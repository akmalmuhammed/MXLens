"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Upload, Zap, CheckCircle } from "lucide-react";

const steps = [
    {
        icon: Upload,
        step: "01",
        title: "Upload Email",
        description:
            "Drag & drop any .eml or .msg file directly into the browser. Or paste headers manually.",
    },
    {
        icon: Zap,
        step: "02",
        title: "Instant Analysis",
        description:
            "Our WASM engine parses MIME structures and extracts artifacts in under 3 seconds locally.",
    },
    {
        icon: CheckCircle,
        step: "03",
        title: "Verdict",
        description:
            "Get an immediate trust score, threat breakdown, and authentication analysis.",
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
                        How It <span className="text-gradient">Works</span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                        A seamless, secure workflow designed for speed.
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
                                <div className="glass-card bg-background/50 backdrop-blur-sm border border-border/70 rounded-2xl p-8 h-full relative group hover:border-primary/60 transition-colors shadow-sm">
                                    {/* Step number */}
                                    <div className="absolute -top-4 left-8 px-3 py-1 bg-primary text-primary-foreground font-mono text-sm font-bold rounded">
                                        {item.step}
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
                                    <p className="text-muted-foreground">{item.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
