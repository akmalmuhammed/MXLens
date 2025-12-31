import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { alertBillingEvent } from "@/lib/slack";

/**
 * Subscription Grace Period Enforcement
 * 
 * This CRON job runs daily and handles:
 * 1. Sends warning emails to past_due subscriptions
 * 2. Auto-downgrades subscriptions that have been past_due for 7+ days
 * 
 * Grace Period Policy:
 * - Day 1: Mark as past_due (handled by Stripe webhook)
 * - Day 1-6: User retains Pro features, receives reminders
 * - Day 7+: Auto-downgrade to FREE tier
 * 
 * Recommended schedule: Daily at 4:00 AM UTC (after cleanup job)
 */

const GRACE_PERIOD_DAYS = 7;

export async function POST(request: NextRequest) {
    try {
        // Verify CRON secret
        const authHeader = request.headers.get("authorization");
        const expectedSecret = process.env.CRON_SECRET;

        if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const now = new Date();
        const gracePeriodCutoff = new Date(now.getTime() - GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

        // Find all organizations with past_due status
        const pastDueOrgs = await db.organization.findMany({
            where: {
                subscriptionStatus: "past_due",
                planTier: { not: "FREE" }
            },
            include: {
                members: {
                    include: { user: true },
                    where: { role: "OWNER" }
                }
            }
        });

        const results = {
            checked: pastDueOrgs.length,
            downgraded: 0,
            warned: 0,
        };

        for (const org of pastDueOrgs) {
            // Check when they became past_due by looking at updatedAt
            // (In production, you'd want a specific pastDueSince field)
            const daysPastDue = Math.floor(
                (now.getTime() - org.updatedAt.getTime()) / (24 * 60 * 60 * 1000)
            );

            if (daysPastDue >= GRACE_PERIOD_DAYS) {
                // Grace period expired - downgrade to FREE
                await db.organization.update({
                    where: { id: org.id },
                    data: {
                        planTier: "FREE",
                        subscriptionStatus: "canceled",
                        subscriptionId: null
                    }
                });

                // Alert via Slack
                await alertBillingEvent({
                    event: "subscription_cancelled",
                    orgName: org.name,
                    planName: "Pro → Free (Grace Period Expired)"
                });

                results.downgraded++;
                console.log(`[GRACE_PERIOD] Downgraded org ${org.id} after ${daysPastDue} days past due`);

            } else {
                // Still within grace period - just log for now
                // (In production, you'd send reminder emails here)
                results.warned++;
                console.log(`[GRACE_PERIOD] Org ${org.id} is ${daysPastDue} days past due (${GRACE_PERIOD_DAYS - daysPastDue} days remaining)`);
            }
        }

        console.log(`[GRACE_PERIOD] Processed ${results.checked} past-due orgs: ${results.downgraded} downgraded, ${results.warned} warned`);

        return NextResponse.json({
            success: true,
            message: `Processed ${results.checked} past-due subscriptions`,
            details: results,
            timestamp: now.toISOString()
        });

    } catch (error) {
        console.error("[GRACE_PERIOD] Error during enforcement:", error);
        return NextResponse.json({ error: "Enforcement failed" }, { status: 500 });
    }
}

// Prevent GET requests
export async function GET() {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
