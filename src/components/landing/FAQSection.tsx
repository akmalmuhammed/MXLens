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
            "No. The web analyzer parses and scores the email in your browser, and the message body and attachments are never uploaded. For enrichment, sender IPs, domains and attachment hashes are sent to our server and on to threat-intel providers; if you are signed in, the verdict and score are saved. The REST API and MCP endpoint analyze email on the server.",
    },
    {
        question: "Is it free to use?",
        answer:
            "Yes! Early beta users get premium features free until March 2026. After that, we'll have a generous free tier and affordable pro plans for power users and teams.",
    },
    {
        question: "What types of files can I upload?",
        answer:
            "MXLens supports .eml email files, the standard format exported from most email clients. You can also paste raw email content directly for quick analysis.",
    },
    {
        question: "Why is client-side analysis better?",
        answer:
            "Cloud-based tools require you to upload sensitive emails to third-party servers, creating risks of data breaches, insider threats, and legal subpoenas. Client-side analysis eliminates these risks entirely—your data physically cannot be accessed by anyone else.",
    },
    {
        question: "How accurate is the threat detection?",
        answer:
            "MXLens combines multiple detection methods including SPF/DKIM/DMARC validation, homoglyph detection, header anomaly analysis, and content heuristics. Our engine catches sophisticated attacks like BEC and supply chain fraud that legacy tools often miss.",
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
