import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck } from "lucide-react";

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

                <form
                    action={async (formData) => {
                        "use server";
                        await signIn("credentials", formData);
                    }}
                    className="space-y-4"
                >
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" placeholder="name@example.com" required defaultValue="demo@mxlens.com" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" name="password" type="password" required defaultValue="mxlens2025" />
                    </div>
                    <Button type="submit" className="w-full">
                        Sign In
                    </Button>
                </form>

                <div className="mt-4 text-center text-xs text-muted-foreground">
                    (Demo: demo@mxlens.com / mxlens2025)
                </div>
            </div>
        </div>
    );
}
