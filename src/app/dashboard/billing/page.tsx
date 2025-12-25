import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, CreditCard, ChevronRight } from "lucide-react";
import { getDashboardStats } from "@/actions/dashboard";

export default async function BillingPage() {
    const stats = await getDashboardStats();
    const dailyLimit = 10;

    return (
        <div className="container mx-auto px-4 py-12 max-w-5xl">
            <h1 className="text-3xl font-bold mb-8">Billing & Subscription</h1>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
                <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Crown className="w-5 h-5 text-amber-500" />
                            Current Plan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold mb-1">Free Tier</div>
                        <p className="text-sm text-muted-foreground mb-6">Limited to {dailyLimit} scans per day.</p>
                        <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span>Daily Usage</span>
                                <span className="font-mono">{stats.dailyScans} / {dailyLimit}</span>
                            </div>
                            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-cyan-500" style={{ width: `${Math.min((stats.dailyScans / dailyLimit) * 100, 100)}%` }} />
                            </div>
                        </div>
                        <div className="mt-8">
                            <Link href="/billing/upgrade">
                                <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0">
                                    Upgrade to Pro
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <Link href="/billing/plans">
                        <Card className="hover:border-cyan-500/50 transition-colors cursor-pointer group">
                            <CardContent className="p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-slate-800 rounded-lg group-hover:bg-cyan-900/20 group-hover:text-cyan-400 transition-colors">
                                        <Crown className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold">Compare Plans</h3>
                                        <p className="text-sm text-muted-foreground">See all features and limits</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/billing/payment-methods">
                        <Card className="hover:border-cyan-500/50 transition-colors cursor-pointer group">
                            <CardContent className="p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-slate-800 rounded-lg group-hover:bg-cyan-900/20 group-hover:text-cyan-400 transition-colors">
                                        <CreditCard className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold">Payment Methods</h3>
                                        <p className="text-sm text-muted-foreground">Manage cards and invoices</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </div>
        </div>
    );
}
