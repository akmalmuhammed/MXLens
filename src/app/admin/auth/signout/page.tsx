"use client";

import * as React from "react";
import { signOut } from "@/lib/admin-auth-client";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminSignOutPage() {
    const [isLoading, setIsLoading] = React.useState(false);
    const router = useRouter();

    async function handleSignOut() {
        setIsLoading(true);
        try {
            await signOut();
            router.push("/admin/auth/signin");
            router.refresh();
        } catch (err) {
            console.error("Signout error:", err);
            setIsLoading(false);
        }
    }

    return (
        <div className="flex h-screen items-center justify-center bg-black">
            <div className="absolute inset-0 z-0 bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:16px_16px] opacity-20"></div>

            <div className="relative z-10 w-full max-w-sm rounded-xl border border-red-900/30 bg-card/50 backdrop-blur-xl p-8 shadow-2xl shadow-red-900/20">
                <div className="mb-8 flex flex-col items-center text-center">
                    <div className="bg-red-500/10 p-4 rounded-full mb-4 border border-red-500/20">
                        <ShieldAlert className="h-10 w-10 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">Sign Out</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Are you sure you want to sign out of the admin console?
                    </p>
                </div>

                <div className="grid gap-4">
                    <Button
                        onClick={handleSignOut}
                        disabled={isLoading}
                        className="bg-red-600 hover:bg-red-700 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <LogOut className="mr-2 h-4 w-4" />
                        )}
                        Sign Out
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={isLoading}
                        className="border-red-900/30 text-white hover:bg-red-900/20"
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
}
