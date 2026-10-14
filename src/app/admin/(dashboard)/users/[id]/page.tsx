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
        },
    });

    if (!user) {
        notFound();
    }

    const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified?.toISOString() || null,
        image: user.image,
        isPlatformAdmin: user.isPlatformAdmin,
        adminRole: user.adminRole,
        status: user.emailVerified ? "active" : "pending",
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        lastActive: null,
        organizations: user.memberships.map((m) => ({
            id: m.organization.id,
            name: m.organization.name,
            slug: m.organization.slug,
            role: m.role,
            planTier: m.organization.planTier,
            subscriptionStatus: m.organization.subscriptionStatus,
            joinedAt: m.joinedAt.toISOString(),
        })),
        authProviders: [{ provider: "clerk" }],
        activeSessions: 0,
    };

    return <UserDetail user={userData} />;
}
