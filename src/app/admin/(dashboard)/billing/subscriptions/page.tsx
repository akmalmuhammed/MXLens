import { db } from "@/lib/db";
import { requireAdminAccessPage } from "@/lib/admin/admin-auth";
import { SubscriptionsClient } from "./subscriptions-client";

export default async function SubscriptionsPage() {
    await requireAdminAccessPage();

    // Fetch organizations with active subscriptions
    const organizations = await db.organization.findMany({
        where: {
            OR: [
                { planTier: "PRO" },
                { planTier: "ENTERPRISE" },
            ],
        },
        select: {
            id: true,
            name: true,
            slug: true,
            planTier: true,
            stripeCustomerId: true,
            stripeSubscriptionId: true,
            subscriptionStatus: true,
            currentPeriodEnd: true,
            createdAt: true,
            _count: {
                select: { members: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    const subscriptions = organizations.map((org) => ({
        id: org.id,
        orgName: org.name,
        orgSlug: org.slug,
        plan: org.planTier,
        status: org.subscriptionStatus || "inactive",
        stripeCustomerId: org.stripeCustomerId,
        stripeSubscriptionId: org.stripeSubscriptionId,
        currentPeriodEnd: org.currentPeriodEnd?.toISOString() || null,
        members: org._count.members,
        createdAt: org.createdAt.toISOString(),
    }));

    // Calculate stats
    const stats = {
        totalActive: subscriptions.filter(s => s.status === "active").length,
        totalPro: subscriptions.filter(s => s.plan === "PRO").length,
        totalEnterprise: subscriptions.filter(s => s.plan === "ENTERPRISE").length,
        pastDue: subscriptions.filter(s => s.status === "past_due").length,
    };

    return <SubscriptionsClient subscriptions={subscriptions} stats={stats} />;
}
