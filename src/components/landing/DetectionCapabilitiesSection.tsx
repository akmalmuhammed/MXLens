"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import {
    ShieldCheck,
    FileWarning,
    QrCode,
    Bug,
    Globe,
    Cpu,
} from "lucide-react";

const capabilities = [
    {
        icon: ShieldCheck,
        title: "Email Authentication",
        items: [
            "SPF/DKIM/DMARC validation",
            "Display name spoofing detection",
            "Reply-To mismatches",
        ],
    },
    {
        icon: FileWarning,
        title: "Content Threats",
        items: [
            "Phishing/typosquatting detection",
            "BEC patterns recognition",
            "Credential harvesting forms",
        ],
    },
    {
        icon: QrCode,
        title: "QR Code Phishing",
        items: [
            "Image extraction & scanning",
            "URL decoding from QR",
            "Malicious site matching",
        ],
    },
    {
        icon: Bug,
        title: "Advanced Threats",
        items: [
            "Homograph/IDN attacks",
            "Suspicious attachments",
            "Header injection attempts",
        ],
    },
    {
        icon: Globe,
        title: "Sender Intelligence",
        items: [
            "IP reputation checks",
            "Domain age analysis",
            "Known malicious DBs",
        ],
    },
    {
        icon: Cpu,
        title: "Technical Analysis",
        items: [
            "Routing path inspection",
            "Timestamp anomalies",
            "MIME structure parsing",
        ],
    },
];

export const DetectionCapabilitiesSection = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section id="features" className="py-24 relative overflow-hidden" ref={ref}>
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
            <div className="absolute top-1/2 left-0 w-1/2 h-96 bg-primary/5 blur-3xl rounded-full" />

            <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                        What We Catch <span className="text-gradient">(11+ Modules)</span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                        Comprehensive detection powered by rule-based analysis.
                    </p>
                </motion.div>

                {/* Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                    {capabilities.map((cap, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 40 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.5, delay: i * 0.08 }}
                            className="group"
                        >
                            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl h-full p-6 hover:border-primary/60 transition-all duration-300">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                        <cap.icon className="w-5 h-5 text-primary" />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground">
                                        {cap.title}
                                    </h3>
                                </div>
                                <ul className="space-y-2">
                                    {cap.items.map((item, j) => (
                                        <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span className="text-accent">✓</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Accuracy note */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="max-w-3xl mx-auto bg-card border border-border rounded-xl p-6"
                >
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm font-mono text-muted-foreground mb-2">ACCURACY</p>
                            <p className="text-foreground">
                                <span className="text-2xl font-bold">84%</span> <span className="text-muted-foreground">(rule-based)</span>
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Target: 95%+ (ML, Q2 2026)
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-mono text-muted-foreground mb-2">WHAT MATTERS MORE</p>
                            <ul className="space-y-1 text-sm text-foreground">
                                <li>→ See <span className="text-primary font-semibold">WHY</span>, not just a score</li>
                                <li>→ Validate every decision</li>
                                <li>→ Learn from each analysis</li>
                            </ul>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
