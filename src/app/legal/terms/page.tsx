import { Footer } from "@/components/landing/Footer";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-black text-foreground flex flex-col">
            <div className="container mx-auto px-4 py-24 prose prose-invert max-w-3xl flex-1">
                <h1>Terms of Service</h1>
                <p>Last updated: Dec 21, 2024</p>
                <p>
                    By using MXLens, you agree to these terms.
                </p>
                <h3>1. Acceptable Use</h3>
                <p>
                    You agree not to use MXLens to analyze content for which you do not have authorization.
                    Reverse engineering of our analysis engine is prohibited.
                </p>
                <h3>2. Liability</h3>
                <p>
                    MXLens is provided "as is". We are not liable for any malware infections that occur on your machine,
                    even if our tool failed to detect them. Always practice "Defense in Depth".
                </p>
                {/* ... more legalese ... */}
            </div>
            <Footer />
        </div>
    )
}
