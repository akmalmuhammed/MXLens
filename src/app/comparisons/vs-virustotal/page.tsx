import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

export default function VsVirusTotalPage() {
    return (
        <div className="min-h-screen bg-background py-20">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
                        MXLens vs <span className="text-slate-400">VirusTotal</span>
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        VirusTotal wins on file hashes. MXLens wins on email context.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-16">
                    <div className="bg-slate-900/50 p-8 rounded-xl border border-slate-800">
                        <h2 className="text-2xl font-bold text-white mb-4">VirusTotal</h2>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-2 text-slate-400">
                                <Check className="w-4 h-4 text-emerald-500" /> Unmatched Malware Database
                            </li>
                            <li className="flex items-center gap-2 text-slate-400">
                                <Check className="w-4 h-4 text-emerald-500" /> Multi-Engine Scanning
                            </li>
                            <li className="flex items-center gap-2 text-slate-500">
                                <X className="w-4 h-4 text-red-500" /> Publicly shares uploaded files (Privacy risk)
                            </li>
                            <li className="flex items-center gap-2 text-slate-500">
                                <X className="w-4 h-4 text-red-500" /> Cannot analyze email headers or authentication
                            </li>
                        </ul>
                    </div>

                    <div className="bg-cyan-900/10 p-8 rounded-xl border border-cyan-500/30 relative">
                        <div className="absolute -top-3 right-4 bg-cyan-500 text-black text-xs font-bold px-3 py-1 rounded-full">RECOMMENDED</div>
                        <h2 className="text-2xl font-bold text-white mb-4">MXLens</h2>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-2 text-slate-200">
                                <Check className="w-4 h-4 text-cyan-400" /> Private Analysis (Zero Data Retention)
                            </li>
                            <li className="flex items-center gap-2 text-slate-200">
                                <Check className="w-4 h-4 text-cyan-400" /> Analyzes Social Engineering Triggers
                            </li>
                            <li className="flex items-center gap-2 text-slate-200">
                                <Check className="w-4 h-4 text-cyan-400" /> Visualize Email Hops & Geography
                            </li>
                            <li className="flex items-center gap-2 text-slate-200">
                                <Check className="w-4 h-4 text-cyan-400" /> Safe Link Previewing
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="text-center">
                    <h3 className="text-2xl font-bold text-white mb-6">Keep your data private.</h3>
                    <Link href="/">
                        <Button size="lg" className="h-14 px-10 text-lg">Start Private Scan</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
