"use client";

import { AlertTriangle, Search, Shield, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function MaliciousAnalysesPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                        Malicious Analyses
                    </h1>
                    <p className="text-muted-foreground font-mono text-sm">
                        All analyses flagged as malicious across organizations
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search malicious analyses..." className="pl-10" />
                </div>
                <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                </Button>
            </div>

            <div className="rounded-lg border border-border bg-card p-8 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Malicious Analyses Found</h3>
                <p className="text-muted-foreground text-sm">
                    All clear! There are no malicious analyses detected at this time.
                </p>
            </div>
        </div>
    );
}
