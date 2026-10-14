import { Zap, Lock, Crosshair, Check } from "lucide-react";

export function Features() {
    const features = [
        {
            icon: Zap,
            title: "Instant Verdict",
            description: "Analyze phishing in 30 seconds—not 15 minutes across 6 browser tabs. Get back to hunting threats.",
            bullets: ["Static analysis engine", "Real-time reputation checks", "Header anomaly detection"]
        },
        {
            icon: Lock,
            title: "Zero Data Retention",
            description: "Your emails never touch our servers. GDPR/HIPAA-friendly by design. Analyze classified emails with confidence.",
            bullets: ["Client-side processing", "Ephemeral formatting", "No database storage"]
        },
        {
            icon: Crosshair,
            title: "Enterprise Detection",
            description: "Catches BEC, homoglyphs, and DMARC spoofing that legacy tools miss. Explainable verdicts, not black boxes.",
            bullets: ["Homoglyph detection", "DMARC/SPF validation", "Content heuristics"]
        }
    ];

    return (
        <section className="py-32 px-6 bg-gradient-to-b from-background to-muted/20 border-t border-border/50">
            <div className="max-w-[1280px] mx-auto">
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">Built for the SOC</h2>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                        Tools designed to reduce alert fatigue and provide instant clarity.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-10">
                    {features.map((feature) => (
                        <FeatureCard
                            key={feature.title}
                            icon={feature.icon}
                            title={feature.title}
                            description={feature.description}
                            bullets={feature.bullets}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

function FeatureCard({ icon: Icon, title, description, bullets }: { icon: any, title: string, description: string, bullets: string[] }) {
    return (
        <div className="p-10 bg-card rounded-lg border border-border/50 hover:border-primary/30 transition-all shadow-sm hover:shadow-[var(--shadow-lg)] group">
            <div className="w-12 h-12 mb-6 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-6 h-6 text-primary" />
            </div>

            <h3 className="text-2xl font-semibold mb-4">
                {title}
            </h3>

            <p className="text-base text-muted-foreground leading-relaxed mb-6">
                {description}
            </p>

            <ul className="space-y-3">
                {bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                        <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{bullet}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
