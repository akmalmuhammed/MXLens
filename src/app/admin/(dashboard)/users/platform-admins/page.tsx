
import { db } from "@/lib/db";
import { UsersClient } from "../users-client";
import { requireAdminAccessPage } from "@/lib/admin/admin-auth";

export default async function PlatformAdminsPage() {
    await requireAdminAccessPage();

    const users = await db.user.findMany({
        where: {
            OR: [
                { isPlatformAdmin: true },
                { adminRole: "SUPER_ADMIN" } // Use adminRole, not role
            ]
        },
        include: {
            _count: {
                select: { memberships: true }
            }
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    const formattedUsers = users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        isPlatformAdmin: u.isPlatformAdmin,
        adminRole: u.adminRole || "USER", // Use valid field
        orgs: u._count.memberships,
        status: "active",
        mfaEnabled: u.mfaEnabled,
        lastActive: u.updatedAt.toLocaleDateString(),
        createdAt: u.createdAt.toISOString()
    }));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Platform Admins</h1>
                <p className="text-muted-foreground">Manage administrators with platform access.</p>
            </div>
            <UsersClient users={formattedUsers} />
        </div>
    );
}
