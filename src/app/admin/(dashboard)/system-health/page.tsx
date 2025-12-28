"use client";

import { Activity, Server, Cpu, HardDrive, Wifi } from "lucide-react";

export default function SystemHealthPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Activity className="h-6 w-6 text-secure" />
                    System Health
                </h1>
                <p className="text-muted-foreground font-mono text-sm">
                    Platform infrastructure status
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
                <div className="rounded-lg border border-secure/30 bg-secure/10 p-4">
                    <div className="flex items-center gap-2 text-secure mb-2">
                        <Server className="h-4 w-4" />
                        <span className="text-sm font-medium">API</span>
                    </div>
                    <p className="text-lg font-bold">Healthy</p>
                    <p className="text-xs text-muted-foreground">99.9% uptime</p>
                </div>
                <div className="rounded-lg border border-secure/30 bg-secure/10 p-4">
                    <div className="flex items-center gap-2 text-secure mb-2">
                        <HardDrive className="h-4 w-4" />
                        <span className="text-sm font-medium">Database</span>
                    </div>
                    <p className="text-lg font-bold">Healthy</p>
                    <p className="text-xs text-muted-foreground">12ms latency</p>
                </div>
                <div className="rounded-lg border border-secure/30 bg-secure/10 p-4">
                    <div className="flex items-center gap-2 text-secure mb-2">
                        <Cpu className="h-4 w-4" />
                        <span className="text-sm font-medium">Workers</span>
                    </div>
                    <p className="text-lg font-bold">Active</p>
                    <p className="text-xs text-muted-foreground">4 instances</p>
                </div>
                <div className="rounded-lg border border-secure/30 bg-secure/10 p-4">
                    <div className="flex items-center gap-2 text-secure mb-2">
                        <Wifi className="h-4 w-4" />
                        <span className="text-sm font-medium">CDN</span>
                    </div>
                    <p className="text-lg font-bold">Active</p>
                    <p className="text-xs text-muted-foreground">Global edge</p>
                </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-8 text-center">
                <Activity className="h-12 w-12 text-secure mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-secure">All Systems Operational</h3>
                <p className="text-muted-foreground text-sm">
                    No incidents reported. Last checked: just now
                </p>
            </div>
        </div>
    );
}
