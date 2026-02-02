"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Check, X, Star, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const plans = [
    {
        name: "Free",
        price: "$0",
        period: "forever",
        description: "For: Trying MXLens",
        features: [
            { text: "3 analyses/day (no signup)", included: true },
            { text: "All 85+ detection rules", included: true },
            { text: "View results only", included: true },
            { text: "Bulk upload", included: false },
            { text: "PDF/JSON export", included: false },
            { text: "API access", included: false },
        ],
        highlight: false,
        cta: "Start Free",
        href: "/analyze",
    },
    {
        name: "Pro",
        price: "$29",
        period: "/month",
        yearlyPrice: "$290/year (save $58)",
        description: "For: Professional analysts",
        badge: "Most Popular",
        features: [
            { text: "Unlimited analyses", included: true },
            { text: "100% private (zero logs)", included: true },
            { text: "BULK: 50 emails", included: true },
            { text: "PDF/JSON export", included: true },
            { text: "API access (100 req/min)", included: true },
            { text: "Priority support (24hr)", included: true },
        ],
        highlight: true,
        cta: "Start 7-Day Free Trial",
        href: "/auth/signup?plan=pro",
    },
    {
        name: "Team",
        price: "$99",
        period: "/month",
        description: "For: SOC teams (5-10 users)",
        features: [
            { text: "All Pro features per user", included: true },
            { text: "Team collaboration", included: true },
            { text: "Shared detection rules", included: true },
            { text: "Admin controls", included: true },
            { text: "Priority support (4hr)", included: true },
            { text: "Usage analytics", included: true },
        ],
        highlight: false,
        cta: "Start Team Trial",
        href: "/auth/signup?plan=team",
    },
    {
        name: "Enterprise",
        price: "Custom",
        period: "pricing",
        description: "For: 50+ seats",
        features: [
            { text: "SSO (Okta, Azure AD)", included: true },
            { text: "SIEM integrations", included: true },
            { text: "On-premise option", included: true },
            { text: "Unlimited bulk", included: true },
            { text: "99.9% SLA", included: true },
            { text: "Dedicated success manager", included: true },
        ],
        highlight: false,
        cta: "Contact Sales",
        href: "mailto:sales@mxlens.com",
    },
];

export const PricingSection = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    // ROI Calculator state
    const [alerts, setAlerts] = useState(100);
    const [minutes, setMinutes] = useState(10);
    const [rate, setRate] = useState(50);

    // Calculations
    const workdaysPerWeek = 5;
    const minutesPerEmailWithMXLens = 0.5; // 30 seconds

    const weeklyMinutesBefore = alerts * minutes * workdaysPerWeek;
    const weeklyHoursBefore = weeklyMinutesBefore / 60;
    const weeklyCostBefore = weeklyHoursBefore * rate;

    const weeklyMinutesAfter = alerts * minutesPerEmailWithMXLens * workdaysPerWeek;
    const weeklyHoursAfter = weeklyMinutesAfter / 60;
    const weeklyCostAfter = weeklyHoursAfter * rate;

    const weeklySavings = weeklyCostBefore - weeklyCostAfter;
    const yearlySavings = weeklySavings * 52;
    const mxlensCost = 29 * 12; // $348/year
    const netSavings = yearlySavings - mxlensCost;
    const roi = netSavings > 0 ? Math.round((netSavings / mxlensCost) * 100) : 0;
    const paybackDays = yearlySavings > 0 ? Math.max(1, Math.round((mxlensCost / yearlySavings) * 365)) : 0;

    return (
        <section id="pricing" className="py-24 relative" ref={ref}>
            {/* Background removed for unified page flow */}

            <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.3 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                        Simple Pricing. <span className="text-gradient">Start Free.</span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                        No hidden fees. Upgrade when you need more.
                    </p>
                </motion.div>

                {/* Pricing Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-16">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 40 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.3, delay: i * 0.05 }}
                            className="relative group"
                        >
                            {/* Highlight glow */}
                            {plan.highlight && (
                                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl blur-xl opacity-70 group-hover:opacity-100 transition-opacity" />
                            )}

                            {/* Badge */}
                            {plan.badge && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center gap-1 z-10">
                                    <Star className="w-3 h-3" />
                                    {plan.badge}
                                </div>
                            )}

                            <div className={`h-full flex flex-col p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 ${plan.highlight
                                ? "bg-background/80 border-primary/50 shadow-glow"
                                : "bg-background/50 border-border/80 hover:border-primary/30"
                                }`}>
                                <div className="mb-6">
                                    <h3 className="text-lg font-bold text-foreground mb-2">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1 mb-1">
                                        <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                                        <span className="text-muted-foreground text-sm">{plan.period}</span>
                                    </div>
                                    {plan.yearlyPrice && (
                                        <p className="text-xs text-accent">{plan.yearlyPrice}</p>
                                    )}
                                    <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                                </div>

                                <div className="flex-grow space-y-3 mb-6">
                                    {plan.features.map((feature, j) => (
                                        <div key={j} className="flex items-start gap-2 text-sm">
                                            {feature.included ? (
                                                <Check className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                                            ) : (
                                                <X className="w-4 h-4 text-muted-foreground/30 flex-shrink-0 mt-0.5" />
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
                                    <Link href={plan.href}>{plan.cta}</Link>
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* ROI Calculator */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="max-w-4xl mx-auto"
                >
                    <div className="bg-card border border-border rounded-2xl p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Calculator className="w-6 h-6 text-primary" />
                            <h3 className="text-xl font-bold text-foreground">ROI Calculator</h3>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6 mb-8">
                            <div>
                                <label className="text-sm text-muted-foreground mb-2 block">Email alerts per day</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={alerts}
                                    onChange={(e) => setAlerts(Math.max(1, Number(e.target.value)))}
                                    className="w-full px-4 py-2 rounded-lg bg-background border border-border text-foreground focus:border-primary focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground mb-2 block">Minutes per email (now)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={minutes}
                                    onChange={(e) => setMinutes(Math.max(1, Number(e.target.value)))}
                                    className="w-full px-4 py-2 rounded-lg bg-background border border-border text-foreground focus:border-primary focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground mb-2 block">Hourly rate ($)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={rate}
                                    onChange={(e) => setRate(Math.max(1, Number(e.target.value)))}
                                    className="w-full px-4 py-2 rounded-lg bg-background border border-border text-foreground focus:border-primary focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="bg-muted/30 rounded-xl p-6">
                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Currently spending</p>
                                    <p className="text-lg font-bold text-foreground">
                                        {weeklyHoursBefore.toFixed(1)} hrs/week <span className="text-muted-foreground font-normal">(${weeklyCostBefore.toLocaleString()}/week)</span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">With MXLens</p>
                                    <p className="text-lg font-bold text-accent">
                                        {weeklyHoursAfter.toFixed(1)} hrs/week <span className="text-muted-foreground font-normal">(${weeklyCostAfter.toLocaleString()}/week)</span>
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-border">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Annual Savings</p>
                                        <p className="text-2xl font-bold text-accent">${Math.round(yearlySavings).toLocaleString()}/year</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            MXLens Pro: ${mxlensCost}/year • <span className="text-primary font-bold">ROI: {roi.toLocaleString()}%</span>
                                            {paybackDays > 0 && <span> • Pays for itself in {paybackDays} {paybackDays === 1 ? 'day' : 'days'}</span>}
                                        </p>
                                    </div>
                                    <Button asChild>
                                        <Link href="/auth/signup?plan=pro">Upgrade to Pro →</Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
