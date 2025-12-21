import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Play, ShieldCheck, Zap, Lock, AlertTriangle } from "lucide-react";
import { BackgroundAnimation } from "@/components/landing/BackgroundAnimation";

export function Hero() {
    return (
        <section className="relative flex items-center justify-center min-h-[90vh] pt-20 pb-20 px-4 overflow-hidden bg-background 
        bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-cyan-50/20 to-white 
        dark:from-slate-900 dark:via-[#0a0a0a] dark:to-black 
        transition-colors duration-300">

            {/* Animated Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-100 dark:opacity-40 pointer-events-none">
                <BackgroundAnimation />
            </div>

            <div className="container relative z-10 grid lg:grid-cols-2 gap-12 items-center">

                {/* Left Content */}
                <div className="space-y-8 text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/5 text-cyan-700 dark:text-cyan-400 text-sm font-medium backdrop-blur-sm">
                        <ShieldCheck className="w-4 h-4" /> SOC 2 Type I Compliant
                    </div>

                    <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl leading-[1.1] text-foreground drop-shadow-sm">
                        Analyze Phishing <br />
                        Emails <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-teal-600 dark:from-cyan-400 dark:to-teal-400">Instantly</span>
                    </h1>

                    <p className="text-muted-foreground text-lg sm:text-xl max-w-lg leading-relaxed font-medium">
                        Your emails never leave your browser. Get expert-level threat detection in 30 seconds—without uploading sensitive data to the cloud.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 items-start pt-2">
                        <Link href="/analyze">
                            <Button size="lg" className="h-14 px-8 text-lg font-bold bg-gradient-to-r from-cyan-600 to-teal-600 dark:from-cyan-500 dark:to-teal-500 text-white dark:text-black hover:opacity-90 hover:scale-105 transition-all shadow-xl shadow-cyan-200/50 dark:shadow-[0_0_30px_-10px_rgba(34,211,238,0.6)] border-0">
                                Try Free Analysis
                            </Button>
                        </Link>
                        <Button variant="ghost" size="lg" className="h-14 text-lg text-muted-foreground hover:text-foreground group hover:bg-slate-100 dark:hover:bg-white/10">
                            <Play className="mr-2 h-5 w-5 fill-current" /> Watch Demo
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground pl-1 font-medium">
                        No signup • 3 free analyses
                    </p>

                    {/* Bottom Stats Row */}
                    <div className="pt-12 flex flex-wrap gap-8 text-muted-foreground text-sm font-semibold border-t border-border/50 mt-8">
                        <div className="flex items-center gap-2">
                            <div className="p-1 rounded bg-cyan-100 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400"><ShieldCheck className="w-4 h-4" /></div>
                            500+ SOC Analysts
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="p-1 rounded bg-cyan-100 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400"><Lock className="w-4 h-4" /></div>
                            Zero Data Retention
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="p-1 rounded bg-cyan-100 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400"><Zap className="w-4 h-4" /></div>
                            &lt;3s Analysis
                        </div>
                    </div>
                </div>

                {/* Right Visuals (Floating Cards) */}
                <div className="relative hidden lg:block h-[600px] w-full perspective-1000">
                    {/* Main Card */}
                    <div className="absolute top-10 right-0 w-[90%] bg-white/80 dark:bg-[#111]/80 border border-white/50 dark:border-slate-800 rounded-xl p-6 shadow-2xl shadow-slate-200/50 dark:shadow-cyan-900/20 z-20 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-10 duration-1000">
                        <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-white/5 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-500">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-foreground font-bold">urgent_payment@paypa1.com</div>
                                    <div className="text-xs text-red-600 dark:text-red-400 font-medium">Homoglyph Detected: 'paypa1' != 'paypal'</div>
                                </div>
                            </div>
                            <div className="px-3 py-1 rounded bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold border border-red-100 dark:border-red-500/30">
                                DMARC: Fail
                            </div>
                        </div>
                        <div className="space-y-4 font-mono text-sm text-slate-600 dark:text-slate-400">
                            <p>Dear Customer,</p>
                            <p>We have detected suspicious activity on your account. Please verify your identity immediately...</p>
                            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-500/20 rounded flex items-center justify-between text-red-700 dark:text-red-200 shadow-sm">
                                <span>verify-identity-secure.com</span>
                                <span className="text-xs bg-red-100 dark:bg-red-500/20 px-2 py-1 rounded font-bold">Malicious Link</span>
                            </div>
                        </div>
                    </div>

                    {/* Score Card */}
                    <div className="absolute bottom-20 left-0 w-48 bg-white/90 dark:bg-[#0a0a0a] border border-white/50 dark:border-slate-800 rounded-xl p-5 shadow-2xl shadow-slate-200/50 dark:shadow-none z-30 backdrop-blur-sm animate-in fade-in slide-in-from-left-10 duration-1000 delay-300">
                        <div className="text-center">
                            <div className="text-5xl font-extrabold text-red-500 mb-1">12</div>
                            <div className="text-xs uppercase tracking-widest text-slate-500 font-bold">Threat Score</div>
                            <div className="mt-3 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full w-[88%] bg-red-500 rounded-full" />
                            </div>
                        </div>
                    </div>

                    {/* Decorative Glows */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-200/20 dark:bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
                </div>
            </div>
        </section>
    );
}
