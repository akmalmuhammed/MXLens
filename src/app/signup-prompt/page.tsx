import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Zap } from "lucide-react";

export default function SignupPromptPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 items-center">

                {/* Left Side: Context & Free Teaser */}
                <div className="space-y-6">
                    <div className="inline-block p-3 rounded-2xl bg-slate-800/50 border border-slate-700">
                        <span className="text-slate-400 font-mono text-sm">Session Limit Reached</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
                        You've used your <span className="text-cyan-400">3 free analyses</span>.
                    </h1>
                    <p className="text-lg text-slate-400">
                        Don't leave your inbox vulnerable. Create a free account to continue analyzing suspicious emails.
                    </p>

                    <ul className="space-y-3">
                        {["10 Free analyses per day", "Basic threat reports", "30-day history"].map((item) => (
                            <li key={item} className="flex items-center gap-2 text-slate-300">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Right Side: Action Card */}
                <Card className="p-8 border-cyan-500/20 bg-slate-900/50 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Zap className="w-32 h-32 text-cyan-400" />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">Create Free Account</h2>
                    <p className="text-sm text-slate-400 mb-6">Get back to analyzing in seconds.</p>

                    <form className="space-y-4" action="/auth/signup">
                        <div className="space-y-2">
                            <Input
                                type="email"
                                placeholder="name@company.com"
                                className="bg-slate-950/50 border-slate-700 focus:border-cyan-500 transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <Input
                                type="password"
                                placeholder="Create a password"
                                className="bg-slate-950/50 border-slate-700 focus:border-cyan-500 transition-colors"
                            />
                        </div>

                        <Button className="w-full h-11 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-base mt-2">
                            Create Account
                        </Button>
                    </form>

                    <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-6">
                        <span className="text-slate-500 text-sm">Need more?</span>
                        <Link href="/pricing" className="text-cyan-400 hover:text-cyan-300 text-sm font-medium flex items-center gap-1">
                            View Premium Plans →
                        </Link>
                    </div>
                </Card>
            </div>
        </div>
    );
}
