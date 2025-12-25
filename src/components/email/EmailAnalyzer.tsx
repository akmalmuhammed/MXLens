import { useState, useEffect, useRef } from "react";
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
import { AnalysisRecommendations } from "./AnalysisRecommendations";
import { ArtifactsPanel } from "./ArtifactsPanel";
import { ShieldAlert, FileText, ShieldCheck, Download, AlertTriangle, Scan, Search, ArrowLeft } from "lucide-react";
import { BulkProcessor, BulkFile } from "./BulkProcessor";
import { BulkAnalysisDashboard } from "./BulkAnalysisDashboard";

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

    // Bulk State
    const [viewMode, setViewMode] = useState<'single' | 'bulk'>('single');
    const [bulkQueue, setBulkQueue] = useState<BulkFile[]>([]);
    const bulkProcessorRef = useRef<BulkProcessor | null>(null);

    // Usage State (Added)
    const [usageStatus, setUsageStatus] = useState<{ allowed: boolean; message?: string }>({ allowed: true });

    // Privacy Controls State
    const [analyzeBody, setAnalyzeBody] = useState(false);
    const [analyzeAttachments, setAnalyzeAttachments] = useState(false);

    // Raw Tab State
    const [rawTab, setRawTab] = useState<'headers' | 'body_text' | 'body_html' | 'telemetry'>('headers');

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
        const startTime = Date.now();
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
            const { signals, result } = await AnalysisEngine.analyze(
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

            // Persist Analysis Result
            try {
                const { saveAnalysis } = await import("@/actions/analysis");

                const mapVerdict = (v: string): "CLEAN" | "SUSPICIOUS" | "MALICIOUS" | "UNKNOWN" => {
                    const normalized = v.toLowerCase();
                    if (normalized.includes("legitimate") || normalized === "clean") return "CLEAN";
                    if (normalized.includes("suspicious")) return "SUSPICIOUS";
                    if (normalized.includes("high") || normalized.includes("malicious")) return "MALICIOUS";
                    return "UNKNOWN";
                };

                await saveAnalysis({
                    verdict: mapVerdict(result.verdict.verdict),
                    score: result.trust.score,
                    hasAttachments: runAttachments,
                    hasBody: runBody,
                    processingTimeMs: Date.now() - startTime
                });
            } catch (err) {
                console.error("Failed to save analysis history:", err);
                // Don't block UI for this failure
            }

        } catch (e: any) {
            console.error("Analysis failed", e);
            if (e.message && e.message.includes("parser")) {
                alert("Error Parsing Email: The file format is invalid or corrupted.");
            } else {
                alert("Analysis failed due to an unexpected error. Please check the console.");
            }
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

    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);

        if (files.length === 0) return;

        // BULK MODE
        if (files.length > 1) {
            if (files.length > 50) {
                alert("Bulk limit is currently capped at 50 files for browser stability.");
                return;
            }

            setViewMode('bulk');
            setAnalysis(null);

            // Initialize Processor
            const processor = new BulkProcessor(files, { analyzeBody, analyzeAttachments });
            bulkProcessorRef.current = processor;

            // Subscribe to updates
            processor.subscribe(() => {
                setBulkQueue(processor.getState());
            });

            // Start Analysis
            setBulkQueue(processor.getState());
            processor.start();
            return;
        }

        // SINGLE MODE
        const file = files[0];
        if (file) {
            if (file.size > MAX_FILE_SIZE) {
                alert("File is too large (>50MB). To prevent browser crashes, please use a smaller file.");
                return;
            }
            try {
                const text = await file.text();
                setInput(text);
                setTimeout(() => performAnalysis(text, analyzeBody, analyzeAttachments), 100);
            } catch (e) {
                alert("Failed to read file.");
            }
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

                {/* BULK VIEW */}
                {viewMode === 'bulk' && (
                    <div className="h-full animate-in fade-in zoom-in-95 duration-300">
                        <div className="mb-4 flex items-center">
                            <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-primary" onClick={() => {
                                setViewMode('single');
                                setBulkQueue([]);
                                bulkProcessorRef.current = null;
                            }}>
                                <ArrowLeft className="h-4 w-4" /> Back to Single Analysis
                            </Button>
                        </div>
                        <BulkAnalysisDashboard
                            files={bulkQueue}
                            onClear={() => {
                                setBulkQueue([]);
                                setViewMode('single');
                            }}
                            onSelectFile={(result) => {
                                setAnalysis(result);
                                setInput(result.header.rawHeaders || "");
                                setViewMode('single');
                            }}
                        />
                    </div>
                )}


                {/* Input Section */}
                {!analysis && viewMode === 'single' && (
                    <div
                        className={`
                        relative flex flex-col items-center justify-center min-h-[600px]
                        rounded-3xl border-2 border-dashed transition-all duration-500 group
                        ${isDragging
                                ? 'border-primary bg-primary/5 scale-[0.99] shadow-2xl'
                                : 'border-border/40 hover:border-primary/50 bg-gradient-to-br from-background/50 to-muted/20'}
                        animate-in zoom-in-95 duration-500
                    `}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        {/* Visual Anchor - Large Icon with Pulse */}
                        <div className={`
                            absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                            transition-all duration-700 pointer-events-none 
                            ${isDragging ? 'opacity-20 scale-125 blur-sm' : 'opacity-[0.03] scale-100'}
                        `}>
                            <Search className="w-96 h-96 text-foreground" />
                        </div>

                        <div className="relative z-10 w-full max-w-2xl px-6 space-y-10 text-center">

                            {/* Trust Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium shadow-sm backdrop-blur-sm">
                                <ShieldCheck className="w-4 h-4" />
                                100% Client-Side Privacy
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight font-heading text-foreground drop-shadow-sm">
                                    Analyze suspicious emails <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-600">
                                        in seconds.
                                    </span>
                                </h2>
                                <p className="text-xl text-muted-foreground/80 max-w-lg mx-auto leading-relaxed">
                                    Drag and drop `.eml` files (Bulk Supported), or paste headers.
                                    <br />
                                    Advanced forensic logic runs entirely in your browser.
                                </p>
                            </div>

                            <div className="pt-2 w-full max-w-xl mx-auto">
                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-500 to-blue-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                                    <Textarea
                                        placeholder="Paste raw email headers or content here..."
                                        className="relative min-h-[160px] w-full font-mono text-sm border-0 bg-background/80 focus:bg-background shadow-xl rounded-lg focus-visible:ring-2 focus-visible:ring-primary/50 resize-none p-6 transition-all"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                    />
                                </div>
                            </div>


                            {/* Action Buttons */}
                            <div className="space-y-6 w-full max-w-xl mx-auto">
                                {/* Privacy Toggles */}
                                <div className="flex flex-wrap items-center justify-center gap-4 text-sm bg-muted/30 p-2 rounded-xl border border-white/5 inline-flex">
                                    <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-lg hover:bg-background/50">
                                        <input type="checkbox" checked={analyzeBody} onChange={e => setAnalyzeBody(e.target.checked)} className="rounded border-gray-400 text-primary focus:ring-primary w-4 h-4" />
                                        Analyze Body
                                    </label>
                                    <div className="w-px h-4 bg-border/50"></div>
                                    <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-lg hover:bg-background/50">
                                        <input type="checkbox" checked={analyzeAttachments} onChange={e => setAnalyzeAttachments(e.target.checked)} className="rounded border-gray-400 text-primary focus:ring-primary w-4 h-4" />
                                        Scan Attachments
                                    </label>
                                </div>

                                <div className="flex gap-4 items-stretch h-14">
                                    <Button
                                        onClick={handleAnalyzeClick}
                                        disabled={!input}
                                        className="flex-1 text-lg font-semibold shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all rounded-xl"
                                        size="lg"
                                    >
                                        {loading ? (
                                            <span className="flex items-center gap-2">
                                                <Scan className="animate-spin w-5 h-5" /> Scanning...
                                            </span>
                                        ) : "Run Forensic Analysis"}
                                    </Button>

                                    <div className="relative h-full aspect-square">
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept=".eml,.txt,message/rfc822"
                                            multiple // Enable bulk selection
                                            onChange={async (e) => {
                                                const files = Array.from(e.target.files || []);
                                                if (files.length === 0) return;

                                                // BULK MODE
                                                if (files.length > 1) {
                                                    if (files.length > 50) {
                                                        alert("Bulk limit is currently capped at 50 files for browser stability.");
                                                        return;
                                                    }
                                                    setViewMode('bulk');
                                                    setAnalysis(null);
                                                    const processor = new BulkProcessor(files, { analyzeBody, analyzeAttachments });
                                                    bulkProcessorRef.current = processor;
                                                    processor.subscribe(() => setBulkQueue(processor.getState()));
                                                    setBulkQueue(processor.getState());
                                                    processor.start();
                                                    e.target.value = ''; // Reset
                                                    return;
                                                }

                                                // SINGLE MODE
                                                const file = files[0];
                                                if (file.size > MAX_FILE_SIZE) {
                                                    alert("File is too large (>50MB).");
                                                    e.target.value = '';
                                                    return;
                                                }
                                                try {
                                                    const text = await file.text();
                                                    setInput(text);
                                                    setTimeout(() => performAnalysis(text, analyzeBody, analyzeAttachments), 100);
                                                } catch (e) {
                                                    alert("Failed to read file.");
                                                }
                                                e.target.value = '';
                                            }}
                                            id="file-upload-input"
                                        />
                                        <Button
                                            variant="outline"
                                            className="h-full w-full rounded-xl border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all"
                                            onClick={() => document.getElementById('file-upload-input')?.click()}
                                            title="Upload Files (Single or Bulk)"
                                        >
                                            <Download className="w-6 h-6 text-muted-foreground" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* Analysis Dashboard */}
                {analysis && viewMode === 'single' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 py-6 px-2">

                        {/* Header Actions & Tabs */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-border/40">
                            <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full md:w-auto">
                                <TabsList className="grid w-full grid-cols-3 h-10 bg-muted/50 p-1 rounded-xl border border-white/5">
                                    <TabsTrigger value="analyst" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all text-muted-foreground" title="Default View">Analyst</TabsTrigger>
                                    <TabsTrigger value="raw" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all text-muted-foreground" title="For Engineers">Raw</TabsTrigger>
                                    <TabsTrigger value="it" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all text-muted-foreground" title="Simplified">Quick IT</TabsTrigger>
                                </TabsList>
                            </Tabs>
                            <div className="flex gap-2 items-center w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                                <Button variant="ghost" size="sm" onClick={() => window.print()} title="Export as PDF" className="hover:bg-muted/50">
                                    <FileText className="w-4 h-4 mr-2" /> PDF
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => {
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
                                }} title="Download JSON" className="hover:bg-muted/50">
                                    <Download className="w-4 h-4 mr-2" /> JSON
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => {
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
                                }} title="Download CSV" className="hover:bg-muted/50">
                                    <FileText className="w-4 h-4 mr-2" /> CSV
                                </Button>

                                <div className="w-px h-6 bg-border mx-2 hidden md:block" />

                                <Button variant="default" size="sm" onClick={handleClear} className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                                    New Analysis
                                </Button>
                            </div>
                        </div>

                        {/* --- IT MODE --- */}
                        {mode === "it" && (
                            <div className="max-w-2xl mx-auto space-y-6 text-center py-8">
                                {/* Unified Verdict Banner */}
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

                                {/* Recommended Actions */}
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
                                {/* Left Column: Verdict & Auth */}
                                <div className="lg:col-span-8 space-y-8">

                                    {/* Privacy Controls Section */}
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

                                    {/* Authentication Analysis (Moved Up) */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-xl font-heading text-foreground/90">Authentication Analysis</h3>
                                        <AuthAlignment
                                            spf={analysis.header.auth.spf}
                                            dkim={analysis.header.auth.dkim}
                                            dmarc={analysis.header.auth.dmarc}
                                        />
                                        {/* ARC Results */}
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

                                    {/* Impersonation Alert */}
                                    {analysis.header.impersonationAlert && (
                                        <div className="bg-red-950/20 border border-red-500/30 p-6 rounded-xl flex items-start gap-4 shadow-sm backdrop-blur-sm">
                                            <ShieldAlert className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="font-bold text-red-500 text-lg">Potential Impersonation Detected</h4>
                                                <p className="text-red-200/90 mt-1 leading-relaxed">{analysis.header.impersonationAlert}</p>
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

                                    <div className="space-y-4">
                                        {/* Auth Analysis moved up, removed from here */}
                                    </div>

                                    {/* X-Headers */}
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

                                        {/* NEW: SOC Recommendations (Moved Here) */}
                                        <div className="pt-8">
                                            <AnalysisRecommendations verdict={analysis.scoring.verdict.verdict} />
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Key Details & Hops */}
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

                                        <div className="space-y-1.5 group">
                                            <label className="text-[10px] uppercase font-bold text-muted-foreground/60 group-hover:text-primary/80 transition-colors">To</label>
                                            <div className="font-medium text-sm break-all">
                                                {(() => {
                                                    const to = Object.entries(analysis.header.headers).find(([k]) => k.toLowerCase() === 'to')?.[1];
                                                    return Array.isArray(to) ? to[0] : (to || 'N/A');
                                                })()}
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-white/5">
                                            <ArtifactsPanel artifacts={analysis.header.artifacts} />
                                        </div>
                                    </div>

                                    {/* NEW: AI Analysis Summary (Moved Here) */}
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
                )}
            </div>
        </div>
    );
}
