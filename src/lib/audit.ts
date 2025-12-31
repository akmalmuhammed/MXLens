import { db } from "@/lib/db";
import { AuditAction } from "@prisma/client";
import { auth } from "@/auth";
import { headers } from "next/headers";

/**
 * Log an administrative or security action.
 * Prefer calling this from Server Actions.
 */
export async function logAuditAction(
    action: AuditAction,
    details: Record<string, any>,
    targetId?: string
) {
    try {
        const session = await auth();
        const headersList = await headers();

        // Prefer authenticated user, fallback to system/unknown
        const actorId = session?.user?.id || "system";
        const actorEmail = session?.user?.email || "system@mxlens.local";
        const orgId = session?.user?.orgId;

        if (!orgId) {
            console.warn("[AUDIT] Skipping audit log: No Org ID found for actor", actorEmail);
            return;
        }

        const ip = headersList.get("x-forwarded-for")?.split(",")[0] || "unknown";
        const userAgent = headersList.get("user-agent") || "unknown";

        await db.auditLog.create({
            data: {
                action,
                actorId,
                actorEmail,
                orgId,
                targetId,
                details: details,
                ipAddress: ip,
                userAgent: userAgent
            }
        });

    } catch (error) {
        console.error("Failed to write audit log:", error);
        // Don't throw - audit logging failure shouldn't crash the main flow usually, 
        // unless strict compliance mode is on.
    }
}
