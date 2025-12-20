import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Zap, Lock, BarChart3 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center py-24 px-6 text-center bg-gradient-to-b from-background to-muted/30">
        <div className="flex items-center gap-2 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-primary/10 p-2 rounded-full">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <span className="text-xl font-bold tracking-tight">MXLens</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-3xl animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
          Analyze Phishing Emails <span className="text-primary block mt-2">Without Exposing Data</span>
        </h1>

        <p className="text-lg text-muted-foreground mb-10 max-w-2xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
          Enterprise-grade email forensics that runs entirely in your browser.
          Zero data uploads. Zero privacy compromises.
          Instantly visualize headers, authentication paths, and threat signals.
        </p>

        <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-7 duration-700 delay-300">
          <Link href="/analyze">
            <Button size="lg" className="h-12 px-8 text-base">
              Start Analysis Now
            </Button>
          </Link>
          <Link href="#features">
            <Button variant="outline" size="lg" className="h-12 px-8 text-base">
              Learn More
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 bg-muted/20">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-card p-6 rounded-xl border shadow-sm flex flex-col items-center text-center">
            <div className="bg-blue-500/10 p-3 rounded-full mb-4">
              <Lock className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">100% Client-Side</h3>
            <p className="text-muted-foreground">Your sensitive emails never leave your device. All processing happens locally in your browser memory.</p>
          </div>

          <div className="bg-card p-6 rounded-xl border shadow-sm flex flex-col items-center text-center">
            <div className="bg-amber-500/10 p-3 rounded-full mb-4">
              <Zap className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Instant Results</h3>
            <p className="text-muted-foreground">No queues, no waiting. Get immediate verdicts on SPF, DKIM, DMARC, and hop anomalies.</p>
          </div>

          <div className="bg-card p-6 rounded-xl border shadow-sm flex flex-col items-center text-center">
            <div className="bg-green-500/10 p-3 rounded-full mb-4">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Visual Forensics</h3>
            <p className="text-muted-foreground">Interactive graphs for email hops and visual breakdowns of authentication headers.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-muted-foreground border-t">
        <div className="container mx-auto">
          <p>&copy; {new Date().getFullYear()} MXLens. Secure Email Analysis.</p>
        </div>
      </footer>
    </div>
  );
}
