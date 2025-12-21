import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Crown, ArrowLeft } from "lucide-react";

export default function LimitReachedPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
            <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
                <div className="mx-auto w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mb-8 border border-amber-500/20">
                    <Crown className="w-12 h-12 text-amber-500" />
                </div>
                <h1 className="text-4xl font-extrabold text-foreground mb-4">You've hit your limit</h1>
                <p className="text-muted-foreground mb-8 text-lg">
                    You've used all 10 free scans for today. Upgrade to Pro for unlimited access immediately.
                </p>

                <div className="space-y-4">
                    <Link href="/billing/upgrade">
                        <Button size="lg" className="w-full text-lg h-14 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-0">
                            Upgrade Now
                        </Button>
                    </Link>
                    <Link href="/dashboard">
                        <Button variant="ghost" className="w-full">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Button>
                    </Link>
                </div>

                <p className="mt-8 text-xs text-muted-foreground">
                    Quota resets in 12 hours.
                </p>
            </div>
        </div>
    );
}
