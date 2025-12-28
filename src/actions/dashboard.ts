"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function getDashboardStats() {
    const session = await auth();

    console.log("[MXLENS_DEBUG] [DASHBOARD/getDashboardStats] Session state:", {
        hasSession: !!session,
        userId: session?.user?.id,
        orgId: session?.user?.orgId,
        orgSlug: session?.user?.orgSlug,
        role: session?.user?.role
    });

    // Must have Org Context
    if (!session?.user?.id || !session?.user?.orgId) {
        console.log("[MXLENS_DEBUG] [DASHBOARD/getDashboardStats] No session or orgId - returning empty stats");
        return {
            totalScans: 0,
            threatsFound: 0,
            cleanEmails: 0,
            riskLevel: "Low",
            recentLogs: [],
            dailyScans: 0,
            isPremium: false
        };
    }

    const orgId = session.user.orgId;
    const userId = session.user.id; // Optional: filter by user if role is restricted?

    console.log("[MXLENS_DEBUG] [DASHBOARD/getDashboardStats] Fetching stats for org:", orgId);

    // 1. Total Scans (Org Wide)
    const totalScans = await db.analysisLog.count({
        where: { orgId }
    });

    // 2. Threats Found
    const threatsFound = await db.analysisLog.count({
        where: {
            orgId,
            verdict: { in: ["MALICIOUS", "SUSPICIOUS"] }
        }
    });

    // 3. Clean Emails
    const cleanEmails = await db.analysisLog.count({
        where: {
            orgId,
            verdict: "CLEAN"
        }
    });

    // 4. Calculate Risk Profile
    const riskRatio = totalScans > 0 ? (threatsFound / totalScans) : 0;
    let riskLevel = "Low";
    if (riskRatio > 0.1) riskLevel = "Medium";
    if (riskRatio > 0.3) riskLevel = "High";

    // 5. Recent Activity
    const recentLogs = await db.analysisLog.findMany({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
            id: true,
            verdict: true,
            createdAt: true,
            riskScore: true // Renamed from score
        }
    });

    // 6. Daily Usage
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const dailyScans = await db.analysisLog.count({
        where: {
            orgId,
            createdAt: { gte: startOfDay }
        }
    });

    // Check Plan Status
    const org = await db.organization.findUnique({
        where: { id: orgId },
        select: { planTier: true }
    });

    return {
        totalScans,
        threatsFound,
        cleanEmails,
        riskLevel,
        recentLogs: recentLogs.map(l => ({
            ...l,
            timestamp: l.createdAt, // Map legacy field for frontend
            score: l.riskScore      // Map legacy field
        })),
        isPremium: org?.planTier !== "FREE",
        dailyScans
    };
}
