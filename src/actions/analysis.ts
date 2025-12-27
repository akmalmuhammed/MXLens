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

// -----------------------------------------------------------------------------
// ANALYST TRIAGE ACTIONS
// -----------------------------------------------------------------------------

export async function updateTriageStatus(id: string, status: "OPEN" | "IN_PROGRESS" | "CLOSED" | "ARCHIVED") {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.orgId) return { error: "Unauthorized" };

    try {
        await db.analysisLog.update({
            where: {
                id,
                orgId: session.user.orgId // Org isolation
            },
            data: { triageStatus: status }
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to update status:", error);
        return { error: "Failed to update status" };
    }
}

export async function updateClassification(id: string, classification: "TRUE_POSITIVE" | "FALSE_POSITIVE" | "UNDETERMINED") {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.orgId) return { error: "Unauthorized" };

    try {
        await db.analysisLog.update({
            where: {
                id,
                orgId: session.user.orgId
            },
            data: { classification }
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to update classification:", error);
        return { error: "Failed to update classification" };
    }
}

export async function addComment(id: string, content: string) {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.orgId) return { error: "Unauthorized" };

    if (!content.trim()) return { error: "Comment cannot be empty" };

    try {
        const comment = await db.analysisComment.create({
            data: {
                analysisLogId: id,
                userId: session.user.id,
                content: content
            },
            include: {
                user: { select: { name: true, image: true } }
            }
        });
        return { success: true, comment };
    } catch (error) {
        console.error("Failed to add comment:", error);
        return { error: "Failed to add comment" };
    }
}

export async function getComments(id: string) {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.orgId) return { error: "Unauthorized" };

    // Verify access first
    const log = await db.analysisLog.findUnique({
        where: { id, orgId: session.user.orgId },
        select: { id: true }
    });

    if (!log) return { error: "Not found" };

    const comments = await db.analysisComment.findMany({
        where: { analysisLogId: id },
        include: {
            user: { select: { name: true, image: true } }
        },
        orderBy: { createdAt: 'asc' }
    });

    return { success: true, comments };
}

export async function getAnalysisTriageState(analysisId: string) {
    const session = await auth();
    if (!session?.user) return null;

    try {
        const log = await db.analysisLog.findUnique({
            where: { id: analysisId },
            select: {
                triageStatus: true,
                classification: true,
                comments: {
                    include: { user: { select: { name: true, image: true } } },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        return log;
    } catch (error) {
        console.error("Failed to fetch triage state:", error);
        return null;
    }
}
