"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const CTASection = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section className="py-24 relative overflow-hidden" ref={ref}>
            {/* Background effects */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-background to-background" />
                <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent/15 rounded-full blur-3xl" />
            </div>

            <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7 }}
                    className="max-w-3xl mx-auto text-center"
                >
                    {/* Icon */}
                    <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 4 }}
                        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-8"
                    >
                        <Sparkles className="w-8 h-8 text-primary" />
                    </motion.div>

                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
                        Ready to investigate{" "}
                        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">your inbox?</span>
                    </h2>

                    <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
                        Join hundreds of SOC analysts using MXLens for instant, private
                        intelligence.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button className="group w-full sm:w-auto h-12 px-8 text-lg" size="lg" asChild>
                            <Link href="/analyze">
                                Start Analysis
                                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full sm:w-auto h-12 px-8 text-lg"
                            asChild
                        >
                            <Link href="/features">Explore Features</Link>
                        </Button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
