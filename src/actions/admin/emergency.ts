"use server";

import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth"; // Assuming NextAuth v5 or similar setup
import { logAuditAction } from "@/lib/audit";

import { AuditAction } from "@prisma/client";

// Keys for Redis
const KEYS = {
    BLOCKLIST: "security:blocklist:users",
    LOCKDOWN: "system:lockdown:level", // 0=None, 1=NoSignup, 2=ReadOnly, 3=Maintenance
};

// Types
export type LockdownLevel = 0 | 1 | 2 | 3;

/**
 * Helper: Ensure caller is a Super Admin
 */
export async function assertSuperAdmin() {
    const session = await auth();
    // Logic depends on how 'isPlatformAdmin' is stored in session. 
    // For now, we assume standard session check or DB lookup.
    if (!session?.user?.email) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: { email: session.user.email },
        select: { isPlatformAdmin: true, adminRole: true }
    });

    // Explicit check for existence and properties
    if (!user || !user.isPlatformAdmin || user.adminRole !== 'SUPER_ADMIN') {
        throw new Error("Insufficient Permissions");
    }
    return user;
}

/**
 * Emergency: Suspend a User immediately.
 * 1. Wipe all active sessions.
 * 2. Add to Redis Blocklist (checked by middleware).
 */
export async function suspendUser(targetUserId: string, reason: string) {
    await assertSuperAdmin();

    console.log(`[EMERGENCY] Suspending User ${targetUserId}. Reason: ${reason}`);

    // 1. Database: Delete Sessions
    await db.session.deleteMany({
        where: { userId: targetUserId }
    });

    // 2. Redis: Add to Blocklist (Permanent ban until removed)
    // We store the reason as value
    await redis.set(`${KEYS.BLOCKLIST}:${targetUserId}`, reason);

    // 3. Optional: Add 'banned' tag to user metadata if exists, generally we rely on Redis for fast rejection

    await logAuditAction(AuditAction.USER_SUSPEND, { targetUserId, reason }, targetUserId);

    revalidatePath("/admin/users");
    return { success: true, message: "User suspended and sessions revoked." };
}

/**
 * Emergency: Revoke an API Key.
 */
export async function revokeApiKey(apiKeyId: string) {
    await assertSuperAdmin();

    await db.apiKey.update({
        where: { id: apiKeyId },
        data: { isActive: false }
    });

    await logAuditAction(AuditAction.API_KEY_REVOKE, { apiKeyId }, apiKeyId);

    revalidatePath("/admin/settings");
    return { success: true, message: "API Key revoked." };
}

/**
 * Emergency: Set System Lockdown Level.
 * 0: Normal
 * 1: No Signups (allow existing)
 * 2: Read-Only (no new analysis)
 * 3: Maintenance (full block)
 */
export async function setSystemLockdown(level: LockdownLevel) {
    await assertSuperAdmin();

    await redis.set(KEYS.LOCKDOWN, level.toString());

    console.log(`[EMERGENCY] System Lockdown set to Level ${level}`);
    await logAuditAction(AuditAction.SYSTEM_LOCKDOWN, { level: level });

    revalidatePath("/");
    return { success: true, level };
}

/**
 * Get current lockdown status
 */
export async function getSystemLockdownStatus(): Promise<LockdownLevel> {
    const level = await redis.get<string | number>(KEYS.LOCKDOWN);
    return (Number(level) || 0) as LockdownLevel;
}

/**
 * Recover/Unsuspend User
 */
export async function unsuspendUser(targetUserId: string) {
    await assertSuperAdmin();
    await redis.del(`${KEYS.BLOCKLIST}:${targetUserId}`);
    await logAuditAction(AuditAction.USER_UNSUSPEND, { targetUserId }, targetUserId);
    return { success: true, message: "User unsuspended." };
}
