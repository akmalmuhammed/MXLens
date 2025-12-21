import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default function UpgradePage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl text-center">
            <h1 className="text-4xl font-extrabold mb-4">Upgrade Your Arsenal</h1>
            <p className="text-muted-foreground text-lg mb-12">
                Uncap your limits and get access to advanced forensic tools.
            </p>

            <div className="grid md:grid-cols-2 gap-8 items-start">
                {/* Free Tier */}
                <div className="p-8 rounded-2xl border border-border bg-card/50">
                    <h3 className="text-xl font-bold mb-2">Free</h3>
                    <div className="text-4xl font-extrabold mb-6">$0</div>
                    <ul className="mb-8 space-y-4 text-left">
                        <li className="flex gap-2 text-sm text-muted-foreground">
                            <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                            10 Scans per Day
                        </li>
                        <li className="flex gap-2 text-sm text-muted-foreground">
                            <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                            Basic Header Analysis
                        </li>
                        <li className="flex gap-2 text-sm text-muted-foreground">
                            <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                            Community Support
                        </li>
                    </ul>
                    <Button variant="outline" className="w-full" disabled>Current Plan</Button>
                </div>

                {/* Pro Tier */}
                <div className="p-8 rounded-2xl border-2 border-cyan-500 bg-cyan-950/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>
                    <h3 className="text-xl font-bold mb-2 text-cyan-500">Pro Analyst</h3>
                    <div className="text-4xl font-extrabold mb-1">$29<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
                    <p className="text-xs text-muted-foreground mb-6">Billed annually</p>

                    <ul className="mb-8 space-y-4 text-left">
                        <li className="flex gap-2 text-sm text-foreground">
                            <Check className="w-5 h-5 text-cyan-500 shrink-0" />
                            <strong>Unlimited</strong> Daily Scans
                        </li>
                        <li className="flex gap-2 text-sm text-foreground">
                            <Check className="w-5 h-5 text-cyan-500 shrink-0" />
                            Deep Attachment Sandboxing
                        </li>
                        <li className="flex gap-2 text-sm text-foreground">
                            <Check className="w-5 h-5 text-cyan-500 shrink-0" />
                            Priority API Access
                        </li>
                        <li className="flex gap-2 text-sm text-foreground">
                            <Check className="w-5 h-5 text-cyan-500 shrink-0" />
                            Save Analysis History
                        </li>
                    </ul>
                    <Button className="w-full bg-cyan-600 hover:bg-cyan-500 h-12 text-lg">Upgrade Now</Button>
                </div>
            </div>
        </div>
    );
}
