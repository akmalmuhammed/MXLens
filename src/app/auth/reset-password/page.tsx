"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { requestPasswordReset } from "@/actions/password-reset";
import { CheckCircle, Mail, ArrowLeft, Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append("email", email);

        try {
            const result = await requestPasswordReset(formData);
            if (result.error) {
                setError(result.error);
            } else {
                setSent(true);
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    if (sent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="w-full max-w-md text-center space-y-6">
                    <div className="mx-auto h-24 w-24 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                        <CheckCircle className="h-12 w-12" />
                    </div>
                    <h1 className="text-3xl font-bold">Check your email</h1>
                    <p className="text-muted-foreground text-lg">
                        If an account exists for <strong>{email}</strong>, we've sent a password reset link.
                    </p>
                    <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
                        Didn't receive it? Check your spam folder or wait a few minutes.
                    </div>
                    <Link href="/auth/signin">
                        <Button variant="ghost" className="gap-2">
                            <ArrowLeft className="h-4 w-4" /> Back to Sign In
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-sm space-y-6">
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-cyan-500/10 rounded-full flex items-center justify-center text-cyan-500 mb-4">
                        <Mail className="h-8 w-8" />
                    </div>
                    <h1 className="text-2xl font-bold">Forgot Password?</h1>
                    <p className="text-muted-foreground mt-2">
                        Enter your email and we'll send you a reset link.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-cyan-600 hover:bg-cyan-500"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            "Send Reset Link"
                        )}
                    </Button>
                </form>

                <div className="text-center">
                    <Link href="/auth/signin" className="text-sm text-muted-foreground hover:text-foreground">
                        Back to Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}
