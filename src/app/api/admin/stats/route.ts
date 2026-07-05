import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin/auth";

export async function GET() {
    try {
        await requireAdminApi();

        // 1. Fetch Key Metrics
        const [
            totalOrgs,
            totalUsers,
        ] = await Promise.all([
            db.organization.count(),
            db.user.count(),
        ]);

        // 2. Fetch Recent Activity (Logs)
        const recentLogs = await db.analysisLog.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { email: true } },
                organization: { select: { name: true } }
            }
        });

        // 3. Subscription Stats
        const proOrgs = await db.organization.count({ where: { planTier: { in: ['PRO', 'ENTERPRISE'] } } });

        return NextResponse.json({
            overview: {
                totalUsers,
                totalOrganizations: totalOrgs,
                totalAnalyses: await db.analysisLog.count(), // Add this back
                proOrgs,
                conversionRate: totalOrgs > 0 ? (proOrgs / totalOrgs * 100).toFixed(1) + '%' : '0%'
            },
            recentActivity: recentLogs.map((log) => ({
                user: log.user?.email || "API Key",
                org: log.organization.name,
                verdict: log.verdict,
                score: log.riskScore,
                time: log.createdAt
            }))
        });

    } catch (error) {
        console.error("Admin stats error:", error);
        return NextResponse.json({ error: "Stats aggregation failed" }, { status: 500 });
    }
}
