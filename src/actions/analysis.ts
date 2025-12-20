"use server";

import { auth } from "@/auth";
import "server-only";

export interface UsageResult {
    allowed: boolean;
    remaining: number;
    reason?: string;
    isGuest?: boolean;
}

export async function checkAndTrackUsage(): Promise<UsageResult> {
    const session = await auth();

    if (!session || !session.user) {
        // Not logged in -> Client side should handle Guest logic, but if they somehow call this:
        return { allowed: false, remaining: 0, reason: "Authentication required for advanced tracking", isGuest: true };
    }

    // Mock Supabase Check
    // TODO: Connect to real Supabase "UsageLogs" table
    console.log(`[Server] Tracking usage for user: ${session.user.email}`);

    // Mock Limit: 10 per day for free registered
    const DAILY_LIMIT = 10;
    const currentUsageMock = 0; // Fetch from DB

    if (currentUsageMock >= DAILY_LIMIT) {
        return { allowed: false, remaining: 0, reason: "Daily limit reached. Upgrade to Premium." };
    }

    // Mock Increment
    // await supabase.from('usage').insert(...)

    return { allowed: true, remaining: DAILY_LIMIT - currentUsageMock - 1 };
}
