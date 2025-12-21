import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
// import Confetti from "@/components/ui/confetti"; // Assuming we might add this later

export default function OnboardingCompletePage() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
            <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
                <div className="mx-auto w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-8">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                </div>
                <h1 className="text-4xl font-extrabold text-foreground mb-4">You're all set!</h1>
                <p className="text-muted-foreground mb-12 text-lg">
                    Your account is configured and usage limits are active. Go ahead and run your first scan.
                </p>
                <div className="space-y-4">
                    <Link href="/analyze">
                        <Button size="lg" className="w-full text-lg h-12 bg-emerald-600 hover:bg-emerald-500">Start Analysis</Button>
                    </Link>
                    <Link href="/dashboard">
                        <Button variant="ghost" className="w-full">Go to Dashboard</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
