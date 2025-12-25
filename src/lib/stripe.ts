import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

/**
 * Lazily initializes and returns the Stripe client.
 * This prevents build-time failures when STRIPE_SECRET_KEY is not available
 * during static page generation on Vercel.
 */
export function getStripeClient(): Stripe {
    if (stripeInstance) {
        return stripeInstance;
    }

    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
        throw new Error("STRIPE_SECRET_KEY is missing in environment variables.");
    }

    stripeInstance = new Stripe(key, {
        apiVersion: "2025-12-15.clover" as unknown as Stripe.LatestApiVersion,
        typescript: true,
    });

    return stripeInstance;
}

// Legacy export for backwards compatibility (will throw at runtime, not build time)
export const stripe = new Proxy({} as Stripe, {
    get(_, prop) {
        return getStripeClient()[prop as keyof Stripe];
    },
});
