import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-sm space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">Reset Password</h1>
                    <p className="text-muted-foreground mt-2">Enter your email to receive a reset code.</p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" placeholder="name@company.com" />
                    </div>
                    <Button className="w-full bg-cyan-600 hover:bg-cyan-500">Send Reset Link</Button>
                </div>

                <div className="text-center">
                    <Link href="/auth/signin" className="text-sm text-muted-foreground hover:text-foreground">
                        Back to Sign In
                    </Link>
                </div>
            </div>
        </div>
    )
}
