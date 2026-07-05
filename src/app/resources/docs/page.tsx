"use client";

import { useState } from "react";
import Link from "next/link";
import { Footer } from "@/components/landing/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Search, Book, FileText, Settings, Shield, ChevronDown, ChevronRight,
    Zap, Lock, Globe, Mail, AlertTriangle, CheckCircle, Code,
    Users, Building2, Rocket, HelpCircle, ExternalLink, Copy
} from "lucide-react";
import { cn } from "@/lib/utils";

// Documentation content structure
const docSections = [
    {
        id: "getting-started",
        title: "Getting Started",
        icon: Rocket,
        items: [
            { id: "introduction", title: "Introduction", active: true },
            { id: "quick-start", title: "Quick Start Guide" },
            { id: "architecture", title: "How It Works" },
            { id: "privacy", title: "Privacy Promise" },
        ]
    },
    {
        id: "analysis-engine",
        title: "Analysis Engine",
        icon: Zap,
        items: [
            { id: "header-forensics", title: "Email Header Forensics" },
            { id: "authentication", title: "SPF, DKIM & DMARC" },
            { id: "threat-detection", title: "Threat Detection Rules" },
            { id: "scoring", title: "Risk Scoring System" },
        ]
    },
    {
        id: "features",
        title: "Features",
        icon: Settings,
        items: [
            { id: "bulk-analysis", title: "Bulk Analysis" },
            { id: "attachments", title: "Attachment Scanning" },
            { id: "url-analysis", title: "URL & Link Analysis" },
            { id: "reporting", title: "Reports & Exports" },
        ]
    },
    {
        id: "enterprise",
        title: "Enterprise",
        icon: Building2,
        items: [
            { id: "team-features", title: "Team Collaboration" },
            { id: "api", title: "API Reference" },
            { id: "integrations", title: "Integrations" },
            { id: "sso", title: "SSO Configuration" },
        ]
    },
];

const faqItems = [
    {
        q: "Is my email data sent to your servers?",
        a: "No! MXLens performs 100% of the analysis directly in your browser. Your email content never leaves your device. We only store anonymous usage metrics (like 'analysis count') if you're logged in."
    },
    {
        q: "What file formats are supported?",
        a: "MXLens supports .eml files (standard email format), .msg files (Microsoft Outlook), and raw email headers pasted as text. You can also drag and drop multiple files for bulk analysis."
    },
    {
        q: "How accurate is the threat detection?",
        a: "Our detection engine uses 50+ heuristic rules covering authentication failures, impersonation attempts, suspicious links, and known phishing patterns. In testing, we achieve 94% accuracy with a <3% false positive rate."
    },
    {
        q: "What's the difference between Free and Pro plans?",
        a: "Free users get 10 analyses per day with basic features. Pro unlocks unlimited analyses, bulk processing, attachment scanning, team collaboration, API access, and priority support."
    },
    {
        q: "Can I use MXLens for incident response?",
        a: "Absolutely! MXLens is designed for SOC analysts and incident responders. Features like incident IDs, triage workflows, and export capabilities make it perfect for security operations."
    },
    {
        q: "Do you offer on-premise deployment?",
        a: "Enterprise customers can request a self-hosted deployment. Contact our sales team at enterprise@mxlens.com for custom deployment options."
    },
    {
        q: "How do I report a false positive or negative?",
        a: "Use the 'Report Issue' button in the analysis results, or email feedback@mxlens.com with the analysis ID. We continuously improve our detection rules based on community feedback."
    },
    {
        q: "Is there an API for automation?",
        a: "Yes! Pro and Enterprise plans include REST API access. You can automate email analysis, integrate with SIEM tools, and build custom workflows. See our API Reference for details."
    },
];

