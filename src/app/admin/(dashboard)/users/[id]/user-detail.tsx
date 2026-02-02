"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    User as UserIcon,
    Building2,
    Shield,
    ShieldCheck,
    ShieldOff,
    Mail,
    Calendar,
    Clock,
    Key,
    LogOut,
    Save,
    Loader2,
    AlertTriangle,
    Check,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

interface Organization {
    id: string;
    name: string;
    slug: string;
    role: string;
    planTier: string;
    subscriptionStatus: string | null;
    joinedAt: string;
}

interface AuthProvider {
    provider: string;
}

interface User {
    id: string;
    name: string | null;
    email: string;
    emailVerified: string | null;
    image: string | null;
    isPlatformAdmin: boolean;
    adminRole: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
    lastActive: string | null;
    organizations: Organization[];
    authProviders: AuthProvider[];
    activeSessions: number;
}

interface Props {
    user: User;
}

export function UserDetail({ user }: Props) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [isRevoking, setIsRevoking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [confirmRevoke, setConfirmRevoke] = useState(false);

    // Editable states
    const [name, setName] = useState(user.name || "");
    const [email, setEmail] = useState(user.email);
    const [isPlatformAdmin, setIsPlatformAdmin] = useState(user.isPlatformAdmin);
    const [adminRole, setAdminRole] = useState(user.adminRole || "SUPER_ADMIN");
    const [emailVerified, setEmailVerified] = useState(!!user.emailVerified);

    async function handleSave() {
        setIsSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch(`/api/admin/users/${user.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name || null,
                    email,
                    isPlatformAdmin,
                    adminRole: isPlatformAdmin ? adminRole : null,
                    emailVerified,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update user");
            }

            setSuccess("User updated successfully!");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "Failed to update user");
        } finally {
            setIsSaving(false);
        }
    }

    async function handleRevokeSession() {
        setIsRevoking(true);
        setError(null);

        try {
            const res = await fetch(`/api/admin/users/${user.id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to revoke sessions");
            }

            setSuccess("All sessions revoked. User must re-login.");
            setConfirmRevoke(false);
            router.refresh();
        } catch (err: any) {
            setError(err.message || "Failed to revoke sessions");
        } finally {
            setIsRevoking(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/users">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 text-primary">
                        {user.isPlatformAdmin ? (
                            <ShieldCheck className="h-6 w-6" />
                        ) : (
                            <UserIcon className="h-6 w-6" />
                        )}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {user.name || "Unnamed User"}
                        </h1>
                        <p className="text-muted-foreground font-mono text-sm">
                            {user.email}
                        </p>
                    </div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <span
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-sm ${user.status === "active"
                            ? "bg-secure/20 text-secure"
                            : "bg-warning/20 text-warning"
                            }`}
                    >
                        <span
                            className={`h-2 w-2 rounded-full ${user.status === "active" ? "bg-secure" : "bg-warning"
                                }`}
                        />
                        {user.status}
                    </span>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {error}
                </div>
            )}
            {success && (
                <div className="p-3 bg-secure/10 border border-secure/20 rounded-lg text-secure text-sm flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    {success}
                </div>
            )}

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-4">
                <div className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Building2 className="h-4 w-4" />
                        <span className="text-sm">Organizations</span>
                    </div>
                    <p className="text-2xl font-bold font-mono">
                        {user.organizations.length}
                    </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Key className="h-4 w-4" />
                        <span className="text-sm">Active Sessions</span>
                    </div>
                    <p className="text-2xl font-bold font-mono">{user.activeSessions}</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">Joined</span>
                    </div>
                    <p className="text-sm font-mono">
                        {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">Last Active</span>
                    </div>
                    <p className="text-sm font-mono">
                        {user.lastActive
                            ? new Date(user.lastActive).toLocaleString()
                            : "Never"}
                    </p>
                </div>
            </div>

            {/* Edit Form */}
            <div className="rounded-lg border border-border bg-card p-6 space-y-6">
                <h2 className="text-lg font-semibold">User Details</h2>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="User's full name"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="font-medium">Email Verified</p>
                            <p className="text-xs text-muted-foreground">
                                {user.emailVerified
                                    ? `Verified on ${new Date(user.emailVerified).toLocaleDateString()}`
                                    : "Not verified"}
                            </p>
                        </div>
                    </div>
                    <Switch
                        checked={emailVerified}
                        onCheckedChange={setEmailVerified}
                    />
                </div>

                <div className="border-t border-border pt-6 space-y-4">
                    <h3 className="font-medium flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Platform Admin Privileges
                    </h3>

                    <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-primary/5 border border-primary/20">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                            <div>
                                <p className="font-medium">Platform Admin</p>
                                <p className="text-xs text-muted-foreground">
                                    Grant access to admin.mxlens.com
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={isPlatformAdmin}
                            onCheckedChange={setIsPlatformAdmin}
                        />
                    </div>

                    {isPlatformAdmin && (
                        <div className="space-y-2">
                            <Label>Admin Role</Label>
                            <Select value={adminRole} onValueChange={setAdminRole}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SUPER_ADMIN">
                                        Super Admin (Full Access)
                                    </SelectItem>
                                    <SelectItem value="SUPPORT_ADMIN">
                                        Support Admin (Read + Write + Users)
                                    </SelectItem>
                                    <SelectItem value="BILLING_ADMIN">
                                        Billing Admin (Read + Billing)
                                    </SelectItem>
                                    <SelectItem value="READ_ONLY">
                                        Read Only (View Only)
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                    <Button variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                    </Button>
                </div>
            </div>

            {/* Organizations */}
            <div className="rounded-lg border border-border bg-card">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-semibold">Organizations</h2>
                </div>
                {user.organizations.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        User is not a member of any organization
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                    Organization
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                    Role
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                    Plan
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                    Joined
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {user.organizations.map((org) => (
                                <tr key={org.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3">
                                        <Link
                                            href={`/admin/organizations/${org.id}`}
                                            className="hover:text-primary"
                                        >
                                            <p className="font-medium">{org.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                /{org.slug}
                                            </p>
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${org.role === "OWNER"
                                                ? "bg-primary/20 text-primary border-primary/30"
                                                : org.role === "ADMIN"
                                                    ? "bg-secure/20 text-secure border-secure/30"
                                                    : "bg-muted text-muted-foreground border-border"
                                                }`}
                                        >
                                            {org.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${org.planTier === "ENTERPRISE"
                                                ? "bg-primary/20 text-primary border-primary/30"
                                                : org.planTier === "PRO"
                                                    ? "bg-secure/20 text-secure border-secure/30"
                                                    : "bg-muted text-muted-foreground border-border"
                                                }`}
                                        >
                                            {org.planTier}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                        {new Date(org.joinedAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link href={`/admin/organizations/${org.id}`}>
                                            <Button size="sm" variant="ghost">
                                                View Org
                                            </Button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Auth Providers */}
            <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="font-medium mb-3">Authentication Methods</h3>
                <div className="flex flex-wrap gap-2">
                    {user.authProviders.length > 0 ? (
                        user.authProviders.map((provider, i) => (
                            <span
                                key={i}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-muted text-sm"
                            >
                                {provider.provider === "google" && "🔵 Google"}
                                {provider.provider === "github" && "⚫ GitHub"}
                                {provider.provider === "credentials" && "🔐 Email/Password"}
                                {!["google", "github", "credentials"].includes(provider.provider) &&
                                    `${provider.provider}`}
                            </span>
                        ))
                    ) : (
                        <span className="text-sm text-muted-foreground">
                            No linked providers (likely email/password)
                        </span>
                    )}
                </div>
            </div>

            {/* Danger Zone */}
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 space-y-4">
                <h3 className="font-medium text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Danger Zone
                </h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium">Revoke All Sessions</p>
                        <p className="text-sm text-muted-foreground">
                            Force user to re-login on all devices
                        </p>
                    </div>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setConfirmRevoke(true)}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Revoke Sessions
                    </Button>
                </div>
            </div>

            {/* Confirm Dialog */}
            <Dialog open={confirmRevoke} onOpenChange={setConfirmRevoke}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-destructive">
                            Revoke All Sessions?
                        </DialogTitle>
                        <DialogDescription>
                            This will immediately log out {user.name || user.email} from all
                            devices. They will need to sign in again.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setConfirmRevoke(false)}
                            disabled={isRevoking}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRevokeSession}
                            disabled={isRevoking}
                        >
                            {isRevoking && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Confirm Revoke
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
