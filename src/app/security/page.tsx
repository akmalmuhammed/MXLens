import { PageHeader } from "@/components/marketing/PageHeader";
import { Footer } from "@/components/landing/Footer";
import { ShieldAlert, EyeOff, Server, FileLock, WifiOff } from "lucide-react";

export default function SecurityPage() {
    return (
        <div className="min-h-screen bg-black text-foreground flex flex-col">
            <PageHeader
                title="Privacy by Design"
                description="We believe security tools shouldn't become security risks. MXLens is architected to keep your data local."
                badge="Security"
            />

            <main className="flex-1">

                {/* Core Promise Grid */}
                <section className="py-24 container mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-8 mb-24">
                        <SecurityCard
                            icon={EyeOff}
                            title="Zero Persistence"
                            description="We do not store the emails you analyze. Once the analysis is done and the tab is closed, the data is wiped from our RAM."
                        />
                        <SecurityCard
                            icon={FileLock}
                            title="Client-Side Parsing"
                            description="Parsing of headers and body text happens in your browser in JavaScript. Only indicators (IPs, domains, file hashes) are sent for reputation checks."
                        />
                        <SecurityCard
                            icon={WifiOff}
                            title="No Training on Data"
                            description="We never use your uploaded emails to train our models. Your proprietary data stays yours."
                        />
                    </div>

                    {/* Architecture Diagram */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 md:p-16 text-center">
                        <h2 className="text-3xl font-bold mb-12">Data Flow Architecture</h2>

                        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
                            {/* Client */}
                            <div className="bg-blue-950/30 p-8 rounded-2xl border border-blue-500/30 w-full md:w-auto">
                                <div className="text-blue-400 font-bold mb-4">YOUR BROWSER</div>
                                <div className="space-y-2 text-sm text-slate-300">
                                    <div className="bg-slate-800 p-2 rounded">Header Parsing</div>
                                    <div className="bg-slate-800 p-2 rounded">Body Extraction</div>
                                    <div className="bg-slate-800 p-2 rounded">Render Preview</div>
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-2">
                                <div className="h-0.5 w-16 bg-slate-700 hidden md:block"></div>
                                <div className="text-xs text-slate-500 uppercase tracking-widest bg-black px-2 z-10">ONLY HASHES & DOMAINS</div>
                                <div className="h-0.5 w-16 bg-slate-700 hidden md:block"></div>
                            </div>

                            {/* Server */}
                            <div className="bg-cyan-950/30 p-8 rounded-2xl border border-cyan-500/30 w-full md:w-auto">
                                <div className="text-cyan-400 font-bold mb-4">MXLENS CLOUD</div>
                                <div className="space-y-2 text-sm text-slate-300">
                                    <div className="bg-slate-800 p-2 rounded">Threat Intel Lookup</div>
                                    <div className="bg-slate-800 p-2 rounded">Link Unfurling</div>
                                    <div className="bg-slate-800 p-2 rounded">AI Verdict</div>
                                </div>
                            </div>
                        </div>

                        <p className="mt-12 text-muted-foreground max-w-2xl mx-auto">
                            Note: For "Team" tier users who opt-in to centralized logging, metadata is stored encrypted at rest using AES-256 with AES-256-GCM.
                        </p>
                    </div>
                </section>

                {/* Compliance */}
                <section className="py-24 bg-muted/5 border-t border-border/20">
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="text-3xl font-bold mb-16">Compliance & Standards</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-70 grayscale hover:grayscale-0 transition-all">
                            {/* Placeholders for logos */}
                            <ComplianceLogo text="GDPR Ready" />
                            <ComplianceLogo text="CCPA Compliant" />
                            <ComplianceLogo text="AES-256 Encryption" />
                                                    </div>
                    </div>
                </section>

            </main>
            <Footer />
        </div>
    );
}

function SecurityCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
    return (
        <div className="bg-card border border-border/50 p-8 rounded-2xl hover:border-cyan-500/30 transition-colors">
            <div className="h-12 w-12 rounded-lg bg-slate-800 flex items-center justify-center text-slate-200 mb-6">
                <Icon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-4">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">
                {description}
            </p>
        </div>
    )
}

function ComplianceLogo({ text }: { text: string }) {
    return (
        <div className="h-24 bg-slate-900/50 rounded-lg flex items-center justify-center border border-slate-800 font-bold text-slate-500">
            {text}
        </div>
    )
}
