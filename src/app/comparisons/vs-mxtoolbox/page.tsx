import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

export default function VsMxToolboxPage() {
    return (
        <div className="min-h-screen bg-background py-20">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
                        MXLens vs <span className="text-slate-400">MXToolbox</span>
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        Why security teams are upgrading from static DNS lookups to dynamic threat intelligence.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-16">
                    <div className="bg-slate-900/50 p-8 rounded-xl border border-slate-800">
                        <h2 className="text-2xl font-bold text-white mb-4">MXToolbox</h2>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-2 text-slate-400">
                                <Check className="w-4 h-4 text-emerald-500" /> Excellent DNS Propagation Checks
                            </li>
                            <li className="flex items-center gap-2 text-slate-400">
                                <Check className="w-4 h-4 text-emerald-500" /> Blacklist Monitoring
                            </li>
                            <li className="flex items-center gap-2 text-slate-500">
                                <X className="w-4 h-4 text-red-500" /> No Email Content Analysis
                            </li>
                            <li className="flex items-center gap-2 text-slate-500">
                                <X className="w-4 h-4 text-red-500" /> No Phishing Detection capability
                            </li>
                        </ul>
                    </div>

                    <div className="bg-cyan-900/10 p-8 rounded-xl border border-cyan-500/30 relative">
                        <div className="absolute -top-3 right-4 bg-cyan-500 text-black text-xs font-bold px-3 py-1 rounded-full">RECOMMENDED</div>
                        <h2 className="text-2xl font-bold text-white mb-4">MXLens</h2>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-2 text-slate-200">
                                <Check className="w-4 h-4 text-cyan-400" /> Deep DNS & SPF/DKIM Validation
                            </li>
                            <li className="flex items-center gap-2 text-slate-200">
                                <Check className="w-4 h-4 text-cyan-400" /> Full Header Forensics
                            </li>
                            <li className="flex items-center gap-2 text-slate-200">
                                <Check className="w-4 h-4 text-cyan-400" /> AI-Powered Phishing Verdicts
                            </li>
                            <li className="flex items-center gap-2 text-slate-200">
                                <Check className="w-4 h-4 text-cyan-400" /> Attachment Sandbox
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="text-center">
                    <h3 className="text-2xl font-bold text-white mb-6">Ready to see the difference?</h3>
                    <Link href="/">
                        <Button size="lg" className="h-14 px-10 text-lg">Analyze an Email Free</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
