import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdminAccessPage } from "@/lib/admin/admin-auth";
import { OrganizationDetail } from "./organization-detail";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function OrganizationDetailPage({ params }: Props) {
    await requireAdminAccessPage();

    const { id } = await params;

    const organization = await db.organization.findUnique({
        where: { id },
        include: {
            members: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            createdAt: true,
                        },
                    },
                },
            },
            _count: {
                select: {
                    analysisLogs: true,
                    apiKeys: true,
                },
            },
        },
    });

    if (!organization) {
        notFound();
    }

    const orgData = {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        planTier: organization.planTier,
        stripeCustomerId: organization.stripeCustomerId,
        subscriptionStatus: organization.subscriptionStatus,
        createdAt: organization.createdAt.toISOString(),
        members: organization.members.map((m) => ({
            id: m.id,
            userId: m.user.id,
            name: m.user.name,
            email: m.user.email,
            role: m.role,
            joinedAt: m.joinedAt.toISOString(),
        })),
        stats: {
            analyses: organization._count.analysisLogs,
            apiKeys: organization._count.apiKeys,
            members: organization.members.length,
        },
    };

    return <OrganizationDetail organization={orgData} />;
}
