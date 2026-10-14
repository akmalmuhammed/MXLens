import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";

export default function PaymentMethodsPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <h1 className="text-2xl font-bold mb-6">Payment Methods</h1>

            <div className="rounded-lg border bg-card p-8 flex flex-col items-center justify-center text-center space-y-4">
                <div className="p-4 bg-muted rounded-full">
                    <CreditCard className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                    <h3 className="font-semibold text-lg">No payment methods added</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
                        You are currently on the Free plan. To upgrade to Pro, you will need to add a payment method during checkout.
                    </p>
                </div>
                <Button className="mt-4">Add Payment Method</Button>
            </div>
        </div>
    );
}
