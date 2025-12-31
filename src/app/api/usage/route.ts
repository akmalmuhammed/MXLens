"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * Usage & Quota API
 * 
 * Returns the current user's usage stats and remaining quota.
 * This is used by the dashboard to display quota visibility.
 */
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id || !session?.user?.orgId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get org plan tier
        const org = await db.organization.findUnique({
            where: { id: session.user.orgId },
            select: { planTier: true, subscriptionStatus: true }
        });

        if (!org) {
            return NextResponse.json({ error: "Organization not found" }, { status: 404 });
        }

        // Define limits per tier
        const LIMITS: Record<string, number> = {
            FREE: 10,
            PRO: 1000,
            ENTERPRISE: 100000
        };

        const dailyLimit = LIMITS[org.planTier as string] || 10;

        // Count today's usage
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const usageCount = await db.analysisLog.count({
            where: {
                orgId: session.user.orgId,
                createdAt: { gte: today }
            }
        });

        // Calculate reset time (next midnight UTC)
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return NextResponse.json({
            planTier: org.planTier,
            subscriptionStatus: org.subscriptionStatus,
            usage: {
                used: usageCount,
                limit: dailyLimit,
                remaining: Math.max(0, dailyLimit - usageCount),
                percentUsed: Math.round((usageCount / dailyLimit) * 100),
            },
            resetAt: tomorrow.toISOString(),
            resetsIn: Math.ceil((tomorrow.getTime() - Date.now()) / (1000 * 60 * 60)), // hours
        });

    } catch (error) {
        console.error("[USAGE_API] Error:", error);
        return NextResponse.json({ error: "Failed to fetch usage" }, { status: 500 });
    }
}
