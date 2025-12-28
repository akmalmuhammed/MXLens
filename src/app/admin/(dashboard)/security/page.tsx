"use client";

import { Shield, AlertTriangle, Lock, Key } from "lucide-react";

export default function SecurityPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Shield className="h-6 w-6 text-secure" />
                    Security Overview
                </h1>
                <p className="text-muted-foreground font-mono text-sm">
                    Platform security status and configurations
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-secure/30 bg-secure/10 p-4">
                    <div className="flex items-center gap-2 text-secure mb-1">
                        <Lock className="h-4 w-4" />
                        <span className="text-sm font-medium">Encryption</span>
                    </div>
                    <p className="text-lg font-bold">Active</p>
                    <p className="text-xs text-muted-foreground">AES-256</p>
                </div>
                <div className="rounded-lg border border-secure/30 bg-secure/10 p-4">
                    <div className="flex items-center gap-2 text-secure mb-1">
                        <Key className="h-4 w-4" />
                        <span className="text-sm font-medium">API Security</span>
                    </div>
                    <p className="text-lg font-bold">Enabled</p>
                    <p className="text-xs text-muted-foreground">Rate limiting active</p>
                </div>
                <div className="rounded-lg border border-secure/30 bg-secure/10 p-4">
                    <div className="flex items-center gap-2 text-secure mb-1">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">Threats Blocked</span>
                    </div>
                    <p className="text-lg font-bold font-mono">0</p>
                    <p className="text-xs text-muted-foreground">Last 24 hours</p>
                </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-8 text-center">
                <Shield className="h-12 w-12 text-secure mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">All Systems Secure</h3>
                <p className="text-muted-foreground text-sm">
                    No security incidents detected.
                </p>
            </div>
        </div>
    );
}
