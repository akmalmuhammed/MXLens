"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Organization {
    id: string;
    name: string;
    slug: string;
    plan: string;
    status: string;
    members: number;
    analyses: number;
    createdAt: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function OrganizationsPage() {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        async function fetchOrganizations() {
            try {
                setLoading(true);
                const params = new URLSearchParams();
                if (search) params.set("search", search);

                const res = await fetch(`/api/admin/organizations?${params}`);
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || "Failed to fetch organizations");
                }
                const data = await res.json();
                setOrganizations(data.organizations);
                setPagination(data.pagination);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load organizations");
            } finally {
                setLoading(false);
            }
        }

        const debounce = setTimeout(fetchOrganizations, 300);
        return () => clearTimeout(debounce);
    }, [search]);

    const stats = {
        total: pagination?.total || 0,
        active: organizations.filter(o => o.status === "active").length,
        enterprise: organizations.filter(o => o.plan === "ENTERPRISE").length,
        totalAnalyses: organizations.reduce((acc, o) => acc + o.analyses, 0),
    };

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
                    <h1 className="text-2xl font-bold tracking-tight">Organizations</h1>
                    <p className="text-muted-foreground font-mono text-sm">
                        Manage all organizations on the platform
                    </p>
                </div>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Organization
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-4">
                <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Total Orgs</p>
                    <p className="text-2xl font-bold font-mono">{stats.total}</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Active</p>
                    <p className="text-2xl font-bold font-mono text-secure">{stats.active}</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Enterprise</p>
                    <p className="text-2xl font-bold font-mono text-primary">{stats.enterprise}</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Total Analyses</p>
                    <p className="text-2xl font-bold font-mono">{stats.totalAnalyses.toLocaleString()}</p>
                </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search organizations..."
                        className="pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="rounded-lg border border-border bg-card overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="text-muted-foreground">Loading...</div>
                    </div>
                ) : organizations.length === 0 ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="text-muted-foreground">No organizations found</div>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                    Organization
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                    Plan
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                                    Members
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                                    Analyses
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                    Created
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {organizations.map((org) => (
                                <tr key={org.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3">
                                        <Link href={`/admin/organizations/${org.id}`} className="hover:text-primary">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/20 text-primary">
                                                    <Building2 className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{org.name}</p>
                                                    <p className="text-xs text-muted-foreground font-mono">/{org.slug}</p>
                                                </div>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${org.plan === "ENTERPRISE"
                                                ? "bg-primary/20 text-primary border-primary/30"
                                                : org.plan === "PRO"
                                                    ? "bg-secure/20 text-secure border-secure/30"
                                                    : "bg-muted text-muted-foreground border-border"
                                            }`}>
                                            {org.plan}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1.5 text-sm ${org.status === "active" ? "text-secure" : "text-destructive"
                                            }`}>
                                            <span className={`h-2 w-2 rounded-full ${org.status === "active" ? "bg-secure" : "bg-destructive"
                                                }`} />
                                            {org.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-sm">{org.members}</td>
                                    <td className="px-4 py-3 text-right font-mono text-sm">{org.analyses.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">{org.createdAt}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
