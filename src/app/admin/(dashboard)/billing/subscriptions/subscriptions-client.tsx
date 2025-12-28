"use client";

import Link from "next/link";
import { CreditCard, Building2, AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface Subscription {
    id: string;
    orgName: string;
    orgSlug: string;
    plan: string;
    status: string;
    stripeCustomerId: string | null;
    subscriptionId: string | null;
    renewsAt: string;
    members: number;
    createdAt: string;
}

interface Props {
    subscriptions: Subscription[];
    stats: {
        totalActive: number;
        totalPro: number;
        totalEnterprise: number;
        pastDue: number;
    };
}

export function SubscriptionsClient({ subscriptions, stats }: Props) {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <CreditCard className="h-6 w-6 text-primary" />
                    Subscriptions
                </h1>
                <p className="text-muted-foreground font-mono text-sm">
                    Active subscriptions and billing status
                </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-4">
                <div className="rounded-lg border border-secure/30 bg-secure/10 p-4">
                    <div className="flex items-center gap-2 text-secure mb-1">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">Active</span>
                    </div>
                    <p className="text-2xl font-bold font-mono">{stats.totalActive}</p>
                </div>
                <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
                    <div className="flex items-center gap-2 text-primary mb-1">
                        <span className="text-sm">Pro Plans</span>
                    </div>
                    <p className="text-2xl font-bold font-mono">{stats.totalPro}</p>
                </div>
                <div className="rounded-lg border border-secondary/30 bg-secondary/10 p-4">
                    <div className="flex items-center gap-2 text-secondary mb-1">
                        <span className="text-sm">Enterprise</span>
                    </div>
                    <p className="text-2xl font-bold font-mono">{stats.totalEnterprise}</p>
                </div>
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
                    <div className="flex items-center gap-2 text-destructive mb-1">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">Past Due</span>
                    </div>
                    <p className="text-2xl font-bold font-mono">{stats.pastDue}</p>
                </div>
            </div>

            {/* Subscriptions Table */}
            <div className="rounded-lg border border-border bg-card overflow-hidden">
                {subscriptions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center">
                        <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Active Subscriptions</h3>
                        <p className="text-muted-foreground text-sm">
                            Paid subscriptions will appear here once organizations upgrade.
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
                                    Renews
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                                    Members
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {subscriptions.map((sub) => (
                                <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3">
                                        <Link href={`/admin/organizations/${sub.id}`} className="hover:text-primary">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/20 text-primary">
                                                    <Building2 className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{sub.orgName}</p>
                                                    <p className="text-xs text-muted-foreground font-mono">/{sub.orgSlug}</p>
                                                </div>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${sub.plan === "ENTERPRISE"
                                            ? "bg-primary/20 text-primary border-primary/30"
                                            : "bg-secure/20 text-secure border-secure/30"
                                            }`}>
                                            {sub.plan}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1.5 text-sm ${sub.status === "active" ? "text-secure" :
                                            sub.status === "past_due" ? "text-destructive" : "text-warning"
                                            }`}>
                                            <span className={`h-2 w-2 rounded-full ${sub.status === "active" ? "bg-secure" :
                                                sub.status === "past_due" ? "bg-destructive" : "bg-warning"
                                                }`} />
                                            {sub.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                        {new Date(sub.renewsAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-sm">{sub.members}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
