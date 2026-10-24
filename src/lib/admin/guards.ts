import "server-only";

import { verifyAdminSession } from "@/lib/admin/auth";

/** Enforce the dedicated platform-admin session and least-privilege role. */
export async function assertSuperAdmin() {
    const session = await verifyAdminSession();
    if (!session) throw new Error("Unauthorized");
    if (session.role !== "SUPER_ADMIN") throw new Error("Insufficient Permissions");
    return session;
}
