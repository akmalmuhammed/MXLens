"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function getDashboardStats() {
    const session = await auth();
    if (!session?.user?.id) {
        return {
            totalScans: 0,
            threatsFound: 0,
            cleanEmails: 0,
            riskLevel: "Low",
            recentLogs: []
        };
    }

    const userId = session.user.id;

    // 1. Total Scans
    const totalScans = await db.usageLog.count({
        where: { userId }
    });

    // 2. Threats Found (High Risk / Malicious)
    // Assuming 'verdict' string matches what we store. 
    // We need to know possible values. Based on EmailAnalyzer, likely "High Risk", "Likely Legitimate", etc.
    // Let's count "High Risk" and maybe "Suspicious" if that exists.
    const threatsFound = await db.usageLog.count({
        where: {
            userId,
            verdict: { in: ["High Risk", "Malicious", "Phishing"] }
        }
    });

    // 3. Clean Emails
    const cleanEmails = await db.usageLog.count({
        where: {
            userId,
            verdict: { in: ["Likely Legitimate", "Safe", "Clean"] }
        }
    });

    // 4. Calculate Risk Profile based on recent ratio
    const riskRatio = totalScans > 0 ? (threatsFound / totalScans) : 0;
    let riskLevel = "Low";
    if (riskRatio > 0.1) riskLevel = "Medium";
    if (riskRatio > 0.3) riskLevel = "High";

    // 5. Recent Activity
    const recentLogs = await db.usageLog.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: 5,
        select: {
            id: true,
            verdict: true,
            timestamp: true,
            score: true
        }
    });

    return {
        totalScans,
        threatsFound,
        cleanEmails,
        riskLevel,
        recentLogs
    };
}
