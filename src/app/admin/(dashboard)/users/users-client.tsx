
"use client";

import Link from "next/link";
import { Users as UsersIcon, Shield } from "lucide-react";
import { UserActionsMenu } from "@/components/admin/UserActionsMenu";

export interface User {
    id: string;
    name: string | null;
    email: string;
    isPlatformAdmin: boolean;
    adminRole: string | null;
    orgs: number; // Count
    status: string;
    mfaEnabled: boolean; // Keep for interface compatibility, even if not displayed
    lastActive: string;
    createdAt: string; // Used for sorting if passed here, but usually sorting is server side
}

interface UsersClientProps {
    users: User[];
}

export function UsersClient({ users }: UsersClientProps) {
    if (users.length === 0) {
        return (
            <div className="flex items-center justify-center h-32 rounded-lg border border-border bg-card">
                <div className="text-muted-foreground">No users found</div>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
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
        </div>
    );
}
