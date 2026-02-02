"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Building2,
    Users,
    BarChart3,
    Key,
    Plus,
    Loader2,
    Copy,
    Check,
    UserPlus,
    Save,
    Edit2,
    AlertTriangle,
    Trash2,
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
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Member {
    id: string;
    userId: string;
    name: string | null;
    email: string;
    role: string;
    joinedAt: string;
}

interface Organization {
    id: string;
    name: string;
    slug: string;
    planTier: string;
    stripeCustomerId: string | null;
    subscriptionStatus: string | null;
    createdAt: string;
    members: Member[];
    stats: {
        analyses: number;
        apiKeys: number;
        members: number;
    };
}

interface ExistingUser {
    id: string;
    name: string | null;
    email: string;
}

interface Props {
    organization: Organization;
}

export function OrganizationDetail({ organization }: Props) {
    const router = useRouter();
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [addUserOpen, setAddUserOpen] = useState(false);
    const [addExistingOpen, setAddExistingOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [newUserResult, setNewUserResult] = useState<{
        email: string;
        tempPassword: string;
    } | null>(null);
    const [copied, setCopied] = useState(false);

    // Editing states for organization
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editName, setEditName] = useState(organization.name);
    const [editPlanTier, setEditPlanTier] = useState(organization.planTier);
    const [editStatus, setEditStatus] = useState(organization.subscriptionStatus || "active");

    // For adding existing users
    const [existingUsers, setExistingUsers] = useState<ExistingUser[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [selectedRole, setSelectedRole] = useState<string>("ANALYST");

    // Save organization changes
    async function handleSaveOrg() {
        setIsSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch(`/api/admin/organizations/${organization.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editName,
                    planTier: editPlanTier,
                    subscriptionStatus: editStatus,
                }),
            });

            if (!res.ok) {
                const result = await res.json();
                throw new Error(result.error || "Failed to update organization");
            }

            setSuccess("Organization updated successfully!");
            setIsEditing(false);
            router.refresh();
        } catch (err: any) {
            setError(err.message || "Failed to update organization");
        } finally {
            setIsSaving(false);
        }
    }

    // Fetch existing users when dialog opens
    useEffect(() => {
        if (addExistingOpen) {
            fetchExistingUsers();
        }
    }, [addExistingOpen]);

    async function fetchExistingUsers() {
        setLoadingUsers(true);
        try {
            const res = await fetch("/api/admin/users?limit=100");
            if (res.ok) {
                const data = await res.json();
                // Filter out users already in this org
                const memberIds = organization.members.map(m => m.userId);
                const available = data.users.filter((u: any) => !memberIds.includes(u.id));
                setExistingUsers(available);
            }
        } catch (err) {
            console.error("Failed to fetch users:", err);
        } finally {
            setLoadingUsers(false);
        }
    }

    async function handleAddUser(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsAddingUser(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const data = {
            orgId: organization.id,
            name: formData.get("userName") as string,
            email: formData.get("userEmail") as string,
            role: formData.get("userRole") as string,
        };

        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const result = await res.json();
                throw new Error(result.error || "Failed to add user");
            }

            const result = await res.json();
            setNewUserResult({
                email: result.email,
                tempPassword: result.tempPassword,
            });
            router.refresh();
        } catch (err: any) {
            setError(err.message || "Failed to add user");
        } finally {
            setIsAddingUser(false);
        }
    }

    async function handleAddExistingUser() {
        if (!selectedUserId) return;

        setIsAddingUser(true);
        setError(null);

        try {
            const res = await fetch("/api/admin/organizations/members", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orgId: organization.id,
                    userId: selectedUserId,
                    role: selectedRole,
                }),
            });

            if (!res.ok) {
                const result = await res.json();
                throw new Error(result.error || "Failed to add user");
            }

            setAddExistingOpen(false);
            setSelectedUserId("");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "Failed to add user");
        } finally {
            setIsAddingUser(false);
        }
    }

    function copyCredentials() {
        if (newUserResult) {
            navigator.clipboard.writeText(
                `Email: ${newUserResult.email}\nPassword: ${newUserResult.tempPassword}`
            );
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/organizations">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 text-primary">
                        <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {organization.name}
                        </h1>
                        <p className="text-muted-foreground font-mono text-sm">
                            /{organization.slug}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-4">
                <div className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Users className="h-4 w-4" />
                        <span className="text-sm">Members</span>
                    </div>
                    <p className="text-2xl font-bold font-mono">
                        {organization.stats.members}
                    </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <BarChart3 className="h-4 w-4" />
                        <span className="text-sm">Analyses</span>
                    </div>
                    <p className="text-2xl font-bold font-mono">
                        {organization.stats.analyses.toLocaleString()}
                    </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Key className="h-4 w-4" />
                        <span className="text-sm">API Keys</span>
                    </div>
                    <p className="text-2xl font-bold font-mono">
                        {organization.stats.apiKeys}
                    </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <span className="text-sm">Plan</span>
                    </div>
                    <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-medium border ${organization.planTier === "ENTERPRISE"
                            ? "bg-primary/20 text-primary border-primary/30"
                            : organization.planTier === "PRO"
                                ? "bg-secure/20 text-secure border-secure/30"
                                : "bg-muted text-muted-foreground border-border"
                            }`}
                    >
                        {organization.planTier}
                    </span>
                </div>
            </div>

            {/* Members Section */}
            <div className="rounded-lg border border-border bg-card">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-semibold">Members</h2>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="sm" className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add User
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setAddUserOpen(true)}>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Create New User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setAddExistingOpen(true)}>
                                <Users className="h-4 w-4 mr-2" />
                                Add Existing User
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Create New User Dialog */}
                <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
                    <DialogContent>
                        {newUserResult ? (
                            <>
                                <DialogHeader>
                                    <DialogTitle className="text-secure">
                                        ✓ User Created Successfully
                                    </DialogTitle>
                                    <DialogDescription>
                                        Share these credentials with the user:
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 mt-4">
                                    <div className="p-4 bg-muted rounded-lg font-mono text-sm space-y-2">
                                        <p>
                                            <strong>Email:</strong> {newUserResult.email}
                                        </p>
                                        <p>
                                            <strong>Password:</strong>{" "}
                                            {newUserResult.tempPassword}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={copyCredentials}
                                            variant="outline"
                                            className="flex-1"
                                        >
                                            {copied ? (
                                                <Check className="h-4 w-4 mr-2" />
                                            ) : (
                                                <Copy className="h-4 w-4 mr-2" />
                                            )}
                                            {copied ? "Copied!" : "Copy Credentials"}
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setNewUserResult(null);
                                                setAddUserOpen(false);
                                            }}
                                        >
                                            Done
                                        </Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <DialogHeader>
                                    <DialogTitle>Create New User</DialogTitle>
                                    <DialogDescription>
                                        Create a new user and add them to {organization.name}
                                    </DialogDescription>
                                </DialogHeader>
                                {error && (
                                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                                        {error}
                                    </div>
                                )}
                                <form onSubmit={handleAddUser} className="space-y-4 mt-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="userName">Name *</Label>
                                        <Input
                                            id="userName"
                                            name="userName"
                                            placeholder="John Doe"
                                            required
                                            disabled={isAddingUser}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="userEmail">Email *</Label>
                                        <Input
                                            id="userEmail"
                                            name="userEmail"
                                            type="email"
                                            placeholder="john@example.com"
                                            required
                                            disabled={isAddingUser}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="userRole">Role *</Label>
                                        <Select name="userRole" defaultValue="ANALYST">
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="OWNER">Owner</SelectItem>
                                                <SelectItem value="ADMIN">Admin</SelectItem>
                                                <SelectItem value="ANALYST">Analyst</SelectItem>
                                                <SelectItem value="VIEWER">Viewer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setAddUserOpen(false)}
                                            disabled={isAddingUser}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={isAddingUser}>
                                            {isAddingUser && (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            )}
                                            Create User
                                        </Button>
                                    </div>
                                </form>
                            </>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Add Existing User Dialog */}
                <Dialog open={addExistingOpen} onOpenChange={setAddExistingOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Existing User</DialogTitle>
                            <DialogDescription>
                                Select a user to add to {organization.name}
                            </DialogDescription>
                        </DialogHeader>
                        {error && (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                                {error}
                            </div>
                        )}
                        <div className="space-y-4 mt-4">
                            <div className="grid gap-2">
                                <Label>Select User *</Label>
                                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                                    <SelectTrigger disabled={loadingUsers}>
                                        <SelectValue placeholder={loadingUsers ? "Loading..." : "Select a user"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {existingUsers.map((user) => (
                                            <SelectItem key={user.id} value={user.id}>
                                                {user.name || user.email} ({user.email})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Role *</Label>
                                <Select value={selectedRole} onValueChange={setSelectedRole}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="OWNER">Owner</SelectItem>
                                        <SelectItem value="ADMIN">Admin</SelectItem>
                                        <SelectItem value="ANALYST">Analyst</SelectItem>
                                        <SelectItem value="VIEWER">Viewer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setAddExistingOpen(false)}
                                    disabled={isAddingUser}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAddExistingUser}
                                    disabled={isAddingUser || !selectedUserId}
                                >
                                    {isAddingUser && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Add to Organization
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

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
                                Joined
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {organization.members.map((member) => (
                            <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                                <td className="px-4 py-3">
                                    <div>
                                        <p className="font-medium">{member.name || "—"}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {member.email}
                                        </p>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${member.role === "OWNER"
                                            ? "bg-primary/20 text-primary border-primary/30"
                                            : member.role === "ADMIN"
                                                ? "bg-secure/20 text-secure border-secure/30"
                                                : "bg-muted text-muted-foreground border-border"
                                            }`}
                                    >
                                        {member.role}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                    {new Date(member.joinedAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
