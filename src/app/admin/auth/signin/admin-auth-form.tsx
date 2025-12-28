"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminAuthFormProps extends React.HTMLAttributes<HTMLDivElement> { }

export function AdminAuthForm({ className, ...props }: AdminAuthFormProps) {
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const [error, setError] = React.useState<string | null>(null);
    const searchParams = useSearchParams();
    const router = useRouter();

    async function onSubmit(event: React.SyntheticEvent) {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const target = event.target as typeof event.target & {
            email: { value: string };
            password: { value: string };
        };

        const email = target.email.value;
        const password = target.password.value;

        try {
            // Use the ADMIN auth endpoint directly
            const res = await fetch("/api/admin/auth/callback/admin-credentials", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    email,
                    password,
                    redirect: "false",
                    csrfToken: await getCsrfToken(),
                }),
            });

            if (res.ok) {
                // Successful login, redirect to admin dashboard
                router.push("/admin");
                router.refresh();
            } else {
                setError("Invalid credentials or not an admin");
                setIsLoading(false);
            }
        } catch (err) {
            setError("Login failed. Please try again.");
            setIsLoading(false);
        }
    }

    async function getCsrfToken() {
        const res = await fetch("/api/admin/auth/csrf");
        const data = await res.json();
        return data.csrfToken;
    }

    return (
        <div className={cn("grid gap-6", className)} {...props}>
            {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                </div>
            )}
            
            <form onSubmit={onSubmit}>
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            placeholder="admin@mxlens.com"
                            type="email"
                            autoCapitalize="none"
                            autoComplete="email"
                            autoCorrect="off"
                            disabled={isLoading}
                            required
                            className="bg-black/50 border-red-900/30"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            autoCapitalize="none"
                            autoComplete="current-password"
                            disabled={isLoading}
                            required
                            className="bg-black/50 border-red-900/30"
                        />
                    </div>
                    <Button disabled={isLoading} type="submit" className="bg-red-600 hover:bg-red-700 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Lock className="mr-2 h-4 w-4" />
                        )}
                        Access Console
                    </Button>
                </div>
            </form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-red-900/30" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Restricted Area
                    </span>
                </div>
            </div>
        </div>
    );
}
