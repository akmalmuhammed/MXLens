import { ShieldCheck, Lock, Eye, Server, FileText, ExternalLink, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/marketing/PageHeader";
import { Footer } from "@/components/landing/Footer";
import Link from "next/link";

export const metadata = {
    title: "Trust Center | MXLens",
    description: "Learn how MXLens protects your privacy with client-side processing and zero data collection.",
};

export default function TrustCenterPage() {
    return (
        <div className="min-h-screen bg-black text-foreground flex flex-col">
            <PageHeader
                title="Trust Center"
                description="Transparency is the foundation of security. Here's exactly how MXLens protects your data."
                badge="Security"
            />

            <main className="flex-1 container mx-auto px-4 py-16 space-y-16">

                {/* Hero Statement */}
                <section className="max-w-3xl mx-auto text-center space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-semibold">
                        <Lock className="w-4 h-4" />
                        Zero Data Collection
                    </div>
                    <h2 className="text-4xl font-bold tracking-tight">
                        Your emails never leave your browser.
                    </h2>
                    <p className="text-xl text-muted-foreground leading-relaxed">
                        MXLens performs all email analysis using client-side JavaScript and WebAssembly.
                        No email content, headers, or attachments are ever transmitted to our servers.
                    </p>
                </section>

                {/* Architecture Proof */}
                <section className="max-w-4xl mx-auto">
                    <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                        <Server className="w-6 h-6 text-primary" />
                        Technical Architecture
                    </h3>
                    <div className="bg-card/50 border rounded-2xl p-8 space-y-6">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h4 className="font-semibold text-lg text-cyan-400">What happens in your browser:</h4>
                                <ul className="space-y-3">
                                    {[
                                        "Email file parsing (postal-mime)",
                                        "Header extraction and analysis",
                                        "SPF/DKIM/DMARC validation logic",
                                        "Phishing indicator detection",
                                        "Risk scoring and verdict generation",
                                        "PDF link extraction (pdf.js)",
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="space-y-4">
                                <h4 className="font-semibold text-lg text-amber-400">What we DO NOT receive:</h4>
                                <ul className="space-y-3">
                                    {[
                                        "Email content or body text",
                                        "Email headers (From, To, Subject)",
                                        "Attachments or file contents",
                                        "IP addresses from email routing",
                                        "Any Personally Identifiable Information",
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <Eye className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                            <span className="text-muted-foreground">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Network Proof Banner */}
                        <div className="mt-8 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <ShieldCheck className="w-5 h-5 text-green-500" />
                                </div>
                                <div>
                                    <p className="font-semibold text-green-400">Verify It Yourself</p>
                                    <p className="text-sm text-muted-foreground">
                                        Open your browser's DevTools → Network tab while analyzing an email.
                                        You'll see <strong>0 bytes</strong> of email data sent to any server.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* What We Store */}
                <section className="max-w-4xl mx-auto">
                    <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                        <FileText className="w-6 h-6 text-primary" />
                        What We Store (For Registered Users)
                    </h3>
                    <div className="bg-card/50 border rounded-2xl p-8">
                        <p className="text-muted-foreground mb-6">
                            When you create an account, we store minimal metadata to provide dashboard features:
                        </p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-3 font-semibold">Data</th>
                                        <th className="text-left p-3 font-semibold">Purpose</th>
                                        <th className="text-left p-3 font-semibold">Retention</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    <tr>
                                        <td className="p-3">Verdict (Clean/Suspicious/Malicious)</td>
                                        <td className="p-3 text-muted-foreground">Dashboard statistics</td>
                                        <td className="p-3 text-muted-foreground">90 days (configurable)</td>
                                    </tr>
                                    <tr>
                                        <td className="p-3">Risk Score (0-100)</td>
                                        <td className="p-3 text-muted-foreground">Trend analysis</td>
                                        <td className="p-3 text-muted-foreground">90 days</td>
                                    </tr>
                                    <tr>
                                        <td className="p-3">Timestamp</td>
                                        <td className="p-3 text-muted-foreground">Activity history</td>
                                        <td className="p-3 text-muted-foreground">90 days</td>
                                    </tr>
                                    <tr>
                                        <td className="p-3">Processing Time (ms)</td>
                                        <td className="p-3 text-muted-foreground">Performance monitoring</td>
                                        <td className="p-3 text-muted-foreground">30 days</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p className="mt-6 text-sm text-muted-foreground">
                            <strong>Note:</strong> We never store email content, headers, sender information, or any text from the email itself.
                        </p>
                    </div>
                </section>

                {/* Compliance & Certifications */}
                <section className="max-w-4xl mx-auto">
                    <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                        <ShieldCheck className="w-6 h-6 text-primary" />
                        Compliance Roadmap
                    </h3>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-card/50 border rounded-xl p-6 text-center">
                            <div className="text-3xl font-bold text-cyan-400 mb-2">SOC 2</div>
                            <div className="text-sm text-muted-foreground">Type II - In Progress</div>
                            <div className="mt-4 text-xs bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full inline-block">
                                Q2 2025
                            </div>
                        </div>
                        <div className="bg-card/50 border rounded-xl p-6 text-center">
                            <div className="text-3xl font-bold text-cyan-400 mb-2">GDPR</div>
                            <div className="text-sm text-muted-foreground">Compliant by Design</div>
                            <div className="mt-4 text-xs bg-green-500/10 text-green-400 px-3 py-1 rounded-full inline-block">
                                Active
                            </div>
                        </div>
                        <div className="bg-card/50 border rounded-xl p-6 text-center">
                            <div className="text-3xl font-bold text-cyan-400 mb-2">ISO 27001</div>
                            <div className="text-sm text-muted-foreground">Certification Planned</div>
                            <div className="mt-4 text-xs bg-slate-500/10 text-slate-400 px-3 py-1 rounded-full inline-block">
                                Q4 2025
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="text-center py-12 border-t border-border/50">
                    <h3 className="text-2xl font-bold mb-4">Questions about our security practices?</h3>
                    <p className="text-muted-foreground mb-6">
                        Our team is happy to discuss technical details with your security team.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link href="mailto:security@mxlens.com">
                            <Button variant="outline" className="gap-2">
                                <ExternalLink className="w-4 h-4" />
                                Contact Security Team
                            </Button>
                        </Link>
                        <Link href="/legal/privacy">
                            <Button variant="ghost">Privacy Policy</Button>
                        </Link>
                    </div>
                </section>

            </main>
            <Footer />
        </div>
    );
}
