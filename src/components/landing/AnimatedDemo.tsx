"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
    Mail,
    Shield,
    CheckCircle,
    FileText,
    ShieldCheck,
    Route,
    AlertTriangle,
    MapPin,
    Search,
    Eye,
    Link2,
    QrCode,
    Clock,
} from "lucide-react";

const features = [
    { icon: ShieldCheck, label: "Auth Checks", detail: "SPF/DKIM/DMARC", color: "text-accent" },
    { icon: Route, label: "Delivery Path", detail: "Hop Analysis", color: "text-primary" },
    { icon: AlertTriangle, label: "Threat Indicators", detail: "Phishing Patterns", color: "text-orange-400" },
    { icon: MapPin, label: "Sender Route Map", detail: "IP Geolocation", color: "text-purple-400" },
    { icon: Search, label: "Artifacts Analysis", detail: "Threat Intel", color: "text-blue-400" },
    { icon: Eye, label: "Safe Preview", detail: "Defanged Content", color: "text-green-400" },
    { icon: Link2, label: "URL Extraction", detail: "Malicious Links", color: "text-red-400" },
    { icon: QrCode, label: "QR Code Scan", detail: "Hidden URLs", color: "text-yellow-400" },
];

const stages = [
    { id: "drop", label: "Drop Email", icon: Mail, duration: 2500 },
    { id: "scan", label: "Analyzing...", icon: Shield, duration: 6000 },
    { id: "verdict", label: "Verdict Ready", icon: CheckCircle, duration: 3000 },
];

