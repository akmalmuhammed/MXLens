import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Activity, Database, Server } from "lucide-react";

export default function UsagePage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Usage Metrics</h1>
                <p className="text-muted-foreground">Real-time usage of your API limits and storage.</p>
            </div>

            <div className="grid gap-6">
                {/* API Calls */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Server className="w-5 h-5 text-primary" />
                            API Calls
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Monthly Requests</span>
                            <span className="text-muted-foreground">14,203 / 100,000</span>
                        </div>
                        <Progress value={14.2} className="h-2" />
                        <p className="text-xs text-muted-foreground pt-2">Resets on Jan 1, 2026. Overage rate: $0.001/request.</p>
                    </CardContent>
                </Card>

                {/* Storage */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="w-5 h-5 text-primary" />
                            Analysis Storage
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Retention</span>
                            <span className="text-muted-foreground">Unlimited (Pro)</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full flex overflow-hidden">
                            <div className="h-full bg-emerald-500 w-[25%]" title="Malicious (2GB)" />
                            <div className="h-full bg-amber-500 w-[10%]" title="Suspicious (0.8GB)" />
                            <div className="h-full bg-blue-500 w-[40%]" title="Clean (3.2GB)" />
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Malicious</div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" /> Suspicious</div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /> Clean</div>
                        </div>
                    </CardContent>
                </Card>

                {/* Compute */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" />
                            Sandbox Compute Time
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">2h 14m</div>
                        <p className="text-sm text-muted-foreground">Total execution time this billing period.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
