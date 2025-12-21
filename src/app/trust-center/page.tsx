import { PageHeader } from "@/components/marketing/PageHeader";
import { Footer } from "@/components/landing/Footer";

export default function TrustCenterPage() {
    return (
        <div className="min-h-screen bg-black text-foreground flex flex-col">
            <PageHeader
                title="Trust Center"
                description="Live system status and compliance reporting."
            />

            <main className="flex-1 container mx-auto px-4 py-12">

                {/* System Status Banner */}
                <div className="bg-green-950/20 border border-green-500/20 rounded-lg p-6 mb-12 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                        <div>
                            <h3 className="font-bold text-green-500">All Systems Operational</h3>
                            <p className="text-sm text-green-500/80">API Latency: 42ms • Email Parsing: 99.99% Uptime</p>
                        </div>
                    </div>
                    <a href="#" className="text-sm underline text-green-500 hover:text-green-400">View History</a>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    <div>
                        <h3 className="text-2xl font-bold mb-6">Compliance Artifacts</h3>
                        <ul className="space-y-4">
                            <DownloadRow title="SOC 2 Type I Report" date="Dec 2024" />
                            <DownloadRow title="Penetration Test Summary" date="Nov 2024" />
                            <DownloadRow title="GDPR DPA (Data Processing Addendum)" date="Rev 1.2" />
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-2xl font-bold mb-6">Subprocessors</h3>
                        <p className="text-muted-foreground mb-4">We minimize data sharing. Current subprocessors:</p>
                        <ul className="space-y-2 text-sm">
                            <li className="flex justify-between border-b border-border/50 py-2">
                                <span>Vercel</span>
                                <span className="text-muted-foreground">Hosting & Edge Functions</span>
                            </li>
                            <li className="flex justify-between border-b border-border/50 py-2">
                                <span>Supabase</span>
                                <span className="text-muted-foreground">Database & Auth</span>
                            </li>
                            <li className="flex justify-between border-b border-border/50 py-2">
                                <span>BetterStack</span>
                                <span className="text-muted-foreground">Uptime Monitoring</span>
                            </li>
                        </ul>
                    </div>
                </div>

            </main>
            <Footer />
        </div>
    );
}

function DownloadRow({ title, date }: any) {
    return (
        <div className="flex items-center justify-between p-4 bg-card border border-border/50 rounded hover:bg-muted/5 cursor-pointer group">
            <span className="font-medium group-hover:text-cyan-500 transition-colors">{title}</span>
            <span className="text-xs text-muted-foreground">{date}</span>
        </div>
    )
}
