"use client";

import { motion } from "framer-motion";
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
    // Parallax and Scroll hooks removed for static performance

    return (
        <div className="relative overflow-hidden">
            {/* Cyberpunk Grid Background - Fixed */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-black" />
                <div
                    className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"
                />
                <div className="absolute top-0 left-0 right-0 h-[800px] bg-gradient-to-b from-cyan-900/10 via-purple-900/5 to-transparent blur-3xl opacity-50" />
            </div>

            <div className="relative z-10 font-sans">
                {/* 
                  Sections are now rendered statically without scroll-reveal animations.
                */}

                <SectionWrapper>
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

                <SectionWrapper>
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
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            Ready to investigate your inbox?
                        </h2>
                        <p className="text-xl text-slate-400 max-w-lg mx-auto">
                            Join hundreds of SOC analysts using MXLens for instant, private intelligence.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                            <Link href="/analyze">
                                <Button size="lg" className="h-14 px-8 text-lg font-semibold bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all rounded-full group">
                                    <Search className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                                    Start Analysis
                                </Button>
                            </Link>
                            <Link href="/features">
                                <Button variant="outline" size="lg" className="h-14 px-8 text-lg border-slate-700 hover:bg-slate-800 rounded-full group">
                                    Explore Features <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                        </div>

                        <p className="text-sm text-slate-600">
                            No credit card required • Guest access enabled • Zero Login
                        </p>
                    </div>
                </SectionWrapper>
            </div>
        </div>
    );
}

function SectionWrapper({ children, className = "" }: { children: React.ReactNode, className?: string, delay?: number }) {
    // Removed framer-motion wrappings for simple static render
    return (
        <div className={className}>
            {children}
        </div>
    )
}
