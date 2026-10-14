"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, ExternalLink, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Organization {
    id: string;
    name: string;
    slug: string;
    plan: "FREE" | "PRO" | "ENTERPRISE";
    analyses: number;
    members: number;
}

const getPlanBadge = (plan: Organization["plan"]) => {
    switch (plan) {
        case "ENTERPRISE":
            return "bg-primary/20 text-primary border-primary/30";
        case "PRO":
            return "bg-secure/20 text-secure border-secure/30";
        case "FREE":
            return "bg-muted text-muted-foreground border-border";
    }
};

export function TopOrganizationsTable() {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchOrgs() {
            try {
                const res = await fetch("/api/admin/organizations?limit=5");
                if (!res.ok) throw new Error("Failed to fetch");
                const json = await res.json();
                setOrganizations(json.organizations || []);
            } catch (error) {
                console.error("Failed to fetch organizations:", error);
                setOrganizations([]);
            } finally {
                setLoading(false);
            }
        }
        fetchOrgs();
    }, []);

    return (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border p-4">
                <h3 className="font-semibold">Top Organizations by Usage</h3>
                <Link href="/admin/organizations" className="text-sm text-primary hover:underline">
                    View all
                </Link>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                {loading ? (
                    <div className="p-8 text-center text-muted-foreground">Loading...</div>
                ) : organizations.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">No organizations found</div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Organization
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Plan
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Analyses
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Members
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {organizations.map((org) => (
                                <tr
                                    key={org.id}
                                    className="hover:bg-muted/30 transition-colors"
                                >
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="font-medium text-sm">{org.name}</p>
                                            <p className="text-xs text-muted-foreground font-mono">/{org.slug}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={cn(
                                                "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
                                                getPlanBadge(org.plan)
                                            )}
                                        >
                                            {org.plan}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-sm">
                                        {org.analyses.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-sm">
                                        {org.members}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/admin/organizations/${org.id}`}>
                                                        <ExternalLink className="mr-2 h-4 w-4" />
                                                        View Details
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>View Members</DropdownMenuItem>
                                                <DropdownMenuItem>View Analyses</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">
                                                    Suspend
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
