import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminAccess } from "@/lib/admin/admin-auth";

/**
 * Admin Monitoring API
 * Returns comprehensive system metrics for the monitoring dashboard
 */

interface MonitoringData {
    timestamp: string;
    system: {
        status: "healthy" | "degraded" | "unhealthy";
        database: {
            status: "up" | "down";
            latencyMs: number;
        };
        memory: {
            usedMB: number;
            percentUsed: number;
        };
    };
    metrics: {
        users: {
            total: number;
            active30d: number;
        };
        organizations: {
            total: number;
            paying: number;
        };
        analyses: {
            total: number;
            today: number;
            thisWeek: number;
            threatRate: number;
        };
    };
    webhooks: {
        stripe: {
            successCount: number;
            failureCount: number;
            lastProcessed: string | null;
        };
    };
}

export async function GET() {
    try {
        await requireAdminAccess();

        const startTime = Date.now();

        // Database health check
        let dbStatus: "up" | "down" = "down";
        let dbLatency = 0;
        try {
            const dbStart = Date.now();
            await db.$queryRaw`SELECT 1`;
            dbLatency = Date.now() - dbStart;
            dbStatus = "up";
        } catch {
            dbStatus = "down";
        }

        // Memory stats
        const memUsage = process.memoryUsage();
        const usedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
        const totalMB = Math.round(memUsage.heapTotal / 1024 / 1024);

        // Get database metrics
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [
            totalUsers,
            activeUsers30d,
            totalOrgs,
            payingOrgs,
            totalAnalyses,
            analysesToday,
            analysesThisWeek,
            threatAnalyses,
        ] = await Promise.all([
            db.user.count(),
            db.user.count({
                where: {
                    updatedAt: { gte: thirtyDaysAgo }
                }
            }),
            db.organization.count(),
            db.organization.count({
                where: {
                    planTier: { in: ["PRO", "ENTERPRISE"] }
                }
            }),
            db.analysisLog.count(),
            db.analysisLog.count({
                where: { createdAt: { gte: todayStart } }
            }),
            db.analysisLog.count({
                where: { createdAt: { gte: weekStart } }
            }),
            db.analysisLog.count({
                where: {
                    verdict: { in: ["SUSPICIOUS", "MALICIOUS"] }
                }
            })
        ]);

        // Calculate threat rate
        const threatRate = totalAnalyses > 0
            ? Math.round((threatAnalyses / totalAnalyses) * 100)
            : 0;

        // Determine overall status
        let systemStatus: "healthy" | "degraded" | "unhealthy" = "healthy";
        if (dbStatus === "down") {
            systemStatus = "unhealthy";
        } else if (dbLatency > 500) {
            systemStatus = "degraded";
        }

        const data: MonitoringData = {
            timestamp: new Date().toISOString(),
            system: {
                status: systemStatus,
                database: {
                    status: dbStatus,
                    latencyMs: dbLatency
                },
                memory: {
                    usedMB,
                    percentUsed: Math.round((usedMB / totalMB) * 100)
                }
            },
            metrics: {
                users: {
                    total: totalUsers,
                    active30d: activeUsers30d
                },
                organizations: {
                    total: totalOrgs,
                    paying: payingOrgs
                },
                analyses: {
                    total: totalAnalyses,
                    today: analysesToday,
                    thisWeek: analysesThisWeek,
                    threatRate
                }
            },
            webhooks: {
                stripe: {
                    successCount: 0, // TODO: Track in database
                    failureCount: 0,
                    lastProcessed: null
                }
            }
        };

        return NextResponse.json(data, {
            headers: {
                "X-Response-Time": `${Date.now() - startTime}ms`
            }
        });
    } catch (error) {
        console.error("Monitoring API Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch monitoring data" },
            { status: 500 }
        );
    }
}
