import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as Sentry from '@sentry/nextjs';

/**
 * Health Check Endpoint for Uptime Monitoring
 * 
 * Use with UptimeRobot, Pingdom, Better Uptime, or similar services.
 * Configure alerts if:
 * - HTTP status != 200 (site down)
 * - Response time > 3000ms (degradation)
 */

interface HealthStatus {
    status: "healthy" | "degraded" | "unhealthy";
    timestamp: string;
    version: string;
    checks: {
        database: {
            status: "up" | "down";
            latencyMs?: number;
            error?: string;
        };
        memory: {
            usedMB: number;
            percentUsed: number;
        };
    };
    responseTimeMs: number;
}

export async function GET() {
    const startTime = Date.now();
    const checks: HealthStatus["checks"] = {
        database: { status: "down" },
        memory: { usedMB: 0, percentUsed: 0 }
    };

    // Check database connectivity with timing
    try {
        const dbStart = Date.now();
        await db.$queryRaw`SELECT 1`;
        checks.database = {
            status: "up",
            latencyMs: Date.now() - dbStart
        };
    } catch (error) {
        checks.database = {
            status: "down",
            error: error instanceof Error ? error.message : "Database connection failed"
        };

        // Report to Sentry for alerting
        Sentry.captureException(error, {
            tags: {
                "health.check": "database",
                "health.status": "down"
            }
        });
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    const usedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const totalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    checks.memory = {
        usedMB,
        percentUsed: Math.round((usedMB / totalMB) * 100)
    };

    // Determine overall status
    let status: HealthStatus["status"] = "healthy";
    if (checks.database.status === "down") {
        status = "unhealthy";
    } else if (checks.database.latencyMs && checks.database.latencyMs > 1000) {
        status = "degraded";
    } else if (checks.memory.percentUsed > 85) {
        status = "degraded";
    }

    const responseTimeMs = Date.now() - startTime;

    const healthStatus: HealthStatus = {
        status,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || "1.0.0",
        checks,
        responseTimeMs
    };

    // Return 503 Service Unavailable if unhealthy (triggers uptime alerts)
    const httpStatus = status === "unhealthy" ? 503 : 200;

    return NextResponse.json(healthStatus, {
        status: httpStatus,
        headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "X-Response-Time": `${responseTimeMs}ms`
        }
    });
}
