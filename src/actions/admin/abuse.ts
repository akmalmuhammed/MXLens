"use server";

import { redis } from "@/lib/redis";
import { unblockIp } from "@/lib/security/abuse-detector";
import { assertSuperAdmin } from "@/actions/admin/emergency";
import { logAuditAction } from "@/lib/audit";
import { AuditAction } from "@prisma/client";

/**
 * Fetch stats for Abuse Dashboard
 */
export async function getAbuseStats() {
    await assertSuperAdmin(); // RBAC: blocklist contents are admin-only
    // 1. Get Blocked IPs
    const blockedIps = await redis.smembers("security:blocklist:ips");

    return {
        blockedIps
    };
}

/**
 * Unblock IP action
 */
export async function unblockIpAction(ip: string) {
    await assertSuperAdmin(); // RBAC
    await unblockIp(ip);
    await logAuditAction(AuditAction.IP_UNBLOCK, { ip, action: "manual_unblock" });
    return { success: true };
}
