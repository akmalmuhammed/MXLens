import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { SocialProof } from "@/components/landing/SocialProof";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { UseCasesSection } from "@/components/landing/UseCasesSection";
import { DetectionCapabilitiesSection } from "@/components/landing/DetectionCapabilitiesSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden pt-16">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <SocialProof />
        <HowItWorksSection />
        <UseCasesSection />
        <DetectionCapabilitiesSection />
        <PricingSection />
        <ComparisonSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
