import { EmailAnalyzer } from "@/components/email/EmailAnalyzer";
import { isEnrichmentEnabled } from "@/lib/config";

// Read the enrichment setting at request time so Docker images honour runtime env.
export const dynamic = "force-dynamic";

export default function AnalyzePage() {
    const enrichmentEnabled = isEnrichmentEnabled();

    return (
        <div className="container mx-auto min-h-screen space-y-3 px-4 py-4 sm:px-6">
            <h1 className="text-xl font-bold tracking-tight text-foreground font-heading bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Email Analysis Studio
            </h1>

            <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl relative overflow-hidden min-h-[700px] transition-all">
                {/* Decorative gradients */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
                <div className="relative z-10 h-full p-1">
                    <EmailAnalyzer enrichmentEnabled={enrichmentEnabled} />
                </div>
            </div>

            <p className="text-center text-sm text-muted-foreground/60">
                {enrichmentEnabled
                    ? "Parsing and scoring run in your browser. External lookups are enabled on this server: IPs, domains and file hashes are sent to reputation services."
                    : "Parsing and scoring run in your browser. Your email is not uploaded and no external lookups are made."}
            </p>
        </div>
    );
}
