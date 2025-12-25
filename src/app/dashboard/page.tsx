import Link from "next/link";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Activity, ShieldAlert, ShieldCheck, TrendingUp, Zap, Globe, AlertOctagon, Plus, Crown } from "lucide-react";
import { getDashboardStats } from "@/actions/dashboard";
import { formatDistanceToNow } from "date-fns";

export default async function DashboardPage() {
    const stats = await getDashboardStats();
    const dailyLimit = 10; // Free tier limit
    const usagePercent = (stats.dailyScans / dailyLimit) * 100;

    return (
        <div className="space-y-6 relative pb-20">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-heading">Dashboard</h1>
                    <p className="text-muted-foreground text-sm">Overview of your recent security findings.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        System Operational
                    </div>
                </div>
            </div>

            {/* Quick Actions & Quota - Prominent for returning users */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                    <CardHeader>
                        <CardTitle>Quick Analyze</CardTitle>
                        <CardDescription>Scan a new email for threats immediately.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/analyze">
                            <Button size="lg" className="w-full sm:w-auto gap-2 text-lg h-12">
                                <Plus className="w-5 h-5" />
                                New Analysis
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {stats.isPremium ? (
                    <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Crown className="w-4 h-4 text-amber-500" />
                                    Premium Plan
                                </CardTitle>
                                <span className="text-xs font-bold bg-amber-500/10 text-amber-500 px-2 py-1 rounded border border-amber-500/20">Active</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end justify-between mb-2">
                                <div className="text-2xl font-bold">Unlimited <span className="text-sm font-normal text-muted-foreground">scans</span></div>
                                <div className="text-xs text-muted-foreground">Next billing: Dec 31</div>
                            </div>
                            <Progress value={100} className="h-2 bg-slate-100 dark:bg-slate-800 [&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-orange-500" />
                            <div className="mt-4 flex gap-2">
                                <Link href="/insights" className="flex-1">
                                    <Button variant="outline" size="sm" className="w-full gap-2 text-xs h-8">
                                        <TrendingUp className="w-3 h-3 text-cyan-500" />
                                        View Insights
                                    </Button>
                                </Link>
                                <Link href="/history" className="flex-1">
                                    <Button variant="outline" size="sm" className="w-full gap-2 text-xs h-8">
                                        <Globe className="w-3 h-3 text-primary" />
                                        Full History
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-dashed">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium">Daily Free Limit</CardTitle>
                                <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-muted-foreground">Free Plan</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end justify-between mb-2">
                                <div className="text-2xl font-bold">{stats.dailyScans} <span className="text-sm font-normal text-muted-foreground">/ {dailyLimit}</span></div>
                                <div className="text-xs text-muted-foreground">Resets in 12h</div>
                            </div>
                            <Progress value={usagePercent} className={`h-2 ${usagePercent > 90 ? "bg-red-100 [&>div]:bg-red-500" : ""}`} />

                            {stats.dailyScans >= dailyLimit ? (
                                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs flex gap-2">
                                    <AlertOctagon className="w-4 h-4 text-amber-500 shrink-0" />
                                    <span className="text-amber-600 dark:text-amber-400">Limit reached. Upgrade for unlimited.</span>
                                </div>
                            ) : (
                                <div className="mt-4">
                                    <Link href="/billing/upgrade">
                                        <Button variant="outline" size="sm" className="w-full gap-2 text-xs h-8">
                                            <Crown className="w-3 h-3 text-amber-500" />
                                            Remove Limits
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="grid gap-[var(--space-6)] md:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-sm card-sm p-4">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Scans</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold font-mono">{stats.totalScans}</div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm card-sm p-4">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Clean</CardTitle>
                        <Zap className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold font-mono">{stats.cleanEmails}</div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm card-sm p-4">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Threats</CardTitle>
                        <Activity className="h-4 w-4 text-rose-500" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold font-mono text-rose-600">{stats.threatsFound}</div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm card-sm p-4">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risk Level</CardTitle>
                        <AlertOctagon className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold font-mono text-amber-500">{stats.riskLevel}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Analysis History */}
            <Card className="shadow-sm card-md p-0">
                <CardHeader className="px-6 py-4 border-b flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-base card-title">Recent Activity</CardTitle>
                        <CardDescription className="text-xs">
                            Last 5 analyses.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {stats.recentLogs.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center">
                            <Globe className="w-12 h-12 text-muted-foreground/20 mb-4" />
                            <p className="text-muted-foreground text-sm mb-4">No analysis history found.</p>
                            <Link href="/analyze">
                                <Button variant="outline">Analyze First Email</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/50">
                            {stats.recentLogs.map((log) => {
                                const isSafe = ['Likely Legitimate', 'Safe', 'Clean'].includes(log.verdict);
                                return (
                                    <div key={log.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${!isSafe ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
                                                {!isSafe ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm text-foreground">
                                                    {log.verdict}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                    {formatDistanceToNow(log.timestamp)} ago
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center gap-4">
                                            <div className="text-xs font-mono text-muted-foreground hidden sm:block">
                                                Score: {log.score}
                                            </div>
                                            <Link href={`/analysis/${log.id}`} passHref>
                                                <Button size="sm" variant="ghost" className="h-8">Details</Button>
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
