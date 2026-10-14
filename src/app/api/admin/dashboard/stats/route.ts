import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { db } from "@/lib/db";

export async function GET() {
    try {
        await requireAdminApi();

        // Get total counts
        const [
            totalOrgs,
            totalUsers,
            totalAnalysesToday,
            threatsToday,
            activeOrgs,
            enterpriseOrgs,
        ] = await Promise.all([
            db.organization.count(),
            db.user.count(),
            db.analysisLog.count({
                where: {
                    createdAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    },
                },
            }),
            db.analysisLog.count({
                where: {
                    createdAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    },
                    verdict: "MALICIOUS",
                },
            }),
            db.organization.count({
                where: {
                    members: {
                        some: {},
                    },
                },
            }),
            db.organization.count({
                where: {
                    planTier: "ENTERPRISE",
                },
            }),
        ]);

        // Get 30-day active users (users with analyses in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const activeUsers = await db.analysisLog.groupBy({
            by: ["userId"],
            where: {
                createdAt: { gte: thirtyDaysAgo },
                userId: { not: null },
            },
        });

        // Calculate MRR estimate based on plan tiers
        const planPricing = {
            FREE: 0,
            PRO: 49,
            ENTERPRISE: 299,
        };

        const orgsWithPlans = await db.organization.findMany({
            select: { planTier: true },
        });

        const mrr = orgsWithPlans.reduce((total, org) => {
            return total + (planPricing[org.planTier] || 0);
        }, 0);

        return NextResponse.json({
            totalOrganizations: totalOrgs,
            activeOrganizations: activeOrgs,
            enterpriseOrganizations: enterpriseOrgs,
            totalUsers,
            activeUsers30d: activeUsers.length,
            analysesToday: totalAnalysesToday,
            threatsToday,
            monthlyRevenue: mrr,
            apiUptime: 99.97, // Placeholder
            avgResponseTime: 127, // Placeholder - would come from metrics
            storageUsedTB: 2.4, // Placeholder
        });
    } catch (error) {
        console.error("Admin stats error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch stats" },
            { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
        );
    }
}
