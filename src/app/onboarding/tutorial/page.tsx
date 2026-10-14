"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, FileJson, AlertTriangle } from "lucide-react";

export default function OnboardingTutorialPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="max-w-4xl w-full grid md:grid-cols-2 gap-12 items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-6">How to analyze an email</h1>
                    <div className="space-y-8">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 font-bold text-lg">1</div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">Upload or Paste</h3>
                                <p className="text-muted-foreground">Drag and drop a .eml file or paste the raw headers directly into the analyzer.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 font-bold text-lg">2</div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">Review the Verdict</h3>
                                <p className="text-muted-foreground">We'll check SPF, DKIM, DMARC, and scan for malicious patterns instantly.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 font-bold text-lg">3</div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">Take Action</h3>
                                <p className="text-muted-foreground">Get a clear "Clean", "Suspicious", or "Malicious" result to guide your next move.</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-10">
                        <Link href="/onboarding/complete">
                            <Button size="lg" className="px-8">I'm Ready</Button>
                        </Link>
                    </div>
                </div>

                {/* Visual Graphic */}
                <div className="relative">
                    <Card className="p-6 bg-slate-900 border-slate-700 -rotate-3 hover:rotate-0 transition-transform duration-500">
                        <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-4">
                            <AlertTriangle className="text-amber-500 w-5 h-5" />
                            <span className="font-mono text-sm text-amber-500">Suspicious Activity Detected</span>
                        </div>
                        <div className="space-y-3">
                            <div className="h-2 bg-slate-800 rounded w-3/4" />
                            <div className="h-2 bg-slate-800 rounded w-1/2" />
                            <div className="h-2 bg-slate-800 rounded w-5/6" />
                        </div>
                        <div className="mt-6 flex justify-between items-center">
                            <div className="flex gap-2">
                                <span className="w-3 h-3 rounded-full bg-red-500" />
                                <span className="font-mono text-xs text-red-400">DMARC Failed</span>
                            </div>
                            <Button size="sm" variant="secondary" className="h-8 text-xs">View Headers</Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
