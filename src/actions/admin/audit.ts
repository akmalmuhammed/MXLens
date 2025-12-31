"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function getAuditLogs() {
    const session = await auth();
    if (!session?.user?.orgId) return [];

    try {
        const logs = await db.auditLog.findMany({
            where: {
                orgId: session.user.orgId
            },
            take: 50,
            orderBy: {
                createdAt: "desc"
            },
            include: {
                user: {
                    select: { name: true, image: true, email: true }
                }
            }
        });
        return logs;
    } catch (error) {
        console.error("Failed to fetch audit logs:", error);
        return [];
    }
}
