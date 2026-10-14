/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/lib/db";
import "server-only";

export interface ShellIncidentData {
    subject: string;
    sender?: string;
    externalId?: string;
    source: "JIRA" | "SERVICENOW" | "GENERIC_WEBHOOK";
    body?: string; // Optional snippet
}

/**
 * Creates a "Shell Incident" transactionally with a sequential ID.
 * Attributes the incident to the Org Owner (since webhooks are headless).
 */
export async function createShellIncident(orgId: string, data: ShellIncidentData) {
    // 1. Find a User to attribute to (The Owner)
    // In future, Integration should have a 'createdById' field.
    const ownerMembership = await db.membership.findFirst({
        where: { orgId: orgId, role: "OWNER" },
        select: { userId: true }
    });

    if (!ownerMembership) {
        throw new Error(`Organization ${orgId} has no owner to attribute incident to.`);
    }

    const userId = ownerMembership.userId;

    // 2. Transaction: Increment Counter & Create Log
    return await db.$transaction(async (tx) => {
        const org = await tx.organization.findUnique({
            where: { id: orgId },
            select: { planTier: true, incidentCounter: true } as any
        });

        if (!org) throw new Error("Org not found");

        let incidentId = null;
        const safeOrg = org as any;

        // Generate ID for paid plans (or all, depending on policy. Let's stick to PRO/ENT)
        if (safeOrg.planTier === "PRO" || safeOrg.planTier === "ENTERPRISE") {
            const nextId = (safeOrg.incidentCounter || 1000) + 1;
            await tx.organization.update({
                where: { id: orgId },
                data: { incidentCounter: nextId } as any
            });
            incidentId = `#INC-${nextId}`;
        }

        // Create the Shell AnalysisLog
        // Status: PENDING (we don't have this enum yet? Default is standard)
        // Verdict: UNKNOWN
        const log = await tx.analysisLog.create({
            data: {
                orgId,
                userId,
                verdict: "UNKNOWN",
                riskScore: 0,
                processingMs: 0,
                confidence: "LOW", // Low confidence because we haven't analyzed it yet
                incidentId,
                source: data.source,
                externalId: data.externalId,
                severity: "MEDIUM", // Default
                meta: {
                    subject: data.subject,
                    sender: data.sender,
                    hasBody: !!data.body,
                    isShell: true // Marker for UI to show "Fetch Content" button
                }
            } as any
        });

        return log as any;
    });
}
