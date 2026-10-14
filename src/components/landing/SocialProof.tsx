"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Quote } from "lucide-react";

export function SocialProof() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    return (
        <section className="py-10 border-y border-border/50 bg-muted/20" ref={ref}>
            <div className="container mx-auto px-4 text-center">
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    className="text-sm font-semibold text-muted-foreground mb-6 uppercase tracking-wider"
                >
                    Trusted by SOC Analysts at Healthcare, Finance & Tech Companies
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="max-w-2xl mx-auto bg-card border border-border/50 p-6 rounded-xl relative"
                >
                    <p className="italic text-lg text-foreground/90">
                        &ldquo;Cut our morning triage from 3 hours to 8 minutes.&rdquo;
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            SC
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-bold text-foreground">Sarah Chen</p>
                            <p className="text-xs text-muted-foreground">SOC Analyst</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
