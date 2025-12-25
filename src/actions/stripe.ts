"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { redirect } from "next/navigation";

export async function createCheckoutSession(isYearly: boolean = false) {
    const session = await auth();

    if (!session?.user?.id || !session?.user?.orgId) {
        return redirect("/auth/signin?callbackUrl=/pricing");
    }

    const orgId = session.user.orgId;

    const org = await db.organization.findUnique({
        where: { id: orgId },
    });

    if (!org) {
        throw new Error("Organization not found");
    }

    // If org already has a stripeCustomerId, reuse it
    let customerId = org.stripeCustomerId;

    if (!customerId) {
        const customer = await stripe.customers.create({
            email: session.user.email || undefined,
            name: org.name,
            metadata: {
                orgId: org.id,
                userId: session.user.id // Keep track of who initiated it
            },
        });
        customerId = customer.id;

        await db.organization.update({
            where: { id: org.id },
            data: { stripeCustomerId: customerId },
        });
    }

    const priceId = isYearly
        ? (process.env.STRIPE_PRICE_ID_PRO_YEARLY || "price_mock_pro_yearly")
        : (process.env.STRIPE_PRICE_ID_PRO_MONTHLY || "price_mock_pro_monthly");

    // Create Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        client_reference_id: org.id, // Important: This is now Org ID
        metadata: {
            orgId: org.id,
            userId: session.user.id
        },
        line_items: [
            {
                price: priceId,
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

    if (!session?.user?.id || !session?.user?.orgId) {
        return redirect("/auth/signin");
    }

    const org = await db.organization.findUnique({
        where: { id: session.user.orgId },
    });

    if (!org || !org.stripeCustomerId) {
        return redirect("/pricing");
    }

    const portalSession = await stripe.billingPortal.sessions.create({
        customer: org.stripeCustomerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard`,
    });

    redirect(portalSession.url);
}
