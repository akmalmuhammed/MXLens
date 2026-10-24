"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
    {
        question: "Is my email data stored on your servers?",
        answer:
            "No. Parsing and scoring run in your browser, and the email is never uploaded. MXLens has no accounts or database. External reputation lookups are off unless whoever runs the server turns them on, and even then only indicators (IPs, domains, file hashes) are sent, never the email.",
    },
    {
        question: "Is it really free?",
        answer:
            "Yes. MXLens is open source under the MIT License. Use the hosted demo, run it on your own machine, or self-host it for your team. There are no paid plans.",
    },
    {
        question: "What types of files can I upload?",
        answer:
            "MXLens supports .eml files, the standard format exported by most email clients. You can also paste raw email source directly, or analyze a folder of .eml files at once.",
    },
    {
        question: "Why is client-side analysis better?",
        answer:
            "Reported phishing often contains internal names, threads and attachments. Analyzing in the browser means none of that is uploaded anywhere, and you can check it yourself in the browser's Network tab or by reading the source.",
    },
    {
        question: "How accurate is the threat detection?",
        answer:
            "MXLens combines SPF/DKIM/DMARC/ARC checks, header anomaly analysis, lookalike and homoglyph domain detection, link and attachment analysis, and content heuristics. Every finding is shown with its reason so you can judge it yourself. It is a triage aid, not a replacement for an email security gateway; false positives and misses happen, and reports are welcome on GitHub.",
    },
];

export const FAQSection = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section className="py-24 relative" ref={ref}>
            {/* Background removed for unified page flow */}

            <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.3 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                        Frequently Asked <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Questions</span>
                    </h2>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="max-w-3xl mx-auto"
                >
                    <Accordion type="single" collapsible className="space-y-4">
                        {faqs.map((faq, i) => (
                            <AccordionItem
                                key={i}
                                value={`item-${i}`}
                                className="glass-card bg-background/50 backdrop-blur-sm px-6 border border-border rounded-lg data-[state=open]:border-primary/50"
                            >
                                <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary transition-colors py-6">
                                    {faq.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-muted-foreground pb-6">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </motion.div>
            </div>
        </section>
    );
};
