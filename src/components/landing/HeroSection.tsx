"use client";

import { motion } from "framer-motion";
import { ArrowRight, ChevronDown, Shield, Zap, Lock, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrbitalBackground } from "./OrbitalBackground";
import Link from "next/link";

const badges = [
    { icon: Shield, label: "No signup • 3 free analyses" },
    { icon: Lock, label: "Open Source Core" },
    { icon: Zap, label: "Zero Data Retention" },
    { icon: Clock, label: "<3s Analysis" },
];

export const HeroSection = () => {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32 pb-20">
            {/* Background */}
            <div className="absolute inset-0 z-0">
                {/* Background image placeholder - replaced with gradient for now */}
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-30 bg-gradient-to-br from-background via-primary/5 to-background"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />
                <div className="absolute inset-0 cyber-grid opacity-20" />
            </div>

            {/* Orbital circles background */}
            <OrbitalBackground />

            {/* Animated glow orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/15 rounded-full blur-3xl animate-pulse-glow delay-1000" />

            <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Tag */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 mb-8"
                    >
                        <Shield className="w-4 h-4 text-primary" />
                        <span className="text-sm font-mono text-primary">
                            100% Client-Side Execution
                        </span>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.1 }}
                        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
                    >
                        <span className="text-foreground">Email Intelligence.</span>
                        <br />
                        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Zero Data Exfiltration.</span>
                    </motion.h1>

                    {/* Subheadline */}
                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                        className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
                    >
                        The first completely client-side analysis engine. Drag, drop, and
                        dissect suspicious emails without them ever leaving your browser.
                        <span className="font-semibold text-foreground"> No server uploads. No logs. No risk.</span>
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
                    >
                        <Button className="group w-full sm:w-auto text-lg h-14 px-8 rounded-full shadow-glow" size="lg" asChild>
                            <Link href="/analyze">
                                Start Analysis (Local Only)
                                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full sm:w-auto text-lg h-14 px-8 rounded-full hover:bg-secondary/10"
                            onClick={() => {
                                document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
                            }}
                        >
                            See how it works
                            <ChevronDown className="ml-2 w-5 h-5" />
                        </Button>
                    </motion.div>

                    {/* Trust badges */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.4 }}
                        className="flex flex-wrap items-center justify-center gap-6"
                    >
                        {badges.map((badge, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-2 text-sm text-muted-foreground"
                            >
                                <badge.icon className="w-4 h-4 text-primary" />
                                <span>{badge.label}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2"
            >
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2"
                >
                    <motion.div className="w-1.5 h-1.5 rounded-full bg-primary" />
                </motion.div>
            </motion.div>
        </section>
    );
};
