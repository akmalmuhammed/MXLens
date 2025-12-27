import { NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/admin/admin-auth";
import { db } from "@/lib/db";

export async function GET() {
    try {
        await requireAdminAccess();

        // Get last 7 days of analysis data
        const days = 7;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        // Group analyses by date
        const analyses = await db.analysisLog.findMany({
            where: {
                createdAt: { gte: startDate },
            },
            select: {
                createdAt: true,
                verdict: true,
            },
        });

        // Aggregate by day
        const dailyData: Record<string, { total: number; threats: number }> = {};

        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (days - 1 - i));
            const dateKey = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            dailyData[dateKey] = { total: 0, threats: 0 };
        }

        analyses.forEach((analysis) => {
            const dateKey = analysis.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            if (dailyData[dateKey]) {
                dailyData[dateKey].total++;
                if (analysis.verdict === "MALICIOUS") {
                    dailyData[dateKey].threats++;
                }
            }
        });

        const trendData = Object.entries(dailyData).map(([date, data]) => ({
            date,
            analyses: data.total,
            threats: data.threats,
        }));

        // Get verdict distribution
        const verdictCounts = await db.analysisLog.groupBy({
            by: ["verdict"],
            where: {
                createdAt: { gte: startDate },
            },
            _count: true,
        });

        const verdictDistribution = verdictCounts.map((v) => ({
            name: v.verdict === "CLEAN" ? "Safe" :
                v.verdict === "SUSPICIOUS" ? "Suspicious" :
                    v.verdict === "MALICIOUS" ? "Malicious" : "Unknown",
            value: v._count,
            color: v.verdict === "CLEAN" ? "hsl(120, 100%, 62%)" :
                v.verdict === "SUSPICIOUS" ? "hsl(25, 100%, 55%)" :
                    v.verdict === "MALICIOUS" ? "hsl(0, 85%, 55%)" : "hsl(220, 10%, 55%)",
        }));

        return NextResponse.json({
            trendData,
            verdictDistribution,
        });
    } catch (error) {
        console.error("Admin trends error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch trends" },
            { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
        );
    }
}
