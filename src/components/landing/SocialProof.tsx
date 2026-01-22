"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Quote, Users, Mail, Shield, Clock } from "lucide-react";

const stats = [
    { value: "20+", label: "Beta Users", icon: Users },
    { value: "1,000+", label: "Emails Analyzed", icon: Mail },
    { value: "0", label: "Privacy Breaches", icon: Shield },
    { value: "85%", label: "Avg Time Saved", icon: Clock },
];

export function SocialProof() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    return (
        <section className="py-16 border-y border-border/50 bg-muted/20" ref={ref}>
            <div className="container mx-auto px-4">
                {/* Header */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    className="text-sm font-semibold text-muted-foreground mb-10 uppercase tracking-wider text-center"
                >
                    Trusted by SOC Analysts at Healthcare, Finance & Tech Companies
                </motion.p>

                {/* Testimonial */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="max-w-2xl mx-auto bg-card border border-border/50 p-8 rounded-xl relative mb-12"
                >
                    <Quote className="absolute top-4 left-4 w-8 h-8 text-primary/20" />
                    <p className="italic text-xl text-foreground/90 mb-6 text-center">
                        &ldquo;Cut our morning triage from 3 hours to 8 minutes.&rdquo;
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-primary font-bold text-lg">
                            SC
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-bold text-foreground">Sarah Chen</p>
                            <p className="text-xs text-muted-foreground">SOC Analyst</p>
                        </div>
                    </div>
                </motion.div>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
                >
                    {stats.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={isInView ? { opacity: 1, scale: 1 } : {}}
                            transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                            className="text-center p-4 rounded-lg bg-background/50 border border-border/50"
                        >
                            <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                            <p className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                                {stat.value}
                            </p>
                            <p className="text-xs text-muted-foreground">{stat.label}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
