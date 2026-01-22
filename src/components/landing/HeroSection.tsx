"use client";

import { motion } from "framer-motion";
import { ArrowRight, Shield, Lock, Zap, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ParticleBackground } from "./ParticleBackground";
import { AnimatedDemo } from "./AnimatedDemo";
import Link from "next/link";

export const HeroSection = () => {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Particle Background */}
            <ParticleBackground />

            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background z-[1]" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 z-[1]" />

            {/* Cyber grid */}
            <div className="absolute inset-0 cyber-grid opacity-30 z-[1]" />

            {/* Animated glow orbs */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse z-[1]" style={{ animationDuration: '4s' }} />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/15 rounded-full blur-[100px] animate-pulse z-[1]" style={{ animationDuration: '4s', animationDelay: '2s' }} />

            <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left: Content */}
                    <div className="text-center lg:text-left">
                        {/* Tag */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/50 bg-primary/10 mb-8"
                        >
                            <Shield className="w-4 h-4 text-primary" />
                            <span className="text-sm font-mono text-primary">
                                100% Client-Side • Zero Cloud Upload
                            </span>
                        </motion.div>

                        {/* MASSIVE Headline */}
                        <motion.h1
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tight mb-6"
                        >
                            <span className="text-foreground block">Email</span>
                            <span className="text-foreground block">Intelligence.</span>
                            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent block bg-[length:200%_auto] animate-gradient">
                                Zero Risk.
                            </span>
                        </motion.h1>

                        {/* Subheadline */}
                        <motion.p
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                            className="text-lg sm:text-xl text-muted-foreground max-w-lg mb-10"
                        >
                            Drag. Drop. <span className="text-foreground font-semibold">Verdict in 3 seconds.</span>
                            <br />
                            Your emails never leave your browser.
                        </motion.p>

                        {/* GLOWING Primary CTA */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.3 }}
                            className="flex flex-col sm:flex-row items-center lg:items-start gap-4 mb-10"
                        >
                            <Button
                                className="group relative w-full sm:w-auto text-lg h-16 px-10 rounded-full font-bold overflow-hidden"
                                size="lg"
                                asChild
                            >
                                <Link href="/analyze">
                                    {/* Glow effect */}
                                    <span className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-100" />
                                    <span className="absolute inset-0 bg-gradient-to-r from-primary to-accent blur-xl opacity-50 group-hover:opacity-80 transition-opacity" />
                                    <span className="relative flex items-center gap-2">
                                        Analyze Your First Threat
                                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                    </span>
                                </Link>
                            </Button>
                            <Button
                                variant="ghost"
                                size="lg"
                                className="w-full sm:w-auto text-lg h-16 px-8 rounded-full text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
                                }}
                            >
                                <Eye className="mr-2 w-5 h-5" />
                                Watch How It Works
                            </Button>
                        </motion.div>

                        {/* Trust indicators - BIG */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.4 }}
                            className="flex flex-wrap items-center justify-center lg:justify-start gap-6"
                        >
                            {[
                                { icon: Lock, text: "No signup needed" },
                                { icon: Zap, text: "85+ detection rules" },
                                { icon: Shield, text: "Works offline" },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                    <item.icon className="w-5 h-5 text-accent" />
                                    <span className="text-muted-foreground">{item.text}</span>
                                </div>
                            ))}
                        </motion.div>
                    </div>

                    {/* Right: Animated Demo */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="hidden lg:block"
                    >
                        <AnimatedDemo />
                    </motion.div>
                </div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 1 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
            >
                <motion.div
                    animate={{ y: [0, 12, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-8 h-12 rounded-full border-2 border-primary/50 flex items-start justify-center p-2"
                >
                    <motion.div className="w-2 h-2 rounded-full bg-primary" />
                </motion.div>
            </motion.div>
        </section>
    );
};
