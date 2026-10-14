"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Upload, Cpu, Layers, CheckCircle, Zap, Shield, Clock } from "lucide-react";

const steps = [
    {
        icon: Upload,
        step: "01",
        title: "Drag Email",
        time: "2 sec",
        description: "Drop .eml/.msg file — browser intercepts instantly",
        highlight: "File stays on YOUR device",
        color: "primary",
    },
    {
        icon: Cpu,
        step: "02",
        title: "Local Engine",
        time: "1 sec",
        description: "The analysis engine runs in your browser",
        highlight: "Email content never uploaded",
        color: "accent",
    },
    {
        icon: Layers,
        step: "03",
        title: "85+ Rules Scan",
        time: "2 sec",
        description: "11 detection modules run in parallel locally",
        highlight: "SPF, DKIM, DMARC, URLs, Headers, QR...",
        color: "primary",
    },
    {
        icon: CheckCircle,
        step: "04",
        title: "Explainable Verdict",
        time: "Instant",
        description: "Trust Score (0-100) with evidence breakdown",
        highlight: "See WHY, not just a score",
        color: "accent",
    },
];

export const HowItWorksSection = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    return (
        <section id="how-it-works" className="py-24 relative overflow-hidden" ref={ref}>
            {/* Background removed for unified page flow */}

            <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.3 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                        From Alert to Verdict in{" "}
                        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            &lt;5 Seconds
                        </span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                        Not 15 minutes across 6 browser tabs.
                    </p>
                </motion.div>

                {/* Steps - Clean Vertical Layout */}
                <div className="max-w-2xl mx-auto relative">
                    {/* Connection line */}
                    <motion.div
                        initial={{ scaleY: 0 }}
                        animate={isInView ? { scaleY: 1 } : {}}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-accent to-primary origin-top"
                    />

                    <div className="space-y-6">
                        {steps.map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -30 }}
                                animate={isInView ? { opacity: 1, x: 0 } : {}}
                                transition={{ duration: 0.3, delay: 0.1 + i * 0.1 }}
                                className="relative flex items-start gap-6 pl-4"
                            >
                                {/* Step icon bubble */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={isInView ? { scale: 1 } : {}}
                                    transition={{ duration: 0.4, delay: 0.3 + i * 0.15, type: "spring" }}
                                    className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${item.color === "accent"
                                        ? "bg-accent text-accent-foreground"
                                        : "bg-primary text-primary-foreground"
                                        }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                </motion.div>

                                {/* Card */}
                                <div className="flex-1 bg-card/80 backdrop-blur-sm border border-border rounded-xl p-5 hover:border-primary/50 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-mono text-muted-foreground">
                                            STEP {item.step}
                                        </span>
                                        <span className={`text-xs font-mono px-2 py-1 rounded ${item.color === "accent"
                                            ? "bg-accent/20 text-accent"
                                            : "bg-primary/20 text-primary"
                                            }`}>
                                            {item.time}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground mb-1">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                                    <p className={`text-sm font-medium ${item.color === "accent" ? "text-accent" : "text-primary"
                                        }`}>
                                        → {item.highlight}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Bottom stats */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.3, delay: 0.5 }}
                    className="mt-16 flex flex-wrap justify-center gap-8"
                >
                    {[
                        { icon: Zap, value: "<5s", label: "Total Analysis" },
                        { icon: Shield, value: "85+", label: "Detection Rules" },
                        { icon: Clock, value: "0", label: "Network Requests" },
                    ].map((stat, i) => (
                        <div key={i} className="text-center">
                            <stat.icon className="w-6 h-6 text-accent mx-auto mb-2" />
                            <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};
