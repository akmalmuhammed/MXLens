"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, ShieldCheck } from "lucide-react";

export function AnimatedUpgradeClient() {
    return (
        <div className="relative overflow-hidden min-h-screen flex flex-col items-center justify-center">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-black" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-900/10 rounded-full blur-[120px] opacity-40" />
            </div>

            <div className="relative z-10 container mx-auto px-4 py-12 max-w-5xl text-center">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-5xl font-extrabold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
                        Upgrade Your Arsenal
                    </h1>
                    <p className="text-slate-400 text-xl mb-16 max-w-2xl mx-auto leading-relaxed">
                        Uncap your limits and unlock enterprise-grade forensic tools. <br />
                        Defense is a right, not a luxury.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
                    {/* Free Tier */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm flex flex-col"
                    >
                        <h3 className="text-xl font-bold mb-2 text-slate-300">Community</h3>
                        <div className="text-4xl font-extrabold mb-6 text-white">$0</div>
                        <ul className="mb-8 space-y-4 text-left flex-1">
                            <ListItem text="10 Scans per Day" />
                            <ListItem text="Basic Header Analysis" />
                            <ListItem text="Community Support" />
                            <ListItem text="Local-Only Privacy" />
                        </ul>
                        <Button variant="outline" className="w-full h-12 text-lg border-white/10 hover:bg-white/5" disabled>
                            Current Plan
                        </Button>
                    </motion.div>

                    {/* Pro Tier */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        whileHover={{ scale: 1.02 }}
                        className="p-8 rounded-3xl border-2 border-cyan-500/50 bg-cyan-950/20 backdrop-blur-md relative overflow-hidden flex flex-col group shadow-[0_0_40px_-10px_rgba(6,182,212,0.3)]"
                    >
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50" />
                        <div className="absolute top-0 right-0 bg-cyan-500 text-black text-xs font-bold px-4 py-1.5 rounded-bl-xl shadow-lg">
                            RECOMMENDED
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold text-cyan-400">Pro Analyst</h3>
                            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                        </div>

                        <div className="text-4xl font-extrabold mb-1 text-white flex items-baseline gap-1">
                            $29 <span className="text-lg font-normal text-slate-400">/mo</span>
                        </div>
                        <p className="text-xs text-cyan-400/80 mb-6 font-mono border border-cyan-500/20 bg-cyan-500/10 inline-block px-2 py-1 rounded w-fit">
                            Billed annually ($348)
                        </p>

                        <ul className="mb-8 space-y-4 text-left flex-1">
                            <ListItem text="Unlimited Daily Scans" highlight />
                            <ListItem text="Deep Attachment Sandboxing" highlight />
                            <ListItem text="Priority API Access" highlight />
                            <ListItem text="Save Analysis History" highlight />
                        </ul>

                        <Button className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold h-12 text-lg shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all">
                            Upgrade Now
                        </Button>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-12 flex items-center justify-center gap-2 text-sm text-slate-500"
                >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Secure 256-bit encrypted payment via Stripe</span>
                </motion.div>
            </div>
        </div>
    );
}

function ListItem({ text, highlight }: { text: string, highlight?: boolean }) {
    return (
        <li className={`flex gap-3 text-sm items-center ${highlight ? 'text-white font-medium' : 'text-slate-400'}`}>
            <div className={`p-1 rounded-full ${highlight ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}>
                <Check className="w-3.5 h-3.5" />
            </div>
            {text}
        </li>
    )
}
