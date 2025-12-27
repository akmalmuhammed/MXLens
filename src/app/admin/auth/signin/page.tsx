import { ShieldAlert } from "lucide-react";
import { AdminAuthForm } from "./admin-auth-form";

export default function AdminSignInPage() {
    return (
        <div className="flex h-screen items-center justify-center bg-black">
            <div className="absolute inset-0 z-0 bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:16px_16px] opacity-20"></div>

            <div className="relative z-10 w-full max-w-sm rounded-xl border border-red-900/30 bg-card/50 backdrop-blur-xl p-8 shadow-2xl shadow-red-900/20">
                <div className="mb-8 flex flex-col items-center text-center">
                    <div className="bg-red-500/10 p-4 rounded-full mb-4 border border-red-500/20 animate-pulse-slow">
                        <ShieldAlert className="h-10 w-10 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">Admin Console</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Authorized personnel only. <br />All attempts are monitored.
                    </p>
                </div>

                <AdminAuthForm />
            </div>
        </div>
    );
}
