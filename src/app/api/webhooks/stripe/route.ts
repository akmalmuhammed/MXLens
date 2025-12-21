import { db } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2024-12-18.acacia", // Use latest API version or pinning
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
    try {
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
            // 1. Retrieve User ID from client_reference_id or metadata
            const userId = session.client_reference_id || session.metadata?.userId;

            if (!userId) {
                return NextResponse.json({ error: "Missing userId in metadata" }, { status: 400 });
            }

            // 2. Update User Subscription
            await db.user.update({
                where: { id: userId },
                data: {
                    subscriptionStatus: "pro", // or based on product ID
                    stripeCustomerId: session.customer as string,
                    subscriptionId: session.subscription as string,
                    messageLimit: 1000, // Upgrade limit
                },
            });
            console.log(`User ${userId} upgraded to Pro via Stripe`);
        }

        if (event.type === "invoice.payment_succeeded") {
            // Renew limits on recurring payment?
            const subscriptionId = session.subscription as string;
            const user = await db.user.findFirst({ where: { subscriptionId } });
            if (user) {
                // Reset usage? or just ensure status is active
                await db.user.update({
                    where: { id: user.id },
                    data: {
                        subscriptionStatus: "pro",
                        usageCount: 0, // Optional: reset usage on billing cycle
                        lastUsageReset: new Date()
                    }
                });
            }
        }

        // Handle failures (subscription deleted, etc)
        if (event.type === "customer.subscription.deleted") {
            // Downgrade
        }

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error("Stripe Webhook Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
