"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import "server-only";

export interface UsageResult {
    allowed: boolean;
    remaining: number;
    reason?: string;
    isGuest?: boolean;
}

export async function checkAndTrackUsage(): Promise<UsageResult> {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return { allowed: false, remaining: 0, reason: "Authentication required", isGuest: true };
    }

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { messageLimit: true, usageCount: true }
    });

    if (!user) {
        return { allowed: false, remaining: 0, reason: "User not found", isGuest: false };
    }

    if (user.usageCount >= user.messageLimit) {
        return { allowed: false, remaining: 0, reason: "Daily limit reached. Upgrade to Premium." };
    }

    return { allowed: true, remaining: user.messageLimit - user.usageCount };
}

export async function saveAnalysis(data: {
    verdict: string;
    score: number;
    hasAttachments: boolean;
    hasBody: boolean;
    processingTimeMs: number;
}) {
    const session = await auth();
    if (!session?.user?.id) return null;

    // 1. Log the usage
    const log = await db.usageLog.create({
        data: {
            userId: session.user.id,
            verdict: data.verdict,
            score: data.score,
            hasAttachments: data.hasAttachments,
            hasBody: data.hasBody,
            processingTimeMs: data.processingTimeMs,
        }
    });

    // 2. Increment user usage count
    await db.user.update({
        where: { id: session.user.id },
        data: { usageCount: { increment: 1 } }
    });

    return log;
}
