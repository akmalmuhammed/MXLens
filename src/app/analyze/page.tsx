import type { Metadata } from "next";
import { EmailAnalyzer } from "@/components/email/EmailAnalyzer";
import { isEnrichmentEnabled } from "@/lib/config";

export const metadata: Metadata = {
    title: "Analyze an email - MXLens",
};

// Read the enrichment setting at request time so Docker images honour runtime env.
export const dynamic = "force-dynamic";

export default function AnalyzePage() {
    return (
        <div className="container mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
            <EmailAnalyzer enrichmentEnabled={isEnrichmentEnabled()} />
        </div>
    );
}
