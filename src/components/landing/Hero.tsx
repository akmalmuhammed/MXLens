import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, ShieldCheck } from "lucide-react";
import { BackgroundAnimation } from "@/components/landing/BackgroundAnimation";

export function Hero() {
    return (
        <section className="relative flex items-center justify-center min-h-screen py-32 px-6 overflow-hidden bg-background">

            {/* Animated Background */}
            <div className="absolute inset-0 z-0 opacity-100 dark:opacity-40 pointer-events-none">
                <BackgroundAnimation />
            </div>

            <div className="max-w-[1280px] mx-auto text-center relative z-10">
                {/* Badge */}
                <div className="mb-8 inline-flex items-center gap-2 px-6 py-3 bg-primary/10 border border-primary/20 rounded-full animate-in fade-in zoom-in duration-500">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">SOC 2 Type I Compliant</span>
                </div>

                {/* Headline */}
                <h1 className="text-6xl md:text-7xl font-bold leading-tight tracking-tight mb-8 text-foreground drop-shadow-sm animate-in slide-in-from-bottom-5 duration-700">
                    Analyze Phishing Emails{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-teal-500">Instantly</span>
                </h1>

                {/* Subheadline */}
                <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed animate-in slide-in-from-bottom-5 duration-700 delay-150">
                    Your emails never leave your browser. Get expert-level threat detection
                    in 30 seconds—without uploading sensitive data to the cloud.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12 animate-in slide-in-from-bottom-5 duration-700 delay-300">
                    <Link href="/analyze">
                        <Button size="xl" variant="primary" className="w-full sm:w-auto text-xl font-bold rounded-lg">
                            Try Free Analysis →
                        </Button>
                    </Link>
                    <Link href="#how-it-works" className="text-lg text-muted-foreground hover:text-primary transition-colors">
                        See how it works ↓
                    </Link>
                </div>

                {/* Benefits Band */}
                <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground animate-in fade-in duration-1000 delay-500">
                    <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-primary" />
                        <span>No signup • 3 free analyses</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-primary" />
                        <span>500+ SOC Analysts</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-primary" />
                        <span>Zero Data Retention</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-primary" />
                        <span>&lt;3s Analysis</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
