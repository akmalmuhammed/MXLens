import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/admin/auth";

export type AdminRole = "SUPER_ADMIN" | "SUPPORT_ADMIN" | "BILLING_ADMIN" | "READ_ONLY";

export interface AdminSession {
    userId: string;
    email: string;
    name: string | null;
    adminRole: AdminRole;
}

function isDynamicServerUsageError(error: unknown): boolean {
    return (
        typeof error === "object" &&
        error !== null &&
        "digest" in error &&
        String((error as { digest?: unknown }).digest).startsWith("DYNAMIC_SERVER_USAGE")
    );
}

export async function getAdminSession(): Promise<AdminSession | null> {
    try {
        // Use the cookie-based admin session verification
        const session = await verifyAdminSession();

        if (!session) {
            return null;
        }

        return {
            userId: session.userId,
            email: session.email,
            name: session.name,
            adminRole: (session.role as AdminRole) || "SUPER_ADMIN",
        };
    } catch (error) {
        if (isDynamicServerUsageError(error)) {
            throw error;
        }

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
        // Redirect to admin login
        const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
        const domain = process.env.NODE_ENV === "production" ? "admin.mxlens.com" : "admin.localhost:3000";
        redirect(`${protocol}://${domain}/admin/auth/signin`);
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
