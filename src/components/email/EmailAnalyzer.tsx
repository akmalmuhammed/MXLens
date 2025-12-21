import { useState, useEffect } from "react";
import PostalMime from 'postal-mime';
import { HeaderParser, AnalysisResult } from "@/lib/email/HeaderParser";
import { AnalysisEngine } from "@/lib/email/scoring/AnalysisEngine";
import { NormalizedSignals, ScoringResult } from "@/lib/email/scoring/types";
import { PrivacyControls } from "./PrivacyControls";
import { PhishingIndicatorsPanel } from "./PhishingIndicatorsPanel";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VerdictBanner } from "./VerdictBanner";
import { AuthAlignment } from "./AuthAlignment";
import { InteractiveHops } from "./InteractiveHops";
import { AIAnalysisSummary } from "./AIAnalysisSummary";
import { ArtifactsPanel } from "./ArtifactsPanel";
import { ShieldAlert, FileText, ShieldCheck, Download, AlertTriangle, Scan, Search } from "lucide-react";

interface EnhancedAnalysis {
    header: AnalysisResult;
    signals: NormalizedSignals;
    scoring: ScoringResult;
    emailContent: { text: string; html: string };
    timestamp: number;
}

export function EmailAnalyzer() {
    const [input, setInput] = useState("");
    const [analysis, setAnalysis] = useState<EnhancedAnalysis | null>(null);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<"analyst" | "raw" | "it">("analyst");
    const [isDragging, setIsDragging] = useState(false);

    // Usage State (Added)
    const [usageStatus, setUsageStatus] = useState<{ allowed: boolean; message?: string }>({ allowed: true });

    // Privacy Controls State
    const [analyzeBody, setAnalyzeBody] = useState(false);
    const [analyzeAttachments, setAnalyzeAttachments] = useState(false);

    // Raw Tab State
    const [rawTab, setRawTab] = useState<'headers' | 'body_text' | 'body_html'>('headers');

    const checkUsage = async (): Promise<boolean> => {
        try {
            // 1. Try Server Check (for logged in users)
            const { checkAndTrackUsage } = await import("@/actions/analysis");
            const serverResult = await checkAndTrackUsage();

            if (!serverResult.isGuest) {
                // User is logged in
                if (!serverResult.allowed) {
                    setUsageStatus({ allowed: false, message: serverResult.reason });
                    return false;
                }
                return true;
            }

            // 2. Guest Logic (LocalStorage)
            const GUEST_LIMIT = 3;
            // A simple way to track usage
            const stored = localStorage.getItem('mxlens_guest_usage');
            const current = parseInt(stored || '0');

            if (current >= GUEST_LIMIT) {
                setUsageStatus({
                    allowed: false,
                    message: "Guest limit reached for this session (3/3)."
                });
                return false;
            }

            // Increment
            localStorage.setItem('mxlens_guest_usage', (current + 1).toString());
            return true;

        } catch (e) {
            console.error("Usage check failed", e);
            return true;
        }
    };

    const performAnalysis = async (content: string, runBody: boolean, runAttachments: boolean, skipUsageCheck = false) => {
        if (!content.trim()) return;

        // Check Limits BEFORE processing, unless skipping
        if (!skipUsageCheck) {
            const allowed = await checkUsage();
            if (!allowed) return;
        }

        setLoading(true);
        try {
            // 1. Parallel Pipeline Logic

            // A. Header Parsing (Legacy Support)
            // We still use HeaderParser for artifacts and hops visualization
            const headerResPromise = HeaderParser.parse(content);

            // B. MIME Parsing (Standardized)
            const parser = new PostalMime();
            const emailPromise = parser.parse(content);

            const [headerRes, email] = await Promise.all([headerResPromise, emailPromise]);

            // C. Unified Analysis Engine (v3)
            const { signals, result } = AnalysisEngine.analyze(
                headerRes,
                email,
                { checkBody: runBody, checkAttachments: runAttachments }
            );

            setAnalysis({
                header: headerRes,
                signals: signals,
                scoring: result,
                emailContent: {
                    text: email.text || "",
                    html: email.html || ""
                },
                timestamp: Date.now()
            });

        } catch (e) {
            console.error("Analysis failed", e);
        } finally {
            setLoading(false);
        }
    };

    // Trigger analysis when settings change IF we already have analysis
    useEffect(() => {
        if (analysis && input) {
            // Debounce re-analysis
            const timer = setTimeout(() => {
                performAnalysis(input, analyzeBody, analyzeAttachments, true);
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [analyzeBody, analyzeAttachments]);

    const handleAnalyzeClick = () => {
        performAnalysis(input, analyzeBody, analyzeAttachments);
    };

    const handleClear = () => {
        setInput("");
        setAnalysis(null);
        setUsageStatus({ allowed: true });
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            const text = await file.text();
            setInput(text);
            setTimeout(() => performAnalysis(text, analyzeBody, analyzeAttachments), 100);
        }
    };

    return (
        <div className="h-full flex flex-col relative font-sans">
            {/* Background Texture similar to Dashboard */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)]"></div>

            <div className="relative z-10 flex-1 flex flex-col">
                {/* Usage Limit Banner */}
                {!usageStatus.allowed && (
                    <div className="max-w-2xl mx-auto mb-4 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-md flex items-center justify-between animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            <span className="font-semibold">{usageStatus.message}</span>
                        </div>
                        <Button size="sm" variant="default" onClick={() => window.location.href = "/auth/register"}>
                            Sign Up Free
                        </Button>
                    </div>
                )}

                {analysis && (
                    <div className="flex items-center justify-between pb-4 border-b animate-in fade-in slide-in-from-top-2 duration-300">
                        <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-[300px]">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="analyst" title="Default View">Analyst</TabsTrigger>
                                <TabsTrigger value="raw" title="For Engineers">Raw</TabsTrigger>
                                <TabsTrigger value="it" title="Simplified">Quick IT</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <div className="flex gap-1 items-center">
                            <Button variant="outline" size="sm" onClick={() => window.print()} title="Export as PDF">
                                <FileText className="w-4 h-4" /> PDF
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => {
                                if (!analysis) return;
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
                            }} title="Download JSON">
                                <Download className="w-4 h-4" /> JSON
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => {
                                if (!analysis) return;
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
                            }} title="Download CSV">
                                <FileText className="w-4 h-4" /> CSV
                            </Button>

                            <div className="w-px h-6 bg-border mx-2" />

                            <Button variant="default" size="sm" onClick={handleClear}>
                                New Analysis
                            </Button>
                        </div>
                    </div>
                )}

                {/* Input Section */}
                {!analysis && (
                    <div
                        className={`
                        relative space-y-4 max-w-3xl mx-auto w-full text-center py-16 px-8 mt-8
                        rounded-xl border-2 border-dashed transition-all duration-300
                        ${isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border/60 hover:border-primary/50 bg-card/50'}
                        animate-in zoom-in-95 duration-500
                    `}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        {/* Visual Anchor - Large Icon */}
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 pointer-events-none ${isDragging ? 'opacity-20 scale-110' : 'opacity-5'}`}>
                            <Search className="w-64 h-64 text-primary" />
                        </div>

                        <div className="relative z-10 space-y-6">

                            <div className="flex justify-center mb-6">
                                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-4 py-1.5 rounded-full inline-flex items-center gap-2 text-sm font-medium shadow-sm">
                                    <ShieldCheck className="w-4 h-4" />
                                    100% Client-Side Privacy
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-3xl font-extrabold tracking-tight font-heading text-foreground">
                                    Drop suspicious email here to scan
                                </h2>
                                <p className="text-muted-foreground text-lg max-w-lg mx-auto">
                                    Analyzing headers, body, and logic for hidden threats.
                                </p>
                            </div>

                            <div className="pt-4">
                                <Textarea
                                    placeholder="Or paste raw email headers here..."
                                    className="min-h-[150px] max-w-xl mx-auto font-mono text-sm border-2 shadow-inner bg-background/50 focus-visible:ring-offset-2 resize-none"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                />
                            </div>


                            {/* Action Buttons */}
                            <div className="space-y-4 pt-4 max-w-xl mx-auto">
                                {/* Privacy Toggles */}
                                <div className="flex items-center justify-center gap-6 text-sm">
                                    <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground hover:text-foreground transition-colors p-2 rounded hover:bg-muted/50">
                                        <input type="checkbox" checked={analyzeBody} onChange={e => setAnalyzeBody(e.target.checked)} className="rounded border-gray-400 text-primary focus:ring-primary" />
                                        Analyze Body
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground hover:text-foreground transition-colors p-2 rounded hover:bg-muted/50">
                                        <input type="checkbox" checked={analyzeAttachments} onChange={e => setAnalyzeAttachments(e.target.checked)} className="rounded border-gray-400 text-primary focus:ring-primary" />
                                        Scan Attachments
                                    </label>
                                </div>

                                <div className="flex gap-4">
                                    <Button onClick={handleAnalyzeClick} disabled={!input} className="flex-1 h-12 text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform" size="lg">
                                        {loading ? "Scanning..." : "Run Analysis"}
                                    </Button>

                                    <div className="relative">
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept=".eml,.txt,message/rfc822"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const text = await file.text();
                                                    setInput(text);
                                                    setTimeout(() => performAnalysis(text, analyzeBody, analyzeAttachments), 100);
                                                    e.target.value = '';
                                                }
                                            }}
                                            id="file-upload-input"
                                        />
                                        <Button variant="outline" size="lg" className="h-12 w-12 px-0" onClick={() => document.getElementById('file-upload-input')?.click()} title="Upload File">
                                            <Download className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Analysis Dashboard */}
                {analysis && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 py-4">
                        {/* Pass mode to sub-components if needed in future, currently handling rendering logic here for speed */}

                        {/* --- IT MODE --- */}
                        {mode === "it" && (
                            <div className="max-w-xl mx-auto space-y-6 text-center py-4">
                                {/* Unified Verdict Banner */}
                                <div className={`p-6 rounded-xl border shadow-sm ${analysis.scoring.verdict.verdict === 'Likely Legitimate' ? 'bg-green-50 border-green-200 dark:bg-green-950/20' :
                                    analysis.scoring.verdict.verdict === 'High Risk' ? 'bg-red-50 border-red-200 dark:bg-red-950/20' :
                                        'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20'
                                    }`}>
                                    <h2 className={`text-3xl font-bold mb-2 ${analysis.scoring.verdict.verdict === 'Likely Legitimate' ? 'text-green-700 dark:text-green-400' :
                                        analysis.scoring.verdict.verdict === 'High Risk' ? 'text-red-700 dark:text-red-400' :
                                            'text-yellow-700 dark:text-yellow-400'
                                        }`}>
                                        {analysis.scoring.verdict.verdict}
                                    </h2>
                                    <div className="text-4xl font-black text-muted-foreground/20 font-mono">{analysis.scoring.trust.score}/100</div>

                                    {!analyzeBody && (
                                        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background border text-sm text-muted-foreground">
                                            <AlertTriangle className="w-3 h-3" />
                                            Limited visibility (Headers Only). Enable body analysis for full verdict.
                                        </div>
                                    )}
                                </div>

                                {/* Recommended Actions */}
                                <div className="bg-background border rounded-lg p-5 text-left max-w-lg mx-auto shadow-sm">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-primary" />
                                        Recall & Containment
                                    </h4>
                                    <ul className="space-y-2">
                                        {analysis.header.recommendedActions?.map((action, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm">
                                                <input type="checkbox" className="mt-1 rounded border-gray-300" />
                                                <span>{action}</span>
                                            </li>
                                        ))}
                                        {!analyzeBody && (
                                            <li className="flex items-start gap-2 text-sm text-muted-foreground italic">
                                                Enable body analysis to see content-based removal recommendations.
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* --- ANALYST MODE --- */}
                        {mode === "analyst" && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left Column: Verdict & Auth */}
                                <div className="lg:col-span-2 space-y-6">

                                    {/* Privacy Controls Section */}
                                    <PrivacyControls
                                        analyzeBody={analyzeBody}
                                        setAnalyzeBody={setAnalyzeBody}
                                        analyzeAttachments={analyzeAttachments}
                                        setAnalyzeAttachments={setAnalyzeAttachments}
                                    />

                                    <VerdictBanner
                                        verdict={analysis.scoring.verdict.verdict}
                                        score={analysis.scoring.trust.score}
                                        confidence={analysis.scoring.confidence}
                                        reason={analysis.scoring.verdict.reason}
                                        factors={[]} // Factors computed in banner or scoring object if needed
                                    />

                                    {/* NEW: AI Analysis Summary */}
                                    <AIAnalysisSummary analysis={analysis.header} />

                                    {/* Impersonation Alert */}
                                    {analysis.header.impersonationAlert && (
                                        <div className="bg-red-950/30 border border-red-900/50 p-4 rounded-md flex items-start gap-3">
                                            <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="font-bold text-red-500 text-sm">Potential Impersonation Detected</h4>
                                                <p className="text-sm text-red-200/80 mt-1">{analysis.header.impersonationAlert}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Phishing Analysis Panel */}
                                    <PhishingIndicatorsPanel
                                        penalties={analysis.scoring.trust.penalties}
                                        extractedUrls={analysis.signals.extractedUrls}
                                        bodyEnabled={analyzeBody}
                                        onEnableBody={() => setAnalyzeBody(true)}
                                    />

                                    <div className="space-y-2">
                                        <h3 className="font-semibold text-lg font-heading">Authentication</h3>
                                        <AuthAlignment
                                            spf={analysis.header.auth.spf}
                                            dkim={analysis.header.auth.dkim}
                                            dmarc={analysis.header.auth.dmarc}
                                        />
                                        {/* ARC Results */}
                                        {analysis.header.arc && analysis.header.arc.status !== 'none' && (
                                            <div className="mt-3 text-sm border-t pt-2">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold text-muted-foreground">ARC Validation:</span>
                                                    <span className={`font-mono font-bold ${analysis.header.arc.status === 'pass' ? 'text-green-600' : 'text-red-500'}`}>
                                                        {analysis.header.arc.status.toUpperCase()}
                                                    </span>
                                                </div>
                                                <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-0.5">
                                                    {analysis.header.arc.details.map((d, i) => <li key={i}>{d}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    {/* X-Headers */}
                                    {analysis.header.xHeaders && analysis.header.xHeaders.length > 0 && (
                                        <div className="space-y-2">
                                            <h3 className="font-semibold text-lg font-heading">Notable X-Headers</h3>
                                            <div className="bg-muted/30 rounded-md border text-sm divide-y">
                                                {analysis.header.xHeaders.map((xh, i) => (
                                                    <div key={i} className="p-3">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className="font-mono text-xs font-semibold">{xh.key}</span>
                                                            <span className="text-[10px] bg-background border px-1.5 rounded">{xh.value.substring(0, 50)}{xh.value.length > 50 ? '...' : ''}</span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground italic">{xh.explanation}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-4 border-t">
                                        <InteractiveHops hops={analysis.header.hops} />
                                    </div>
                                </div>

                                {/* Right Column: Key Details & Hops */}
                                <div className="space-y-6">
                                    <div className="bg-card border rounded-md p-4 space-y-4">
                                        <h3 className="font-semibold text-sm text-foreground/80 mb-2">Key Metadata</h3>
                                        <div className="space-y-1">
                                            <label className="text-xs uppercase font-bold text-muted-foreground">Subject</label>
                                            <div className="font-medium text-sm">{analysis.header.headers['Subject']}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs uppercase font-bold text-muted-foreground">From</label>
                                            <div className="font-medium text-sm break-all">{analysis.header.headers['From']}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs uppercase font-bold text-muted-foreground">Return-Path</label>
                                            <div className="font-mono text-xs break-all">{analysis.header.headers['Return-Path'] || 'N/A'}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs uppercase font-bold text-muted-foreground">To</label>
                                            <div className="font-medium text-sm break-all">{analysis.header.headers['To']}</div>
                                        </div>
                                    </div>

                                    <ArtifactsPanel artifacts={analysis.header.artifacts} />
                                </div>
                            </div>
                        )}

                        {/* --- RAW MODE --- */}
                        {mode === "raw" && (
                            <div className="space-y-4">
                                <div className="flex gap-2 mb-4">
                                    <Button size="sm" variant={rawTab === 'headers' ? 'secondary' : 'ghost'} onClick={() => setRawTab('headers')}>Headers</Button>
                                    {analyzeBody && <Button size="sm" variant={rawTab === 'body_text' ? 'secondary' : 'ghost'} onClick={() => setRawTab('body_text')}>Body (Text)</Button>}
                                    {analyzeBody && <Button size="sm" variant={rawTab === 'body_html' ? 'secondary' : 'ghost'} onClick={() => setRawTab('body_html')}>Body (HTML)</Button>}
                                </div>

                                {rawTab === 'headers' && (
                                    <div className="relative">
                                        <Button size="sm" variant="outline" className="absolute top-2 right-2" onClick={() => navigator.clipboard.writeText(analysis.header.rawHeaders)}>Copy</Button>
                                        <pre className="p-4 bg-muted/30 rounded-md overflow-x-auto text-xs font-mono whitespace-pre-wrap break-all border h-[600px] overflow-y-auto">
                                            {analysis.header.rawHeaders}
                                        </pre>
                                    </div>
                                )}
                                {rawTab === 'body_text' && (
                                    <pre className="p-4 bg-muted/30 rounded-md overflow-x-auto text-xs font-mono whitespace-pre-wrap break-all border h-[600px] overflow-y-auto">
                                        {analysis.emailContent.text || "No text content found."}
                                    </pre>
                                )}
                                {rawTab === 'body_html' && (
                                    <pre className="p-4 bg-muted/30 rounded-md overflow-x-auto text-xs font-mono whitespace-pre-wrap break-all border h-[600px] overflow-y-auto">
                                        {analysis.emailContent.html || "No HTML content found."}
                                    </pre>
                                )}
                            </div>
                        )}
                    </div >
                )}
            </div>
        </div>
    );
}
