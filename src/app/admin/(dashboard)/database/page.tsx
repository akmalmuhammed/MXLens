"use client";

import { Database, Table, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DatabasePage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Database className="h-6 w-6 text-primary" />
                        Database
                    </h1>
                    <p className="text-muted-foreground font-mono text-sm">
                        Database statistics and management
                    </p>
                </div>
                <Button variant="outline" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-card p-4">
                    <Table className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-semibold">Organizations</h3>
                    <p className="text-2xl font-bold font-mono">0</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                    <Table className="h-8 w-8 text-secure mb-2" />
                    <h3 className="font-semibold">Users</h3>
                    <p className="text-2xl font-bold font-mono">0</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                    <Table className="h-8 w-8 text-secondary mb-2" />
                    <h3 className="font-semibold">Analyses</h3>
                    <p className="text-2xl font-bold font-mono">0</p>
                </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-8 text-center">
                <Database className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Database Healthy</h3>
                <p className="text-muted-foreground text-sm">
                    PostgreSQL on Neon • 12ms average latency
                </p>
            </div>
        </div>
    );
}
