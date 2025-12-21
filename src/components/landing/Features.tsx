import { Zap, Lock, Crosshair } from "lucide-react";

export function Features() {
    return (
        <section className="py-24 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/50 dark:to-background border-t border-border/50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight mb-4">Built for the SOC</h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Tools designed to reduce alert fatigue and provide instant clarity.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={Zap}
                        title="Instant Verdict"
                        description="Analyze phishing in 30 seconds—not 15 minutes across 6 browser tabs. Get back to hunting threats."
                    />
                    <FeatureCard
                        icon={Lock}
                        title="Zero Data Retention"
                        description="Your emails never touch our servers. GDPR/HIPAA-friendly by design. Analyze classified emails with confidence."
                    />
                    <FeatureCard
                        icon={Crosshair}
                        title="Enterprise-Grade Detection"
                        description="Catches BEC, homoglyphs, and DMARC spoofing that legacy tools miss. Explainable verdicts, not black boxes."
                    />
                </div>
            </div>
        </section>
    );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
    return (
        <div className="bg-card/50 dark:bg-card border border-border/50 p-8 rounded-xl transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-cyan-500/5 dark:hover:shadow-cyan-900/20 group backdrop-blur-sm">
            <div className="h-12 w-12 rounded-lg bg-cyan-100 dark:bg-primary/10 flex items-center justify-center text-cyan-700 dark:text-primary mb-6 transition-colors group-hover:bg-cyan-500 group-hover:text-white dark:group-hover:bg-primary dark:group-hover:text-black">
                <Icon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">
                {description}
            </p>
        </div>
    );
}
