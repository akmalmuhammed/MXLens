import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";

export default function PaymentFailed() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
            <div className="h-32 w-32 bg-red-900/20 rounded-full flex items-center justify-center text-destructive mb-8">
                <CreditCard className="h-16 w-16" />
            </div>
            <h1 className="text-4xl font-extrabold text-foreground mb-4">Payment Failed</h1>
            <h2 className="text-xl font-semibold mb-4 text-slate-400">Transaction processing error</h2>
            <p className="text-muted-foreground max-w-md mb-8">
                We couldn't process your payment. Please check your billing details or try a different card.
            </p>
            <div className="flex gap-4">
                <Link href="/settings/billing">
                    <Button className="h-12 px-8">Update Billing Method</Button>
                </Link>
                <Link href="mailto:support@mxlens.com">
                    <Button variant="ghost" className="h-12 px-8">Contact Support</Button>
                </Link>
            </div>
        </div>
    );
}
