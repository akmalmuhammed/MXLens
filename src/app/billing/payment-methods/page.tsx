import { Button } from "@/components/ui/button";
import { CreditCard, Plus } from "lucide-react";

export default function PaymentMethodsPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-3xl">
            <h1 className="text-3xl font-bold mb-8">Payment Methods</h1>

            <div className="border rounded-xl p-8 text-center bg-muted/20 border-dashed mb-8">
                <div className="mx-auto w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <CreditCard className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="font-medium text-lg mb-2">No payment methods added</h3>
                <p className="text-muted-foreground text-sm mb-6">
                    Add a card to upgrade your plan or pay for one-off reports.
                </p>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Credit Card
                </Button>
            </div>

            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-400">
                <strong className="block mb-1">Secure Payments</strong>
                Your payment information is encrypted and processed securely by Stripe. We do not store your full card details.
            </div>
        </div>
    );
}
