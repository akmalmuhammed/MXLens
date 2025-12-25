import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { AnalysisResult } from "@/lib/email/HeaderParser";
import { NormalizedSignals, ScoringResult } from "@/lib/email/scoring/types";
import { PrivacyControls } from "../PrivacyControls";
import { VerdictBanner } from "../VerdictBanner";
import { AuthAlignment } from "../AuthAlignment";
import { InteractiveHops } from "../InteractiveHops";
import { AIAnalysisSummary } from "../AIAnalysisSummary";
import { AnalysisRecommendations } from "../AnalysisRecommendations";
import { ArtifactsPanel } from "../ArtifactsPanel";
import { PhishingIndicatorsPanel } from "../PhishingIndicatorsPanel";
import { ShieldAlert } from "lucide-react";

interface EnhancedAnalysis {
    header: AnalysisResult;
    signals: NormalizedSignals;
    scoring: ScoringResult;
    emailContent: { text: string; html: string };
    timestamp: number;
}

interface ResultsDashboardProps {
    analysis: EnhancedAnalysis;
    onClear: () => void;
    analyzeBody: boolean;
    setAnalyzeBody: (v: boolean) => void;
    analyzeAttachments: boolean;
    setAnalyzeAttachments: (v: boolean) => void;
}

export function ResultsDashboard({ analysis, onClear, analyzeBody, setAnalyzeBody, analyzeAttachments, setAnalyzeAttachments }: ResultsDashboardProps) {
    const [mode, setMode] = useState<"analyst" | "raw" | "it">("analyst");
    const [rawTab, setRawTab] = useState<'headers' | 'body_text' | 'body_html' | 'telemetry'>('headers');

    const handleDownloadJSON = () => {
        const exportData = {
            header: analysis.header,
            signals: analysis.signals,
            scoring: analysis.scoring,
            timestamp: analysis.timestamp,
            privacySettings: { analyzeBody, analyzeAttachments }
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `email-analysis-${analysis.timestamp}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDownloadCSV = () => {
        const rows = [
            ['Metric', 'Value'],
            ['Verdict', analysis.scoring.verdict.verdict],
            ['Trust Score', analysis.scoring.trust.score],
            ['Confidence', analysis.scoring.confidence.level],
            ['Subject', `"${analysis.header.headers['Subject'] || ''}"`],
            ['From', `"${analysis.header.headers['From'] || ''}"`],
            ['SPF', analysis.header.auth.spf.status],
            ['DKIM', analysis.header.auth.dkim.status],
            ['DMARC', analysis.header.auth.dmarc.status],
            [],
            ['Header Key', 'Header Value'],
            ...Object.entries(analysis.header.headers).map(([k, v]) => [`"${k}"`, `"${Array.isArray(v) ? v.join('; ') : v}"`])
        ];
        const csvContent = rows.map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `email-analysis-${analysis.timestamp}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 py-6 px-2">
            {/* Header Actions & Tabs */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-border/40">
                <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full md:w-auto">
                    <TabsList className="grid w-full grid-cols-3 h-10 bg-muted/50 p-1 rounded-xl border border-white/5">
                        <TabsTrigger value="analyst" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all text-muted-foreground">Analyst</TabsTrigger>
                        <TabsTrigger value="raw" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all text-muted-foreground">Raw</TabsTrigger>
                        <TabsTrigger value="it" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all text-muted-foreground">Quick IT</TabsTrigger>
                    </TabsList>
                </Tabs>
                <div className="flex gap-2 items-center w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <Button variant="ghost" size="sm" onClick={() => window.print()} title="Export as PDF" className="hover:bg-muted/50">
                        <FileText className="w-4 h-4 mr-2" /> PDF
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleDownloadJSON} title="Download JSON" className="hover:bg-muted/50">
                        <Download className="w-4 h-4 mr-2" /> JSON
                    </Button>

                    {/* Conversion Hook */}
                    <Link href="/auth/signup">
                        <Button variant="outline" size="sm" className="hidden md:flex border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300">
                            Save Report
                        </Button>
                    </Link>

                    <div className="w-px h-6 bg-border mx-2 hidden md:block" />

                    <Button variant="default" size="sm" onClick={onClear} className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                        New Analysis
                    </Button>
                </div>
            </div>

            {/* --- IT MODE --- */}
            {mode === "it" && (
                <div className="max-w-2xl mx-auto space-y-6 text-center py-8">
                    <div className={`p-8 rounded-3xl border shadow-xl backdrop-blur-sm ${analysis.scoring.verdict.verdict === 'Likely Legitimate' ? 'bg-green-50/50 border-green-200/50 dark:bg-green-950/10 dark:border-green-900/30' :
                        analysis.scoring.verdict.verdict === 'High Risk' ? 'bg-red-50/50 border-red-200/50 dark:bg-red-950/10 dark:border-red-900/30' :
                            'bg-yellow-50/50 border-yellow-200/50 dark:bg-yellow-950/10 dark:border-yellow-900/30'
                        }`}>
                        <h2 className={`text-4xl font-extrabold mb-4 font-heading ${analysis.scoring.verdict.verdict === 'Likely Legitimate' ? 'text-green-700 dark:text-green-400' :
                            analysis.scoring.verdict.verdict === 'High Risk' ? 'text-red-700 dark:text-red-400' :
                                'text-yellow-700 dark:text-yellow-400'
                            }`}>
                            {analysis.scoring.verdict.verdict}
                        </h2>
                        <div className="text-6xl font-black text-muted-foreground/10 font-mono tracking-tighter">{analysis.scoring.trust.score}/100</div>

                        {!analyzeBody && (
                            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 border text-sm text-muted-foreground shadow-sm">
                                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                Limited visibility (Headers Only). Enable body analysis for full verdict.
                            </div>
                        )}
                    </div>

                    <div className="bg-card/50 backdrop-blur-md border border-white/5 rounded-2xl p-8 text-left max-w-xl mx-auto shadow-lg hover:shadow-xl transition-shadow">
                        <h4 className="font-semibold text-lg mb-4 flex items-center gap-2 text-foreground">
                            <FileText className="w-5 h-5 text-primary" />
                            Recommended Actions
                        </h4>
                        <ul className="space-y-3">
                            {analysis.header.recommendedActions?.map((action, idx) => (
                                <li key={idx} className="flex items-start gap-3 text-base">
                                    <input type="checkbox" className="mt-1.5 w-4 h-4 rounded border-gray-400 text-primary focus:ring-primary" />
                                    <span className="leading-relaxed">{action}</span>
                                </li>
                            ))}
                            {!analyzeBody && (
                                <li className="flex items-start gap-2 text-sm text-muted-foreground italic pl-7">
                                    Enable body analysis to see content-based removal recommendations.
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            )}

            {/* --- ANALYST MODE --- */}
            {mode === "analyst" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="bg-muted/10 p-4 rounded-xl border border-white/5">
                            <PrivacyControls
                                analyzeBody={analyzeBody}
                                setAnalyzeBody={setAnalyzeBody}
                                analyzeAttachments={analyzeAttachments}
                                setAnalyzeAttachments={setAnalyzeAttachments}
                            />
                        </div>

                        <VerdictBanner
                            verdict={analysis.scoring.verdict.verdict}
                            score={analysis.scoring.trust.score}
                            confidence={analysis.scoring.confidence}
                            reason={analysis.scoring.verdict.reason}
                            factors={[]}
                        />

                        <div className="space-y-4">
                            <h3 className="font-semibold text-xl font-heading text-foreground/90">Authentication Analysis</h3>
                            <AuthAlignment
                                spf={analysis.header.auth.spf}
                                dkim={analysis.header.auth.dkim}
                                dmarc={analysis.header.auth.dmarc}
                            />
                            {analysis.header.arc && analysis.header.arc.status !== 'none' && (
                                <div className="mt-4 text-sm bg-muted/20 border rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-semibold text-foreground/80">ARC Validation:</span>
                                        <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${analysis.header.arc.status === 'pass' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-500'}`}>
                                            {analysis.header.arc.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                                        {analysis.header.arc.details.map((d, i) => <li key={i}>{d}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {analysis.header.impersonationAlert && (
                            <div className="bg-red-950/20 border border-red-500/30 p-6 rounded-xl flex items-start gap-4 shadow-sm backdrop-blur-sm">
                                <ShieldAlert className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-red-500 text-lg">Potential Impersonation Detected</h4>
                                    <p className="text-red-200/90 mt-1 leading-relaxed">{analysis.header.impersonationAlert}</p>
                                </div>
                            </div>
                        )}

                        <PhishingIndicatorsPanel
                            penalties={analysis.scoring.trust.penalties}
                            extractedUrls={analysis.signals.extractedUrls}
                            bodyEnabled={analyzeBody}
                            onEnableBody={() => setAnalyzeBody(true)}
                        />

                        {analysis.header.xHeaders && analysis.header.xHeaders.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-xl font-heading text-foreground/90">Notable Headers</h3>
                                <div className="bg-card/50 rounded-xl border shadow-sm divide-y text-sm">
                                    {analysis.header.xHeaders.map((xh, i) => (
                                        <div key={i} className="p-4 hover:bg-muted/20 transition-colors first:rounded-t-xl last:rounded-b-xl">
                                            <div className="flex flex-col sm:flex-row justify-between items-start mb-2 gap-2">
                                                <span className="font-mono text-xs font-semibold text-primary">{xh.key}</span>
                                                <span className="text-[10px] bg-muted border px-2 py-1 rounded-full text-muted-foreground font-mono break-all line-clamp-1">{xh.value}</span>
                                            </div>
                                            <p className="text-muted-foreground text-sm">{xh.explanation}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="pt-8 border-t border-border/40">
                            <InteractiveHops hops={analysis.header.hops} />
                            <div className="pt-8">
                                <AnalysisRecommendations verdict={analysis.scoring.verdict.verdict} />
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-6 shadow-xl sticky top-4">
                            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Message Headers</h3>
                            <div className="space-y-1.5 group">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground/60 group-hover:text-primary/80 transition-colors">Subject</label>
                                <div className="font-semibold text-base leading-snug">
                                    {(() => {
                                        const subject = Object.entries(analysis.header.headers).find(([k]) => k.toLowerCase() === 'subject')?.[1];
                                        return Array.isArray(subject) ? subject[0] : (subject || 'N/A');
                                    })()}
                                </div>
                            </div>
                            <div className="space-y-1.5 group">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground/60 group-hover:text-primary/80 transition-colors">From</label>
                                <div className="font-medium text-sm break-all bg-muted/30 p-2 rounded-lg border border-transparent group-hover:border-border transition-all">
                                    {(() => {
                                        const from = Object.entries(analysis.header.headers).find(([k]) => k.toLowerCase() === 'from')?.[1];
                                        return Array.isArray(from) ? from[0] : (from || 'N/A');
                                    })()}
                                </div>
                            </div>
                            <div className="space-y-1.5 group">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground/60 group-hover:text-primary/80 transition-colors">Return-Path</label>
                                {(() => {
                                    const rp = Object.entries(analysis.header.headers).find(([k]) => k.toLowerCase() === 'return-path')?.[1];
                                    const val = Array.isArray(rp) ? rp[0] : (rp || 'N/A');
                                    const isSuspicious = analysis.header.anomalies.includes('From/Return-Path Domain Mismatch');
                                    return (
                                        <div className={`font-mono text-xs break-all p-2 rounded-lg border ${isSuspicious ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' : 'text-muted-foreground bg-muted/20 border-transparent'}`}>
                                            {val}
                                            {isSuspicious && (
                                                <div className="flex items-center gap-1 mt-1 text-[10px] font-bold uppercase tracking-wider">
                                                    <AlertTriangle className="w-3 h-3" /> Mismatch
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                            <div className="pt-4 border-t border-white/5">
                                <ArtifactsPanel artifacts={analysis.header.artifacts} />
                            </div>
                        </div>
                        <AIAnalysisSummary analysis={analysis.header} scoring={analysis.scoring} />
                    </div>
                </div>
            )}

            {/* --- RAW MODE --- */}
            {mode === "raw" && (
                <div className="space-y-4">
                    <div className="flex gap-1 mb-4 bg-muted/40 p-1 rounded-xl border border-white/5 w-fit">
                        <Button size="sm" variant={rawTab === 'headers' ? 'secondary' : 'ghost'} onClick={() => setRawTab('headers')} className="rounded-lg hover:bg-background/50">Headers</Button>
                        {analyzeBody && <Button size="sm" variant={rawTab === 'body_text' ? 'secondary' : 'ghost'} onClick={() => setRawTab('body_text')} className="rounded-lg hover:bg-background/50">Body (Text)</Button>}
                        {analyzeBody && <Button size="sm" variant={rawTab === 'body_html' ? 'secondary' : 'ghost'} onClick={() => setRawTab('body_html')} className="rounded-lg hover:bg-background/50">Body (HTML)</Button>}
                        <Button size="sm" variant={rawTab === 'telemetry' ? 'secondary' : 'ghost'} onClick={() => setRawTab('telemetry')} className="rounded-lg hover:bg-background/50">Engine Telemetry</Button>
                    </div>

                    {rawTab === 'headers' && (
                        <div className="relative group">
                            <Button size="sm" variant="outline" className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm" onClick={() => navigator.clipboard.writeText(analysis.header.rawHeaders)}>Copy</Button>
                            <pre className="scrollbar-premium p-6 bg-gray-950 text-gray-100 rounded-xl overflow-x-auto text-xs font-mono whitespace-pre-wrap break-all border border-gray-800 h-[700px] overflow-y-auto leading-relaxed shadow-inner">
                                {analysis.header.rawHeaders}
                            </pre>
                        </div>
                    )}
                    {rawTab === 'body_text' && (
                        <pre className="scrollbar-premium p-6 bg-gray-50 dark:bg-gray-950 text-foreground rounded-xl overflow-x-auto text-xs font-mono whitespace-pre-wrap break-all border h-[700px] overflow-y-auto leading-relaxed shadow-inner">
                            {analysis.emailContent.text || "No text content found."}
                        </pre>
                    )}
                    {rawTab === 'body_html' && (
                        <pre className="scrollbar-premium p-6 bg-gray-50 dark:bg-gray-950 text-foreground rounded-xl overflow-x-auto text-xs font-mono whitespace-pre-wrap break-all border h-[700px] overflow-y-auto leading-relaxed shadow-inner">
                            {analysis.emailContent.html || "No HTML content found."}
                        </pre>
                    )}
                    {rawTab === 'telemetry' && (
                        <div className="bg-card/40 border rounded-xl overflow-hidden">
                            <div className="p-4 border-b bg-muted/20">
                                <h4 className="font-semibold text-sm">Detection Pipeline Performance</h4>
                            </div>
                            <div className="divide-y text-sm">
                                {analysis.scoring.performance ? (
                                    analysis.scoring.performance.map((item, i) => (
                                        <div key={i} className="p-3 flex items-center justify-between hover:bg-muted/10">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${item.status === 'success' ? (item.durationMs > 500 ? 'bg-amber-500' : 'bg-green-500') : 'bg-red-500'}`} />
                                                <span className="font-mono text-xs text-muted-foreground mr-2">{item.id}</span>
                                                <span className="font-medium">{item.name}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {item.status !== 'success' && (
                                                    <span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-500 font-bold uppercase">{item.status}</span>
                                                )}
                                                <span className={`font-mono ${item.durationMs > 500 ? 'text-amber-500 font-bold' : 'text-muted-foreground'}`}>
                                                    {item.durationMs}ms
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-muted-foreground">No telemetry data available.</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
