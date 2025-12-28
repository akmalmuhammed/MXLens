import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/admin-auth";

export type AdminRole = "SUPER_ADMIN" | "SUPPORT_ADMIN" | "BILLING_ADMIN" | "READ_ONLY";

export interface AdminSession {
    userId: string;
    email: string;
    name: string | null;
    adminRole: AdminRole;
}

/**
 * Get the current admin session from Better Auth.
 * Returns null if user is not logged in or not a platform admin.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
    try {
        // Get session from Better Auth using the API
        const session = await adminAuth.api.getSession({
            headers: {
                cookie: (await cookies()).toString(),
            },
        });

        if (!session?.user?.id) {
            return null;
        }

        // Query admin user from our isolated admin table
        const adminUser = await db.adminUser.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isPlatformAdmin: true,
            },
        });

        if (!adminUser || !adminUser.isPlatformAdmin) {
            return null;
        }

        return {
            userId: adminUser.id,
            email: adminUser.email,
            name: adminUser.name,
            adminRole: (adminUser.role as AdminRole) || "SUPER_ADMIN",
        };
    } catch (error) {
        console.error("Error getting admin session:", error);
        return null;
    }
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
 * Require admin access for page routes. Redirects to login if not admin.
 */
export async function requireAdminAccessPage(): Promise<AdminSession> {
    const adminSession = await getAdminSession();

    if (!adminSession) {
        redirect("/admin/auth/signin");
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
