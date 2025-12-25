import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { adminRateLimit } from "@/lib/rate-limit";

export async function GET(req: Request) {
    const session = await auth();

    // 1. Admin Authorization (RBAC)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Rate Limiting (10 req/min for admin stats)
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    try {
        await adminRateLimit.check(10, ip);
    } catch {
        return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    try {
        // 3. Aggregate Stats
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
