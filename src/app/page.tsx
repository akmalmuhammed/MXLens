import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { ArchitectureSection } from "@/components/landing/ArchitectureSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { UseCasesSection } from "@/components/landing/UseCasesSection";
import { DetectionCapabilitiesSection } from "@/components/landing/DetectionCapabilitiesSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden relative">
      {/* Unified flowing background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Subtle cyber grid overlay */}
        <div className="absolute inset-0 cyber-grid opacity-20" />

        {/* Flowing glow orbs positioned strategically */}
        <div className="absolute top-[10%] left-[10%] w-[600px] h-[600px] bg-primary/8 rounded-full blur-[150px]" />
        <div className="absolute top-[40%] right-[5%] w-[400px] h-[400px] bg-accent/6 rounded-full blur-[120px]" />
        <div className="absolute top-[70%] left-[20%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[140px]" />
      </div>

      <Navbar />
      <main className="flex-grow relative z-10">
        <HeroSection />
        <ArchitectureSection />
        <HowItWorksSection />
        <UseCasesSection />
        <DetectionCapabilitiesSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
