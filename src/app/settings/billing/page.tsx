import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default function BillingPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Billing & Subscription</h1>
                <p className="text-muted-foreground">Manage your plan, payment methods, and invoices.</p>
            </div>

            {/* Current Plan Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-border rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 bg-cyan-500/10 text-cyan-400 text-xs font-bold rounded-bl-xl border-l border-b border-cyan-500/20">
                    CURRENT PLAN
                </div>

                <div className="flex items-baseline gap-2 mb-2">
                    <h2 className="text-3xl font-bold">Analyst Pro</h2>
                    <span className="text-muted-foreground">/ monthly</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">Next billing date: <strong>January 21, 2025</strong></p>

                <div className="flex gap-4">
                    <Button variant="outline" className="border-cyan-500/50 hover:bg-cyan-950/30">Change Plan</Button>
                    <Button>Manage in Stripe</Button>
                </div>
            </div>

            {/* Invoice History Stub */}
            <div className="pt-8 border-t border-border/50">
                <h2 className="text-lg font-semibold mb-4">Invoice History</h2>
                <div className="border border-border/50 rounded-lg divide-y divide-border/50">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-4">
                            <div>
                                <div className="font-medium">Invoice #INV-2024-00{i}</div>
                                <div className="text-sm text-muted-foreground">Dec {21 - i}, 2024</div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-medium text-green-500">$29.00</span>
                                <Button variant="ghost" size="sm">Download</Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
