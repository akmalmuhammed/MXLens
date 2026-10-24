import { db } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";
import * as Sentry from "@sentry/nextjs";

import { rateLimit } from "@/lib/rate-limit";
import { alertBillingEvent } from "@/lib/slack";
import { sendSubscriptionConfirmationEmail, sendUpcomingBillingEmail } from "@/lib/email";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
    try {
        // Rate Limit: 100 req/min for webhooks (generous for bursts)
        // SECURITY: x-forwarded-for is spoofable unless behind a trusted proxy (Vercel overrides this safely)
        const ip = (await headers()).get("x-forwarded-for")?.split(',')[0] || "unknown";
        const limit = await rateLimit(ip, 100, "1 m"); // 100 reqs per minute
        if (!limit.success) {
            return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
        }

        const body = await req.text();
        const signature = (await headers()).get("stripe-signature") as string;

        let event: Stripe.Event;

        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } catch (err: any) {
            // Track signature verification failures for alerting
            Sentry.captureException(err, {
                tags: {
                    "webhook.provider": "stripe",
                    "webhook.error_type": "signature_verification"
                }
            });
            return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
        }

        const session = event.data.object as Stripe.Checkout.Session;

        // Handle the event
        if (event.type === "checkout.session.completed") {
            const orgId = session.client_reference_id || session.metadata?.orgId;

            if (!orgId) {
                return NextResponse.json({ error: "Missing orgId in metadata" }, { status: 400 });
            }

            // Update Organization Subscription
            const org = await db.organization.update({
                where: { id: orgId },
                data: {
                    subscriptionStatus: "active",
                    planTier: "PRO",
                    stripeCustomerId: session.customer as string,
                    subscriptionId: session.subscription as string,
                },
                include: { members: { include: { user: true }, where: { role: "OWNER" } } }
            });
            console.log(`Org ${orgId} upgraded to Pro via Stripe`);

            // Send alerts and emails
            const ownerEmail = org.members[0]?.user?.email;
            if (ownerEmail) {
                await sendSubscriptionConfirmationEmail(
                    ownerEmail,
                    "Pro",
                    session.amount_total ? `$${(session.amount_total / 100).toFixed(2)}` : "N/A",
                    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
                );
            }

            // Slack alert for new subscription
            await alertBillingEvent({
                event: "subscription_created",
                orgName: org.name,
                planName: "Pro",
                amount: session.amount_total ? `$${(session.amount_total / 100).toFixed(2)}` : undefined
            });
        }

        if (event.type === "invoice.payment_succeeded") {
            // Subscription renewal
            const subscriptionId = session.subscription as string;
            // The object here is Invoice, not Session, but subscription ID field name matches
            if (subscriptionId) {
                const org = await db.organization.findFirst({ where: { subscriptionId } });
                if (org) {
                    await db.organization.update({
                        where: { id: org.id },
                        data: {
                            subscriptionStatus: "active",
                            planTier: "PRO" // Ensure tier is maintained
                        }
                    });
                }
            }
        }

        if (event.type === "customer.subscription.deleted") {
            const subscription = event.data.object as Stripe.Subscription;
            const subscriptionId = subscription.id;
            if (subscriptionId) {
                const org = await db.organization.findFirst({ where: { subscriptionId } });
                if (org) {
                    await db.organization.update({
                        where: { id: org.id },
                        data: {
                            subscriptionStatus: "canceled",
                            planTier: "FREE"
                        }
                    });

                    // Alert on cancellation
                    await alertBillingEvent({
                        event: "subscription_cancelled",
                        orgName: org.name,
                        planName: "Pro → Free"
                    });
                }
            }
        }

        // Handle failed payment - mark as past_due
        if (event.type === "invoice.payment_failed") {
            const invoice = event.data.object as any;
            const subscriptionId = invoice.subscription as string | null;

            if (subscriptionId) {
                const org = await db.organization.findFirst({ where: { subscriptionId } });
                if (org) {
                    await db.organization.update({
                        where: { id: org.id },
                        data: { subscriptionStatus: "past_due" }
                    });
                    console.log(`Org ${org.id} marked as past_due due to payment failure`);

                    // Critical alert for payment failure
                    await alertBillingEvent({
                        event: "payment_failed",
                        orgName: org.name,
                        planName: "Pro"
                    });
                }
            }
        }

        // Handle subscription updates (plan changes, etc.)
        if (event.type === "customer.subscription.updated") {
            const subscription = event.data.object as Stripe.Subscription;
            const subscriptionId = subscription.id;

            if (subscriptionId) {
                const org = await db.organization.findFirst({ where: { subscriptionId } });
                if (org) {
                    // Update status based on subscription status
                    const statusMap: Record<string, string> = {
                        'active': 'active',
                        'past_due': 'past_due',
                        'canceled': 'canceled',
                        'unpaid': 'past_due',
                        'incomplete': 'past_due'
                    };

                    await db.organization.update({
                        where: { id: org.id },
                        data: {
                            subscriptionStatus: statusMap[subscription.status] || subscription.status
                        }
                    });
                    console.log(`Org ${org.id} subscription updated to ${subscription.status}`);
                }
            }
        }

        // Handle upcoming invoice (proactive billing notification)
        if (event.type === "invoice.upcoming") {
            const invoice = event.data.object as Stripe.Invoice;
            const customerId = invoice.customer as string;

            if (customerId) {
                const org = await db.organization.findFirst({
                    where: { stripeCustomerId: customerId },
                    include: { members: { include: { user: true }, where: { role: "OWNER" } } }
                });

                if (org) {
                    const ownerEmail = org.members[0]?.user?.email;
                    const amountDue = invoice.amount_due ? `$${(invoice.amount_due / 100).toFixed(2)}` : "N/A";
                    const billingDate = invoice.due_date
                        ? new Date(invoice.due_date * 1000).toLocaleDateString()
                        : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString();

                    if (ownerEmail) {
                        // Send proactive billing email
                        await sendUpcomingBillingEmail(ownerEmail, org.name, amountDue, billingDate);
                    }

                    console.log(`Upcoming invoice notification sent for org ${org.id}`);
                }
            }
        }

        // Handle dispute created (chargeback initiated)
        if (event.type === "charge.dispute.created") {
            const dispute = event.data.object as Stripe.Dispute;
            const chargeId = dispute.charge as string;
            const amount = dispute.amount ? `$${(dispute.amount / 100).toFixed(2)}` : "N/A";

            // Find the org via the charge's customer
            const charge = await stripe.charges.retrieve(chargeId);
            const customerId = charge.customer as string;

            if (customerId) {
                const org = await db.organization.findFirst({
                    where: { stripeCustomerId: customerId }
                });

                if (org) {
                    console.log(`[DISPUTE] Chargeback initiated for org ${org.id}: ${dispute.id}`);

                    // Critical alert for dispute
                    await alertBillingEvent({
                        event: "payment_failed",
                        orgName: `${org.name} - DISPUTE OPENED`,
                        planName: "Pro",
                        amount: amount
                    });

                    // Optionally: Auto-suspend org on dispute (uncomment if desired)
                    // const { suspendOrganization } = await import("@/actions/admin/emergency");
                    // await suspendOrganization(org.id, `Stripe dispute: ${dispute.id}`);
                }
            }
        }

        // Handle dispute closed (won or lost)
        if (event.type === "charge.dispute.closed") {
            const dispute = event.data.object as Stripe.Dispute;
            const status = dispute.status; // "won", "lost", "warning_closed"

            console.log(`[DISPUTE] Dispute ${dispute.id} closed with status: ${status}`);

            // Alert on resolution
            await alertBillingEvent({
                event: status === "won" ? "payment_succeeded" : "payment_failed",
                orgName: `Dispute Resolved: ${status.toUpperCase()}`,
                planName: dispute.id
            });
        }

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error("Stripe Webhook Error:", error);

        // Track webhook processing failures for alerting
        // Alert rule: count() > 3 in 1 hour WHERE tags[webhook.provider]:stripe
        Sentry.captureException(error, {
            tags: {
                "webhook.provider": "stripe",
                "webhook.error_type": "processing_failure"
            },
            extra: {
                eventType: "unknown" // Event type not available in catch block
            }
        });

        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
