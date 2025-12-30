"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Check, X, AlertTriangle } from "lucide-react";

const comparisonData = [
    {
        feature: "Privacy",
        mxtoolbox: { value: "Risk (Public Logs)", status: "bad" },
        virustotal: { value: "Risk (Public Upload)", status: "bad" },
        mxlens: { value: "100% Private (Local)", status: "good" },
    },
    {
        feature: "Analysis Depth",
        mxtoolbox: { value: "Basic DNS", status: "neutral" },
        virustotal: { value: "File Reputation", status: "neutral" },
        mxlens: { value: "Full Email Forensics", status: "good" },
    },
    {
        feature: "Body Parsing",
        mxtoolbox: { value: "No", status: "bad" },
        virustotal: { value: "No", status: "bad" },
        mxlens: { value: "Yes", status: "good" },
    },
    {
        feature: "Speed",
        mxtoolbox: { value: "Fast", status: "neutral" },
        virustotal: { value: "Medium", status: "neutral" },
        mxlens: { value: "Instant (<3s)", status: "good" },
    },
];

const StatusIcon = ({ status }: { status: string }) => {
    if (status === "good") {
        return <Check className="w-4 h-4 text-accent" />;
    }
    if (status === "bad") {
        return <X className="w-4 h-4 text-destructive" />;
    }
    return <AlertTriangle className="w-4 h-4 text-warning" />;
};

export const ComparisonSection = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section id="trust" className="py-24 relative" ref={ref}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                        Why Security Teams Choose{" "}
                        <span className="text-gradient">MXLens</span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                        Stop compromising between speed and privacy.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="max-w-4xl mx-auto"
                >
                    <div className="glass-card bg-background/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden shadow-lg">
                        {/* Header */}
                        <div className="grid grid-cols-4 gap-4 p-6 border-b border-border/50 bg-muted/30">
                            <div className="font-semibold text-muted-foreground"></div>
                            <div className="text-center font-semibold text-muted-foreground">
                                MXToolbox
                            </div>
                            <div className="text-center font-semibold text-muted-foreground">
                                VirusTotal
                            </div>
                            <div className="text-center">
                                <span className="font-bold text-primary">MXLens</span>
                            </div>
                        </div>

                        {/* Rows */}
                        {comparisonData.map((row, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={isInView ? { opacity: 1, x: 0 } : {}}
                                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                                className={`grid grid-cols-4 gap-4 p-6 ${i !== comparisonData.length - 1
                                    ? "border-b border-border/30"
                                    : ""
                                    }`}
                            >
                                <div className="font-medium text-foreground">{row.feature}</div>
                                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                    <StatusIcon status={row.mxtoolbox.status} />
                                    <span className="hidden sm:inline">{row.mxtoolbox.value}</span>
                                </div>
                                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                    <StatusIcon status={row.virustotal.status} />
                                    <span className="hidden sm:inline">{row.virustotal.value}</span>
                                </div>
                                <div
                                    className={`flex items-center justify-center gap-2 text-sm font-medium ${row.mxlens.status === "good"
                                        ? "text-accent"
                                        : "text-muted-foreground"
                                        }`}
                                >
                                    <StatusIcon status={row.mxlens.status} />
                                    <span className="hidden sm:inline">{row.mxlens.value}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
