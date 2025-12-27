import { NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/admin/admin-auth";
import { db } from "@/lib/db";

export async function GET() {
    try {
        await requireAdminAccess();

        // Get recent analyses (threats and suspicious)
        const recentThreats = await db.analysisLog.findMany({
            where: {
                verdict: { in: ["MALICIOUS", "SUSPICIOUS"] },
            },
            take: 10,
            orderBy: { createdAt: "desc" },
            include: {
                organization: { select: { name: true } },
            },
        });

        // Get recent signups
        const recentOrgs = await db.organization.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                planTier: true,
                createdAt: true,
            },
        });

        // Format activities
        const activities = [
            ...recentThreats.map((threat) => ({
                id: threat.id,
                type: threat.verdict === "MALICIOUS" ? "threat" : "analysis",
                title: threat.verdict === "MALICIOUS" ? "Malicious Email Detected" : "Suspicious Email Found",
                description: `${threat.verdict.toLowerCase()} analysis for ${threat.organization.name}`,
                timestamp: getRelativeTime(threat.createdAt),
                meta: threat.verdict === "MALICIOUS" ? "HIGH RISK" : undefined,
            })),
            ...recentOrgs.map((org) => ({
                id: org.id,
                type: "signup",
                title: "New Organization",
                description: `${org.name} signed up for ${org.planTier} plan`,
                timestamp: getRelativeTime(org.createdAt),
            })),
        ];

        // Sort by most recent
        activities.sort((a, b) => {
            const aTime = parseRelativeTime(a.timestamp);
            const bTime = parseRelativeTime(b.timestamp);
            return aTime - bTime;
        });

        return NextResponse.json({
            activities: activities.slice(0, 10),
        });
    } catch (error) {
        console.error("Admin activity error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch activity" },
            { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
        );
    }
}

function getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

function parseRelativeTime(timeStr: string): number {
    if (timeStr === "Just now") return 0;
    const match = timeStr.match(/(\d+)\s*(min|hour|day)/);
    if (!match) return 999999;
    const num = parseInt(match[1]);
    const unit = match[2];
    if (unit === "min") return num;
    if (unit === "hour") return num * 60;
    if (unit === "day") return num * 1440;
    return 999999;
}
