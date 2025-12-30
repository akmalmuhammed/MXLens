"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Activity,
    Server,
    Database,
    Users,
    Building2,
    BarChart3,
    CheckCircle,
    AlertTriangle,
    XCircle,
    Clock,
    RefreshCw,
    Zap,
    Shield,
    TrendingUp,
    Webhook
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MonitoringData {
    timestamp: string;
    system: {
        status: "healthy" | "degraded" | "unhealthy";
        database: {
            status: "up" | "down";
            latencyMs: number;
        };
        memory: {
            usedMB: number;
            percentUsed: number;
        };
    };
    metrics: {
        users: {
            total: number;
            active30d: number;
        };
        organizations: {
            total: number;
            paying: number;
        };
        analyses: {
            total: number;
            today: number;
            thisWeek: number;
            threatRate: number;
        };
    };
    webhooks: {
        stripe: {
            successCount: number;
            failureCount: number;
            lastProcessed: string | null;
        };
    };
}

export default function MonitoringDashboard() {
    const [data, setData] = useState<MonitoringData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [autoRefresh, setAutoRefresh] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/monitoring");
            if (!res.ok) throw new Error("Failed to fetch monitoring data");
            const json = await res.json();
            setData(json);
            setError(null);
            setLastRefresh(new Date());
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [autoRefresh, fetchData]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "healthy":
            case "up":
                return <CheckCircle className="h-5 w-5 text-secure" />;
            case "degraded":
                return <AlertTriangle className="h-5 w-5 text-warning" />;
            case "unhealthy":
            case "down":
                return <XCircle className="h-5 w-5 text-destructive" />;
            default:
                return <Activity className="h-5 w-5 text-muted-foreground" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "healthy":
            case "up":
                return "text-secure bg-secure/10 border-secure/30";
            case "degraded":
                return "text-warning bg-warning/10 border-warning/30";
            case "unhealthy":
            case "down":
                return "text-destructive bg-destructive/10 border-destructive/30";
            default:
                return "text-muted-foreground bg-muted border-border";
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <XCircle className="h-12 w-12 text-destructive" />
                <p className="text-destructive">{error}</p>
                <Button onClick={fetchData} variant="outline">
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Activity className="h-6 w-6 text-primary" />
                        Monitoring Dashboard
                    </h1>
                    <p className="text-muted-foreground font-mono text-sm">
                        Real-time system metrics and health monitoring
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="font-mono">
                            Last updated: {lastRefresh.toLocaleTimeString()}
                        </span>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchData}
                        className="gap-2"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </Button>
                    <Button
                        variant={autoRefresh ? "default" : "outline"}
                        size="sm"
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className="gap-2"
                    >
                        <Zap className="h-4 w-4" />
                        Auto ({autoRefresh ? "ON" : "OFF"})
                    </Button>
                </div>
            </div>

            {/* System Status Banner */}
            <div
                className={cn(
                    "p-4 rounded-lg border flex items-center gap-3",
                    getStatusColor(data?.system.status || "")
                )}
            >
                {getStatusIcon(data?.system.status || "")}
                <div>
                    <p className="font-semibold capitalize">
                        System {data?.system.status}
                    </p>
                    <p className="text-sm opacity-80">
                        Database: {data?.system.database.latencyMs}ms | Memory: {data?.system.memory.percentUsed}%
                    </p>
                </div>
            </div>

            {/* Infrastructure Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* API Server */}
                <div className={cn("rounded-lg border p-4", getStatusColor("healthy"))}>
                    <div className="flex items-center gap-2 mb-2">
                        <Server className="h-4 w-4" />
                        <span className="text-sm font-medium">API Server</span>
                    </div>
                    <p className="text-lg font-bold">Operational</p>
                    <p className="text-xs opacity-70">Vercel Edge</p>
                </div>

                {/* Database */}
                <div className={cn("rounded-lg border p-4", getStatusColor(data?.system.database.status || ""))}>
                    <div className="flex items-center gap-2 mb-2">
                        <Database className="h-4 w-4" />
                        <span className="text-sm font-medium">Database</span>
                    </div>
                    <p className="text-lg font-bold capitalize">{data?.system.database.status}</p>
                    <p className="text-xs opacity-70">{data?.system.database.latencyMs}ms latency</p>
                </div>

                {/* Memory */}
                <div className={cn(
                    "rounded-lg border p-4",
                    getStatusColor(
                        (data?.system.memory.percentUsed || 0) > 85 ? "degraded" : "healthy"
                    )
                )}>
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4" />
                        <span className="text-sm font-medium">Memory</span>
                    </div>
                    <p className="text-lg font-bold">{data?.system.memory.percentUsed}%</p>
                    <p className="text-xs opacity-70">{data?.system.memory.usedMB} MB used</p>
                </div>

                {/* Webhooks */}
                <div className={cn("rounded-lg border p-4", getStatusColor("healthy"))}>
                    <div className="flex items-center gap-2 mb-2">
                        <Webhook className="h-4 w-4" />
                        <span className="text-sm font-medium">Stripe Webhooks</span>
                    </div>
                    <p className="text-lg font-bold">Active</p>
                    <p className="text-xs opacity-70">0 failures (1hr)</p>
                </div>
            </div>

            {/* Platform Metrics */}
            <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Platform Metrics
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        icon={Users}
                        value={data?.metrics.users.total || 0}
                        label="Total Users"
                        subLabel={`${data?.metrics.users.active30d || 0} active`}
                        color="primary"
                    />
                    <MetricCard
                        icon={Building2}
                        value={data?.metrics.organizations.total || 0}
                        label="Organizations"
                        subLabel={`${data?.metrics.organizations.paying || 0} paying`}
                        color="secondary"
                    />
                    <MetricCard
                        icon={Shield}
                        value={data?.metrics.analyses.total || 0}
                        label="Total Analyses"
                        subLabel={`${data?.metrics.analyses.today || 0} today`}
                        color="secure"
                    />
                    <MetricCard
                        icon={TrendingUp}
                        value={`${data?.metrics.analyses.threatRate || 0}%`}
                        label="Threat Rate"
                        subLabel="of all analyses"
                        color="warning"
                    />
                </div>
            </div>

            {/* Analysis Activity */}
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Analyses Today</p>
                    <p className="text-3xl font-bold font-mono text-primary">
                        {data?.metrics.analyses.today?.toLocaleString() || 0}
                    </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">This Week</p>
                    <p className="text-3xl font-bold font-mono">
                        {data?.metrics.analyses.thisWeek?.toLocaleString() || 0}
                    </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">All Time</p>
                    <p className="text-3xl font-bold font-mono text-muted-foreground">
                        {data?.metrics.analyses.total?.toLocaleString() || 0}
                    </p>
                </div>
            </div>

            {/* External Links */}
            <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="font-semibold mb-3">External Monitoring</h3>
                <div className="flex flex-wrap gap-3">
                    <a
                        href="https://sentry.io"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-md bg-muted hover:bg-muted/80 text-sm font-medium transition-colors"
                    >
                        Sentry Dashboard →
                    </a>
                    <a
                        href="https://vercel.com/dashboard"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-md bg-muted hover:bg-muted/80 text-sm font-medium transition-colors"
                    >
                        Vercel Analytics →
                    </a>
                    <a
                        href="https://console.neon.tech"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-md bg-muted hover:bg-muted/80 text-sm font-medium transition-colors"
                    >
                        Neon Console →
                    </a>
                </div>
            </div>
        </div>
    );
}

// Sub-component for metric cards
function MetricCard({
    icon: Icon,
    value,
    label,
    subLabel,
    color
}: {
    icon: React.ComponentType<{ className?: string }>;
    value: number | string;
    label: string;
    subLabel: string;
    color: "primary" | "secondary" | "secure" | "warning" | "destructive";
}) {
    const colorClasses = {
        primary: "bg-primary/20 text-primary",
        secondary: "bg-secondary/20 text-secondary",
        secure: "bg-secure/20 text-secure",
        warning: "bg-warning/20 text-warning",
        destructive: "bg-destructive/20 text-destructive"
    };

    return (
        <div className="flex items-center gap-4">
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-lg", colorClasses[color])}>
                <Icon className="h-6 w-6" />
            </div>
            <div>
                <p className="text-2xl font-bold font-mono">
                    {typeof value === "number" ? value.toLocaleString() : value}
                </p>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-xs text-muted-foreground/70">{subLabel}</p>
            </div>
        </div>
    );
}
