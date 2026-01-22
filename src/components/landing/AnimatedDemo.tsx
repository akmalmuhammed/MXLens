"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Mail, Shield, CheckCircle, AlertTriangle, FileText } from "lucide-react";

const stages = [
    { id: "drop", label: "Drop Email", icon: Mail },
    { id: "scan", label: "Scanning...", icon: Shield },
    { id: "verdict", label: "Verdict Ready", icon: CheckCircle },
];

export const AnimatedDemo = () => {
    const [stage, setStage] = useState(0);
    const [score, setScore] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setStage((prev) => {
                if (prev === 2) {
                    // Reset after showing verdict
                    setTimeout(() => setScore(0), 500);
                    return 0;
                }
                if (prev === 1) {
                    // Animate score counting up
                    setScore(87);
                }
                return prev + 1;
            });
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative w-full max-w-md mx-auto">
            {/* Demo container */}
            <motion.div
                className="relative bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-6 overflow-hidden"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
            >
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />

                {/* Stage indicator */}
                <div className="flex items-center justify-center gap-2 mb-6">
                    {stages.map((s, i) => (
                        <div
                            key={s.id}
                            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono transition-all ${i === stage
                                    ? "bg-primary text-primary-foreground"
                                    : i < stage
                                        ? "bg-accent/20 text-accent"
                                        : "bg-muted text-muted-foreground"
                                }`}
                        >
                            <s.icon className="w-3 h-3" />
                            {s.label}
                        </div>
                    ))}
                </div>

                {/* Main visual */}
                <div className="relative h-40 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        {stage === 0 && (
                            <motion.div
                                key="drop"
                                initial={{ y: -50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 50, opacity: 0 }}
                                className="flex flex-col items-center gap-3"
                            >
                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                    className="w-20 h-24 bg-card border-2 border-dashed border-primary/50 rounded-lg flex items-center justify-center"
                                >
                                    <FileText className="w-10 h-10 text-primary/50" />
                                </motion.div>
                                <p className="text-sm text-muted-foreground font-mono">
                                    suspicious_invoice.eml
                                </p>
                            </motion.div>
                        )}

                        {stage === 1 && (
                            <motion.div
                                key="scan"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 1.2, opacity: 0 }}
                                className="flex flex-col items-center gap-4"
                            >
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                    className="w-20 h-20 rounded-full border-4 border-primary border-t-transparent"
                                />
                                <div className="flex gap-2">
                                    {["SPF", "DKIM", "DMARC", "URLs", "Headers"].map((mod, i) => (
                                        <motion.span
                                            key={mod}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: i * 0.2 }}
                                            className="text-xs font-mono text-primary/70 bg-primary/10 px-2 py-0.5 rounded"
                                        >
                                            {mod}
                                        </motion.span>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {stage === 2 && (
                            <motion.div
                                key="verdict"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                className="flex flex-col items-center gap-3"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200 }}
                                    className="relative"
                                >
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-glow">
                                        <span className="text-3xl font-bold text-white">{score}</span>
                                    </div>
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-accent text-accent-foreground text-xs font-bold rounded-full"
                                    >
                                        SAFE
                                    </motion.div>
                                </motion.div>
                                <p className="text-sm text-muted-foreground">
                                    Analysis complete in <span className="text-accent font-bold">2.3s</span>
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Bottom indicator */}
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-3 h-3 text-accent" />
                    <span>100% local • Zero cloud upload</span>
                </div>
            </motion.div>
        </div>
    );
};
