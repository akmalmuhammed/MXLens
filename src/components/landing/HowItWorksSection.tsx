"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Upload, Zap, CheckCircle, Cpu, Network, FileOutput } from "lucide-react";

const steps = [
    {
        icon: Upload,
        step: "STEP 1",
        title: "Upload",
        time: "2 sec",
        description: "Drag .eml/.msg files or paste email content directly.",
        detail: "Bulk: Select up to 50 emails at once",
    },
    {
        icon: Cpu,
        step: "STEP 2",
        title: "Analysis",
        time: "3 sec",
        description: "WebAssembly engine processes locally in your browser.",
        detail: "11+ modules run in parallel • Zero network requests",
    },
    {
        icon: FileOutput,
        step: "STEP 3",
        title: "Results",
        time: "instant",
        description: "Get Trust Score (0-100), intelligence summary, and evidence breakdown.",
        detail: "Export PDF/JSON for reporting",
    },
];

export const HowItWorksSection = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section id="how-it-works" className="py-24 relative" ref={ref}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                        From Alert to Verdict in <span className="text-gradient">30 Seconds</span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                        Three simple steps. Zero complexity.
                    </p>
                </motion.div>

                {/* Steps */}
                <div className="relative">
                    {/* Connection line */}
                    <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2" />

                    <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
                        {steps.map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 40 }}
                                animate={isInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.6, delay: i * 0.15 }}
                                className="relative"
                            >
                                <div className="glass-card bg-background/50 backdrop-blur-sm border border-border rounded-2xl p-8 h-full relative group hover:border-primary/60 transition-colors shadow-sm">
                                    {/* Step label */}
                                    <div className="absolute -top-4 left-8 px-3 py-1 bg-primary text-primary-foreground font-mono text-sm font-bold rounded">
                                        {item.step}
                                    </div>

                                    {/* Time badge */}
                                    <div className="absolute -top-4 right-8 px-3 py-1 bg-accent/20 text-accent font-mono text-sm font-bold rounded border border-accent/30">
                                        {item.time}
                                    </div>

                                    {/* Icon */}
                                    <div className="mb-6 mt-4">
                                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                            <item.icon className="w-7 h-7 text-primary" />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <h3 className="text-xl font-bold mb-3 text-foreground">
                                        {item.title}
                                    </h3>
                                    <p className="text-muted-foreground mb-3">{item.description}</p>
                                    <p className="text-sm text-primary/80 font-mono">{item.detail}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Callout */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="mt-16 max-w-3xl mx-auto"
                >
                    <div className="bg-card/50 border border-primary/30 rounded-xl p-6 text-center">
                        <p className="text-lg text-foreground italic mb-2">
                            &ldquo;Unlike black-box AI, MXLens shows <span className="text-primary font-semibold">WHY</span>.
                            You&apos;re still the analyst—we&apos;re just 83% faster.&rdquo;
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
