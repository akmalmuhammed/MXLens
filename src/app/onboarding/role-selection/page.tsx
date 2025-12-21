"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User, Shield, Briefcase } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function OnboardingRolePage() {
    const [selected, setSelected] = useState<string | null>(null);

    const roles = [
        { id: "personal", title: "Personal Use", icon: User, desc: "Checking my own emails" },
        { id: "analyst", title: "Security Analyst", icon: Shield, desc: "Investigating threats for work" },
        { id: "business", title: "Business Owner", icon: Briefcase, desc: "Protecting my company" },
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-foreground mb-2">How will you use MXLens?</h1>
                    <p className="text-muted-foreground">We'll tailor your experience based on your role.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-8">
                    {roles.map((role) => {
                        const Icon = role.icon;
                        const isSelected = selected === role.id;
                        return (
                            <Card
                                key={role.id}
                                className={cn(
                                    "p-6 cursor-pointer transition-all hover:border-primary",
                                    isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                                )}
                                onClick={() => setSelected(role.id)}
                            >
                                <div className="mb-4">
                                    <Icon className={cn("w-8 h-8", isSelected ? "text-primary" : "text-muted-foreground")} />
                                </div>
                                <h3 className="font-bold mb-1">{role.title}</h3>
                                <p className="text-xs text-muted-foreground">{role.desc}</p>
                            </Card>
                        )
                    })}
                </div>

                <div className="flex justify-end">
                    <Link href="/onboarding/tutorial">
                        <Button size="lg" disabled={!selected} className="w-full md:w-auto px-8">
                            Continue
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
