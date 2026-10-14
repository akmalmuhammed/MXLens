"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";
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
import Link from "next/link";

export default function CreateOrganizationPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const data = {
            name: formData.get("name") as string,
            slug: formData.get("slug") as string,
            planTier: formData.get("planTier") as string,
            ownerEmail: formData.get("ownerEmail") as string,
            ownerName: formData.get("ownerName") as string,
        };

        try {
            const res = await fetch("/api/admin/organizations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const result = await res.json();
                throw new Error(result.error || "Failed to create organization");
            }

            const result = await res.json();
            router.push(`/admin/organizations/${result.id}`);
        } catch (err: any) {
            setError(err.message || "Failed to create organization");
            setIsLoading(false);
        }
    }

    // Auto-generate slug from name
    function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
        const name = e.target.value;
        const slugInput = document.getElementById("slug") as HTMLInputElement;
        if (slugInput) {
            slugInput.value = name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "");
        }
    }

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/organizations">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Create Organization</h1>
                    <p className="text-muted-foreground text-sm">
                        Create a new organization and assign an owner
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
                            <Building2 className="h-5 w-5" />
                        </div>
                        <h2 className="text-lg font-semibold">Organization Details</h2>
                    </div>

                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Organization Name *</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="Acme Corporation"
                                required
                                disabled={isLoading}
                                onChange={handleNameChange}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="slug">URL Slug *</Label>
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground text-sm">mxlens.com/</span>
                                <Input
                                    id="slug"
                                    name="slug"
                                    placeholder="acme-corp"
                                    required
                                    disabled={isLoading}
                                    className="font-mono"
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="planTier">Plan Tier *</Label>
                            <Select name="planTier" defaultValue="FREE">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select plan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="FREE">Free</SelectItem>
                                    <SelectItem value="PRO">Pro</SelectItem>
                                    <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-6 space-y-4">
                    <h2 className="text-lg font-semibold">Owner Account</h2>
                    <p className="text-sm text-muted-foreground">
                        Create an owner account for this organization. A temporary password will be generated.
                    </p>

                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="ownerName">Owner Name *</Label>
                            <Input
                                id="ownerName"
                                name="ownerName"
                                placeholder="John Doe"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="ownerEmail">Owner Email *</Label>
                            <Input
                                id="ownerEmail"
                                name="ownerEmail"
                                type="email"
                                placeholder="john@acme.com"
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <Link href="/admin/organizations">
                        <Button variant="outline" type="button" disabled={isLoading}>
                            Cancel
                        </Button>
                    </Link>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Organization
                    </Button>
                </div>
            </form>
        </div>
    );
}
