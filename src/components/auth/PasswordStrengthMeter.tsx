"use client";

import { useState, useMemo } from "react";
import { calculatePasswordStrength } from "@/lib/validations/auth";
import { Progress } from "@/components/ui/progress";

interface PasswordStrengthMeterProps {
    password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
    const strength = useMemo(() => {
        if (!password) return null;
        return calculatePasswordStrength(password);
    }, [password]);

    if (!password || !strength) {
        return null;
    }

    return (
        <div className="space-y-1.5 mt-2">
            <div className="flex items-center gap-1">
                {[0, 1, 2, 3].map((index) => (
                    <div
                        key={index}
                        className={`h-1 flex-1 rounded-full transition-colors ${index < strength.score
                                ? strength.color
                                : "bg-muted"
                            }`}
                    />
                ))}
            </div>
            <p className={`text-xs capitalize ${strength.label === "weak" ? "text-red-500" :
                    strength.label === "fair" ? "text-amber-500" :
                        strength.label === "good" ? "text-green-400" :
                            "text-green-500"
                }`}>
                Password strength: {strength.label}
            </p>
        </div>
    );
}
