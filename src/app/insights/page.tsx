import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ShieldAlert, BarChart3, Mail, Globe } from "lucide-react";

export default function InsightsPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Security Insights</h1>
                    <p className="text-muted-foreground">Deep dive into your organization's threat landscape.</p>
                </div>
                <div className="text-sm text-muted-foreground">
                    Last 30 Days
                </div>
            </div>

            {/* Top Stats Row */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-l-4 border-l-emerald-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Clean Traffic</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">92%</div>
                        <p className="text-xs text-muted-foreground">+2% from last month</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-rose-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Threats Blocked</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">14</div>
                        <p className="text-xs text-muted-foreground">-5% from last month</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-amber-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Suspicious Domains</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">8</div>
                        <p className="text-xs text-muted-foreground">3 new domains detected</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Analysis Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1.2s</div>
                        <p className="text-xs text-muted-foreground">Optimized by 200ms</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Area (Mocked with CSS/HTML for now, would replace with Recharts later) */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Threat Volume Over Time
                        </CardTitle>
                        <CardDescription>Daily volume of malicious emails detected.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-end justify-between gap-2 pt-4">
                        {[10, 40, 25, 50, 30, 60, 45, 20, 35, 10, 5, 60, 40, 30].map((h, i) => (
                            <div key={i} className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-sm relative group">
                                <div
                                    className="absolute bottom-0 w-full bg-gradient-to-t from-rose-500 to-rose-400 rounded-t-sm transition-all hover:bg-rose-600"
                                    style={{ height: `${h}%` }}
                                >
                                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded border shadow-sm">
                                        {h}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="w-5 h-5 text-primary" />
                            Top Sender Origins
                        </CardTitle>
                        <CardDescription>Geographic distribution of analyzed emails.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🇺🇸</span>
                                <span className="font-medium">United States</span>
                            </div>
                            <div className="w-1/2 flex items-center gap-2">
                                <div className="h-2 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{ width: '65%' }} />
                                </div>
                                <span className="text-sm font-mono text-muted-foreground">65%</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🇩🇪</span>
                                <span className="font-medium">Germany</span>
                            </div>
                            <div className="w-1/2 flex items-center gap-2">
                                <div className="h-2 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{ width: '15%' }} />
                                </div>
                                <span className="text-sm font-mono text-muted-foreground">15%</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🇷🇺</span>
                                <span className="font-medium">Russia</span>
                            </div>
                            <div className="w-1/2 flex items-center gap-2">
                                <div className="h-2 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-rose-500" style={{ width: '12%' }} />
                                </div>
                                <span className="text-sm font-mono text-muted-foreground">12%</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🇨🇳</span>
                                <span className="font-medium">China</span>
                            </div>
                            <div className="w-1/2 flex items-center gap-2">
                                <div className="h-2 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500" style={{ width: '5%' }} />
                                </div>
                                <span className="text-sm font-mono text-muted-foreground">5%</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-amber-500" />
                        Common Threat Indicators
                    </CardTitle>
                    <CardDescription>Most frequently detected IOCs in your environment.</CardDescription>
                </CardHeader>
                <CardContent>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-left text-muted-foreground">
                                <th className="pb-3 font-medium">Indicator Type</th>
                                <th className="pb-3 font-medium">Pattern</th>
                                <th className="pb-3 font-medium">Frequency</th>
                                <th className="pb-3 font-medium text-right">Risk Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            <tr className="group hover:bg-muted/50 transition-colors">
                                <td className="py-3">SPF Record</td>
                                <td className="py-3 font-mono text-xs">Softfail (none)</td>
                                <td className="py-3">125 hits</td>
                                <td className="py-3 text-right text-amber-500 font-bold">Medium</td>
                            </tr>
                            <tr className="group hover:bg-muted/50 transition-colors">
                                <td className="py-3">Attachment</td>
                                <td className="py-3 font-mono text-xs">.html double extension</td>
                                <td className="py-3">42 hits</td>
                                <td className="py-3 text-right text-rose-500 font-bold">High</td>
                            </tr>
                            <tr className="group hover:bg-muted/50 transition-colors">
                                <td className="py-3">Link Reputation</td>
                                <td className="py-3 font-mono text-xs">Bit.ly redirect chain</td>
                                <td className="py-3">38 hits</td>
                                <td className="py-3 text-right text-rose-500 font-bold">High</td>
                            </tr>
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}
