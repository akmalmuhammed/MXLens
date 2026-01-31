"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Check, X, AlertTriangle, Info } from "lucide-react";

const comparisonData = [
    {
        feature: "Privacy",
        mxlens: { value: "Local", status: "good", tooltip: "100% client-side" },
        sublime: { value: "Cloud", status: "bad" },
        abnormal: { value: "Cloud", status: "bad" },
        virustotal: { value: "Public", status: "bad" },
    },
    {
        feature: "Bulk",
        mxlens: { value: "50", status: "good" },
        sublime: { value: "No", status: "bad" },
        abnormal: { value: "No", status: "bad" },
        virustotal: { value: "No", status: "bad" },
    },
    {
        feature: "Speed",
        mxlens: { value: "3s", status: "good" },
        sublime: { value: "30s", status: "neutral" },
        abnormal: { value: "60s", status: "neutral" },
        virustotal: { value: "10s", status: "neutral" },
    },
    {
        feature: "Explainable",
        mxlens: { value: "Full", status: "good" },
        sublime: { value: "Limited", status: "neutral" },
        abnormal: { value: "No", status: "bad" },
        virustotal: { value: "No", status: "bad" },
    },
    {
        feature: "Offline",
        mxlens: { value: "Yes", status: "good" },
        sublime: { value: "No", status: "bad" },
        abnormal: { value: "No", status: "bad" },
        virustotal: { value: "No", status: "bad" },
    },
    {
        feature: "Price",
        mxlens: { value: "$29/mo", status: "good" },
        sublime: { value: "$10K+/yr", status: "neutral" },
        abnormal: { value: "$50K+/yr", status: "neutral" },
        virustotal: { value: "Free*", status: "neutral" },
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
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.3 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                        How MXLens <span className="text-gradient">Compares</span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                        We&apos;re architecturally different, not just cheaper.
                    </p>
                </motion.div>

                {/* Comparison Table */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="max-w-5xl mx-auto"
                >
                    <div className="glass-card bg-background/50 backdrop-blur-sm border border-border rounded-2xl overflow-hidden shadow-lg">
                        {/* Header */}
                        <div className="grid grid-cols-5 gap-2 p-4 sm:p-6 border-b border-border bg-muted/30">
                            <div className="font-semibold text-muted-foreground text-sm">Feature</div>
                            <div className="text-center">
                                <span className="font-bold text-primary text-sm sm:text-base">MXLens</span>
                            </div>
                            <div className="text-center font-semibold text-muted-foreground text-xs sm:text-sm">
                                Sublime
                            </div>
                            <div className="text-center font-semibold text-muted-foreground text-xs sm:text-sm">
                                Abnormal
                            </div>
                            <div className="text-center font-semibold text-muted-foreground text-xs sm:text-sm">
                                VirusTotal
                            </div>
                        </div>

                        {/* Rows */}
                        {comparisonData.map((row, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={isInView ? { opacity: 1, x: 0 } : {}}
                                transition={{ duration: 0.5, delay: 0.3 + i * 0.08 }}
                                className={`grid grid-cols-5 gap-2 p-4 sm:p-6 ${i !== comparisonData.length - 1 ? "border-b border-border/80" : ""
                                    }`}
                            >
                                <div className="font-medium text-foreground text-sm">{row.feature}</div>
                                <div className="flex items-center justify-center gap-1 text-sm font-medium text-accent">
                                    <StatusIcon status={row.mxlens.status} />
                                    <span className="hidden sm:inline">{row.mxlens.value}</span>
                                </div>
                                <div className="flex items-center justify-center gap-1 text-xs sm:text-sm text-muted-foreground">
                                    <StatusIcon status={row.sublime.status} />
                                    <span className="hidden sm:inline">{row.sublime.value}</span>
                                </div>
                                <div className="flex items-center justify-center gap-1 text-xs sm:text-sm text-muted-foreground">
                                    <StatusIcon status={row.abnormal.status} />
                                    <span className="hidden sm:inline">{row.abnormal.value}</span>
                                </div>
                                <div className="flex items-center justify-center gap-1 text-xs sm:text-sm text-muted-foreground">
                                    <StatusIcon status={row.virustotal.status} />
                                    <span className="hidden sm:inline">{row.virustotal.value}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Footnote */}
                    <p className="text-xs text-muted-foreground text-center mt-4">
                        * VirusTotal free tier is extremely limited
                    </p>
                </motion.div>

                {/* Callout */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className="max-w-3xl mx-auto mt-12"
                >
                    <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Info className="w-5 h-5 text-primary" />
                            <p className="text-lg font-bold text-foreground">The Difference</p>
                        </div>
                        <p className="text-muted-foreground">
                            Cloud tools <span className="italic">promise</span> privacy.
                            Client-side <span className="font-bold text-primary">guarantees</span> it.
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
