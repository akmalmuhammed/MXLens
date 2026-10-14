import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, ShieldCheck, Download, Save, Share2, Printer, ChevronLeft, Flag } from "lucide-react";
import Link from "next/link";

export default async function AnalysisResultPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    // Mock data based on ID
    const isMalicious = params.id.startsWith('mal');
    const verdict = isMalicious ? "Malicious" : "Clean";
    const score = isMalicious ? 92 : 15;

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <Link href="/history" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <ChevronLeft className="w-4 h-4" /> Back to History
                </Link>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" /> Export PDF
                    </Button>
                    <Button variant="outline" size="sm">
                        <Share2 className="w-4 h-4 mr-2" /> Share
                    </Button>
                    <Button variant="default" size="sm">
                        <Save className="w-4 h-4 mr-2" /> Save to Case
                    </Button>
                </div>
            </div>

            {/* Verdict Hero */}
            <div className={`rounded-xl p-8 border-l-8 shadow-sm ${isMalicious ? 'bg-rose-500/5 border-rose-500' : 'bg-emerald-500/5 border-emerald-500'}`}>
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center shrink-0 ${isMalicious ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {isMalicious ? <ShieldAlert className="w-10 h-10" /> : <ShieldCheck className="w-10 h-10" />}
                        </div>
                        <div>
                            <h1 className={`text-3xl font-bold mb-2 ${isMalicious ? 'text-rose-600' : 'text-emerald-600'}`}>
                                Verdict: {verdict}
                            </h1>
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className="text-base px-3 py-1">Score: {score}/100</Badge>
                                <span className="text-muted-foreground text-sm">Analyzed on Dec 21, 2025 at 14:32</span>
                            </div>
                        </div>
                    </div>
                    {isMalicious && (
                        <div className="flex flex-col gap-2 w-full md:w-auto">
                            <Button variant="destructive" className="w-full">
                                <Flag className="w-4 h-4 mr-2" /> Report Phishing
                            </Button>
                            <p className="text-xs text-muted-foreground text-center">Automatically notifies SOC team</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Authentication Checks</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="font-mono font-bold text-muted-foreground">SPF</div>
                                <div>
                                    <div className="font-medium">Sender Policy Framework</div>
                                    <div className="text-xs text-muted-foreground">google.com authorized sender</div>
                                </div>
                            </div>
                            <Badge className="bg-emerald-500 hover:bg-emerald-600">PASS</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="font-mono font-bold text-muted-foreground">DKIM</div>
                                <div>
                                    <div className="font-medium">DomainKeys Identified Mail</div>
                                    <div className="text-xs text-muted-foreground">Signature valid</div>
                                </div>
                            </div>
                            <Badge className="bg-emerald-500 hover:bg-emerald-600">PASS</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
                            <div className="flex items-center gap-3">
                                <div className="font-mono font-bold text-amber-600">DMARC</div>
                                <div>
                                    <div className="font-medium">Domain-based Message Auth</div>
                                    <div className="text-xs text-muted-foreground">Policy not found</div>
                                </div>
                            </div>
                            <Badge variant="outline" className="border-amber-500 text-amber-500">NONE</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Message Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div>
                            <span className="block text-muted-foreground text-xs uppercase tracking-wider">Subject</span>
                            <span className="font-medium">Urgent: Invoice Overdue #99282</span>
                        </div>
                        <div>
                            <span className="block text-muted-foreground text-xs uppercase tracking-wider">From</span>
                            <span className="font-medium break-all">billing-support@accounts-google.com</span>
                        </div>
                        <div>
                            <span className="block text-muted-foreground text-xs uppercase tracking-wider">Return-Path</span>
                            <span className="font-medium break-all">bounce-8382@malign.org</span>
                        </div>
                        <div>
                            <span className="block text-muted-foreground text-xs uppercase tracking-wider">IP Address</span>
                            <span className="font-medium">192.168.1.1</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Suspicious Indicators */}
            <Card>
                <CardHeader>
                    <CardTitle>Suspicious Indicators</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3 text-sm p-2 rounded hover:bg-muted/50">
                            <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                            <span className="flex-1">
                                <strong className="font-semibold text-rose-500">Mismatched Return-Path: </strong>
                                The Return-Path domain (malign.org) does not match the From domain (accounts-google.com).
                            </span>
                        </li>
                        <li className="flex items-start gap-3 text-sm p-2 rounded hover:bg-muted/50">
                            <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                            <span className="flex-1">
                                <strong className="font-semibold text-amber-500">Generic Greeting: </strong>
                                Uses non-specific greeting "Dear Customer".
                            </span>
                        </li>
                        <li className="flex items-start gap-3 text-sm p-2 rounded hover:bg-muted/50">
                            <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                            <span className="flex-1">
                                <strong className="font-semibold text-amber-500">Urgency: </strong>
                                Subject line indicates high urgency ("Urgent", "Overdue").
                            </span>
                        </li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
