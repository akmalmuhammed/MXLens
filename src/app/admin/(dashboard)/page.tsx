"use client";

import { useEffect, useState } from "react";
import {
    Building2,
    Users,
    Shield,
    Activity,
    DollarSign,
    Database,
    AlertTriangle,
    Clock,
} from "lucide-react";
import { MetricCard } from "@/components/admin/MetricCard";
import { TrendChart } from "@/components/admin/TrendChart";
import { VerdictPieChart } from "@/components/admin/VerdictPieChart";
import { RecentActivityFeed } from "@/components/admin/RecentActivityFeed";
import { SystemHealthIndicator } from "@/components/admin/SystemHealthIndicator";
import { TopOrganizationsTable } from "@/components/admin/TopOrganizationsTable";

interface DashboardStats {
    totalOrganizations: number;
    activeOrganizations: number;
    enterpriseOrganizations: number;
    totalUsers: number;
    activeUsers30d: number;
    analysesToday: number;
    threatsToday: number;
    monthlyRevenue: number;
    apiUptime: number;
    avgResponseTime: number;
    storageUsedTB: number;
}

export default async function AdminDashboard() {
    await requireAdminAccessPage();

    // We fetch stats client-side in the original code, but we should probably do it server-side.
    // However, adhering to the "client component" structure requested, we'll keep the client logic separate.
    return <AdminDashboardClient />;
}

function AdminDashboardClient() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch("/api/admin/dashboard/stats");
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || "Failed to fetch stats");
                }
                const data = await res.json();
                setStats(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load dashboard");
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Loading dashboard...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-destructive">{error}</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Command Center
                    </h1>
                    <p className="text-muted-foreground font-mono text-sm">
                        <span className="text-primary">MXLENS</span> // Platform Overview
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="font-mono">
                        Last updated: {new Date().toLocaleTimeString()}
                    </span>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Total Organizations"
                    value={stats?.totalOrganizations?.toString() || "0"}
                    icon={Building2}
                    variant="primary"
                />
                <MetricCard
                    title="Active Users (30d)"
                    value={stats?.activeUsers30d?.toLocaleString() || "0"}
                    icon={Users}
                    variant="default"
                />
                <MetricCard
                    title="Analyses Today"
                    value={stats?.analysesToday?.toLocaleString() || "0"}
                    icon={Shield}
                    variant="secure"
                />
                <MetricCard
                    title="Threats Blocked"
                    value={stats?.threatsToday?.toString() || "0"}
                    icon={AlertTriangle}
                    variant="destructive"
                />
            </div>

            {/* Secondary Metrics */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Monthly Revenue"
                    value={`$${((stats?.monthlyRevenue || 0) / 1000).toFixed(1)}K`}
                    icon={DollarSign}
                    variant="secure"
                />
                <MetricCard
                    title="API Uptime"
                    value={`${stats?.apiUptime || 99.97}%`}
                    icon={Activity}
                    variant="secure"
                />
                <MetricCard
                    title="Avg Response Time"
                    value={`${stats?.avgResponseTime || 127}ms`}
                    icon={Clock}
                    variant="primary"
                />
                <MetricCard
                    title="Storage Used"
                    value={`${stats?.storageUsedTB || 0} TB`}
                    icon={Database}
                    variant="default"
                />
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <TrendChart title="Analysis Trend (Last 7 Days)" showThreats />
                </div>
                <VerdictPieChart />
            </div>

            {/* Bottom Row */}
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <TopOrganizationsTable />
                </div>
                <div className="space-y-6">
                    <SystemHealthIndicator />
                </div>
            </div>

            {/* Activity Feed */}
            <RecentActivityFeed />
        </div>
    );
}
