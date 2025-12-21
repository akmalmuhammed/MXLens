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
        const [totalUsers, totalAnalyses, recentLogs] = await db.$transaction([
            db.user.count(),
            db.usageLog.count(),
            db.usageLog.findMany({
                take: 10,
                orderBy: { timestamp: 'desc' },
                include: { user: { select: { email: true } } }
            })
        ]);

        // 3. Subscription Stats
        const proUsers = await db.user.count({ where: { subscriptionStatus: 'pro' } });

        return NextResponse.json({
            overview: {
                totalUsers,
                totalAnalyses,
                proUsers,
                conversionRate: totalUsers > 0 ? (proUsers / totalUsers * 100).toFixed(1) + '%' : '0%'
            },
            recentActivity: recentLogs.map(log => ({
                user: log.user.email,
                verdict: log.verdict,
                score: log.score,
                time: log.timestamp
            }))
        });

    } catch (error) {
        return NextResponse.json({ error: "Stats aggregation failed" }, { status: 500 });
    }
}
