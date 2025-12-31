"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users as UsersIcon, Search, Shield, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserActionsMenu } from "@/components/admin/UserActionsMenu";

interface User {
    id: string;
    name: string | null;
    email: string;
    isPlatformAdmin: boolean;
    adminRole: string | null;
    orgs: number;
    status: string;
    mfaEnabled: boolean;
    lastActive: string;
    createdAt: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        async function fetchUsers() {
            try {
                setLoading(true);
                const params = new URLSearchParams();
                if (search) params.set("search", search);

                const res = await fetch(`/api/admin/users?${params}`);
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || "Failed to fetch users");
                }
                const data = await res.json();
                setUsers(data.users);
                setPagination(data.pagination);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load users");
            } finally {
                setLoading(false);
            }
        }

        const debounce = setTimeout(fetchUsers, 300);
        return () => clearTimeout(debounce);
    }, [search]);

    const stats = {
        total: pagination?.total || 0,
        active: users.filter(u => u.status === "active").length,
        platformAdmins: users.filter(u => u.isPlatformAdmin).length,
        suspended: users.filter(u => u.status === "suspended").length,
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
                    <h1 className="text-2xl font-bold tracking-tight">Users</h1>
                    <p className="text-muted-foreground font-mono text-sm">
                        Manage all users on the platform
                    </p>
                </div>
                <Link href="/admin/users/new">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create User
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-4">
                <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold font-mono">{stats.total}</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Active</p>
                    <p className="text-2xl font-bold font-mono text-secure">{stats.active}</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Platform Admins</p>
                    <p className="text-2xl font-bold font-mono text-primary">{stats.platformAdmins}</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Inactive</p>
                    <p className="text-2xl font-bold font-mono text-warning">
                        {users.filter(u => u.status === "inactive").length}
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search users..."
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
                ) : users.length === 0 ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="text-muted-foreground">No users found</div>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                    User
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                    Role
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                                    Organizations
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                    Last Active
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3">
                                        <Link href={`/admin/users/${user.id}`} className="hover:text-primary">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                                                    {user.isPlatformAdmin ? (
                                                        <Shield className="h-4 w-4 text-primary" />
                                                    ) : (
                                                        <UsersIcon className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{user.name || "Unnamed"}</p>
                                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                                </div>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${user.isPlatformAdmin
                                            ? "bg-primary/20 text-primary border-primary/30"
                                            : "bg-muted text-muted-foreground border-border"
                                            }`}>
                                            {user.adminRole || "USER"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1.5 text-sm ${user.status === "active" ? "text-secure" :
                                            user.status === "inactive" ? "text-warning" : "text-destructive"
                                            }`}>
                                            <span className={`h-2 w-2 rounded-full ${user.status === "active" ? "bg-secure" :
                                                user.status === "inactive" ? "bg-warning" : "bg-destructive"
                                                }`} />
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-sm">{user.orgs}</td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">{user.lastActive}</td>
                                    <td className="px-4 py-3 text-right">
                                        <UserActionsMenu userId={user.id} userName={user.name || "Unknown"} status={user.status} />
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
