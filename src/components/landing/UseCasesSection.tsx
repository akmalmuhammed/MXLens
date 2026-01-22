"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Clock, AlertTriangle, Lock, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const useCases = [
    {
        id: "triage",
        icon: Clock,
        title: "Morning Triage",
        scenario: "87 weekend email alerts waiting Monday morning",
        before: "87 × 10 min = 14.5 hours (2 workdays)",
        after: "Bulk upload = 4.5 minutes",
        savings: "14 hours (95% reduction)",
        cta: "Try Bulk Upload Free",
        href: "/analyze",
    },
    {
        id: "incident",
        icon: AlertTriangle,
        title: "Incident Response",
        scenario: "200+ user reports during phishing campaign",
        before: "One-by-one analysis = 33+ hours",
        after: "Pattern detection across all emails = 15 min",
        savings: "33 hours (98% reduction)",
        cta: "See Workflow",
        href: "/analyze",
    },
    {
        id: "confidential",
        icon: Lock,
        title: "Confidential Emails",
        scenario: "CEO email flagged. Contains M&A details. Can't upload to VirusTotal.",
        before: "Limited manual checks, higher risk",
        after: "Full analysis locally, zero compliance risk",
        savings: "GDPR violation avoided",
        cta: "Learn About Privacy",
        href: "#trust",
    },
    {
        id: "team",
        icon: Users,
        title: "Team Standardization",
        scenario: "5 analysts, 5 different methods, inconsistent results",
        before: "Mixed tools (VirusTotal, manual, MXToolbox)",
        after: "Unified approach, shared rules, consistent verdicts",
        savings: "100% Consistency",
        cta: "Explore Team Features",
        href: "/pricing",
    },
];

export const UseCasesSection = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    const [activeTab, setActiveTab] = useState(0);

    const activeCase = useCases[activeTab];

    return (
        <section id="use-cases" className="py-24 relative bg-muted/20" ref={ref}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                        Built for Real <span className="text-gradient">SOC Workflows</span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                        See how MXLens transforms everyday security tasks.
                    </p>
                </motion.div>

                {/* Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="flex flex-wrap justify-center gap-2 mb-8"
                >
                    {useCases.map((useCase, i) => (
                        <button
                            key={useCase.id}
                            onClick={() => setActiveTab(i)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${activeTab === i
                                    ? "bg-primary text-primary-foreground shadow-glow"
                                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                                }`}
                        >
                            <useCase.icon className="w-4 h-4" />
                            {useCase.title}
                        </button>
                    ))}
                </motion.div>

                {/* Active Tab Content */}
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="max-w-4xl mx-auto"
                >
                    <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <activeCase.icon className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-foreground">{activeCase.title}</h3>
                                <p className="text-sm text-muted-foreground">{activeCase.scenario}</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            {/* Before */}
                            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-5">
                                <p className="text-xs font-mono text-destructive uppercase mb-2">Before MXLens</p>
                                <p className="text-foreground font-medium">{activeCase.before}</p>
                            </div>

                            {/* After */}
                            <div className="bg-accent/10 border border-accent/30 rounded-xl p-5">
                                <p className="text-xs font-mono text-accent uppercase mb-2">With MXLens</p>
                                <p className="text-foreground font-medium">{activeCase.after}</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Time Saved:</span>
                                <span className="text-lg font-bold text-accent">{activeCase.savings}</span>
                            </div>
                            <Button asChild>
                                <Link href={activeCase.href}>
                                    {activeCase.cta}
                                    <ArrowRight className="ml-2 w-4 h-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
