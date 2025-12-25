import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ShieldAlert, ShieldCheck, ArrowLeft, Download, FileText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AnalysisDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;

    const session = await auth();

    if (!session?.user?.id || !session?.user?.orgId) {
        return redirect("/auth/signin");
    }

    const log = await db.analysisLog.findUnique({
        where: { id: params.id },
    });

    if (!log) {
        return notFound();
    }

    // Security Check: Ensure user belongs to the same org
    if (log.orgId !== session.user.orgId && session.user.role !== 'ADMIN') {
        return notFound(); // Hide existence
    }

    const isSafe = ['CLEAN', 'LIKELY_LEGITIMATE'].includes(log.verdict);
    const meta = log.meta as any; // Type capability limitation

    return (
        <div className="container mx-auto py-10 max-w-4xl space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/dashboard">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold font-heading">Analysis Report</h1>
                    <p className="text-muted-foreground text-sm font-mono">{log.id}</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Verdict Card */}
                <Card className={`md:col-span-2 border-l-4 ${isSafe ? 'border-l-emerald-500' : 'border-l-rose-500'}`}>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    {isSafe ? <ShieldCheck className="w-6 h-6 text-emerald-500" /> : <ShieldAlert className="w-6 h-6 text-rose-500" />}
                                    {log.verdict}
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    Processed {formatDistanceToNow(log.createdAt)} ago
                                </CardDescription>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold font-mono">{log.riskScore}/100</div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wider">Risk Score</div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="mt-4 p-4 rounded-lg bg-muted/50 text-sm">
                            <h4 className="font-semibold mb-2">Findings Summary</h4>
                            <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                                {meta?.spf && <li>SPF Authentication: <Badge variant="outline">{meta.spf}</Badge></li>}
                                {meta?.dkim && <li>DKIM Signature: <Badge variant="outline">{meta.dkim}</Badge></li>}
                                {meta?.hasAttachments && <li>Contains Attachments: <Badge variant="outline">Yes</Badge></li>}
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {/* Metadata Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Metadata</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div className="flex justify-between py-1 border-b">
                            <span className="text-muted-foreground">Confidence</span>
                            <span className="font-medium">{log.confidence}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b">
                            <span className="text-muted-foreground">Duration</span>
                            <span className="font-medium">{log.processingMs}ms</span>
                        </div>
                        <div className="flex justify-between py-1 border-b">
                            <span className="text-muted-foreground">Method</span>
                            <span className="font-medium">Web/Client</span>
                        </div>
                        <div className="mt-6">
                            <Button variant="outline" className="w-full gap-2" disabled>
                                <Download className="w-4 h-4" />
                                Export JSON
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