export const AnimatedDemo = () => {
    const [stage, setStage] = useState(0);
    const [score, setScore] = useState(0);
    const [activeFeatures, setActiveFeatures] = useState<number[]>([]);

    useEffect(() => {
        const advanceStage = () => {
            setStage((prev) => {
                const nextStage = (prev + 1) % 3;

                if (nextStage === 0) {
                    // Reset when going back to drop
                    setScore(0);
                    setActiveFeatures([]);
                }
                if (nextStage === 2) {
                    // Set score when entering verdict
                    setScore(87);
                }

                return nextStage;
            });
        };

        // Use current stage's duration
        const timeout = setTimeout(advanceStage, stages[stage].duration);
        return () => clearTimeout(timeout);
    }, [stage]);

    // Animate features appearing during scan stage
    useEffect(() => {
        if (stage === 1) {
            setActiveFeatures([]);
            features.forEach((_, i) => {
                setTimeout(() => {
                    setActiveFeatures(prev => [...prev, i]);
                }, i * 500); // Spaced out for readability
            });
        }
    }, [stage]);

    return (
        <div className="relative w-full max-w-lg mx-auto">
            {/* Subtle orbital circles behind */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
                    className="absolute w-[400px] h-[400px] rounded-full border border-primary/10"
                />
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                    className="absolute w-[350px] h-[350px] rounded-full border border-accent/10"
                />
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                    className="absolute w-[300px] h-[300px] rounded-full border border-primary/5"
                />
                {/* Orbiting dots */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                    className="absolute w-[380px] h-[380px]"
                >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary/30" />
                </motion.div>
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
                    className="absolute w-[320px] h-[320px]"
                >
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-accent/40" />
                </motion.div>
            </div>

            {/* Demo container */}
            <motion.div
                className="relative bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-6 overflow-hidden z-10"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
            >
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />

                {/* Stage indicator */}
                <div className="flex items-center justify-center gap-2 mb-6">
                    {stages.map((s, i) => (
                        <motion.div
                            key={s.id}
                            animate={i === stage ? { scale: [1, 1.05, 1] } : {}}
                            transition={{ repeat: i === stage ? Infinity : 0, duration: 1.5 }}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-mono transition-all ${i === stage
                                    ? "bg-primary text-primary-foreground shadow-glow"
                                    : i < stage
                                        ? "bg-accent/20 text-accent"
                                        : "bg-muted text-muted-foreground"
                                }`}
                        >
                            <s.icon className="w-3 h-3" />
                            {s.label}
                        </motion.div>
                    ))}
                </div>

                {/* Main visual */}
                <div className="relative min-h-[280px] flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        {stage === 0 && (
                            <motion.div
                                key="drop"
                                initial={{ y: -50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 50, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="flex flex-col items-center gap-4"
                            >
                                <motion.div
                                    animate={{ y: [0, -15, 0] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="relative"
                                >
                                    <div className="w-24 h-28 bg-card border-2 border-dashed border-primary/50 rounded-lg flex items-center justify-center">
                                        <FileText className="w-12 h-12 text-primary/50" />
                                    </div>
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className="absolute -inset-2 border-2 border-primary/30 rounded-xl"
                                    />
                                </motion.div>
                                <div className="text-center">
                                    <p className="text-sm font-mono text-foreground">suspicious_invoice.eml</p>
                                    <p className="text-xs text-muted-foreground mt-1">Drag & drop to analyze</p>
                                </div>
                            </motion.div>
                        )}

                        {stage === 1 && (
                            <motion.div
                                key="scan"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="flex flex-col items-center gap-4 w-full"
                            >
                                {/* Spinning scanner */}
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                                    className="relative w-20 h-20"
                                >
                                    <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary" />
                                    <Shield className="absolute inset-0 m-auto w-8 h-8 text-primary" />
                                </motion.div>

                                {/* Feature labels grid */}
                                <div className="grid grid-cols-2 gap-2 w-full mt-2">
                                    {features.map((feature, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                                            animate={activeFeatures.includes(i)
                                                ? { opacity: 1, x: 0 }
                                                : { opacity: 0.3, x: i % 2 === 0 ? -10 : 10 }
                                            }
                                            transition={{ duration: 0.3 }}
                                            className={`flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border/50 ${activeFeatures.includes(i) ? "border-primary/30" : ""
                                                }`}
                                        >
                                            <feature.icon className={`w-4 h-4 ${feature.color} flex-shrink-0`} />
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-foreground truncate">{feature.label}</p>
                                                <p className="text-[10px] text-muted-foreground truncate">{feature.detail}</p>
                                            </div>
                                            {activeFeatures.includes(i) && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="ml-auto"
                                                >
                                                    <CheckCircle className="w-3 h-3 text-accent" />
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>

                                <p className="text-xs text-muted-foreground font-mono mt-2">
                                    {activeFeatures.length}/{features.length} modules complete
                                </p>
                            </motion.div>
                        )}

                        {stage === 2 && (
                            <motion.div
                                key="verdict"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="flex flex-col items-center gap-4"
                            >
                                {/* Score circle */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200 }}
                                    className="relative"
                                >
                                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-glow">
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-4xl font-bold text-white"
                                        >
                                            {score}
                                        </motion.span>
                                    </div>
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 bg-accent text-accent-foreground text-sm font-bold rounded-full"
                                    >
                                        SAFE
                                    </motion.div>
                                </motion.div>

                                {/* Result stats */}
                                <div className="flex gap-4 mt-4">
                                    {[
                                        { label: "Auth", value: "3/3", icon: ShieldCheck },
                                        { label: "Threats", value: "0", icon: AlertTriangle },
                                        { label: "Time", value: "2.3s", icon: Clock },
                                    ].map((stat, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 + i * 0.1 }}
                                            className="text-center"
                                        >
                                            <stat.icon className="w-4 h-4 text-accent mx-auto mb-1" />
                                            <p className="text-lg font-bold text-foreground">{stat.value}</p>
                                            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                                        </motion.div>
                                    ))}
                                </div>

                                <p className="text-sm text-muted-foreground mt-2">
                                    Analysis complete in <span className="text-accent font-bold">2.3s</span>
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Bottom indicator */}
                <motion.div
                    className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground border-t border-border/50 pt-4"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                >
                    <Shield className="w-3 h-3 text-accent" />
                    <span>Runs locally • No upload • Open source</span>
                </motion.div>
            </motion.div>
        </div>
    );
};
