"use server";

import { db } from "@/lib/db";
import { redis } from "@/lib/redis"; // Using the shared Redis client we created
import { subHours } from "date-fns";
import { assertSuperAdmin } from "@/lib/admin/guards";

export interface SecurityStats {
    activeThreats24h: number;
    totalAnalyses24h: number;
    lockdownLevel: number;
    recentIncidents: any[];
}

/**
 * Fetch high-level security metrics for the admin dashboard
 */
export async function getSecurityOverview(): Promise<SecurityStats> {
    await assertSuperAdmin();
    const oneDayAgo = subHours(new Date(), 24);

    const [activeThreats, totalAnalyses] = await Promise.all([
        db.analysisLog.count({
            where: {
                createdAt: { gte: oneDayAgo },
                verdict: "MALICIOUS"
            }
        }),
        db.analysisLog.count({
            where: {
                createdAt: { gte: oneDayAgo }
            }
        })
    ]);

    const recentIncidents = await db.analysisLog.findMany({
        where: { verdict: "MALICIOUS" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
            id: true,
            verdict: true,
            riskScore: true,
            createdAt: true,
            meta: true,
            userId: true,
            organization: {
                select: { name: true }
            }
        }
    });

    const lockdownLevel = await redis.get<number>("system:lockdown:level") || 0;

    return {
        activeThreats24h: activeThreats,
        totalAnalyses24h: totalAnalyses,
        lockdownLevel,
        recentIncidents
    };
}
