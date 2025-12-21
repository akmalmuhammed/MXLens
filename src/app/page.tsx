import { Hero } from "@/components/landing/Hero";
import { SocialProof } from "@/components/landing/SocialProof";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { UseCases } from "@/components/landing/UseCases";
import { Comparison } from "@/components/landing/Comparison";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-foreground overflow-x-hidden">

      {/* 
        Optional: Top Banner 
        "Beta Access: First 100 teams get 50% lifetime discount"
      */}
      <div className="bg-cyan-950/30 text-cyan-400 text-xs font-bold py-2 text-center border-b border-cyan-500/20 backdrop-blur-sm z-50 relative">
        Limited Time: Premium free until March 2026 for early beta users
      </div>

      <Hero />
      <SocialProof />
      <HowItWorks />
      <Features />
      <UseCases />
      <Comparison />
      <FAQ />

      {/* Final CTA */}
      <section className="py-24 text-center bg-muted/10 border-y border-border/50">
        <div className="container mx-auto px-4 max-w-2xl space-y-6">
          <h2 className="section-headline tracking-tight">
            Ready to secure your inbox?
          </h2>
          <p className="text-muted-foreground text-lg body-text">
            Join hundreds of SOC analysts using MXLens for instant, private forensics.
          </p>
          <div className="flex justify-center pt-4">
            <Link href="/analyze">
              <Button size="lg" className="px-10 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:scale-105 transition-all">
                <Search className="mr-2 h-5 w-5" /> Start Analyzing Securely
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground/70">
            No credit card required. Guest access enabled.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
