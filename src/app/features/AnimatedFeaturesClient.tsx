"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ShieldCheck, FileWarning, ScanEye, Lock, Zap, Hexagon, Terminal, Search } from "lucide-react";
import { useRef, useState, useEffect } from "react";

export function AnimatedFeaturesClient() {
    const { scrollYProgress } = useScroll();
    const scale = useTransform(scrollYProgress, [0, 1], [0.8, 1]); // Subtle parallax for background

    return (
        <div className="flex-1 relative overflow-hidden">
            {/* Ambient Background - Cyberpunk grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />

            {/* Feature 1: Local-First Privacy */}
            <Section>
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        viewport={{ once: true }}
                    >
                        <FeatureIcon icon={ShieldCheck} color="emerald" />
                        <h2 className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500">
                            Local-First Security Core
                        </h2>
                        <p className="text-muted-foreground text-xl leading-relaxed mb-8">
                            Traditional sandboxes leak data. MXLens is different. Our analysis engine runs <span className="text-emerald-400 font-semibold">100% in your browser</span> using WebAssembly.
                        </p>
                        <ul className="space-y-4">
                            <MotionListItem delay={0.1} text="Air-Gap Safe (No Uploads)" />
                            <MotionListItem delay={0.2} text="Zero Data Exfiltration" />
                            <MotionListItem delay={0.3} text="Instant Results (0ms Latency)" />
                            <MotionListItem delay={0.4} text="GDPR/CCPA Compliant" />
                        </ul>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
                        whileInView={{ opacity: 1, scale: 1, rotateX: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl blur opacity-20 animate-pulse" />
                        <div className="relative bg-slate-950/90 backdrop-blur-xl rounded-xl border border-slate-800/50 p-8 shadow-2xl overflow-hidden min-h-[400px] flex flex-col items-center justify-center group">
                            {/* Scanning Animation */}
                            <motion.div
                                className="absolute top-0 left-0 right-0 h-1 bg-emerald-500/50 blur-[2px] z-10"
                                animate={{ top: ["0%", "100%", "0%"] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            />

                            <Lock className="h-20 w-20 text-slate-700 mb-6 group-hover:text-emerald-500 transition-colors duration-500" />

                            <div className="font-mono text-sm space-y-2 text-center relative z-20">
                                <div className="inline-block px-3 py-1 bg-emerald-950/50 border border-emerald-500/30 rounded text-emerald-400 mb-2">
                                    boundary: "client_side_only"
                                </div>
                                <div className="text-slate-500 flex flex-col gap-1">
                                    <span>memory_isolation: <span className="text-emerald-500">active</span></span>
                                    <span>network_egress: <span className="text-red-500">blocked</span></span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </Section>

            {/* Feature 2: Attachment Forensics */}
            <Section className="bg-slate-950/30 border-y border-white/5">
                <div className="grid lg:grid-cols-2 gap-16 items-center lg:flex-row-reverse">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="order-2 lg:order-1 relative"
                    >
                        {/* Interactive Hex Viewer */}
                        <div className="bg-black/80 rounded-xl border border-slate-800 p-6 font-mono text-xs md:text-sm shadow-2xl relative overflow-hidden">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <FileWarning className="w-4 h-4" />
                                    <span>invoice_sept.pdf.exe</span>
                                </div>
                                <div className="flex gap-2">
                                    <span className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                                    <span className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                                    <span className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                                </div>
                            </div>

                            <div className="grid grid-cols-[auto_1fr] gap-6">
                                <div className="text-slate-600 hidden md:block">
                                    00000000<br />00000010<br />00000020<br />00000030
                                </div>
                                <div className="space-y-1">
                                    <motion.div
                                        className="flex gap-2"
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        transition={{ staggerChildren: 0.05 }}
                                    >
                                        <span className="text-yellow-400 font-bold bg-yellow-400/10 px-1 rounded">4D 5A</span>
                                        <span className="text-slate-400">90 00 03 00</span>
                                        <span className="text-slate-400">00 00 04 00</span>
                                    </motion.div>
                                    <div className="text-slate-500">FF FF 00 00 B8 00 00 00</div>
                                    <div className="text-slate-500">00 00 00 00 40 00 00 00</div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 }}
                                        className="mt-6 p-3 bg-red-950/30 border border-red-500/30 rounded text-red-300 flex items-center gap-3"
                                    >
                                        <div className="animate-pulse w-2 h-2 bg-red-500 rounded-full" />
                                        ALERT: PE Header (EXE) detected in PDF file.
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="order-1 lg:order-2"
                    >
                        <FeatureIcon icon={Hexagon} color="purple" />
                        <h2 className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                            Deep Forensics
                        </h2>
                        <p className="text-muted-foreground text-xl leading-relaxed mb-8">
                            Extensions lie. We don't just look at names; we x-ray the file. From <span className="text-purple-400">Magic Bytes</span> to hidden Macros and embedded script heuristics.
                        </p>
                        <ul className="space-y-4">
                            <MotionListItem delay={0.1} text="Binary Signature Analysis" />
                            <MotionListItem delay={0.2} text="Macro Extraction (vbaProject.bin)" />
                            <MotionListItem delay={0.3} text="Script De-obfuscation" />
                            <MotionListItem delay={0.4} text="SHA-256 Hash Reputation" />
                        </ul>
                    </motion.div>
                </div>
            </Section>

            {/* Feature 3: Quishing & ARC */}
            <Section>
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <FeatureIcon icon={ScanEye} color="blue" />
                        <h2 className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
                            Intelligent Detection
                        </h2>
                        <p className="text-muted-foreground text-xl leading-relaxed mb-8">
                            Attackers are evolving. We detect hidden threats like "Quishing" (QR Phishing) and validitate complex ARC headers to prevent false positives.
                        </p>
                        <ul className="space-y-4">
                            <MotionListItem delay={0.1} text="QR Code URL Extraction" />
                            <MotionListItem delay={0.2} text="ARC Authentication Chains" />
                            <MotionListItem delay={0.3} text="Return-Path Alignment" />
                            <MotionListItem delay={0.4} text="Visual Hop Tracing" />
                        </ul>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, rotate: -5 }}
                        whileInView={{ opacity: 1, rotate: 0 }}
                        transition={{
                            type: "spring",
                            stiffness: 100,
                            damping: 20
                        }}
                        viewport={{ once: true }}
                        className="relative bg-slate-950 border border-slate-800 p-8 rounded-3xl shadow-2xl overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-[50px] pointer-events-none" />

                        {/* Abstract Visualization of ARC */}
                        <div className="flex flex-col gap-4 relative z-10">
                            {[1, 2, 3].map((hop, i) => (
                                <motion.div
                                    key={hop}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.2 }}
                                    className="flex items-center gap-4 p-3 rounded-lg border border-slate-800/50 bg-slate-900/50 backdrop-blur-sm"
                                >
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${i === 2 ? 'bg-green-500 text-black' : 'bg-slate-800 text-slate-400'}`}>
                                        {i === 2 ? '✓' : i + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="h-2 w-24 bg-slate-700/50 rounded mb-1.5" />
                                        <div className="h-1.5 w-16 bg-slate-800 rounded" />
                                    </div>
                                    <div className="text-xs font-mono text-slate-500">
                                        {i === 0 ? 'FAIL' : i === 1 ? 'NONE' : 'PASS'}
                                    </div>
                                </motion.div>
                            ))}

                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.8 }}
                                className="mt-4 p-4 bg-blue-900/10 border border-blue-500/20 rounded-xl text-center"
                            >
                                <p className="text-blue-400 text-sm font-medium">ARC Chain Validated</p>
                                <p className="text-slate-500 text-xs mt-1">Trust inherited from previous hop.</p>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </Section>
        </div>
    );
}

function Section({ children, className = "" }: { children: React.ReactNode, className?: string }) {
    return (
        <section className={`py-32 px-4 relative ${className}`}>
            <div className="container mx-auto">
                {children}
            </div>
        </section>
    );
}

function FeatureIcon({ icon: Icon, color }: { icon: any, color: "emerald" | "purple" | "blue" }) {
    const colorClasses = {
        emerald: "bg-emerald-900/20 text-emerald-400 border-emerald-500/20",
        purple: "bg-purple-900/20 text-purple-400 border-purple-500/20",
        blue: "bg-blue-900/20 text-blue-400 border-blue-500/20"
    };

    return (
        <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-8 border ${colorClasses[color]} shadow-lg`}
        >
            <Icon className="h-8 w-8" />
        </motion.div>
    );
}

function MotionListItem({ text, delay }: { text: string, delay: number }) {
    return (
        <motion.li
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay }}
            className="flex items-center gap-3 text-lg"
        >
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <span className="text-slate-300 font-light">{text}</span>
        </motion.li>
    )
}
