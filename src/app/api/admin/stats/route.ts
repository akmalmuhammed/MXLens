import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await auth();

    // 1. Admin Authorization (Simple email check for MVP)
    // In production, use Roles (e.g., session.user.role === 'ADMIN')
    const allowedAdmins = process.env.ADMIN_EMAILS?.split(',') || ["user@example.com"];

    if (!session?.user?.email || !allowedAdmins.includes(session.user.email)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // 2. Aggregate Stats
        const [totalUsers, totalOrganizations, totalAnalyses, recentLogs] = await db.$transaction([
            db.user.count(),
            db.organization.count(),
            db.analysisLog.count(),
            db.analysisLog.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { email: true } }, organization: { select: { name: true } } }
            })
        ]);

        // 3. Subscription Stats (Looking at Orgs now)
        const proOrgs = await db.organization.count({ where: { planTier: { in: ['PRO', 'ENTERPRISE'] } } });

        return NextResponse.json({
            overview: {
                totalUsers,
                totalOrganizations,
                totalAnalyses,
                proOrgs,
                conversionRate: totalOrganizations > 0 ? (proOrgs / totalOrganizations * 100).toFixed(1) + '%' : '0%'
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
        return NextResponse.json({ error: "Stats aggregation failed" }, { status: 500 });
    }
}
