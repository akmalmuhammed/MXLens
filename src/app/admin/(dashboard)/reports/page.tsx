"use client";

import { FileBarChart, Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <FileBarChart className="h-6 w-6 text-primary" />
                        Reports
                    </h1>
                    <p className="text-muted-foreground font-mono text-sm">
                        Generate and download reports
                    </p>
                </div>
                <Button className="gap-2">
                    <Download className="h-4 w-4" />
                    Generate Report
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-card p-4 hover:bg-muted/30 cursor-pointer transition-colors">
                    <FileBarChart className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-semibold">Usage Report</h3>
                    <p className="text-xs text-muted-foreground">Platform usage analytics</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4 hover:bg-muted/30 cursor-pointer transition-colors">
                    <FileBarChart className="h-8 w-8 text-secure mb-2" />
                    <h3 className="font-semibold">Security Report</h3>
                    <p className="text-xs text-muted-foreground">Threat analysis summary</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4 hover:bg-muted/30 cursor-pointer transition-colors">
                    <FileBarChart className="h-8 w-8 text-secondary mb-2" />
                    <h3 className="font-semibold">Billing Report</h3>
                    <p className="text-xs text-muted-foreground">Revenue and subscriptions</p>
                </div>
            </div>
        </div>
    );
}
