import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, ShieldCheck } from "lucide-react";
import { BackgroundAnimation } from "@/components/landing/BackgroundAnimation";

export function Hero() {
    return (
        <section className="relative flex items-center justify-center min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-background">

            {/* Animated Background */}
            <div className="absolute inset-0 z-0 opacity-100 dark:opacity-40 pointer-events-none">
                <BackgroundAnimation />
                <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />
            </div>

            <div className="max-w-4xl mx-auto text-center relative z-10">
                {/* Badge */}
                <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full animate-in fade-in zoom-in duration-500 backdrop-blur-sm">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <span className="text-sm font-mono text-primary">100% Client-Side Execution</span>
                </div>

                {/* Headline */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 text-foreground drop-shadow-sm animate-in slide-in-from-bottom-5 duration-700 font-heading">
                    Email Intelligence.<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500">Zero Data Exfiltration.</span>
                </h1>

                {/* Subheadline */}
                <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-in slide-in-from-bottom-5 duration-700 delay-150 text-balance">
                    The first completely client-side analysis engine. Drag, drop, and dissect
                    suspicious emails without them ever leaving your browser. <span className="font-semibold text-foreground">No server uploads. No logs. No risk.</span>
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-in slide-in-from-bottom-5 duration-700 delay-300">
                    <Link href="/analyze">
                        <Button size="xl" className="w-full sm:w-auto font-bold rounded-lg shadow-2xl shadow-primary/20 hover:shadow-primary/40 bg-primary text-primary-foreground hover:bg-primary/90">
                            Start Analysis (Local Only) →
                        </Button>
                    </Link>
                    <Link href="#how-it-works" className="text-lg text-muted-foreground hover:text-primary transition-colors">
                        See how it works ↓
                    </Link>
                </div>

                {/* Benefits Band */}
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground animate-in fade-in duration-1000 delay-500">
                    <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary" />
                        <span>No signup • 3 free analyses</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary" />
                        <span>Open Source Core</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary" />
                        <span>Zero Data Retention</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary" />
                        <span>&lt;3s Analysis</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
