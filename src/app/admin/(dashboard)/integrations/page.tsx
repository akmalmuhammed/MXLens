"use client";

import { Plug, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function IntegrationsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Plug className="h-6 w-6 text-primary" />
                        Integrations
                    </h1>
                    <p className="text-muted-foreground font-mono text-sm">
                        Platform-wide integration configurations
                    </p>
                </div>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Integration
                </Button>
            </div>

            <div className="rounded-lg border border-border bg-card p-8 text-center">
                <Plug className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Integrations Configured</h3>
                <p className="text-muted-foreground text-sm">
                    Add integrations to connect MXLens with external services.
                </p>
            </div>
        </div>
    );
}
