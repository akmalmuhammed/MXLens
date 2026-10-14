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
import {
    Activity,
    ShieldAlert,
    ShieldCheck,
    TrendingUp,
    Zap,
    Globe,
    AlertOctagon,
    Plus,
    Crown,
    Info,
    TrendingDown,
    Clock,
    ArrowRight
} from "lucide-react";
import { getDashboardStats } from "@/actions/dashboard";
import { formatDistanceToNow } from "date-fns";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export default async function DashboardPage() {
    const stats = await getDashboardStats();
    const dailyLimit = 10; // Free tier limit
    const usagePercent = (stats.dailyScans / dailyLimit) * 100;

    // Determine score interpretation (higher score = safer, 0-100 scale)
    const getScoreInterpretation = (score: number, verdict: string) => {
        // Score is Trust Score: Higher = Safer
        if (score >= 80) return { label: "Safe", color: "text-emerald-500" };
        if (score >= 60) return { label: "Likely Safe", color: "text-emerald-400" };
        if (score >= 40) return { label: "Uncertain", color: "text-amber-500" };
        if (score >= 20) return { label: "Suspicious", color: "text-orange-500" };
        return { label: "High Risk", color: "text-rose-500" };
    };

    // Calculate threat trend (mock for now - would need historical data)
    const threatTrend = stats.threatsFound > 0 ? "up" : "stable";

    return (
        <TooltipProvider>
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
                                        Pro Plan
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
                                    <Link href="/dashboard/history" className="flex-1">
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
                                        <Link href="/dashboard/billing/upgrade">
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
                            <p className="text-xs text-muted-foreground mt-1">All time</p>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm card-sm p-4">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Clean</CardTitle>
                            <Zap className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="text-2xl font-bold font-mono text-emerald-600">{stats.cleanEmails}</div>
                            <p className="text-xs text-muted-foreground mt-1">No threats detected</p>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm card-sm p-4">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Threats</CardTitle>
                            <Activity className="h-4 w-4 text-rose-500" />
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="text-2xl font-bold font-mono text-rose-600">{stats.threatsFound}</div>
                            <p className="text-xs text-muted-foreground mt-1">Suspicious + Malicious</p>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm card-sm p-4">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
                            <div className="flex items-center gap-1">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risk Level</CardTitle>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="h-3 w-3 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="text-xs max-w-[200px]">
                                            Based on threat ratio: Low (&lt;10%), Medium (10-30%), High (&gt;30%)
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <AlertOctagon className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className={`text-2xl font-bold font-mono ${stats.riskLevel === "High" ? "text-rose-500" :
                                    stats.riskLevel === "Medium" ? "text-amber-500" : "text-emerald-500"
                                }`}>{stats.riskLevel}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {stats.totalScans > 0 ? `${Math.round((stats.threatsFound / stats.totalScans) * 100)}% threat rate` : "No data yet"}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Analysis History */}
                <Card className="shadow-sm card-md p-0">
                    <CardHeader className="px-6 py-4 border-b flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base card-title">Recent Activity</CardTitle>
                            <CardDescription className="text-xs">
                                Your latest analyses
                            </CardDescription>
                        </div>
                        <Link href="/dashboard/history">
                            <Button variant="ghost" size="sm" className="gap-1 text-xs">
                                View All <ArrowRight className="w-3 h-3" />
                            </Button>
                        </Link>
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
                                    const isSafe = log.verdict === 'CLEAN';
                                    const isMalicious = log.verdict === 'MALICIOUS';
                                    const scoreInfo = getScoreInterpretation(log.score, log.verdict);

                                    return (
                                        <div key={log.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isMalicious ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' :
                                                        isSafe ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                                                            'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                                                    }`}>
                                                    {isSafe ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <div className={`font-medium text-sm ${isMalicious ? 'text-rose-600' :
                                                            isSafe ? 'text-emerald-600' : 'text-amber-600'
                                                        }`}>
                                                        {log.verdict}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatDistanceToNow(log.timestamp)} ago
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right flex items-center gap-4">
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <div className={`text-sm font-mono ${scoreInfo.color}`}>
                                                            {log.score}/100
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="text-xs">Trust Score: Higher = Safer</p>
                                                    </TooltipContent>
                                                </Tooltip>
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
        </TooltipProvider>
    );
}
