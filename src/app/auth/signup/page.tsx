import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { registerUser } from "@/actions/auth";

export default function SignUpPage() {
    return (
        <div className="flex min-h-screen">
            {/* Left Column: Form */}
            <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-background">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div className="flex flex-col space-y-2 text-center lg:text-left">
                        <Link href="/" className="font-bold text-2xl tracking-tight mb-8 self-center lg:self-start">
                            <span className="text-primary">MX</span>Lens
                        </Link>
                        <h1 className="text-3xl font-bold tracking-tight">Create your account</h1>
                        <p className="text-sm text-muted-foreground">
                            Join security professionals analyzing threats instantly.
                        </p>
                    </div>

                    <div className="mt-10">
                        <div className="mb-6">
                            <form
                                action={async () => {
                                    "use server";
                                    await signIn("google", { redirectTo: "/dashboard" });
                                }}
                            >
                                <Button variant="outline" type="submit" className="w-full flex items-center justify-center gap-2 py-6 text-base font-medium">
                                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                                        <path
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            fill="#4285F4"
                                        />
                                        <path
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            fill="#34A853"
                                        />
                                        <path
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            fill="#FBBC05"
                                        />
                                        <path
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            fill="#EA4335"
                                        />
                                    </svg>
                                    Sign up with Google
                                </Button>
                            </form>
                        </div>

                        <div className="relative mb-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Or register with email
                                </span>
                            </div>
                        </div>

                        <form action={async (formData) => {
                            "use server"
                            await registerUser(formData)
                        }} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" name="name" type="text" placeholder="Jane Doe" className="h-11" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Work Email</Label>
                                <Input id="email" name="email" type="email" placeholder="jane@company.com" required className="h-11" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" name="password" type="password" required className="h-11" />
                            </div>
                            <Button type="submit" className="w-full h-11 text-base shadow-lg shadow-primary/25">
                                Create Account <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </form>

                        <div className="mt-6 text-center text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <Link href="/auth/signin" className="font-medium text-primary hover:underline">
                                Sign in
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Visuals */}
            <div className="relative hidden w-0 flex-1 lg:block bg-slate-950">
                <div className="absolute inset-0 h-full w-full object-cover bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover opacity-20 invert" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-20 text-white space-y-8">
                    <div className="space-y-4">
                        <blockquote className="text-2xl font-medium leading-relaxed">
                            &ldquo;MXLens cut our phishing triage time by 90%. Being able to visualize the email hops instantly is a game changer.&rdquo;
                        </blockquote>
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-cyan-500/20 flex items-center justify-center font-bold text-cyan-500 border border-cyan-500/30">
                                JD
                            </div>
                            <div>
                                <div className="font-semibold">John Doe</div>
                                <div className="text-slate-400 text-sm">CISO, TechCorp Inc.</div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-white/10 pt-8 grid grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-cyan-400 font-semibold">
                                <CheckCircle2 className="w-5 h-5" />
                                Enterprise Grade
                            </div>
                            <p className="text-sm text-slate-400">SOC-2 Compliant & Privacy First</p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-cyan-400 font-semibold">
                                <CheckCircle2 className="w-5 h-5" />
                                Unlimited History
                            </div>
                            <p className="text-sm text-slate-400">Save and share reports securely</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
