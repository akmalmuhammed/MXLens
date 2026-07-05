import { NextResponse } from "next/server";

/**
 * Usage & Quota API
 * 
 * Returns the current user's usage stats and remaining quota.
 * This is used by the dashboard to display quota visibility.
 */
export async function GET() {
    try {
        const dailyLimit = Number.MAX_SAFE_INTEGER;

        return NextResponse.json({
            planTier: "FREE",
            subscriptionStatus: "free",
            usage: {
                used: 0,
                limit: dailyLimit,
                remaining: dailyLimit,
                percentUsed: 0,
            },
            resetAt: null,
            resetsIn: null,
        });

    } catch (error) {
        console.error("[USAGE_API] Error:", error);
        return NextResponse.json({ error: "Failed to fetch usage" }, { status: 500 });
    }
}
