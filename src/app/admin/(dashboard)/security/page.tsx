"use client";

import { useEffect, useState } from "react";
import { Shield, AlertTriangle, Lock, Key, Ban, Activity, AlertOctagon } from "lucide-react";
import { getSecurityOverview, SecurityStats } from "@/actions/admin/security";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export default function SecurityPage() {
    const [stats, setStats] = useState<SecurityStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getSecurityOverview()
            .then(setStats)
            .finally(() => setLoading(false));
    }, []);

    const lockdownStatus = {
        0: { label: "Normal", color: "text-green-500", bg: "bg-green-500/10" },
        1: { label: "No Signups", color: "text-amber-500", bg: "bg-amber-500/10" },
        2: { label: "Read-Only", color: "text-orange-500", bg: "bg-orange-500/10" },
        3: { label: "Maintenance", color: "text-red-500", bg: "bg-red-500/10" },
    }[stats?.lockdownLevel || 0] || { label: "Unknown", color: "text-gray-500", bg: "bg-gray-500/10" };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Shield className="h-6 w-6 text-secure" />
                        Security Control Center
                    </h1>
                    <p className="text-muted-foreground font-mono text-sm">
                        Live threat intelligence and platform defense status
                    </p>
                </div>
                {stats && stats.lockdownLevel > 0 && (
                    <Badge variant="outline" className={`${lockdownStatus.color} ${lockdownStatus.bg} border-current animate-pulse`}>
                        <AlertOctagon className="w-4 h-4 mr-2" />
                        System Lockdown: {lockdownStatus.label}
                    </Badge>
                )}
            </div>

            {/* Key Metrics */}
            <div className="grid gap-4 sm:grid-cols-4">
                <Card className="bg-card/50 border-secure/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Lock className="h-4 w-4 text-secure" /> Encryption
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">AES-256</div>
                        <p className="text-xs text-muted-foreground mt-1">At Rest & Transit</p>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 border-secure/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Activity className="h-4 w-4 text-primary" /> Analysis Volume (24h)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">
                            {loading ? "..." : stats?.totalAnalyses24h}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Scans processed</p>
                    </CardContent>
                </Card>

                <Card className={`bg-card/50 border-secure/20 ${stats && stats.activeThreats24h > 0 ? "border-red-500/50 bg-red-500/5" : ""}`}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <AlertTriangle className={`h-4 w-4 ${stats && stats.activeThreats24h > 0 ? "text-red-500" : "text-secure"}`} />
                            Threats Blocked (24h)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold font-mono ${stats && stats.activeThreats24h > 0 ? "text-red-500" : ""}`}>
                            {loading ? "..." : stats?.activeThreats24h}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Malicious verdicts</p>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 border-secure/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Key className="h-4 w-4 text-secure" /> API Security
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">Active</div>
                        <p className="text-xs text-muted-foreground mt-1">Rate limiting enabled</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Incidents Feed */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Ban className="h-5 w-5 text-red-500" />
                    Recent Security Incidents
                </h3>

                <div className="rounded-lg border border-border bg-card overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-muted-foreground">Loading threat feed...</div>
                    ) : !stats?.recentIncidents.length ? (
                        <div className="p-12 text-center">
                            <Shield className="h-12 w-12 text-secure mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-medium">All Clear</h3>
                            <p className="text-muted-foreground text-sm">No malicious activity detected recently.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {stats.recentIncidents.map((incident) => (
                                <div key={incident.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                                            <AlertOctagon className="h-5 w-5 text-red-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm flex items-center gap-2">
                                                Malicious Content Detected
                                                <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-500">
                                                    Risk: {incident.riskScore}
                                                </Badge>
                                            </p>
                                            <p className="text-xs text-muted-foreground font-mono">
                                                Org: {incident.organization?.name || "Unknown"} • ID: {incident.id.substring(0, 8)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground font-mono">
                                        {formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
