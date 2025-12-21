import { PageHeader } from "@/components/marketing/PageHeader";
import { Footer } from "@/components/landing/Footer";
import { Shield, Microscope, Network, Zap, Lock, Terminal } from "lucide-react";
import Image from "next/image";

export default function FeaturesPage() {
    return (
        <div className="min-h-screen bg-black text-foreground flex flex-col">
            <PageHeader
                title="Technical Capabilities"
                description="Built for analysts who need to know exactly why an email was flagged. No black boxes."
                badge="Features"
            />

            <main className="flex-1">

                {/* Deep Header Analysis */}
                <section className="py-24 border-b border-border/20">
                    <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="h-12 w-12 rounded-lg bg-cyan-900/30 flex items-center justify-center text-cyan-400 mb-6">
                                <Microscope className="h-6 w-6" />
                            </div>
                            <h2 className="text-3xl font-bold mb-4">Deep Header Forensics</h2>
                            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                                Most tools stop at "SPF Fail". We analyze the entire hop path using <code className="bg-muted px-1 py-0.5 rounded text-sm">Received</code> headers to visualize exactly where an email originated and how it traveled.
                            </p>
                            <ul className="space-y-3">
                                <FeatureItem text="Visual Hop-by-Hop Trace" />
                                <FeatureItem text="Hidden Character Detection in Headers" />
                                <FeatureItem text="Return-Path vs From Alignment Checks" />
                                <FeatureItem text="Time-of-flight Latency Analysis" />
                            </ul>
                        </div>
                        <div className="relative bg-slate-950 rounded-xl border border-slate-800 p-6 shadow-2xl">
                            {/* Pseudo-code viz */}
                            <div className="font-mono text-xs text-slate-400 space-y-2">
                                <div className="flex justify-between border-b border-slate-800 pb-2">
                                    <span>Hop #3 (Origin)</span>
                                    <span className="text-red-400">Suspicious IP</span>
                                </div>
                                <div className="pl-4 border-l-2 border-slate-800">
                                    <p>IP: 192.168.x.x <span className="text-slate-600">(Russia)</span></p>
                                    <p>Delay: 12ms</p>
                                    <p>Auth: <span className="text-red-400">NONE</span></p>
                                </div>
                                <div className="flex justify-between border-b border-slate-800 pb-2 pt-4">
                                    <span>Hop #2 (Relay)</span>
                                    <span className="text-green-400">Trusted</span>
                                </div>
                                <div className="pl-4 border-l-2 border-slate-800">
                                    <p>IP: 10.0.0.1 <span className="text-slate-600">(Google)</span></p>
                                    <p>DKIM: <span className="text-green-400">PASS</span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Payload Analysis */}
                <section className="py-24 border-b border-border/20 bg-muted/5">
                    <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-16 items-center lg:flex-row-reverse">
                        <div className="order-2 lg:order-1 relative bg-slate-950 rounded-xl border border-slate-800 p-6 shadow-2xl flex items-center justify-center min-h-[300px]">
                            <Lock className="h-24 w-24 text-slate-800" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-cyan-500/10 backdrop-blur-md border border-cyan-500/30 p-4 rounded-lg text-cyan-400 font-mono text-sm">
                                    &lt;script&gt;malicious_payload()&lt;/script&gt;
                                    <br />
                                    <span className="text-red-500 font-bold">DETECTED</span>
                                </div>
                            </div>
                        </div>
                        <div className="order-1 lg:order-2">
                            <div className="h-12 w-12 rounded-lg bg-purple-900/30 flex items-center justify-center text-purple-400 mb-6">
                                <Terminal className="h-6 w-6" />
                            </div>
                            <h2 className="text-3xl font-bold mb-4">Static Script Analysis</h2>
                            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                                We extract and de-obfuscate JavaScript, PowerShell, and Macro code embedded in HTML bodies or attachments without executing them.
                            </p>
                            <ul className="space-y-3">
                                <FeatureItem text="Base64 / Hex Decoding" />
                                <FeatureItem text="Homoglyph Normalization" />
                                <FeatureItem text="HTML Entity Expansion" />
                                <FeatureItem text="Zero-Risk Static Extraction" />
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Link Explosion */}
                <section className="py-24">
                    <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="h-12 w-12 rounded-lg bg-blue-900/30 flex items-center justify-center text-blue-400 mb-6">
                                <Network className="h-6 w-6" />
                            </div>
                            <h2 className="text-3xl font-bold mb-4">Link Unfurling</h2>
                            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                                Attackers hide behind bit.ly, t.co, and open redirects. MXLens follows the redirect chain server-side so you don't have to visit the site yourself.
                            </p>
                            <ul className="space-y-3">
                                <FeatureItem text="Follows up to 10 redirects" />
                                <FeatureItem text="Screenshots landing pages" />
                                <FeatureItem text="Checks against Google/PhishTank Safe Browsing" />
                            </ul>
                        </div>

                        <div className="relative bg-slate-950 rounded-xl border border-slate-800 p-6 shadow-2xl">
                            <div className="space-y-4">
                                <LinkStep url="http://bit.ly/suspicious" status="301 Moved" />
                                <div className="h-4 w-0.5 bg-slate-700 ml-4"></div>
                                <LinkStep url="http://redirect-service.com/login" status="302 Found" />
                                <div className="h-4 w-0.5 bg-slate-700 ml-4"></div>
                                <LinkStep url="http://fake-microsoft-login.phish" status="200 OK" isDanger />
                            </div>
                        </div>

                    </div>
                </section>

            </main>
            <Footer />
        </div>
    );
}

function FeatureItem({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-3">
            <Zap className="h-4 w-4 text-cyan-500" />
            <span className="text-foreground/90">{text}</span>
        </div>
    );
}

function LinkStep({ url, status, isDanger }: { url: string, status: string, isDanger?: boolean }) {
    return (
        <div className={`p-3 rounded border ${isDanger ? 'border-red-900/50 bg-red-900/10' : 'border-slate-800 bg-slate-900'}`}>
            <div className="flex justify-between items-center mb-1">
                <span className={`text-xs font-mono ${isDanger ? 'text-red-400' : 'text-slate-400'}`}>{status}</span>
            </div>
            <div className="text-sm font-medium truncate">{url}</div>
        </div>
    )
}
