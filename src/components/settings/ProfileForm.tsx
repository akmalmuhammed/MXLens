```
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/actions/settings";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ProfileForm({ user }: { user: any }) {
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setMessage(null);
        setError(null);

        try {
            const result = await updateProfile(formData);
            if (result.error) {
                setError(result.error);
            } else if (result.success) {
                setMessage(result.success);
            }
        } catch (e) {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form action={handleSubmit} className="grid gap-6 max-w-xl">
            {error && (
                <div className="p-3 bg-red-100 text-red-600 rounded-md text-sm">
                    {error}
                </div>
            )}
            {message && (
                <div className="p-3 bg-green-100 text-green-600 rounded-md text-sm">
                    {message}
                </div>
            )}
            
            <div className="grid gap-2">
                <Label htmlFor="name">Display Name</Label>
                <Input id="name" name="name" defaultValue={user?.name || ""} placeholder="Your Name" />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" defaultValue={user?.email || ""} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Contact support to change your email.</p>
            </div>
            
            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </form>
    );
}
```
