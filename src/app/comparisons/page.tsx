import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, X, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function ComparisonsPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-20">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
                        Why Security Teams Choose <span className="text-cyan-400">MXLens</span>
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        Stop settling for basic DNS checks. Get deep packet inspection and AI-powered analysis.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800">
                                <th className="p-4 w-1/3">Feature</th>
                                <th className="p-4 w-1/3 text-cyan-400 text-xl font-bold bg-slate-900/50 rounded-t-lg">MXLens</th>
                                <th className="p-4 w-1/3 text-slate-400 text-xl font-bold">Standard Tools</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-300">
                            <ComparisonRow feature="AI-Powered Context Analysis" mxlens={true} others={false} />
                            <ComparisonRow feature="Deep SPF/DKIM/DMARC Validation" mxlens={true} others={true} />
                            <ComparisonRow feature="Recursive Attachment Scanning" mxlens={true} others={false} />
                            <ComparisonRow feature="Visual Threat Timeline" mxlens={true} others={false} />
                            <ComparisonRow feature="Zero-Day Phishing Detection" mxlens={true} others={false} />
                            <ComparisonRow feature="Dark Mode Interface" mxlens={true} others={false} />
                        </tbody>
                    </table>
                </div>

                <div className="mt-20 grid md:grid-cols-2 gap-8">
                    <Card className="p-8">
                        <h3 className="text-2xl font-bold text-white mb-4">MXLens vs VirusTotal</h3>
                        <p className="text-slate-400 mb-6">
                            VirusTotal is great for file hashes, but misses the context of email headers and social engineering patterns.
                        </p>
                        <Link href="/resources/comparisons/virustotal">
                            <Button variant="outline">Read Full Comparison</Button>
                        </Link>
                    </Card>
                    <Card className="p-8">
                        <h3 className="text-2xl font-bold text-white mb-4">MXLens vs MXToolbox</h3>
                        <p className="text-slate-400 mb-6">
                            MXToolbox is essential for DNS, but MXLens goes beyond configuration to actual threat detection.
                        </p>
                        <Link href="/resources/comparisons/mxtoolbox">
                            <Button variant="outline">Read Full Comparison</Button>
                        </Link>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function ComparisonRow({ feature, mxlens, others }: { feature: string, mxlens: boolean, others: boolean }) {
    return (
        <tr className="border-b border-slate-800 hover:bg-slate-900/30 transition-colors">
            <td className="p-4 font-medium">{feature}</td>
            <td className="p-4 bg-slate-900/20">
                {mxlens ? <Check className="w-6 h-6 text-cyan-400" /> : <X className="w-6 h-6 text-slate-600" />}
            </td>
            <td className="p-4">
                {others ? <Check className="w-6 h-6 text-slate-400" /> : <Minus className="w-6 h-6 text-slate-600" />}
            </td>
        </tr>
    );
}
