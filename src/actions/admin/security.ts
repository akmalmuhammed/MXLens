"use server";

import { db } from "@/lib/db";
import { redis } from "@/lib/redis"; // Using the shared Redis client we created
import { startOfDay, subHours } from "date-fns";

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
    try {
        const oneDayAgo = subHours(new Date(), 24);

        // 1. Get Threat Stats (Last 24h)
        // Aggregating locally for now, Prisma count is fast
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

        // 2. Get Recent Incidents (Last 5 malicious)
        const recentIncidents = await db.analysisLog.findMany({
            where: { verdict: "MALICIOUS" },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
                id: true,
                verdict: true,
                riskScore: true,
                createdAt: true,
                meta: true, // Contains file info usually
                userId: true, // Who scanned it?
                organization: {
                    select: { name: true }
                }
            }
        });

        // 3. Get System Lockdown Status from Redis
        const lockdownLevel = await redis.get<number>("system:lockdown:level") || 0;

        return {
            activeThreats24h: activeThreats,
            totalAnalyses24h: totalAnalyses,
            lockdownLevel,
            recentIncidents
        };

    } catch (error) {
        console.error("Failed to fetch security stats:", error);
        return {
            activeThreats24h: 0,
            totalAnalyses24h: 0,
            lockdownLevel: 0,
            recentIncidents: []
        };
    }
}
