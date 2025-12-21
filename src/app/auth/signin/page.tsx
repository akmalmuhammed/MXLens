import { ShieldCheck } from "lucide-react";
import { UserAuthForm } from "./user-auth-form";

export default function SignInPage() {
    return (
        <div className="flex h-screen items-center justify-center bg-muted/20">
            <div className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-sm">
                <div className="mb-6 flex flex-col items-center text-center">
                    <div className="bg-primary/10 p-3 rounded-full mb-4">
                        <ShieldCheck className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold">Welcome Back</h1>
                    <p className="text-sm text-muted-foreground">Sign in to your MXLens account</p>
                </div>

                <UserAuthForm />
            </div>
        </div>
    );
}
