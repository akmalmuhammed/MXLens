"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/marketing/PageHeader";
import { Footer } from "@/components/landing/Footer";
import Link from "next/link";
import { FAQ } from "@/components/landing/FAQ";

import { createCheckoutSession } from "@/actions/stripe";

export default function PricingPage() {
    const [isYearly, setIsYearly] = useState(true);

    const handleSubscribe = async () => {
        await createCheckoutSession(isYearly);
    };

    return (
        <div className="min-h-screen bg-black text-foreground flex flex-col">
            <PageHeader
                title="Simple, Transparent Pricing"
                description="Secure your SOC with tools built for speed and privacy. Choose the plan that fits your volume."
                badge="Pricing"
            />

            <main className="flex-1">
                {/* Toggle */}
                <div className="flex justify-center items-center mt-12 mb-16 gap-4">
                    <span className={`text-sm font-medium ${!isYearly ? "text-white" : "text-muted-foreground"}`}>Monthly</span>
                    <Switch
                        checked={isYearly}
                        onCheckedChange={setIsYearly}
                        className="data-[state=checked]:bg-cyan-600"
                    />
                    <span className={`text-sm font-medium ${isYearly ? "text-white" : "text-muted-foreground"}`}>
                        Yearly <span className="text-cyan-400 text-xs ml-1">(Save 20%)</span>
                    </span>
                </div>

                {/* Grid */}
                <div className="container mx-auto px-4 pb-24">
                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">

                        {/* Guest / Free */}
                        <PricingCard
                            title="Guest"
                            price="$0"
                            period="forever"
                            description="Perfect for ad-hoc analysis and quick verifications."
                            features={[
                                "3 Analyses / day",
                                "Basic Header Analysis",
                                "Link Expansion",
                                "Community Support"
                            ]}
                            missing={[
                                "Analysis History",
                                "API Access",
                                "Advanced Threat Intel"
                            ]}
                            cta="Start Free"
                            href="/analyze"
                            variant="outline"
                        />

                        {/* Pro / Analyst */}
                        <PricingCard
                            title="Analyst"
                            price={isYearly ? "$24" : "$29"}
                            period="per user / mo"
                            description="For professional threat hunters requiring history and depth."
                            features={[
                                "Unlimited Analyses",
                                "Full Header Forensics (DKIM/SPF)",
                                "Screenshot & DOM Analysis",
                                "Local History Storage",
                                "Priority Email Support",
                                "Early Access to Beta Features"
                            ]}
                            cta="Start Trial"
                            action={handleSubscribe} // Pass action instead of href
                            variant="primary"
                            popular
                        />

                        {/* Team / Enterprise */}
                        <PricingCard
                            title="Team"
                            price="Custom"
                            period="contact us"
                            description="Centralized governance for large SOC teams."
                            features={[
                                "Everything in Analyst",
                                "Centralized Logging",
                                "SSO / ADFS Integration",
                                "Team Collaboration",
                                "Dedicated Account Manager",
                                "Custom Data Retention Policies"
                            ]}
                            cta="Contact Sales"
                            href="mailto:sales@mxlens.com"
                            variant="outline"
                        />
                    </div>
                </div>

                <div className="container mx-auto px-4 py-16 border-t border-border/50">
                    <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
                    <FAQ />
                </div>

            </main>
            <Footer />
        </div>
    );
}

function PricingCard({
    title,
    price,
    period,
    description,
    features,
    missing,
    cta,
    href,
    action,
    variant = "outline",
    popular = false
}: {
    title: string,
    price: string,
    period: string,
    description: string,
    features: string[],
    missing?: string[],
    cta: string,
    href?: string,
    action?: () => void,
    variant?: "outline" | "primary",
    popular?: boolean
}) {
    return (
        <div className={`
            relative p-8 rounded-2xl border flex flex-col h-full transition-all duration-300
            ${popular
                ? "bg-slate-900/40 border-cyan-500/50 shadow-2xl shadow-cyan-900/20 scale-105 z-10"
                : "bg-background border-border/50 hover:border-border"
            }
        `}>
            {popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-cyan-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    MOST POPULAR
                </div>
            )}

            <div className="mb-8">
                <h3 className="text-lg font-medium text-muted-foreground mb-2">{title}</h3>
                <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">{price}</span>
                    <span className="text-sm text-muted-foreground">{period}</span>
                </div>
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                    {description}
                </p>
            </div>

            <div className="flex-1 space-y-4 mb-8">
                {features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                        <Check className="h-4 w-4 text-cyan-500 mt-1 shrink-0" />
                        <span className="text-sm text-foreground/90">{feature}</span>
                    </div>
                ))}
                {missing && missing.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3 opacity-50">
                        <X className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                ))}
            </div>

            {action ? (
                <Button
                    onClick={action}
                    className={`w-full h-12 font-semibold ${variant === 'primary'
                        ? "bg-cyan-600 hover:bg-cyan-500 text-white"
                        : "bg-transparent border border-input hover:bg-accent hover:text-accent-foreground"
                        }`}
                >
                    {cta}
                </Button>
            ) : (
                <Link href={href || "#"} className="w-full">
                    <Button
                        className={`w-full h-12 font-semibold ${variant === 'primary'
                            ? "bg-cyan-600 hover:bg-cyan-500 text-white"
                            : "bg-transparent border border-input hover:bg-accent hover:text-accent-foreground"
                            }`}
                    >
                        {cta}
                    </Button>
                </Link>
            )}
        </div>
    );
}