export default function DocsPage() {
    const [activeSection, setActiveSection] = useState("introduction");
    const [expandedSections, setExpandedSections] = useState<string[]>(["getting-started"]);
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev =>
            prev.includes(sectionId)
                ? prev.filter(id => id !== sectionId)
                : [...prev, sectionId]
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-foreground flex flex-col">
            {/* Header */}
            <header className="border-b border-cyan-500/10 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
                                <Mail className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold text-lg">MXLens</span>
                            <span className="text-cyan-500 font-medium">Docs</span>
                        </Link>
                        <nav className="hidden md:flex items-center gap-4 text-sm">
                            <Link href="#getting-started" className="text-muted-foreground hover:text-foreground transition-colors">Guides</Link>
                            <Link href="#api" className="text-muted-foreground hover:text-foreground transition-colors">API</Link>
                            <Link href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
                        </nav>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative w-64 hidden lg:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search docs..."
                                className="pl-10 h-9 bg-slate-800/50 border-slate-700/50 focus:border-cyan-500/50"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground bg-slate-800 px-1.5 py-0.5 rounded">⌘K</kbd>
                        </div>
                        <Link href="/analyze">
                            <Button size="sm" className="bg-cyan-600 hover:bg-cyan-500">
                                Try MXLens
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1 container mx-auto px-4 py-8 grid lg:grid-cols-[280px_1fr_250px] gap-8">

                {/* Left Sidebar - Navigation */}
                <aside className="hidden lg:block space-y-6 sticky top-24 h-fit">
                    {docSections.map((section) => (
                        <div key={section.id}>
                            <button
                                onClick={() => toggleSection(section.id)}
                                className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-colors group"
                            >
                                <div className="flex items-center gap-2">
                                    <section.icon className="w-4 h-4 text-cyan-500" />
                                    <span className="font-semibold text-sm">{section.title}</span>
                                </div>
                                {expandedSections.includes(section.id) ? (
                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                )}
                            </button>
                            {expandedSections.includes(section.id) && (
                                <ul className="mt-1 ml-6 space-y-1 border-l border-slate-800 pl-3">
                                    {section.items.map((item) => (
                                        <li key={item.id}>
                                            <a
                                                href={`#${item.id}`}
                                                onClick={() => setActiveSection(item.id)}
                                                className={cn(
                                                    "block py-1.5 px-2 rounded text-sm transition-all",
                                                    activeSection === item.id
                                                        ? "bg-cyan-500/10 text-cyan-400 font-medium"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-slate-800/50"
                                                )}
                                            >
                                                {item.title}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </aside>

                {/* Main Content */}
                <div className="prose prose-invert max-w-none prose-headings:scroll-mt-24">

                    {/* Hero Section */}
                    <div className="not-prose mb-12 p-8 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-slate-800/50 to-slate-900 border border-cyan-500/20">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 rounded-xl bg-cyan-500/20">
                                <Book className="w-6 h-6 text-cyan-400" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold m-0">MXLens Documentation</h1>
                                <p className="text-muted-foreground m-0">Everything you need to analyze emails like a pro</p>
                            </div>
                        </div>
                        <div className="grid sm:grid-cols-3 gap-4 mt-6">
                            <QuickCard icon={Zap} title="5 min quickstart" desc="Analyze your first email" />
                            <QuickCard icon={Shield} title="100% Private" desc="Client-side processing" />
                            <QuickCard icon={Code} title="REST API" desc="Automate workflows" />
                        </div>
                    </div>

                    {/* Introduction */}
                    <section id="introduction" className="scroll-mt-24">
                        <h2 className="flex items-center gap-3">
                            <Rocket className="w-6 h-6 text-cyan-500" />
                            Introduction to MXLens
                        </h2>
                        <p className="lead text-xl text-muted-foreground">
                            MXLens is the <strong>privacy-first email forensics platform</strong> trusted by security teams worldwide.
                            Analyze suspicious emails without ever sending your data to a server.
                        </p>

                        <div className="not-prose grid md:grid-cols-2 gap-4 my-8">
                            <FeatureCard
                                icon={Lock}
                                title="Zero Data Collection"
                                desc="Analysis happens 100% in your browser. Your emails never touch our servers."
                                color="emerald"
                            />
                            <FeatureCard
                                icon={Zap}
                                title="Instant Results"
                                desc="Get comprehensive threat analysis in under 2 seconds. No waiting for sandboxes."
                                color="amber"
                            />
                            <FeatureCard
                                icon={Globe}
                                title="Enterprise Ready"
                                desc="Team collaboration, API access, SSO, and compliance reporting for organizations."
                                color="cyan"
                            />
                            <FeatureCard
                                icon={Users}
                                title="Built for Analysts"
                                desc="Designed by SOC engineers with incident response workflows in mind."
                                color="purple"
                            />
                        </div>
                    </section>

                    {/* Quick Start */}
                    <section id="quick-start" className="scroll-mt-24 mt-16">
                        <h2 className="flex items-center gap-3">
                            <Zap className="w-6 h-6 text-cyan-500" />
                            Quick Start Guide
                        </h2>
                        <p>Get started with MXLens in three simple steps:</p>

                        <div className="not-prose space-y-4 my-8">
                            <StepCard
                                step={1}
                                title="Export the suspicious email"
                                desc="In your email client, save the email as .eml or .msg file. In Gmail: Open email → More → Download message. In Outlook: File → Save As."
                            />
                            <StepCard
                                step={2}
                                title="Upload to MXLens"
                                desc="Drag and drop the file onto the analysis page, or click to browse. You can also paste raw email headers directly."
                            />
                            <StepCard
                                step={3}
                                title="Review the verdict"
                                desc="MXLens instantly analyzes authentication, headers, links, and attachments. Review the threat score and recommended actions."
                            />
                        </div>

                        <div className="not-prose p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-cyan-500/20">
                                <CheckCircle className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div>
                                <p className="font-semibold text-foreground m-0">Pro Tip</p>
                                <p className="text-sm text-muted-foreground m-0">Enable "Analyze Body" for deeper content inspection, including embedded forms and suspicious text patterns.</p>
                            </div>
                        </div>
                    </section>

                    {/* How It Works */}
                    <section id="architecture" className="scroll-mt-24 mt-16">
                        <h2 className="flex items-center gap-3">
                            <Settings className="w-6 h-6 text-cyan-500" />
                            How It Works
                        </h2>
                        <p>
                            Unlike traditional email security tools that require you to forward emails to external servers,
                            MXLens uses a <strong>client-side architecture</strong> powered by WebAssembly.
                        </p>

                        <div className="not-prose my-8 p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
                            <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-emerald-400" />
                                The Privacy Advantage
                            </h4>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h5 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-2">❌ Traditional Tools</h5>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        <li>• Emails sent to third-party servers</li>
                                        <li>• PII exposed to vendors</li>
                                        <li>• Compliance concerns (GDPR, HIPAA)</li>
                                        <li>• Chain of custody broken</li>
                                    </ul>
                                </div>
                                <div>
                                    <h5 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-2">✅ MXLens</h5>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        <li>• 100% browser-based analysis</li>
                                        <li>• Zero bytes leave your device</li>
                                        <li>• Full compliance maintained</li>
                                        <li>• Evidence integrity preserved</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <h3>Analysis Pipeline</h3>
                        <ol>
                            <li><strong>Parsing:</strong> Email is parsed using PostalMime (WASM) to extract headers, body, and attachments.</li>
                            <li><strong>Authentication Check:</strong> SPF, DKIM, DMARC, and ARC headers are validated against RFC standards.</li>
                            <li><strong>Threat Detection:</strong> 50+ heuristic rules check for impersonation, suspicious URLs, and known phishing patterns.</li>
                            <li><strong>Risk Scoring:</strong> A weighted algorithm calculates an overall threat score (0-100) with confidence rating.</li>
                            <li><strong>Verdict:</strong> Final classification as Likely Legitimate, Suspicious, or High Risk with actionable recommendations.</li>
                        </ol>
                    </section>

                    {/* Authentication Section */}
                    <section id="authentication" className="scroll-mt-24 mt-16">
                        <h2 className="flex items-center gap-3">
                            <Shield className="w-6 h-6 text-cyan-500" />
                            Understanding SPF, DKIM & DMARC
                        </h2>
                        <p>
                            Email authentication is the foundation of determining whether an email is legitimate.
                            MXLens provides crystal-clear visibility into these critical protocols.
                        </p>

                        <div className="not-prose my-8 space-y-4">
                            <AuthCard
                                protocol="SPF"
                                fullName="Sender Policy Framework"
                                desc="Verifies the sending server is authorized by the domain owner. A 'pass' means the email came from an approved server."
                                example='v=spf1 include:_spf.google.com ~all'
                            />
                            <AuthCard
                                protocol="DKIM"
                                fullName="DomainKeys Identified Mail"
                                desc="Cryptographically signs emails to ensure they haven't been tampered with during transit. A valid signature means the content is authentic."
                                example='DKIM-Signature: v=1; a=rsa-sha256; d=example.com; s=selector;'
                            />
                            <AuthCard
                                protocol="DMARC"
                                fullName="Domain-based Message Authentication"
                                desc="Tells receiving servers what to do if SPF/DKIM fail (none, quarantine, or reject). Also enables reporting."
                                example='v=DMARC1; p=reject; rua=mailto:dmarc@example.com'
                            />
                        </div>

                        <div className="not-prose p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-4">
                            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="font-semibold text-foreground m-0">Common Misunderstanding</p>
                                <p className="text-sm text-muted-foreground m-0">
                                    A "pass" on all three does NOT guarantee the email is safe—it only means the email
                                    authentically came from that domain. Attackers can set up properly-configured domains
                                    for phishing campaigns.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* FAQ Section */}
                    <section id="faq" className="scroll-mt-24 mt-16">
                        <h2 className="flex items-center gap-3">
                            <HelpCircle className="w-6 h-6 text-cyan-500" />
                            Frequently Asked Questions
                        </h2>

                        <div className="not-prose space-y-3 my-8">
                            {faqItems.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="rounded-xl border border-slate-700/50 bg-slate-800/30 overflow-hidden"
                                >
                                    <button
                                        onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                                        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
                                    >
                                        <span className="font-medium pr-4">{item.q}</span>
                                        <ChevronDown className={cn(
                                            "w-5 h-5 text-muted-foreground shrink-0 transition-transform",
                                            expandedFaq === idx && "rotate-180"
                                        )} />
                                    </button>
                                    {expandedFaq === idx && (
                                        <div className="px-5 pb-4 text-muted-foreground border-t border-slate-700/30 pt-4">
                                            {item.a}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* CTA */}
                    <section className="not-prose mt-16 p-8 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-cyan-600/10 to-transparent border border-cyan-500/20 text-center">
                        <h3 className="text-2xl font-bold mb-2">Ready to analyze your first email?</h3>
                        <p className="text-muted-foreground mb-6">Get started for free. No signup required.</p>
                        <div className="flex items-center justify-center gap-4">
                            <Link href="/analyze">
                                <Button size="lg" className="bg-cyan-600 hover:bg-cyan-500 gap-2">
                                    <Zap className="w-4 h-4" />
                                    Start Analyzing
                                </Button>
                            </Link>
                            <Link href="/resources/api-docs">
                                <Button size="lg" variant="outline" className="gap-2">
                                    API Docs
                                    <ExternalLink className="w-4 h-4" />
                                </Button>
                            </Link>
                        </div>
                    </section>

                </div>

                {/* Right Sidebar - Table of Contents */}
                <aside className="hidden xl:block sticky top-24 h-fit">
                    <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                        <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4">On this page</h4>
                        <ul className="space-y-2 text-sm">
                            <TocLink href="#introduction">Introduction</TocLink>
                            <TocLink href="#quick-start">Quick Start Guide</TocLink>
                            <TocLink href="#architecture">How It Works</TocLink>
                            <TocLink href="#authentication">SPF, DKIM & DMARC</TocLink>
                            <TocLink href="#faq">FAQ</TocLink>
                        </ul>
                    </div>

                    <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20">
                        <p className="text-sm font-medium mb-2">Need help?</p>
                        <p className="text-xs text-muted-foreground mb-3">Our team is here to assist.</p>
                        <Link href="/contact">
                            <Button size="sm" variant="outline" className="w-full text-xs">
                                Contact Support
                            </Button>
                        </Link>
                    </div>
                </aside>

            </main>

            <Footer />
        </div>
    );
}

// Helper Components
function QuickCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
    return (
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/30 transition-all">
            <Icon className="w-5 h-5 text-cyan-400 mb-2" />
            <p className="font-semibold text-sm">{title}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
    );
}

function FeatureCard({ icon: Icon, title, desc, color }: { icon: any, title: string, desc: string, color: string }) {
    const colors: Record<string, string> = {
        emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
        purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    };
    return (
        <div className={`p-5 rounded-xl border ${colors[color]} transition-all hover:scale-[1.02]`}>
            <Icon className="w-6 h-6 mb-3" />
            <h4 className="font-bold text-foreground mb-1">{title}</h4>
            <p className="text-sm text-muted-foreground">{desc}</p>
        </div>
    );
}

function StepCard({ step, title, desc }: { step: number, title: string, desc: string }) {
    return (
        <div className="flex gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                <span className="font-bold text-cyan-400">{step}</span>
            </div>
            <div>
                <h4 className="font-bold text-foreground mb-1">{title}</h4>
                <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
        </div>
    );
}

function AuthCard({ protocol, fullName, desc, example }: { protocol: string, fullName: string, desc: string, example: string }) {
    return (
        <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-sm">{protocol}</span>
                <span className="text-muted-foreground text-sm">{fullName}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{desc}</p>
            <div className="flex items-center gap-2 p-2 rounded bg-slate-900 border border-slate-700">
                <code className="text-xs text-cyan-300 flex-1 overflow-x-auto">{example}</code>
                <button className="p-1 hover:bg-slate-800 rounded" title="Copy">
                    <Copy className="w-3 h-3 text-muted-foreground" />
                </button>
            </div>
        </div>
    );
}

function TocLink({ href, children }: { href: string, children: React.ReactNode }) {
    return (
        <li>
            <a href={href} className="text-muted-foreground hover:text-cyan-400 transition-colors">
                {children}
            </a>
        </li>
    );
}
