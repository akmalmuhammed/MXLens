import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Mail } from "lucide-react";

export default function VerifyEmailPage() {
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
                    Didn't receive it? Check your spam folder or
                    <Button variant="link" className="p-0 h-auto font-normal text-cyan-500 ml-1">resend email</Button>.
                </div>

                <Link href="/auth/signin">
                    <Button variant="ghost">Back to Sign In</Button>
                </Link>
            </div>
        </div>
    )
}
