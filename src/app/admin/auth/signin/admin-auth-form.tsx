"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, AlertCircle, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { signIn, signUp } from "@/lib/admin-auth-client";

interface AdminAuthFormProps extends React.HTMLAttributes<HTMLDivElement> { }

export function AdminAuthForm({ className, ...props }: AdminAuthFormProps) {
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const [error, setError] = React.useState<string | null>(null);
    const [mode, setMode] = React.useState<"signin" | "signup">("signin");
    const router = useRouter();

    async function onSubmit(event: React.SyntheticEvent) {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const target = event.target as typeof event.target & {
            email: { value: string };
            password: { value: string };
            name?: { value: string };
        };

        const email = target.email.value;
        const password = target.password.value;
        const name = target.name?.value || email.split("@")[0];

        try {
            if (mode === "signup") {
                // First, sign up the user
                const signUpResult = await signUp.email({
                    email,
                    password,
                    name,
                });

                if (signUpResult.error) {
                    setError(signUpResult.error.message || "Signup failed");
                    setIsLoading(false);
                    return;
                }

                // After successful signup, automatically sign in
                const signInResult = await signIn.email({
                    email,
                    password,
                });

                if (signInResult.error) {
                    setError("Account created but login failed. Please sign in manually.");
                    setMode("signin");
                    setIsLoading(false);
                    return;
                }

                // Success - redirect to admin dashboard
                router.push("/admin");
                router.refresh();
            } else {
                // Sign in mode
                const result = await signIn.email({
                    email,
                    password,
                });

                if (result.error) {
                    setError(result.error.message || "Invalid credentials or not an admin");
                    setIsLoading(false);
                    return;
                }

                // Success - redirect to admin dashboard
                router.push("/admin");
                router.refresh();
            }
        } catch (err) {
            console.error("Auth error:", err);
            setError(mode === "signup" ? "Signup failed. Please try again." : "Login failed. Please try again.");
            setIsLoading(false);
        }
    }

    return (
        <div className={cn("grid gap-6", className)} {...props}>
            {/* Mode toggle */}
            <div className="flex gap-2 p-1 bg-black/30 rounded-lg">
                <button
                    type="button"
                    onClick={() => { setMode("signin"); setError(null); }}
                    className={cn(
                        "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
                        mode === "signin"
                            ? "bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.3)]"
                            : "text-muted-foreground hover:text-white"
                    )}
                >
                    Sign In
                </button>
                <button
                    type="button"
                    onClick={() => { setMode("signup"); setError(null); }}
                    className={cn(
                        "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
                        mode === "signup"
                            ? "bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.3)]"
                            : "text-muted-foreground hover:text-white"
                    )}
                >
                    Sign Up
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            <form onSubmit={onSubmit}>
                <div className="grid gap-4">
                    {mode === "signup" && (
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                placeholder="Admin Name"
                                type="text"
                                autoCapitalize="words"
                                autoComplete="name"
                                disabled={isLoading}
                                className="bg-black/50 border-red-900/30"
                            />
                        </div>
                    )}
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
                            autoComplete={mode === "signup" ? "new-password" : "current-password"}
                            disabled={isLoading}
                            required
                            minLength={mode === "signup" ? 8 : undefined}
                            className="bg-black/50 border-red-900/30"
                        />
                        {mode === "signup" && (
                            <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
                        )}
                    </div>
                    <Button
                        disabled={isLoading}
                        type="submit"
                        className="bg-red-600 hover:bg-red-700 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : mode === "signup" ? (
                            <UserPlus className="mr-2 h-4 w-4" />
                        ) : (
                            <Lock className="mr-2 h-4 w-4" />
                        )}
                        {mode === "signup" ? "Create Account & Login" : "Access Console"}
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
