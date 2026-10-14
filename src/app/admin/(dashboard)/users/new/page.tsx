"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Loader2, Copy, Check } from "lucide-react";
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

interface Organization {
    id: string;
    name: string;
    slug: string;
}

export default function CreateUserPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loadingOrgs, setLoadingOrgs] = useState(true);
    const [result, setResult] = useState<{
        email: string;
        tempPassword: string;
    } | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        async function fetchOrganizations() {
            try {
                const res = await fetch("/api/admin/organizations?limit=100");
                if (res.ok) {
                    const data = await res.json();
                    setOrganizations(data.organizations);
                }
            } catch (err) {
                console.error("Failed to fetch organizations:", err);
            } finally {
                setLoadingOrgs(false);
            }
        }
        fetchOrganizations();
    }, []);

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const data = {
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            orgId: formData.get("orgId") as string || undefined,
            role: formData.get("role") as string || "ANALYST",
        };

        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const result = await res.json();
                throw new Error(result.error || "Failed to create user");
            }

            const resultData = await res.json();
            setResult({
                email: resultData.email,
                tempPassword: resultData.tempPassword,
            });
        } catch (err: any) {
            setError(err.message || "Failed to create user");
            setIsLoading(false);
        }
    }

    function copyCredentials() {
        if (result) {
            navigator.clipboard.writeText(
                `Email: ${result.email}\nPassword: ${result.tempPassword}`
            );
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    if (result) {
        return (
            <div className="space-y-6 max-w-md mx-auto">
                <div className="rounded-lg border border-secure/30 bg-secure/10 p-6 text-center">
                    <Check className="h-12 w-12 text-secure mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-secure mb-2">User Created!</h2>
                    <p className="text-muted-foreground text-sm mb-4">
                        Share these credentials with the user:
                    </p>
                    <div className="p-4 bg-card rounded-lg font-mono text-sm text-left space-y-2 border border-border">
                        <p><strong>Email:</strong> {result.email}</p>
                        <p><strong>Password:</strong> {result.tempPassword}</p>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <Button onClick={copyCredentials} variant="outline" className="flex-1">
                            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                            {copied ? "Copied!" : "Copy"}
                        </Button>
                        <Link href="/admin/users" className="flex-1">
                            <Button className="w-full">Done</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/users">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Create User</h1>
                    <p className="text-muted-foreground text-sm">
                        Create a new user with auto-generated password
                    </p>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
                    {error}
                </div>
            )}

            <form onSubmit={onSubmit} className="space-y-6">
                <div className="rounded-lg border border-border bg-card p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/20 text-primary">
                            <User className="h-5 w-5" />
                        </div>
                        <h2 className="text-lg font-semibold">User Details</h2>
                    </div>

                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Full Name *</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="John Doe"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">Email Address *</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="john@example.com"
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-6 space-y-4">
                    <h2 className="text-lg font-semibold">Organization Assignment (Optional)</h2>
                    <p className="text-sm text-muted-foreground">
                        Optionally assign this user to an organization
                    </p>

                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="orgId">Organization</Label>
                            <Select name="orgId">
                                <SelectTrigger disabled={loadingOrgs}>
                                    <SelectValue placeholder={loadingOrgs ? "Loading..." : "Select organization (optional)"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {organizations.map((org) => (
                                        <SelectItem key={org.id} value={org.id}>
                                            {org.name} (/{org.slug})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="role">Role in Organization</Label>
                            <Select name="role" defaultValue="ANALYST">
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
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <Link href="/admin/users">
                        <Button variant="outline" type="button" disabled={isLoading}>
                            Cancel
                        </Button>
                    </Link>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create User
                    </Button>
                </div>
            </form>
        </div>
    );
}
