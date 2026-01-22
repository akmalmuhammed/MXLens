"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Shield, Zap, Package, Lock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const badges = [
    { icon: Lock, label: "100% Client-Side" },
    { icon: Zap, label: "3-Sec Analysis" },
    { icon: Package, label: "50-Email Bulk" },
    { icon: Shield, label: "Zero Privacy Risk" },
];

export const CTASection = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section className="py-24 relative overflow-hidden" ref={ref}>
            {/* Background effects */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-background to-background" />
                <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent/15 rounded-full blur-3xl" />
            </div>

            <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7 }}
                    className="max-w-3xl mx-auto text-center"
                >
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
                        Ready to Eliminate{" "}
                        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            Alert Fatigue?
                        </span>
                    </h2>

                    <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                        Join 20+ SOC analysts analyzing emails in seconds, not hours.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                        <Button className="group w-full sm:w-auto h-14 px-8 text-lg shadow-glow" size="lg" asChild>
                            <Link href="/analyze">
                                Start Free Analysis
                                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full sm:w-auto h-14 px-8 text-lg"
                            asChild
                        >
                            <Link href="mailto:demo@mxlens.com">
                                <Calendar className="mr-2 w-5 h-5" />
                                Book Demo
                            </Link>
                        </Button>
                    </div>

                    {/* Trust badges */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-wrap items-center justify-center gap-4 text-sm"
                    >
                        <span className="text-muted-foreground">✓ No credit card</span>
                        <span className="text-muted-foreground">✓ 3 free analyses</span>
                        <span className="text-muted-foreground">✓ Full features</span>
                    </motion.div>

                    {/* Feature badges */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="flex flex-wrap items-center justify-center gap-3 mt-8"
                    >
                        {badges.map((badge, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border text-sm"
                            >
                                <badge.icon className="w-4 h-4 text-primary" />
                                <span className="text-foreground">{badge.label}</span>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};
