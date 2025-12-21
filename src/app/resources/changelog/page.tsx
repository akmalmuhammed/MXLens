import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function ChangelogPage() {
    return (
        <div className="min-h-screen bg-background text-slate-200 py-20 px-4">
            <div className="max-w-3xl mx-auto">
                <div className="mb-12">
                    <h1 className="text-4xl font-extrabold text-white mb-4">Changelog</h1>
                    <p className="text-muted-foreground">New updates and improvements to MXLens.</p>
                </div>

                <div className="space-y-12">
                    <ChangelogItem
                        version="v1.2.0"
                        date="December 20, 2024"
                        title="Advanced Header Analysis"
                        description="Added support for recursive unpacking of msg files and deeper X-Originating-IP tracing."
                        changes={[
                            "New: Support for Outlook .msg files",
                            "Improved: SPF lookup speed by 30%",
                            "Fix: Rate limit handling for API users"
                        ]}
                    />
                    <ChangelogItem
                        version="v1.1.0"
                        date="December 5, 2024"
                        title="Dark Mode UI Overhaul"
                        description="A complete redesign of the dashboard with a new high-contrast dark theme optimized for SOC analysts."
                        changes={[
                            "New: Glassmorphism design system",
                            "New: Activity timeline visualization",
                        ]}
                    />
                </div>
            </div>
        </div>
    );
}

function ChangelogItem({ version, date, title, description, changes }: { version: string, date: string, title: string, description: string, changes: string[] }) {
    return (
        <div className="relative pl-8 border-l border-slate-800">
            <div className="absolute -left-[6px] top-0 w-3 h-3 rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/50" />
            <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-cyan-900/30 text-cyan-400 hover:bg-cyan-900/50 border-cyan-500/20">{version}</Badge>
                <span className="text-sm text-slate-500">{date}</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
            <p className="text-slate-400 mb-6">{description}</p>
            <ul className="space-y-2">
                {changes.map((change, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="text-slate-600">•</span>
                        {change}
                    </li>
                ))}
            </ul>
        </div>
    );
}
