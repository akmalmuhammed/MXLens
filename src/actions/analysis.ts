/* eslint-disable @typescript-eslint/no-explicit-any */
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

    console.log("[MXLENS_DEBUG] [ANALYSIS/checkAndTrackUsage] Session state:", {
        hasSession: !!session,
        userId: session?.user?.id,
        orgId: session?.user?.orgId,
        orgSlug: session?.user?.orgSlug,
        role: session?.user?.role
    });

    if (!session?.user?.id || !session?.user?.orgId) {
        console.log("[MXLENS_DEBUG] [ANALYSIS/checkAndTrackUsage] No session or orgId - returning guest");
        return { allowed: false, remaining: 0, reason: "Authentication required", isGuest: true };
    }

    // New: Check ORGANIZATION Status
    const org = await db.organization.findUnique({
        where: { id: session.user.orgId },
        select: { planTier: true, subscriptionStatus: true }
    });

    console.log("[MXLENS_DEBUG] [ANALYSIS/checkAndTrackUsage] Org lookup:", {
        orgId: session.user.orgId,
        found: !!org,
        planTier: org?.planTier,
        subscriptionStatus: org?.subscriptionStatus
    });

    if (!org) {
        console.log("[MXLENS_DEBUG] [ANALYSIS/checkAndTrackUsage] ERROR: Organization not found!");
        return { allowed: false, remaining: 0, reason: "Organization not found", isGuest: false };
    }

    // Simple Quota Logic (Can be expanded later)
    const LIMITS: Record<string, number> = {
        FREE: 10,
        PRO: 1000,
        ENTERPRISE: 100000
    };

    const limit = LIMITS[org.planTier as string] || 10;

    // Count today's logs for this org
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usageCount = await db.analysisLog.count({
        where: {
            orgId: session.user.orgId,
            createdAt: { gte: today }
        }
    });

    console.log("[MXLENS_DEBUG] [ANALYSIS/checkAndTrackUsage] Usage:", {
        limit,
        usageCount,
        remaining: limit - usageCount
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

    const orgId = session.user.orgId;
    const userId = session.user.id;

    // Transaction to ensure sequential IDs if applicable
    const log = await db.$transaction(async (tx) => {
        // 1. Check Plan & Increment Counter
        const org = await tx.organization.findUnique({
            where: { id: orgId },
            select: { planTier: true, incidentCounter: true } as any
        });

        let incidentId = null;

        // Force cast safely to avoid build errors if Types are stale
        const safeOrg = org as any;

        if (safeOrg && (safeOrg.planTier === "PRO" || safeOrg.planTier === "ENTERPRISE")) {
            // Note: Currently enabling for PRO too, but strictly usually TEAM. 
            const nextId = (safeOrg.incidentCounter || 1000) + 1;
            await tx.organization.update({
                where: { id: orgId },
                data: { incidentCounter: nextId } as any
            });
            incidentId = `#INC-${nextId}`;
        }

        // 2. Create Log
        return await tx.analysisLog.create({
            data: {
                orgId,
                userId,
                verdict: data.verdict,
                riskScore: data.score,
                processingMs: data.processingTimeMs,
                confidence: "HIGH",
                incidentId, // Will be null for Free/Basic
                meta: {
                    hasAttachments: data.hasAttachments,
                    hasBody: data.hasBody
                }
            } as any
        });
    });

    return log;
}

export async function assignIncident(analysisId: string, assigneeId: string) {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.orgId) return { error: "Unauthorized" };

    try {
        // Validation: Verify assignee belongs to same org (security)
        if (assigneeId !== "unassigned") {
            const member = await db.membership.findUnique({
                where: {
                    userId_orgId: {
                        userId: assigneeId,
                        orgId: session.user.orgId
                    }
                }
            });
            if (!member) return { error: "Assignee not in organization" };
        }

        const updateData = assigneeId === "unassigned" ? { assigneeId: null } : { assigneeId };

        await db.analysisLog.update({
            where: {
                id: analysisId,
                orgId: session.user.orgId
            },
            data: updateData as any
        });

        return { success: true };
    } catch (error) {
        console.error("Failed to assign incident:", error);
        return { error: "Failed to assign incident" };
    }
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
            data: { triageStatus: status } as any
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
            data: { classification } as any
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
            } as any
        });
        return log;
    } catch (error) {
        console.error("Failed to fetch triage state:", error);
        return null;
    }
}

export async function getIncidents() {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.orgId) return [];

    try {
        const incidents = await db.analysisLog.findMany({
            where: {
                orgId: session.user.orgId,
                triageStatus: { not: "ARCHIVED" }, // Show everything except archived
            } as any,
            include: {
                assignee: {
                    select: { name: true, image: true, email: true }
                },
                user: { // The reporter
                    select: { name: true }
                },
                organization: {
                    select: { planTier: true }
                }
            } as any,
            orderBy: { createdAt: 'desc' }
        });
        return incidents as any[];
    } catch (error) {
        console.error("Failed to fetch incidents:", error);
        return [];
    }
}
