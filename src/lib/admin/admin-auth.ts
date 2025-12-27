import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export type AdminRole = "SUPER_ADMIN" | "SUPPORT_ADMIN" | "BILLING_ADMIN" | "READ_ONLY";

export interface AdminSession {
    userId: string;
    email: string;
    name: string | null;
    adminRole: AdminRole;
}

/**
 * Get the current admin session. Returns null if user is not a platform admin.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
    const session = await auth();

    if (!session?.user?.id) {
        return null;
    }

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            email: true,
            name: true,
            isPlatformAdmin: true,
            adminRole: true,
        },
    });

    if (!user || !user.isPlatformAdmin || !user.adminRole) {
        return null;
    }

    return {
        userId: user.id,
        email: user.email,
        name: user.name,
        adminRole: user.adminRole as AdminRole,
    };
}

/**
 * Require admin access. Throws if user is not an admin (for API routes).
 */
export async function requireAdminAccess(): Promise<AdminSession> {
    const adminSession = await getAdminSession();

    if (!adminSession) {
        throw new Error("Unauthorized: Admin access required");
    }

    return adminSession;
}

/**
 * Require admin access for page routes. Redirects to home if not admin.
 */
export async function requireAdminAccessPage(): Promise<AdminSession> {
    const adminSession = await getAdminSession();

    if (!adminSession) {
        redirect("/");
    }

    return adminSession;
}

/**
 * Check if admin has specific permission.
 */
export function hasAdminPermission(
    adminSession: AdminSession,
    requiredPermissions: ("read" | "write" | "billing" | "users" | "settings")[]
): boolean {
    const rolePermissions: Record<AdminRole, string[]> = {
        SUPER_ADMIN: ["read", "write", "billing", "users", "settings"],
        SUPPORT_ADMIN: ["read", "write", "users"],
        BILLING_ADMIN: ["read", "billing"],
        READ_ONLY: ["read"],
    };

    const userPermissions = rolePermissions[adminSession.adminRole] || [];
    return requiredPermissions.every((p) => userPermissions.includes(p));
}

/**
 * Require specific admin permission. Throws if not authorized.
 */
export function requireAdminPermission(
    adminSession: AdminSession,
    requiredPermissions: ("read" | "write" | "billing" | "users" | "settings")[]
): void {
    if (!hasAdminPermission(adminSession, requiredPermissions)) {
        throw new Error(`Unauthorized: Missing required permissions: ${requiredPermissions.join(", ")}`);
    }
}
