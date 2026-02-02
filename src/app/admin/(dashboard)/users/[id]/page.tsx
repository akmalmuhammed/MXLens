import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdminAccessPage } from "@/lib/admin/admin-auth";
import { UserDetail } from "./user-detail";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: Props) {
    await requireAdminAccessPage();

    const { id } = await params;

    const user = await db.user.findUnique({
        where: { id },
        include: {
            memberships: {
                include: {
                    organization: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            planTier: true,
                            subscriptionStatus: true,
                        },
                    },
                },
            },
            accounts: {
                select: {
                    provider: true,
                },
            },
            sessions: {
                select: {
                    id: true,
                    expires: true,
                },
                orderBy: { expires: "desc" },
                take: 5,
            },
        },
    });

    if (!user) {
        notFound();
    }

    // Calculate status
    const now = new Date();
    const activeSessions = user.sessions.filter((s) => s.expires > now);

    const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified?.toISOString() || null,
        image: user.image,
        isPlatformAdmin: user.isPlatformAdmin,
        adminRole: user.adminRole,
        status: activeSessions.length > 0 ? "active" : "inactive",
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        lastActive: user.sessions[0]?.expires?.toISOString() || null,
        organizations: user.memberships.map((m) => ({
            id: m.organization.id,
            name: m.organization.name,
            slug: m.organization.slug,
            role: m.role,
            planTier: m.organization.planTier,
            subscriptionStatus: m.organization.subscriptionStatus,
            joinedAt: m.joinedAt.toISOString(),
        })),
        authProviders: user.accounts.map((a) => ({
            provider: a.provider,
        })),
        activeSessions: activeSessions.length,
    };

    return <UserDetail user={userData} />;
}
