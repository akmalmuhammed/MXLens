"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import {
    Zap,
    Shield,
    Search,
    Eye,
    Lock,
    AlertTriangle,
} from "lucide-react";

const features = [
    {
        icon: Zap,
        title: "Instant Verdict",
        description:
            "Analyze phishing in 30 seconds—not 15 minutes across 6 browser tabs. Get back to hunting threats.",
        tags: ["Static analysis engine", "Real-time reputation checks", "Header anomaly detection"],
    },
    {
        icon: Lock,
        title: "Zero Data Retention",
        description:
            "Your emails never touch our servers. GDPR/HIPAA-friendly by design. Analyze classified emails with confidence.",
        tags: ["Client-side processing", "Ephemeral formatting", "No database storage"],
    },
    {
        icon: Search,
        title: "Enterprise Detection",
        description:
            "Catches BEC, homoglyphs, and DMARC spoofing that legacy tools miss. Explainable verdicts, not black boxes.",
        tags: ["Homoglyph detection", "DMARC/SPF validation", "Content heuristics"],
    },
];

const threats = [
    {
        icon: Eye,
        title: "Executive Impersonation",
        description:
            "Detect CEO fraud emails with domain similarity checks and header alignment (SPF/DKIM).",
    },
    {
        icon: AlertTriangle,
        title: "Credential Harvesting",
        description:
            "Identify hidden login forms, suspicious redirects, and obscured URLs automatically.",
    },
    {
        icon: Shield,
        title: "Supplier Compromise",
        description:
            "Verify legitimate vendors vs. spoofed domains using deep header analysis.",
    },
];

export const FeaturesSection = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section id="features" className="py-24 relative overflow-hidden" ref={ref}>
            {/* Background elements */}
            <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
            <div className="absolute top-1/2 left-0 w-1/2 h-96 bg-primary/5 blur-3xl rounded-full" />

            <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
                {/* Main features */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                        Built for the <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">SOC</span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                        Tools designed to reduce alert fatigue and provide instant clarity.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8 mb-24">
                    {features.map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 40 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6, delay: i * 0.1 }}
                            className="group"
                        >
                            <div className="bg-background/50 backdrop-blur-sm border border-border/70 rounded-2xl h-full p-8 hover:border-primary/60 transition-all duration-300 shadow-sm hover:shadow-glow">
                                {/* Icon */}
                                <div className="mb-6">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <feature.icon className="w-6 h-6 text-primary" />
                                    </div>
                                </div>

                                {/* Content */}
                                <h3 className="text-xl font-bold mb-3 text-foreground">
                                    {feature.title}
                                </h3>
                                <p className="text-muted-foreground mb-6">
                                    {feature.description}
                                </p>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-2">
                                    {feature.tags.map((tag, j) => (
                                        <span
                                            key={j}
                                            className="text-xs font-mono px-2 py-1 rounded bg-secondary text-secondary-foreground"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Threat types */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="text-center mb-12"
                >
                    <h3 className="text-2xl sm:text-3xl font-bold mb-4">
                        Built for <span className="bg-gradient-to-r from-destructive to-warning bg-clip-text text-transparent">Real-World Threats</span>
                    </h3>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6">
                    {threats.map((threat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={isInView ? { opacity: 1, scale: 1 } : {}}
                            transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                            className="flex items-start gap-4 p-6 rounded-lg bg-card/50 border border-border/70 hover:border-primary/50 transition-colors"
                        >
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <threat.icon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-foreground mb-1">
                                    {threat.title}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    {threat.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
