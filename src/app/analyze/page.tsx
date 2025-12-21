"use client";

import { EmailAnalyzer } from "@/components/email/EmailAnalyzer";
import { ShieldCheck, EyeOff, Cpu } from "lucide-react";

export default function AnalyzePage() {
    return (
        <div className="container mx-auto py-8 min-h-screen space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold tracking-tight text-primary">Email Analysis Studio</h1>

                {/* Privacy Trust Badge */}
                <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground bg-muted/50 px-4 py-2 rounded-full border border-primary/10">
                    <span className="flex items-center gap-1.5"><EyeOff className="w-3.5 h-3.5 text-primary" /> Private Session</span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-primary" /> Client-Side Processing</span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-primary" /> SOC-2 Logic</span>
                </div>
            </div>

            <div className="bg-card border border-border/50 rounded-xl shadow-[0_0_20px_-10px_var(--primary)] h-[calc(100vh-180px)] overflow-hidden transition-all hover:border-primary/30">
                <EmailAnalyzer />
            </div>

            <p className="text-center text-xs text-muted-foreground">
                Your file never leaves this browser tab. All parsing happens locally in WebAssembly.
            </p>
        </div>
    );
}
