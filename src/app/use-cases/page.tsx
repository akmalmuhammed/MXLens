import { PageHeader } from "@/components/marketing/PageHeader";
import { Footer } from "@/components/landing/Footer";
import { UserCheck, FileText, Globe, AlertTriangle, ArrowRight } from "lucide-react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function UseCasesPage() {
    return (
        <div className="min-h-screen bg-black text-foreground flex flex-col">
            <PageHeader
                title="Solved by MXLens"
                description="From complex BEC attacks to everyday credential harvesting, see how we stop threats that bypass standard filters."
                badge="Use Cases"
            />

            <main className="flex-1">

                {/* CEO Fraud / BEC */}
                <UseCaseSection
                    icon={UserCheck}
                    title="Business Email Compromise (BEC)"
                    problem="Attackers impersonate your CEO using a Gmail address or a look-alike domain (e.g., compnay.com) to request urgent wire transfers."
                    solution="MXLens highlights 'Header Mismatches' where the Display Name matches an executive but the Return-Path is external. We also fuzz-match the domain against your known corporate domains."
                    tags={["SPF Analysis", "Domain Levenshtein Distance"]}
                />

                {/* Invoice Redirects */}
                <UseCaseSection
                    icon={FileText}
                    title="Invoice Redirect Fraud"
                    problem="A vendor's email is compromised, and they send you a legitimate-looking invoice with new bank details."
                    solution="Our 'Hop Analysis' shows if the email originated from the vendor's usual location or a suspicious new IP (e.g., Nigeria or Russia). We distinctively flag first-time seen IP blocks."
                    tags={["Geo-IP Intelligence", "Hop Trace"]}
                    align="right"
                />

                {/* Credential Harvesting */}
                <UseCaseSection
                    icon={Globe}
                    title="Credential Phishing"
                    problem="Links hide behind multiple redirects (SendGrid -> bit.ly -> malicious-site.com) to evade scanners."
                    solution="MXLens traces the full redirect path server-side and takes a screenshot of the final landing page, so you see the fake Microsoft 365 login screen without clicking the link."
                    tags={["Link Unfurling", "Visual Intelligence"]}
                />

                {/* CTA */}
                <section className="py-24 bg-gradient-to-t from-cyan-950/30 to-black text-center border-t border-border/20">
                    <h2 className="text-3xl font-bold mb-6">Have a suspicious email right now?</h2>
                    <Link href="/analyze">
                        <Button size="lg" className="rounded-full px-8 bg-cyan-600 hover:bg-cyan-500 text-white">
                            Analyze it for Free <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </section>

            </main>
            <Footer />
        </div>
    );
}

function UseCaseSection({ icon: Icon, title, problem, solution, tags, align = "left" }: any) {
    return (
        <section className="py-20 border-b border-border/10 last:border-0 hover:bg-muted/5 transition-colors">
            <div className={`container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center ${align === 'right' ? 'lg:flex-row-reverse' : ''}`}>
                <div className={align === 'right' ? 'lg:order-2' : ''}>
                    <div className="h-14 w-14 rounded-xl bg-cyan-900/20 flex items-center justify-center text-cyan-400 mb-6 border border-cyan-500/20">
                        <Icon className="h-7 w-7" />
                    </div>
                    <h2 className="text-3xl font-bold mb-6">{title}</h2>

                    <div className="space-y-6">
                        <div className="bg-red-950/10 border border-red-900/30 p-6 rounded-lg">
                            <h4 className="flex items-center text-red-400 font-bold mb-2">
                                <AlertTriangle className="h-4 w-4 mr-2" /> The Problem
                            </h4>
                            <p className="text-muted-foreground leading-relaxed">
                                {problem}
                            </p>
                        </div>

                        <div className="bg-green-950/10 border border-green-900/30 p-6 rounded-lg">
                            <h4 className="flex items-center text-green-400 font-bold mb-2">
                                <UserCheck className="h-4 w-4 mr-2" /> The MXLens Fix
                            </h4>
                            <p className="text-muted-foreground leading-relaxed">
                                {solution}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-6">
                        {tags.map((tag: string) => (
                            <span key={tag} className="px-3 py-1 bg-slate-800 rounded-full text-xs font-medium text-slate-300">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Decorative Visual */}
                <div className={`
                    hidden lg:flex items-center justify-center relative
                    ${align === 'right' ? 'lg:order-1' : ''}
                `}>
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 blur-3xl rounded-full opacity-30" />
                    <div className="relative z-10 p-8 w-full">
                        {/* Abstract Representation of the attack */}
                        <div className="bg-black border border-slate-800 rounded-lg p-4 shadow-2xl skew-y-3 opacity-90">
                            <div className="flex items-center gap-4 mb-4 border-b border-slate-800 pb-4">
                                <div className="h-8 w-8 rounded-full bg-slate-800" />
                                <div>
                                    <div className="h-2 w-24 bg-slate-800 rounded mb-2" />
                                    <div className="h-2 w-16 bg-slate-800 rounded" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-2 w-full bg-slate-900 rounded" />
                                <div className="h-2 w-5/6 bg-slate-900 rounded" />
                                <div className="h-2 w-4/6 bg-slate-900 rounded" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
