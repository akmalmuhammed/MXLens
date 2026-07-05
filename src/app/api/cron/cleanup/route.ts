import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * Token & Session Cleanup API
 * 
 * This endpoint is designed to be called by a CRON job (e.g., Vercel CRON).
 * It cleans up expired tokens and sessions from the database to prevent bloat.
 * 
 * Recommended schedule: Daily at 3:00 AM UTC
 * 
 * SECURITY: This endpoint is protected by a secret key to prevent abuse.
 * Set CRON_SECRET in your environment variables.
 */
export async function POST(request: NextRequest) {
    try {
        // Verify CRON secret
        const authHeader = request.headers.get("authorization");
        const expectedSecret = process.env.CRON_SECRET;

        if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const now = new Date();
        const results = {
            orgInvites: 0,
            adminSessions: 0,
        };

        // 1. Clean up expired OrgInvites
        const deletedOrgInvites = await db.orgInvite.deleteMany({
            where: { expiresAt: { lt: now } }
        });
        results.orgInvites = deletedOrgInvites.count;

        // 2. Clean up expired AdminSessions
        const deletedAdminSessions = await db.adminSession.deleteMany({
            where: { expiresAt: { lt: now } }
        });
        results.adminSessions = deletedAdminSessions.count;

        const totalDeleted =
            results.orgInvites +
            results.adminSessions;

        console.log(`[CLEANUP] Removed ${totalDeleted} expired records:`, results);

        return NextResponse.json({
            success: true,
            message: `Cleaned up ${totalDeleted} expired records`,
            details: results,
            timestamp: now.toISOString()
        });

    } catch (error) {
        console.error("[CLEANUP] Error during token cleanup:", error);
        return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
    }
}

// Prevent GET requests
export async function GET() {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
