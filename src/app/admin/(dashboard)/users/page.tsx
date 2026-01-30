"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users as UsersIcon, Search, Shield, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UsersClient, User } from "./users-client";

// Interface removed, imported from client

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
            {loading ? (
                <div className="flex items-center justify-center h-32 rounded-lg border border-border bg-card">
                    <div className="text-muted-foreground">Loading...</div>
                </div>
            ) : (
                <UsersClient users={users} />
            )}
        </div>
    );
}
