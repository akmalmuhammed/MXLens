import { db } from "@/lib/db";
import { requireAdminAccessPage } from "@/lib/admin/admin-auth";
import { AuditLogsClient } from "./audit-logs-client";

export default async function AuditLogsPage() {
    await requireAdminAccessPage();

    // Fetch recent analysis logs as audit trail
    // In production, you'd have a dedicated AuditLog table
    const recentActivity = await db.analysisLog.findMany({
        take: 50,
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            incidentId: true,
            verdict: true,
            riskScore: true,
            createdAt: true,
            organization: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },
        },
    });

    // Get recent user creations
    const recentUsers = await db.user.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
        },
    });

    // Get recent organization creations
    const recentOrgs = await db.organization.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            slug: true,
            createdAt: true,
        },
    });

    // Combine into audit log entries
    const auditEntries = [
        ...recentActivity.map((a) => ({
            id: a.id,
            type: "ANALYSIS" as const,
            action: `Analysis completed: ${a.verdict}`,
            details: `Incident ${a.incidentId} - Risk Score: ${a.riskScore}`,
            orgName: a.organization?.name || "Unknown",
            timestamp: a.createdAt.toISOString(),
        })),
        ...recentUsers.map((u) => ({
            id: u.id,
            type: "USER" as const,
            action: "User created",
            details: `${u.name || "Unknown"} (${u.email})`,
            orgName: "Platform",
            timestamp: u.createdAt.toISOString(),
        })),
        ...recentOrgs.map((o) => ({
            id: o.id,
            type: "ORGANIZATION" as const,
            action: "Organization created",
            details: `${o.name} (/${o.slug})`,
            orgName: o.name,
            timestamp: o.createdAt.toISOString(),
        })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 50);

    return <AuditLogsClient entries={auditEntries} />;
}
