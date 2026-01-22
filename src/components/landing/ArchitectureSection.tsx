"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import {
    Monitor,
    Cloud,
    Shield,
    X,
    Check,
    Server,
    Lock,
    Eye,
    AlertTriangle,
    ArrowRight
} from "lucide-react";

export const ArchitectureSection = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section id="architecture" className="py-24 relative overflow-hidden" ref={ref}>
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />

            <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                        Why <span className="text-gradient">Client-Side</span> Matters
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                        Cloud tools promise privacy. We guarantee it.
                    </p>
                </motion.div>

                {/* Visual Comparison */}
                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* Cloud Tools - RED */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 to-transparent rounded-2xl" />
                        <div className="relative bg-card border border-destructive/30 rounded-2xl p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center">
                                    <Cloud className="w-6 h-6 text-destructive" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-foreground">Cloud Tools</h3>
                                    <p className="text-sm text-destructive">VirusTotal, Sublime, Abnormal</p>
                                </div>
                            </div>

                            {/* Flow diagram */}
                            <div className="space-y-4 mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                                        <Monitor className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-destructive animate-pulse" />
                                    <div className="w-12 h-12 rounded-lg bg-destructive/20 border border-destructive/50 flex items-center justify-center">
                                        <Server className="w-5 h-5 text-destructive" />
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-destructive animate-pulse" />
                                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                                        <Eye className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground font-mono text-center">
                                    Your Email → Their Servers → Their Logs
                                </p>
                            </div>

                            {/* Risks */}
                            <div className="space-y-3">
                                {[
                                    "Email content stored on external servers",
                                    "Data visible to third parties",
                                    "Compliance risk (GDPR, HIPAA)",
                                    "Potential for data breaches",
                                ].map((risk, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                                        transition={{ delay: 0.4 + i * 0.1 }}
                                        className="flex items-center gap-3"
                                    >
                                        <X className="w-5 h-5 text-destructive flex-shrink-0" />
                                        <span className="text-sm text-muted-foreground">{risk}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* MXLens - GREEN */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent rounded-2xl" />
                        <div className="absolute inset-0 border-2 border-accent/30 rounded-2xl animate-pulse" style={{ animationDuration: '3s' }} />
                        <div className="relative bg-card border border-accent/50 rounded-2xl p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                                    <Shield className="w-6 h-6 text-accent" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-foreground">MXLens</h3>
                                    <p className="text-sm text-accent">100% Client-Side</p>
                                </div>
                            </div>

                            {/* Flow diagram */}
                            <div className="space-y-4 mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                                        <Monitor className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-accent" />
                                    <div className="w-12 h-12 rounded-lg bg-accent/20 border border-accent/50 flex items-center justify-center relative">
                                        <Lock className="w-5 h-5 text-accent" />
                                        <motion.div
                                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent flex items-center justify-center"
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                        >
                                            <Check className="w-2.5 h-2.5 text-background" />
                                        </motion.div>
                                    </div>
                                    <div className="w-6 h-6 rounded-full bg-destructive/20 border border-destructive/50 flex items-center justify-center relative">
                                        <X className="w-3 h-3 text-destructive" />
                                    </div>
                                    <div className="w-12 h-12 rounded-lg bg-muted/30 flex items-center justify-center opacity-30 line-through">
                                        <Server className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground font-mono text-center">
                                    Your Email → Your Browser Only → <span className="text-destructive">✕ No Server</span>
                                </p>
                            </div>

                            {/* Benefits */}
                            <div className="space-y-3">
                                {[
                                    "Zero data leaves your device",
                                    "Works completely offline",
                                    "GDPR/HIPAA compliant by design",
                                    "Verifiable in DevTools (Network tab)",
                                ].map((benefit, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                                        transition={{ delay: 0.5 + i * 0.1 }}
                                        className="flex items-center gap-3"
                                    >
                                        <Check className="w-5 h-5 text-accent flex-shrink-0" />
                                        <span className="text-sm text-foreground">{benefit}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Bottom callout */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="mt-12 text-center"
                >
                    <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent/10 border border-accent/30">
                        <AlertTriangle className="w-5 h-5 text-accent" />
                        <span className="text-sm font-medium text-foreground">
                            Open DevTools → Network tab during analysis. You&apos;ll see <span className="text-accent font-bold">zero requests</span>.
                        </span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
