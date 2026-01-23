import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
// adminAuth import removed as it's deprecated

export type AdminRole = "SUPER_ADMIN" | "SUPPORT_ADMIN" | "BILLING_ADMIN" | "READ_ONLY";

export interface AdminSession {
    userId: string;
    email: string;
    name: string | null;
    adminRole: AdminRole;
}

/**
 * Get the current admin session from NextAuth.
 * Returns null if user is not logged in or not a platform admin.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return null;
        }

        // Quick check from session token claims first
        if (!session.user.isPlatformAdmin) {
            return null;
        }

        // Double check against DB to ensure real-time revocation support
        const adminUser = await db.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                adminRole: true,
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
            adminRole: (adminUser.adminRole as AdminRole) || "SUPER_ADMIN",
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
        // Redirect to main auth login
        const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
        const domain = process.env.NODE_ENV === "production" ? "mxlens.com" : "localhost:3000";
        redirect(`${protocol}://${domain}/auth/signin`);
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
