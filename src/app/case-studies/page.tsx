import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Building2, ShieldCheck, TrendingUp } from "lucide-react";

export default function CaseStudiesPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Hero */}
            <div className="py-20 text-center container mx-auto px-4">
                <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6">
                    Securing the <span className="text-cyan-400">Modern Enterprise</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                    See how leading organizations use MXLens to detect threats that others miss.
                </p>
            </div>

            {/* Featured Case Study */}
            <div className="container mx-auto px-4 mb-20">
                <Card className="p-8 md:p-12 bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="flex items-center gap-2 text-cyan-400 mb-4 font-bold tracking-wider text-sm">
                                <Building2 className="w-4 h-4" />
                                FEATURED STORY
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-4">TechFlow Financial saves $2M preventing BEC attacks</h2>
                            <p className="text-lg text-slate-300 mb-6">
                                How a leading fintech firm reduced phishing incidents by 94% within the first month of deploying MXLens.
                            </p>
                            <div className="flex gap-8 mb-8">
                                <div>
                                    <div className="text-3xl font-bold text-white">94%</div>
                                    <div className="text-sm text-slate-400">Reduction in Phishing</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-white">&lt;5min</div>
                                    <div className="text-sm text-slate-400">Time to Remediate</div>
                                </div>
                            </div>
                            <Button className="group">
                                Read Full Story
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                        <div className="relative h-64 md:h-full bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center">
                            {/* Placeholder for chart/image */}
                            <TrendingUp className="w-24 h-24 text-slate-700" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* More Stories */}
            <div className="container mx-auto px-4 pb-20 grid md:grid-cols-3 gap-6">
                <CaseStudyCard
                    industry="Healthcare"
                    title="Securing Patient Data during Cloud Migration"
                    metric="100% HIPAA Compliance"
                />
                <CaseStudyCard
                    industry="Manufacturing"
                    title="Stopping Supply Chain Fraud in its Tracks"
                    metric="$500k Saved"
                />
                <CaseStudyCard
                    industry="Education"
                    title="Protecting 50,000 Students from Malware"
                    metric="Zero Downtime"
                />
            </div>
        </div>
    );
}

function CaseStudyCard({ industry, title, metric }: { industry: string, title: string, metric: string }) {
    return (
        <Card className="p-6 hover:border-cyan-500/50 transition-colors cursor-pointer group">
            <div className="text-cyan-500 text-sm font-semibold mb-3 uppercase tracking-wide">{industry}</div>
            <h3 className="text-xl font-bold text-white mb-4 group-hover:text-cyan-400 transition-colors">{title}</h3>
            <div className="flex items-center gap-2 text-slate-400 text-sm mt-auto pt-4 border-t border-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                {metric}
            </div>
        </Card>
    )
}
