import { PageHeader } from "@/components/marketing/PageHeader";
import { Footer } from "@/components/landing/Footer";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-black text-foreground flex flex-col">
            <PageHeader
                title="Privacy Policy"
                description="Effective Date: Dec 20, 2024"
            />

            <main className="flex-1 container mx-auto px-4 py-12 prose prose-invert max-w-3xl">
                <p>
                    At MXLens, we take privacy seriously. This document outlines what data we collect and how we use it.
                </p>
                <h3>1. No Data Collection for Analysis</h3>
                <p>
                    Files and emails analyzed on the "Guest" and "Analyst" tiers are processed locally in your browser. content is NOT uploaded to our servers.
                    We only receive metadata (hashes, domains) needed to perform threat intelligence lookups.
                </p>
                <h3>2. Analytics</h3>
                <p>
                    We use privacy-preserving analytics (like Plausible/Fathom) to track page views, not users.
                </p>
                <p className="text-sm text-muted-foreground mt-12">
                    This is a summary. For the full legal text, please contact legal@mxlens.com.
                </p>
            </main>
            <Footer />
        </div>
    );
}
