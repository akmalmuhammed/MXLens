import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

export default function OnboardingWelcomePage() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
            <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
                <div className="mx-auto w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-8">
                    <ShieldCheck className="w-10 h-10 text-primary" />
                </div>
                <h1 className="text-4xl font-extrabold text-foreground mb-4">Welcome to MXLens</h1>
                <p className="text-muted-foreground mb-8 text-lg">
                    You've taken the first step towards a safer inbox. Let's get you set up in less than 2 minutes.
                </p>
                <Link href="/onboarding/role-selection">
                    <Button size="lg" className="w-full text-lg h-12">Get Started</Button>
                </Link>
            </div>
        </div>
    );
}
