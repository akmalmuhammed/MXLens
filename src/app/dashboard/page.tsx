import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Activity, ShieldAlert, ShieldCheck, TrendingUp, Users, Zap, Globe, AlertOctagon } from "lucide-react";
import { getDashboardStats } from "@/actions/dashboard";
import { formatDistanceToNow } from "date-fns";

export default async function DashboardPage() {
    const stats = await getDashboardStats();

    return (
        <div className="space-y-6 relative pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight font-heading">Security Overview</h1>
                    <p className="text-muted-foreground text-sm">Real-time threat intelligence and analysis based on local telemetry.</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-1 rounded-full border">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    System Operational
                </div>
            </div>

            {/* High Density Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Detailed Scans</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-2xl font-bold font-mono">{stats.totalScans}</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <TrendingUp className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-500 font-medium">Active</span>
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Clean Traffic</CardTitle>
                        <Zap className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-2xl font-bold font-mono">{stats.cleanEmails}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Verdicts marked Safe
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-rose-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risk Profile</CardTitle>
                        <AlertOctagon className="h-4 w-4 text-rose-500" />
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className={`text-2xl font-bold font-mono ${stats.riskLevel === 'High' ? 'text-rose-600' : 'text-foreground'}`}>{stats.riskLevel}</div>
                        <div className="mt-2 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${stats.riskLevel === 'High' ? 'bg-rose-500 w-[70%]' : stats.riskLevel === 'Medium' ? 'bg-yellow-500 w-[40%]' : 'bg-green-500 w-[10%]'}`} />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-slate-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Threats Found</CardTitle>
                        <Activity className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-2xl font-bold font-mono">{stats.threatsFound}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            High Risk / Malicious
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Attack Vectors - More Analytical */}
                <Card className="col-span-4 lg:col-span-5 shadow-sm">
                    <CardHeader className="px-6 py-4 border-b">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base">Recent Analysis History</CardTitle>
                                <CardDescription className="text-xs">
                                    Your personal scan log.
                                </CardDescription>
                            </div>
                            <Globe className="w-4 h-4 text-muted-foreground" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {stats.recentLogs.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm">
                                No scans yet. Analyze your first email!
                            </div>
                        ) : (
                            <div className="divide-y divide-border/50">
                                {stats.recentLogs.map((log) => {
                                    const isSafe = ['Likely Legitimate', 'Safe', 'Clean'].includes(log.verdict);
                                    return (
                                        <div key={log.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${!isSafe ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
                                                    {!isSafe ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-foreground">
                                                        {log.verdict}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground font-mono mt-0.5">
                                                        Score: {log.score}/100 • {formatDistanceToNow(log.timestamp)} ago
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-xs font-bold px-2 py-1 rounded border ${!isSafe ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 text-rose-700 dark:text-rose-300' : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-700 dark:text-emerald-300'}`}>
                                                    {!isSafe ? 'Flagged' : 'Clean'}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Targeted User Widget */}
                <Card className="col-span-3 lg:col-span-2 shadow-sm bg-muted/10 border-dashed">
                    <CardHeader className="px-6 py-4">
                        <CardTitle className="text-sm">Usage Quota</CardTitle>
                        <CardDescription className="text-xs">Current plan limits.</CardDescription>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Scan Limit</span>
                                <span className="text-xs font-bold text-primary px-2 py-0.5 rounded">{stats.totalScans} / 1000</span>
                            </div>
                            <Progress value={(stats.totalScans / 1000) * 100} className="h-1.5 bg-muted [&>div]:bg-primary" />
                        </div>

                        <div className="mt-6 pt-6 border-t border-dashed">
                            <div className="text-xs text-muted-foreground mb-2">Plan Status</div>
                            <div className="text-2xl font-bold font-mono">My Plan</div>
                            <div className="text-xs text-muted-foreground mt-1">Upgrade to Enterprise for unlimited history.</div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
