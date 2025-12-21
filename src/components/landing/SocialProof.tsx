import { ShieldCheck, Lock, Globe } from "lucide-react";

export function SocialProof() {
    return (
        <section className="py-10 border-y border-border/50 bg-muted/20">
            <div className="container mx-auto px-4 text-center">
                <p className="text-sm font-semibold text-muted-foreground mb-6 uppercase tracking-wider">
                    Trusted Logic Used By Analysts At
                </p>

                {/* 
                 Since we don't have real logos yet, we use generic "Security Team" placeholders 
                 or "Trusted by 500+ security analysts" as requested.
                */}
                <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-70 grayscale transition-all hover:grayscale-0">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <ShieldCheck className="h-6 w-6" /> FinSec Corp
                    </div>
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <Lock className="h-6 w-6" /> HealthGuard
                    </div>
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <Globe className="h-6 w-6" /> CyberDefense
                    </div>
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <ShieldCheck className="h-6 w-6" /> NetSecure
                    </div>
                </div>

                <div className="mt-10 max-w-2xl mx-auto bg-card border border-border/50 p-6 rounded-xl relative">
                    <p className="italic text-lg text-foreground/90">
                        "Finally, a phishing analyzer I can use on confidential emails without compliance headaches."
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            JK
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-bold text-foreground">James K.</p>
                            <p className="text-xs text-muted-foreground">Senior SOC Analyst, Healthcare</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
