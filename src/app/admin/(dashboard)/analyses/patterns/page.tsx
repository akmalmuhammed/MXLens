"use client";

import { Fingerprint, Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function PatternsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Fingerprint className="h-6 w-6 text-primary" />
                        Detection Patterns
                    </h1>
                    <p className="text-muted-foreground font-mono text-sm">
                        Custom detection patterns and rules
                    </p>
                </div>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Pattern
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search patterns..." className="pl-10" />
                </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-8 text-center">
                <Fingerprint className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Patterns Configured</h3>
                <p className="text-muted-foreground text-sm">
                    Detection patterns will appear here once configured.
                </p>
            </div>
        </div>
    );
}
