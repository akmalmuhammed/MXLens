"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { AlertTriangle, CheckCircle, User, Cloud, Server, Cpu, Wifi, WifiOff } from "lucide-react";

export const ArchitectureSection = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section className="py-24 relative overflow-hidden" ref={ref}>
            <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />

            <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                        Architecturally <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Private</span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        We don't promise privacy. We guarantee it with physics. Your data cannot leak because it never leaves your device.
                    </p>
                </motion.div>

                {/* Comparison diagrams */}
                <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                    {/* Cloud-based (bad) */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="glass-card bg-background/50 backdrop-blur-sm border border-destructive/30 rounded-2xl p-8 shadow-sm"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                                The Industry Standard
                            </span>
                        </div>
                        <h3 className="text-xl font-bold mb-6 text-foreground">
                            Cloud-Based Analysis
                        </h3>

                        {/* Diagram */}
                        <div className="flex items-center justify-between gap-4 mb-6">
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                                    <User className="w-8 h-8 text-foreground" />
                                </div>
                                <span className="text-sm text-muted-foreground">You</span>
                            </div>

                            <motion.div
                                animate={{ x: [0, 10, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="flex-1 flex items-center"
                            >
                                <div className="h-0.5 flex-1 bg-gradient-to-r from-warning to-destructive" />
                                <Wifi className="w-5 h-5 text-warning mx-2" />
                                <div className="h-0.5 flex-1 bg-gradient-to-r from-warning to-destructive" />
                            </motion.div>

                            <div className="flex flex-col items-center gap-2">
                                <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center border border-destructive/40">
                                    <Cloud className="w-8 h-8 text-destructive" />
                                </div>
                                <span className="text-sm text-muted-foreground">Cloud Server</span>
                            </div>
                        </div>

                        {/* Warning */}
                        <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-muted-foreground">
                                Sensitive emails are uploaded to a 3rd party server. Risks include data breaches, insider threats, and subpoena access.
                            </p>
                        </div>
                    </motion.div>

                    {/* Local execution (good) */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="glass-card bg-background/50 backdrop-blur-sm border border-accent/30 rounded-2xl p-8 relative overflow-hidden shadow-sm"
                    >
                        {/* Glow effect */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-3xl" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-mono text-accent uppercase tracking-wider">
                                    The MXLens Architecture
                                </span>
                            </div>
                            <h3 className="text-xl font-bold mb-6 text-foreground">
                                Local Execution
                            </h3>

                            {/* Diagram */}
                            <div className="flex items-center justify-between gap-4 mb-6">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                                        <User className="w-8 h-8 text-foreground" />
                                    </div>
                                    <span className="text-sm text-muted-foreground">You</span>
                                </div>

                                <div className="flex-1 flex items-center">
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className="h-0.5 flex-1 bg-gradient-to-r from-primary to-accent"
                                    />
                                </div>

                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center border border-accent/40">
                                        <Cpu className="w-8 h-8 text-accent" />
                                    </div>
                                    <span className="text-sm text-muted-foreground">Browser (WASM)</span>
                                </div>

                                <div className="flex-1 flex items-center justify-center">
                                    <WifiOff className="w-5 h-5 text-muted-foreground" />
                                </div>

                                <div className="flex flex-col items-center gap-2 opacity-30">
                                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border border-border">
                                        <Server className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <span className="text-sm text-muted-foreground">Internet</span>
                                </div>
                            </div>

                            {/* Success message */}
                            <div className="flex items-start gap-3 p-4 rounded-lg bg-accent/10 border border-accent/20">
                                <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-muted-foreground">
                                    Analysis happens instantly in your RAM. No bytes leave your machine. The network is completely bypassed.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
