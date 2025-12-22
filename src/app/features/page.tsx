import { PageHeader } from "@/components/marketing/PageHeader";
import { Footer } from "@/components/landing/Footer";
import { AnimatedFeaturesClient } from "./AnimatedFeaturesClient";

export default function FeaturesPage() {
    return (
        <div className="min-h-screen bg-black text-foreground flex flex-col">
            <PageHeader
                title="Technical Capabilities"
                description="Built for analysts who need to know exactly why an email was flagged. No black boxes."
                badge="Features"
            />

            <AnimatedFeaturesClient />

            <Footer />
        </div>
    );
}
