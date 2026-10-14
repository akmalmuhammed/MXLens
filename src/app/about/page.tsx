import { PageHeader } from "@/components/marketing/PageHeader";
import { Footer } from "@/components/landing/Footer";
import { AnimatedAboutClient } from "./AnimatedAboutClient";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-black text-foreground flex flex-col">
            <PageHeader
                title="Democratizing Cyber Defense"
                description="We believe every analyst deserves enterprise-grade forensics, regardless of their budget."
                badge="About Us"
            />

            <AnimatedAboutClient />

            <Footer />
        </div>
    );
}
