import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Check } from "lucide-react";

export default function PlansPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <h1 className="text-3xl font-bold text-center mb-4">Upgrade your Plan</h1>
            <p className="text-center text-muted-foreground mb-12">Unlock advanced features and higher limits.</p>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Free */}
                <Card>
                    <CardHeader>
                        <CardTitle>Free</CardTitle>
                        <CardDescription>For basic personal use</CardDescription>
                        <div className="text-3xl font-bold mt-4">$0 <span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm">
                            <li className="flex gap-2"><Check className="w-4 h-4 text-green-500" /> 10 scans per day</li>
                            <li className="flex gap-2"><Check className="w-4 h-4 text-green-500" /> Basic threat detection</li>
                            <li className="flex gap-2"><Check className="w-4 h-4 text-green-500" /> 24h history retention</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full" disabled>Current Plan</Button>
                    </CardFooter>
                </Card>

                {/* Pro */}
                <Card className="border-cyan-500 shadow-lg shadow-cyan-500/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-cyan-500 text-white text-xs px-2 py-1 rounded-bl">POPULAR</div>
                    <CardHeader>
                        <CardTitle>Pro</CardTitle>
                        <CardDescription>For power users and pros</CardDescription>
                        <div className="text-3xl font-bold mt-4">$15 <span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm">
                            <li className="flex gap-2"><Check className="w-4 h-4 text-cyan-500" /> 500 scans per day</li>
                            <li className="flex gap-2"><Check className="w-4 h-4 text-cyan-500" /> Advanced attachments analysis</li>
                            <li className="flex gap-2"><Check className="w-4 h-4 text-cyan-500" /> 30-day history retention</li>
                            <li className="flex gap-2"><Check className="w-4 h-4 text-cyan-500" /> Priority support</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full bg-cyan-600 hover:bg-cyan-700">Upgrade Now</Button>
                    </CardFooter>
                </Card>

                {/* Team */}
                <Card>
                    <CardHeader>
                        <CardTitle>Team</CardTitle>
                        <CardDescription>For security teams</CardDescription>
                        <div className="text-3xl font-bold mt-4">$49 <span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm">
                            <li className="flex gap-2"><Check className="w-4 h-4 text-green-500" /> Unlimited scans</li>
                            <li className="flex gap-2"><Check className="w-4 h-4 text-green-500" /> API Access</li>
                            <li className="flex gap-2"><Check className="w-4 h-4 text-green-500" /> Team management</li>
                            <li className="flex gap-2"><Check className="w-4 h-4 text-green-500" /> 90-day history retention</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full">Contact Sales</Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
