import { db } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

import { rateLimit } from "@/lib/rate-limit";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
    try {
        // Rate Limit: 100 req/min for webhooks (generous for bursts)
        const ip = (await headers()).get("x-forwarded-for") || "unknown";
        const limit = await rateLimit(ip, 100, 60000); // 100 reqs per 60s
        if (!limit.success) {
            return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
        }

        const body = await req.text();
        const signature = (await headers()).get("stripe-signature") as string;

        let event: Stripe.Event;

        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } catch (err: any) {
            return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
        }

        const session = event.data.object as Stripe.Checkout.Session;

        // Handle the event
        if (event.type === "checkout.session.completed") {
            const orgId = session.client_reference_id || session.metadata?.orgId;

            if (!orgId) {
                return NextResponse.json({ error: "Missing orgId in metadata" }, { status: 400 });
            }

            // 2. Update Organization Subscription
            await db.organization.update({
                where: { id: orgId },
                data: {
                    subscriptionStatus: "active",
                    planTier: "PRO", // Upgrade tier
                    stripeCustomerId: session.customer as string,
                    subscriptionId: session.subscription as string,
                },
            });
            console.log(`Org ${orgId} upgraded to Pro via Stripe`);
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
            const subscriptionId = session.subscription as string;
            if (subscriptionId) {
                const org = await db.organization.findFirst({ where: { subscriptionId } });
                if (org) {
                    await db.organization.update({
                        where: { id: org.id },
                        data: {
                            subscriptionStatus: "canceled",
                            planTier: "FREE" // Downgrade
                        }
                    });
                }
            }
        }

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error("Stripe Webhook Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
