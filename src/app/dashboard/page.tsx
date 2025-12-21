import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Activity, ShieldAlert, ShieldCheck, TrendingUp, Users, Zap, Globe, AlertOctagon } from "lucide-react";

export default function DashboardPage() {
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
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Threats Neutralized</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-2xl font-bold font-mono">1,284</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <TrendingUp className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-500 font-medium">+12%</span> from last week
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Clean Traffic</CardTitle>
                        <Zap className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-2xl font-bold font-mono">14.2k</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Emails processed securely
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-rose-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risk Profile</CardTitle>
                        <AlertOctagon className="h-4 w-4 text-rose-500" />
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">High</div>
                        <div className="mt-2 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full w-[70%] bg-rose-500 rounded-full" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-slate-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Analysts</CardTitle>
                        <Users className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-2xl font-bold font-mono">8</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Currently online across tools
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
                                <CardTitle className="text-base">Recent Threat Analysis</CardTitle>
                                <CardDescription className="text-xs">
                                    Live feed of incoming analysis requests.
                                </CardDescription>
                            </div>
                            <Globe className="w-4 h-4 text-muted-foreground" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/50">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${i % 3 === 0 ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
                                            {i % 3 === 0 ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-foreground">
                                                {i % 3 === 0 ? 'Spear Phishing / CEO Fraud' : 'Standard Verification'}
                                            </div>
                                            <div className="text-xs text-muted-foreground font-mono mt-0.5">
                                                ID: <span className="text-foreground/70">REQ-{202400 + i}</span> • {i * 2} mins ago
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-xs font-bold px-2 py-1 rounded border ${i % 3 === 0 ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 text-rose-700 dark:text-rose-300' : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-700 dark:text-emerald-300'}`}>
                                            {i % 3 === 0 ? 'Malicious' : 'Clean'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Targeted User Widget */}
                <Card className="col-span-3 lg:col-span-2 shadow-sm bg-muted/10 border-dashed">
                    <CardHeader className="px-6 py-4">
                        <CardTitle className="text-sm">Most Targeted Department</CardTitle>
                        <CardDescription className="text-xs">Based on header anomalies.</CardDescription>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 font-bold text-xs">FI</div>
                                    <span className="text-sm font-medium">Finance</span>
                                </div>
                                <span className="text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 rounded">High Risk</span>
                            </div>
                            <Progress value={85} className="h-1.5 bg-muted [&>div]:bg-orange-500" />

                            <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold text-xs">HR</div>
                                    <span className="text-sm font-medium">HR</span>
                                </div>
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded">Medium</span>
                            </div>
                            <Progress value={45} className="h-1.5 bg-muted [&>div]:bg-blue-500" />
                        </div>

                        <div className="mt-6 pt-6 border-t border-dashed">
                            <div className="text-xs text-muted-foreground mb-2">Analysis Rate</div>
                            <div className="text-2xl font-bold font-mono">92/day</div>
                            <div className="text-xs text-muted-foreground mt-1">Upgrade plan to increase limits.</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Live Threat Feed Ticker */}
            <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-background/80 backdrop-blur-md border-t border-border z-10 h-8 flex items-center overflow-hidden">
                <div className="flex items-center gap-2 px-4 shrink-0 bg-background border-r z-20 h-full">
                    <Activity className="w-3 h-3 text-primary animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Live Feed</span>
                </div>
                <div className="flex items-center whitespace-nowrap animate-marquee md:animate-marquee-slow pause-on-hover">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="flex items-center gap-2 px-6 text-xs font-mono text-muted-foreground border-r border-border/30">
                            <span className={i % 2 === 0 ? "text-rose-500" : "text-emerald-500"}>●</span>
                            <span>{i % 2 === 0 ? "MALWARE BLOCKED" : "ANALYSIS COMPLETE"}</span>
                            <span className="opacity-50">IP: 192.168.1.{10 + i}</span>
                            <span className="opacity-50 text-[10px]">[US-EAST]</span>
                        </div>
                    ))}
                    {/* Duplicate for seamless loop */}
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={`dup-${i}`} className="flex items-center gap-2 px-6 text-xs font-mono text-muted-foreground border-r border-border/30">
                            <span className={i % 2 === 0 ? "text-rose-500" : "text-emerald-500"}>●</span>
                            <span>{i % 2 === 0 ? "MALWARE BLOCKED" : "ANALYSIS COMPLETE"}</span>
                            <span className="opacity-50">IP: 192.168.1.{10 + i}</span>
                            <span className="opacity-50 text-[10px]">[US-EAST]</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
