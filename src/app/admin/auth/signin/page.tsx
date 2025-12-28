"use client";

import * as React from "react";
import { signIn } from "@/lib/admin-auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminSignInPage() {
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const router = useRouter();

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        try {
            const result = await signIn.email({
                email,
                password,
            });

            if (result.error) {
                setError(result.error.message || "Invalid credentials");
                setIsLoading(false);
                return;
            }

            // Successful login - redirect to admin dashboard
            router.push("/admin");
            router.refresh();
        } catch (err) {
            setError("An error occurred. Please try again.");
            setIsLoading(false);
        }
    }

    return (
        <div className="flex h-screen items-center justify-center bg-black">
            <div className="absolute inset-0 z-0 bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:16px_16px] opacity-20"></div>

            <div className="relative z-10 w-full max-w-sm rounded-xl border border-red-900/30 bg-card/50 backdrop-blur-xl p-8 shadow-2xl shadow-red-900/20">
                <div className="mb-8 flex flex-col items-center text-center">
                    <div className="bg-red-500/10 p-4 rounded-full mb-4 border border-red-500/20 animate-pulse">
                        <ShieldAlert className="h-10 w-10 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">Admin Console</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Authorized personnel only. <br />All attempts are monitored.
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={onSubmit} className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="email" className="text-white">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            placeholder="admin@mxlens.com"
                            type="email"
                            autoCapitalize="none"
                            autoComplete="email"
                            autoCorrect="off"
                            disabled={isLoading}
                            required
                            className="bg-black/50 border-red-900/30 text-white placeholder:text-muted-foreground"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password" className="text-white">Password</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            autoCapitalize="none"
                            autoComplete="current-password"
                            disabled={isLoading}
                            required
                            className="bg-black/50 border-red-900/30 text-white"
                        />
                    </div>
                    <Button
                        disabled={isLoading}
                        type="submit"
                        className="bg-red-600 hover:bg-red-700 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Lock className="mr-2 h-4 w-4" />
                        )}
                        Access Console
                    </Button>
                </form>

                <div className="relative mt-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-red-900/30" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card/50 px-2 text-muted-foreground">
                            Restricted Area
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
