"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { verifyEmail } from "@/actions/email-verification";
import { CheckCircle, Mail, Loader2, AlertTriangle, XCircle } from "lucide-react";

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [status, setStatus] = useState<"loading" | "success" | "error" | "no-token">("loading");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        async function verify() {
            if (!token) {
                setStatus("no-token");
                return;
            }

            try {
                const result = await verifyEmail(token);
                if (result.error) {
                    setErrorMessage(result.error);
                    setStatus("error");
                } else {
                    setStatus("success");
                }
            } catch {
                setErrorMessage("Verification failed. Please try again.");
                setStatus("error");
            }
        }

        verify();
    }, [token]);

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="w-full max-w-md text-center space-y-6">
                    <div className="mx-auto h-24 w-24 bg-cyan-500/10 rounded-full flex items-center justify-center text-cyan-500">
                        <Loader2 className="h-12 w-12 animate-spin" />
                    </div>
                    <h1 className="text-3xl font-bold">Verifying...</h1>
                    <p className="text-muted-foreground text-lg">
                        Please wait while we verify your email address.
                    </p>
                </div>
            </div>
        );
    }

    if (status === "success") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="w-full max-w-md text-center space-y-6">
                    <div className="mx-auto h-24 w-24 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                        <CheckCircle className="h-12 w-12" />
                    </div>
                    <h1 className="text-3xl font-bold">Email Verified!</h1>
                    <p className="text-muted-foreground text-lg">
                        Your email has been successfully verified. You can now sign in to your account.
                    </p>
                    <Link href="/auth/signin">
                        <Button className="bg-cyan-600 hover:bg-cyan-500">
                            Sign In
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    if (status === "no-token") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="w-full max-w-md text-center space-y-6">
                    <div className="mx-auto h-24 w-24 bg-cyan-500/10 rounded-full flex items-center justify-center text-cyan-500 mb-6">
                        <Mail className="h-12 w-12" />
                    </div>
                    <h1 className="text-3xl font-bold">Check your inbox</h1>
                    <p className="text-muted-foreground text-lg">
                        We've sent a verification link to your email. Please click it to activate your account.
                    </p>
                    <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
                        Didn't receive it? Check your spam folder or contact support.
                    </div>
                    <Link href="/auth/signin">
                        <Button variant="ghost">Back to Sign In</Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Error state
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md text-center space-y-6">
                <div className="mx-auto h-24 w-24 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
                    <XCircle className="h-12 w-12" />
                </div>
                <h1 className="text-3xl font-bold">Verification Failed</h1>
                <p className="text-muted-foreground text-lg">
                    {errorMessage || "This verification link is invalid or has expired."}
                </p>
                <div className="flex flex-col gap-2">
                    <Link href="/auth/signin">
                        <Button className="w-full bg-cyan-600 hover:bg-cyan-500">
                            Sign In
                        </Button>
                    </Link>
                    <Link href="/auth/signin">
                        <Button variant="ghost" className="w-full">
                            Request New Verification
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
