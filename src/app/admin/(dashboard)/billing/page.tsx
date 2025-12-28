"use client";

import { CreditCard, DollarSign, TrendingUp, Users } from "lucide-react";

export default function BillingPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Billing Overview</h1>
                <p className="text-muted-foreground font-mono text-sm">
                    Platform-wide billing and revenue metrics
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
                <div className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <DollarSign className="h-4 w-4" />
                        <span className="text-sm">Monthly Revenue</span>
                    </div>
                    <p className="text-2xl font-bold font-mono">$0</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm">Growth</span>
                    </div>
                    <p className="text-2xl font-bold font-mono text-secure">0%</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Users className="h-4 w-4" />
                        <span className="text-sm">Paying Customers</span>
                    </div>
                    <p className="text-2xl font-bold font-mono">0</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <CreditCard className="h-4 w-4" />
                        <span className="text-sm">Active Subscriptions</span>
                    </div>
                    <p className="text-2xl font-bold font-mono">0</p>
                </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-8 text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Billing Data</h3>
                <p className="text-muted-foreground text-sm">
                    Billing information will appear once subscriptions are active.
                </p>
            </div>
        </div>
    );
}
