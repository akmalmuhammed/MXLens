import { PageHeader } from "@/components/marketing/PageHeader";
import { Footer } from "@/components/landing/Footer";
import Link from "next/link";
import { Search, Book, FileText, Settings, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function DocsPage() {
    return (
        <div className="min-h-screen bg-black text-foreground flex flex-col">
            {/* Mini Header */}
            <div className="border-b border-border/50 bg-background/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="font-bold text-lg tracking-tight">
                        MXLens <span className="text-muted-foreground font-normal">Docs</span>
                    </Link>
                    <div className="relative w-64 hidden md:block">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input type="search" placeholder="Search documentation..." className="pl-9 h-9 bg-muted/50 border-border/50" />
                    </div>
                </div>
            </div>

            <main className="flex-1 container mx-auto px-4 py-12 grid lg:grid-cols-[250px_1fr] gap-12">

                {/* Sidebar */}
                <aside className="hidden lg:block space-y-8">
                    <DocsNavSection title="Getting Started">
                        <DocsNavLink href="#" active>Introduction</DocsNavLink>
                        <DocsNavLink href="#">Quick Start Guide</DocsNavLink>
                        <DocsNavLink href="#">Architecture Overview</DocsNavLink>
                    </DocsNavSection>

                    <DocsNavSection title="Analysis Engine">
                        <DocsNavLink href="#">Header Forensics</DocsNavLink>
                        <DocsNavLink href="#">URL Rewriting</DocsNavLink>
                        <DocsNavLink href="#">Attachments</DocsNavLink>
                    </DocsNavSection>

                    <DocsNavSection title="Enterprise">
                        <DocsNavLink href="#">SSO Configuration</DocsNavLink>
                        <DocsNavLink href="#">API Reference</DocsNavLink>
                        <DocsNavLink href="#">Billing</DocsNavLink>
                    </DocsNavSection>
                </aside>

                {/* Content */}
                <div className="prose prose-invert max-w-3xl">
                    <h1>Introduction to MXLens</h1>
                    <p className="lead text-xl text-muted-foreground">
                        MXLens is a client-side first email forensic tool designed for speed and privacy.
                    </p>

                    <div className="not-prose grid md:grid-cols-2 gap-4 my-8">
                        <QuickLinkCard
                            icon={Book}
                            title="Quick Start"
                            desc="Learn how to analyze your first email in 30 seconds."
                        />
                        <QuickLinkCard
                            icon={Settings}
                            title="Configuration"
                            desc="Set up your workspace and preferences."
                        />
                        <QuickLinkCard
                            icon={Shield}
                            title="Privacy Guide"
                            desc="Understand exactly how we handle your data."
                        />
                        <QuickLinkCard
                            icon={FileText}
                            title="API Reference"
                            desc="Automate analysis with our REST API."
                        />
                    </div>

                    <h2>How it works</h2>
                    <p>
                        Unlike traditional sandboxes that require you to forward emails (breaking Chain of Custody),
                        MXLens parses `.eml` and `.msg` files directly in your browser using WebAssembly.
                    </p>
                    <p>
                        This ensures that PII (Personally Identifiable Information) never leaves your device unless you explicitly opt-in to cloud enrichment features.
                    </p>
                </div>

            </main>
            <Footer />
        </div>
    );
}

function DocsNavSection({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div>
            <h4 className="font-bold text-foreground mb-3 px-2">{title}</h4>
            <ul className="space-y-1">{children}</ul>
        </div>
    )
}

function DocsNavLink({ href, children, active }: { href: string, children: React.ReactNode, active?: boolean }) {
    return (
        <li>
            <Link href={href} className={`block px-2 py-1.5 rounded-md text-sm transition-colors ${active ? "bg-cyan-900/20 text-cyan-400" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                {children}
            </Link>
        </li>
    )
}

function QuickLinkCard({ icon: Icon, title, desc }: any) {
    return (
        <div className="p-4 rounded-xl border border-border/50 bg-card hover:border-cyan-500/30 transition-all cursor-pointer">
            <Icon className="h-5 w-5 text-cyan-500 mb-3" />
            <h3 className="font-bold mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{desc}</p>
        </div>
    )
}
