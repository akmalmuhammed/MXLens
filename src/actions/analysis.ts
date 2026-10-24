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
    return { allowed: true, remaining: Number.MAX_SAFE_INTEGER, isGuest: false };
}

export async function saveAnalysis(data: {
    verdict: "CLEAN" | "SUSPICIOUS" | "MALICIOUS" | "UNKNOWN";
    score: number;
    hasAttachments: boolean;
    hasBody: boolean;
    processingTimeMs: number;
    subject?: string;
    sender?: string;
    spfStatus?: string;
    dkimStatus?: string;
    dmarcStatus?: string;
    auth?: {
        spf?: string;
        dkim?: string;
        dmarc?: string;
    };
}) {
    console.log("[MXLENS_DEBUG] [ANALYSIS/saveAnalysis] Called with:", data);

    const session = await auth();

    console.log("[MXLENS_DEBUG] [ANALYSIS/saveAnalysis] Session:", {
        hasSession: !!session,
        userId: session?.user?.id,
        orgId: session?.user?.orgId
    });

    if (!session?.user?.id || !session?.user?.orgId) {
        console.log("[MXLENS_DEBUG] [ANALYSIS/saveAnalysis] No session - returning null");
        return null;
    }

    const orgId = session.user.orgId;
    const userId = session.user.id;

    try {
        // Transaction to ensure sequential IDs if applicable
        const log = await db.$transaction(async (tx) => {
            console.log("[MXLENS_DEBUG] [ANALYSIS/saveAnalysis] Inside transaction");

            // 1. Check Plan & Increment Counter
            const org = await tx.organization.findUnique({
                where: { id: orgId },
                select: { planTier: true, incidentCounter: true } as any
            });

            console.log("[MXLENS_DEBUG] [ANALYSIS/saveAnalysis] Org lookup:", org);

            let incidentId = null;

            // Force cast safely to avoid build errors if Types are stale
            const safeOrg = org as any;

            if (safeOrg && (safeOrg.planTier === "PRO" || safeOrg.planTier === "ENTERPRISE")) {
                // Note: Currently enabling for PRO too, but strictly usually TEAM. 
                const nextId = (safeOrg.incidentCounter || 1000) + 1;
                console.log("[MXLENS_DEBUG] [ANALYSIS/saveAnalysis] Incrementing counter to:", nextId);

                await tx.organization.update({
                    where: { id: orgId },
                    data: { incidentCounter: nextId } as any
                });
                incidentId = `#INC-${nextId}`;
            }

            console.log("[MXLENS_DEBUG] [ANALYSIS/saveAnalysis] Creating log with incidentId:", incidentId);

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
                        hasBody: data.hasBody,
                        subject: data.subject?.replace(/\s+/g, " ").trim().slice(0, 256),
                        sender: data.sender?.replace(/\s+/g, " ").trim().slice(0, 256),
                        spf: data.spfStatus ?? data.auth?.spf,
                        dkim: data.dkimStatus ?? data.auth?.dkim,
                        dmarc: data.dmarcStatus ?? data.auth?.dmarc,
                    }
                } as any
            });
        });

        console.log("[MXLENS_DEBUG] [ANALYSIS/saveAnalysis] Log created:", log?.id);
        return log;
    } catch (error) {
        console.error("[MXLENS_DEBUG] [ANALYSIS/saveAnalysis] ERROR:", error);
        throw error;
    }
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
