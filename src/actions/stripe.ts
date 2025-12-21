"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { redirect } from "next/navigation";

export async function createCheckoutSession() {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return redirect("/auth/signin?callbackUrl=/pricing");
    }

    const user = await db.user.findUnique({
        where: { id: session.user.id },
    });

    if (!user) {
        throw new Error("User not found");
    }

    // If user already has a stripeCustomerId, reuse it
    let customerId = user.stripeCustomerId;

    if (!customerId) {
        const customer = await stripe.customers.create({
            email: user.email,
            name: user.name || undefined,
            metadata: {
                userId: user.id,
            },
        });
        customerId = customer.id;

        await db.user.update({
            where: { id: user.id },
            data: { stripeCustomerId: customerId },
        });
    }

    // Create Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        client_reference_id: user.id,
        metadata: {
            userId: user.id,
        },
        line_items: [
            {
                // Replace with your actual Price ID from Stripe Dashboard
                // For dev, use a mock or environment variable
                price: process.env.STRIPE_PRICE_ID_PRO || "price_mock_pro_monthly",
                quantity: 1,
            },
        ],
        mode: "subscription",
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/pricing?canceled=true`,
    });

    if (!checkoutSession.url) {
        throw new Error("Failed to create checkout session");
    }

    redirect(checkoutSession.url);
}

export async function createPortalSession() {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return redirect("/auth/signin");
    }

    const user = await db.user.findUnique({
        where: { id: session.user.id },
    });

    if (!user || !user.stripeCustomerId) {
        return redirect("/pricing");
    }

    const portalSession = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard`,
    });

    redirect(portalSession.url);
}
