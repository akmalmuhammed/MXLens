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

    if (!session?.user?.id || !session?.user?.orgId) {
        return { allowed: false, remaining: 0, reason: "Authentication required", isGuest: true };
    }

    // New: Check ORGANIZATION Status
    const org = await db.organization.findUnique({
        where: { id: session.user.orgId },
        select: { planTier: true, subscriptionStatus: true }
    });

    if (!org) {
        return { allowed: false, remaining: 0, reason: "Organization not found", isGuest: false };
    }

    // Simple Quota Logic (Can be expanded later)
    const LIMITS = {
        FREE: 10,
        PRO: 1000,
        ENTERPRISE: 100000
    };

    const limit = LIMITS[org.planTier] || 10;

    // Count today's logs for this org
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usageCount = await db.analysisLog.count({
        where: {
            orgId: session.user.orgId,
            createdAt: { gte: today }
        }
    });

    if (usageCount >= limit) {
        return { allowed: false, remaining: 0, reason: "Daily limit reached for your Team." };
    }

    return { allowed: true, remaining: limit - usageCount };
}

export async function saveAnalysis(data: {
    verdict: "CLEAN" | "SUSPICIOUS" | "MALICIOUS" | "UNKNOWN";
    score: number;
    hasAttachments: boolean;
    hasBody: boolean;
    processingTimeMs: number;
}) {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.orgId) return null;

    // 1. Create Analysis Log (Replacing UsageLog)
    const log = await db.analysisLog.create({
        data: {
            orgId: session.user.orgId,
            userId: session.user.id,
            verdict: data.verdict,
            riskScore: data.score,
            processingMs: data.processingTimeMs,
            confidence: "HIGH", // Default for client-side
            meta: {
                hasAttachments: data.hasAttachments,
                hasBody: data.hasBody
            }
        }
    });

    // Note: We no longer increment a counter on the User/Org table.
    // We just count rows in checkAndTrackUsage for accuracy.

    return log;
}
