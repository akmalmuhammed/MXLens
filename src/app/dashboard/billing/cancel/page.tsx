import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function CancelPlanPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-2xl text-center space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Switch to Free Plan?</h1>
                <p className="text-muted-foreground mt-2">
                    We're sorry to see you go. Your plan benefits will continue until the end of your billing cycle on Dec 31, 2025.
                </p>
            </div>

            <Card className="text-left border-amber-500/20 bg-amber-500/5">
                <CardContent className="p-6 flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
                    <div>
                        <h3 className="font-bold text-amber-500 mb-1">Impact of Cancellation</h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            <li>You will be limited to 10 scans per day.</li>
                            <li>Analysis history older than 24 hours will be deleted.</li>
                            <li>API access will be revoked.</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

            <div className="flex flex-col gap-3 max-w-xs mx-auto">
                <Button variant="destructive">Confirm Cancellation</Button>
                <Button variant="ghost">Keep My Plan</Button>
            </div>

            <p className="text-xs text-muted-foreground">
                Questions? <a href="/contact" className="underline">Contact Support</a>
            </p>
        </div>
    );
}
