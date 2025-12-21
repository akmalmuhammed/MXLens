import { PageHeader } from "@/components/marketing/PageHeader";
import { Footer } from "@/components/landing/Footer";
import Link from "next/link";
import { Calendar, User, ArrowRight } from "lucide-react";
import Image from "next/image";

export default function BlogPage() {
    return (
        <div className="min-h-screen bg-black text-foreground flex flex-col">
            <PageHeader
                title="Threat Intel & Updates"
                description="The latest research on phishing techniques, email standards, and MXLens product updates."
                badge="Blog"
            />

            <main className="flex-1 container mx-auto px-4 py-24">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

                    {/* Featured Post */}
                    <div className="col-span-full mb-12">
                        <div className="group relative rounded-2xl overflow-hidden border border-border/50 bg-card hover:border-cyan-500/30 transition-all grid md:grid-cols-2">
                            <div className="h-64 md:h-auto bg-slate-900 relative">
                                {/* Placeholder Image */}
                                <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 to-blue-900/20" />
                                <div className="absolute inset-0 flex items-center justify-center text-slate-700 font-bold text-2xl">
                                    FEATURE IMAGE
                                </div>
                            </div>
                            <div className="p-8 md:p-12 flex flex-col justify-center">
                                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                                    <span className="bg-cyan-950 text-cyan-400 px-2 py-1 rounded">Engineering</span>
                                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Dec 20, 2024</span>
                                </div>
                                <h2 className="text-3xl font-bold mb-4 group-hover:text-cyan-400 transition-colors">
                                    The Anatomy of a Modern QR Code Phishing Attack
                                </h2>
                                <p className="text-muted-foreground mb-6 line-clamp-3">
                                    Attackers are bypassing secure email gateways by embedding malicious links in QR codes.
                                    Here is how we reverse-engineered a campaign targeting C-suite executives...
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-slate-700" />
                                    <div className="text-sm">
                                        <p className="font-bold">Akmal</p>
                                        <p className="text-muted-foreground text-xs">Security Researcher</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Regular Posts */}
                    <BlogCard
                        category="Product"
                        date="Dec 15, 2024"
                        title="Introducing MXLens V1: The Client-Side Sandbox"
                        excerpt="Why we rebuilt the email analysis engine from scratch using WebAssembly and Rust."
                    />

                    <BlogCard
                        category="Tutorial"
                        date="Nov 28, 2024"
                        title="How to Spot SPF SoftFail vs HardFail"
                        excerpt="Understanding the nuances of DMARC alignment and why 'SoftFail' isn't always innocent."
                    />

                    <BlogCard
                        category="Research"
                        date="Nov 10, 2024"
                        title="De-obuscating JavaScript in HTML Attachments"
                        excerpt="A deep dive into the 'unescape' and 'base64' techniques used by malware authors to hide payloads."
                    />

                </div>
            </main>
            <Footer />
        </div>
    );
}

function BlogCard({ category, date, title, excerpt }: any) {
    return (
        <Link href="#" className="group block h-full">
            <div className="h-full rounded-2xl border border-border/50 bg-card p-6 hover:border-cyan-500/30 hover:bg-muted/5 transition-all flex flex-col">
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                    <span className="text-cyan-500 font-bold uppercase tracking-wider">{category}</span>
                    <span>•</span>
                    <span>{date}</span>
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-cyan-400 transition-colors">
                    {title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed flex-1">
                    {excerpt}
                </p>
                <div className="mt-6 flex items-center text-cyan-500 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                    Read Article <ArrowRight className="ml-2 h-4 w-4" />
                </div>
            </div>
        </Link>
    )
}
