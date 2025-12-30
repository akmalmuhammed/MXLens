"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const plans = [
    {
        name: "Starter",
        price: "$0",
        period: "/month",
        description: "For individuals exploring suspicious emails.",
        features: [
            { text: "3 public analyses per day", included: true },
            { text: "Basic threat detection", included: true },
            { text: "SPF/DKIM/DMARC checks", included: true },
            { text: "API Access", included: false },
            { text: "Private Analysis", included: false },
        ],
        highlight: false,
        buttonVariant: "outline" as const,
        cta: "Start Free",
        href: "/auth/signup",
    },
    {
        name: "Pro",
        price: "$29",
        period: "/month",
        description: "For security analysts demanding privacy.",
        features: [
            { text: "Unlimited private analyses", included: true },
            { text: "Advanced heuristics engine", included: true },
            { text: "Zero Data Retention Guarantee", included: true },
            { text: "API Access (100 req/min)", included: true },
            { text: "Priority Support", included: true },
        ],
        highlight: true,
        buttonVariant: "default" as const,
        cta: "Get Pro",
        href: "/auth/signup?plan=pro",
    },
    {
        name: "Enterprise",
        price: "Custom",
        period: "",
        description: "For SOC teams requiring full control.",
        features: [
            { text: "Everything in Pro", included: true },
            { text: "On-Premise / Self-Hosted", included: true },
            { text: "SSO & SAML Integration", included: true },
            { text: "Custom Retention Policies", included: true },
            { text: "Dedicated Success Manager", included: true },
        ],
        highlight: false,
        buttonVariant: "outline" as const,
        cta: "Contact Sales",
        href: "mailto:sales@mxlens.com",
    },
];

export const PricingSection = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section id="pricing" className="py-24 relative" ref={ref}>
            <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/10 to-background" />

            <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                        Simple, Transparent <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Pricing</span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                        Start for free, upgrade for privacy and power.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 40 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6, delay: i * 0.15 }}
                            className="relative group"
                        >
                            {/* Glow Effect for Highlighted Plan */}
                            {plan.highlight && (
                                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl blur-xl opacity-70 group-hover:opacity-100 transition-opacity" />
                            )}

                            <div className={`h-full flex flex-col p-8 rounded-2xl border backdrop-blur-sm transition-all duration-300 ${plan.highlight
                                    ? "bg-background/80 border-primary/50 shadow-glow"
                                    : "bg-background/50 border-border/50 hover:border-primary/30"
                                }`}>
                                <div className="mb-8">
                                    <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1 mb-4">
                                        <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                                        <span className="text-muted-foreground">{plan.period}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                                </div>

                                <div className="flex-grow space-y-4 mb-8">
                                    {plan.features.map((feature, j) => (
                                        <div key={j} className="flex items-start gap-3 text-sm">
                                            {feature.included ? (
                                                <Check className="w-5 h-5 text-primary flex-shrink-0" />
                                            ) : (
                                                <X className="w-5 h-5 text-muted-foreground/30 flex-shrink-0" />
                                            )}
                                            <span className={feature.included ? "text-foreground" : "text-muted-foreground/50"}>
                                                {feature.text}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    variant={plan.highlight ? "default" : "outline"}
                                    className={`w-full ${plan.highlight ? "shadow-glow" : ""}`}
                                    asChild
                                >
                                    <Link href={plan.href}>
                                        {plan.cta}
                                    </Link>
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
