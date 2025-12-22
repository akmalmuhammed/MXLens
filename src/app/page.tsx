import { AnimatedLandingClient } from "./AnimatedLandingClient";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-foreground overflow-x-hidden">
      <AnimatedLandingClient />
      <Footer />
    </div>
  );
}
