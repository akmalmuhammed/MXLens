import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, Shield, AlertTriangle, Clock, BarChart3, PieChart } from "lucide-react";

export const metadata = {
    title: "Insights | MXLens",
    description: "Deep analytics and trends from your email security analyses.",
};

export default async function InsightsPage() {
    const session = await auth();
    if (!session?.user?.orgId) {
        redirect("/auth/signin");
    }

    // Fetch aggregated stats
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalAnalyses, verdictBreakdown, recentTrend] = await Promise.all([
        db.analysisLog.count({
            where: { orgId: session.user.orgId }
        }),
        db.analysisLog.groupBy({
            by: ['verdict'],
            where: { orgId: session.user.orgId },
            _count: { verdict: true }
        }),
        db.analysisLog.findMany({
            where: {
                orgId: session.user.orgId,
                createdAt: { gte: thirtyDaysAgo }
            },
            select: { createdAt: true, verdict: true, riskScore: true },
            orderBy: { createdAt: 'asc' }
        })
    ]);

    // Calculate stats
    const clean = verdictBreakdown.find(v => v.verdict === 'CLEAN')?._count.verdict || 0;
    const suspicious = verdictBreakdown.find(v => v.verdict === 'SUSPICIOUS')?._count.verdict || 0;
    const malicious = verdictBreakdown.find(v => v.verdict === 'MALICIOUS')?._count.verdict || 0;
    const avgScore = recentTrend.length > 0
        ? Math.round(recentTrend.reduce((acc, r) => acc + r.riskScore, 0) / recentTrend.length)
        : 0;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-heading">Security Insights</h1>
                <p className="text-muted-foreground">Trends and analytics from your email analyses (Last 30 days).</p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{totalAnalyses.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">All time</p>
                    </CardContent>
                </Card>

                <Card className="border-green-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Clean Emails</CardTitle>
                        <Shield className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-500">{clean}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {totalAnalyses > 0 ? Math.round((clean / totalAnalyses) * 100) : 0}% of total
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-amber-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Suspicious</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-amber-500">{suspicious}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {totalAnalyses > 0 ? Math.round((suspicious / totalAnalyses) * 100) : 0}% of total
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-red-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Malicious</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-500">{malicious}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {totalAnalyses > 0 ? Math.round((malicious / totalAnalyses) * 100) : 0}% of total
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Trend Overview */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Average Risk Score
                        </CardTitle>
                        <CardDescription>Based on last 30 days of analyses</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-4">
                            <div className="text-6xl font-bold font-mono">{avgScore}</div>
                            <div className="text-muted-foreground pb-2">/ 100</div>
                        </div>
                        <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all ${avgScore < 30 ? 'bg-green-500' :
                                        avgScore < 60 ? 'bg-amber-500' : 'bg-red-500'
                                    }`}
                                style={{ width: `${avgScore}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-primary" />
                            Verdict Distribution
                        </CardTitle>
                        <CardDescription>Breakdown by analysis outcome</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                    <span className="text-sm">Clean</span>
                                </div>
                                <span className="font-mono text-sm">{clean}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                                    <span className="text-sm">Suspicious</span>
                                </div>
                                <span className="font-mono text-sm">{suspicious}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <span className="text-sm">Malicious</span>
                                </div>
                                <span className="font-mono text-sm">{malicious}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity Timeline */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        Recent Activity
                    </CardTitle>
                    <CardDescription>Last 30 days of email analyses</CardDescription>
                </CardHeader>
                <CardContent>
                    {recentTrend.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No analyses in the last 30 days. Start analyzing emails to see trends!
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground">
                            {recentTrend.length} analyses recorded in the last 30 days.
                            {/* Future: Add a chart visualization here */}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
