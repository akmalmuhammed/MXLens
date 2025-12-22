"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Hero } from "@/components/landing/Hero";
import { Architecture } from "@/components/landing/Architecture";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { UseCases } from "@/components/landing/UseCases";
import { Comparison } from "@/components/landing/Comparison";
import { FAQ } from "@/components/landing/FAQ";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search, ArrowRight } from "lucide-react";

export function AnimatedLandingClient() {
    const { scrollYProgress } = useScroll();

    // Parallax background effect
    const gridY = useTransform(scrollYProgress, [0, 1], [0, -50]);

    return (
        <div className="relative overflow-hidden">
            {/* Cyberpunk Grid Background - Fixed */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-black" />
                <motion.div
                    style={{ y: gridY }}
                    className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"
                />
                <div className="absolute top-0 left-0 right-0 h-[800px] bg-gradient-to-b from-cyan-900/10 via-purple-900/5 to-transparent blur-3xl opacity-50" />
            </div>

            <div className="relative z-10 font-sans">
                {/* 
                  We wrap each section in a scroll-reveal container. 
                  Since the original components are static, we animate their containers.
                */}

                <SectionWrapper delay={0}>
                    <div className="bg-cyan-950/30 text-cyan-400 text-xs font-bold py-2 text-center border-b border-cyan-500/20 backdrop-blur-sm relative overflow-hidden">
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        />
                        Limited Time: Premium free until March 2026 for early beta users
                    </div>
                    <Hero />
                </SectionWrapper>

                <SectionWrapper delay={0.2}>
                    <Architecture />
                </SectionWrapper>

                <SectionWrapper>
                    <HowItWorks />
                </SectionWrapper>

                <SectionWrapper>
                    <Features />
                </SectionWrapper>

                <SectionWrapper>
                    <UseCases />
                </SectionWrapper>

                <SectionWrapper>
                    <Comparison />
                </SectionWrapper>

                <SectionWrapper>
                    <FAQ />
                </SectionWrapper>

                <SectionWrapper className="py-24 text-center border-t border-white/5 bg-gradient-to-b from-black to-slate-950">
                    <div className="container mx-auto px-4 max-w-2xl space-y-8">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400"
                        >
                            Ready to secure your inbox?
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-xl text-slate-400 max-w-lg mx-auto"
                        >
                            Join hundreds of SOC analysts using MXLens for instant, private forensics.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
                        >
                            <Link href="/analyze">
                                <Button size="lg" className="h-14 px-8 text-lg font-semibold bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all rounded-full group">
                                    <Search className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                                    Start Analyzing Safe
                                </Button>
                            </Link>
                            <Link href="/features">
                                <Button variant="outline" size="lg" className="h-14 px-8 text-lg border-slate-700 hover:bg-slate-800 rounded-full group">
                                    Explore Features <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                        </motion.div>

                        <p className="text-sm text-slate-600">
                            No credit card required • Guest access enabled • Zero Login
                        </p>
                    </div>
                </SectionWrapper>
            </div>
        </div>
    );
}

function SectionWrapper({ children, className = "", delay = 0.1 }: { children: React.ReactNode, className?: string, delay?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, delay, ease: "easeOut" }}
            className={className}
        >
            {children}
        </motion.div>
    )
}
