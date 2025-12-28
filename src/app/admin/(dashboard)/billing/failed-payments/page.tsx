import { db } from "@/lib/db";
import { requireAdminAccessPage } from "@/lib/admin/admin-auth";
import { AlertTriangle, Building2, CreditCard, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function FailedPaymentsPage() {
    await requireAdminAccessPage();

    // Fetch organizations with payment issues
    const failedPayments = await db.organization.findMany({
        where: {
            subscriptionStatus: "past_due",
        },
        select: {
            id: true,
            name: true,
            slug: true,
            planTier: true,
            stripeCustomerId: true,
            subscriptionStatus: true,
            currentPeriodEnd: true,
            _count: {
                select: { members: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                        Failed Payments
                    </h1>
                    <p className="text-muted-foreground font-mono text-sm">
                        Organizations with payment issues requiring attention
                    </p>
                </div>
                <Button variant="outline" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </Button>
            </div>

            {/* Alert Banner */}
            {failedPayments.length > 0 && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                    <div className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        <span className="font-medium">
                            {failedPayments.length} organization{failedPayments.length > 1 ? "s" : ""} with failed payments
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                        These organizations may lose access if payment is not resolved.
                    </p>
                </div>
            )}

            {/* Table */}
            <div className="rounded-lg border border-border bg-card overflow-hidden">
                {failedPayments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center">
                        <CreditCard className="h-12 w-12 text-secure mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2 text-secure">All Payments Healthy</h3>
                        <p className="text-muted-foreground text-sm">
                            No failed payments detected. All subscriptions are up to date.
                        </p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                    Organization
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                    Plan
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                    Grace Period Ends
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {failedPayments.map((org) => (
                                <tr key={org.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3">
                                        <Link href={`/admin/organizations/${org.id}`} className="hover:text-primary">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-destructive/20 text-destructive">
                                                    <Building2 className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{org.name}</p>
                                                    <p className="text-xs text-muted-foreground font-mono">/{org.slug}</p>
                                                </div>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border bg-muted text-muted-foreground border-border">
                                            {org.planTier}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center gap-1.5 text-sm text-destructive">
                                            <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                                            Past Due
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                        {org.currentPeriodEnd
                                            ? new Date(org.currentPeriodEnd).toLocaleDateString()
                                            : "—"
                                        }
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button size="sm" variant="outline">
                                            View in Stripe
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
