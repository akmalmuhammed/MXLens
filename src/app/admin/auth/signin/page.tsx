
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Shield, Loader2 } from "lucide-react";

export default function AdminSignIn() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);

    // Quick feedback if redirected
    const errorMsg = searchParams.get("error");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email");
        const password = formData.get("password");

        try {
            const res = await fetch("/api/admin/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || "Login failed");
                setLoading(false);
                return;
            }

            toast.success("Welcome back, Commander");
            router.push("/admin");
            router.refresh(); // Refresh to update middleware state checking cookies
        } catch (err) {
            toast.error("Connection error");
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-black text-white cyber-grid">
            <div className="w-full max-w-md space-y-8 p-8 border border-white/10 rounded-xl bg-black/50 backdrop-blur-xl">
                <div className="flex flex-col items-center justify-center text-center">
                    <div className="h-12 w-12 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4 ring-1 ring-cyan-500/50">
                        <Shield className="h-6 w-6 text-cyan-400" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">
                        Admin Command
                    </h2>
                    <p className="text-sm text-gray-400 mt-2">
                        Restricted Access. Level 4 Clearance Required.
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <Input
                                name="email"
                                type="email"
                                placeholder="Admin Email"
                                required
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                            />
                        </div>
                        <div>
                            <Input
                                name="password"
                                type="password"
                                placeholder="Passphrase"
                                required
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                            />
                        </div>
                    </div>

                    {errorMsg && (
                        <div className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded">
                            {errorMsg}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-[0_0_20px_-5px_rgba(8,145,178,0.5)] transition-all"
                    >
                        {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Authenticate"}
                    </Button>
                </form>
            </div>
        </div>
    );
}
