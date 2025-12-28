"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import PostalMime from 'postal-mime';
import { HeaderParser, AnalysisResult } from "@/lib/email/HeaderParser";
import { AnalysisEngine } from "@/lib/email/scoring/AnalysisEngine";
import { NormalizedSignals, ScoringResult } from "@/lib/email/scoring/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { BulkProcessor, BulkFile } from "./BulkProcessor";
import { BulkAnalysisDashboard } from "./BulkAnalysisDashboard";

// Sub-components
import { AnalyzerDropzone } from "./analyzer/AnalyzerDropzone";
import { ResultsDashboard } from "./analyzer/ResultsDashboard";
import { UsageBanner } from "./analyzer/UsageBanner";

export interface EnhancedAnalysis {
    id?: string;
    header: AnalysisResult;
    signals: NormalizedSignals;
    scoring: ScoringResult;
    emailContent: { text: string; html: string };
    timestamp: number;
}

interface EmailAnalyzerProps {
    userPlan?: string;
}

export function EmailAnalyzer({ userPlan = "FREE" }: EmailAnalyzerProps) {
    const router = useRouter();
    const [analysis, setAnalysis] = useState<EnhancedAnalysis | null>(null);
    const [loading, setLoading] = useState(false);

    // Bulk State
    const [viewMode, setViewMode] = useState<'single' | 'bulk'>('single');
    const [bulkQueue, setBulkQueue] = useState<BulkFile[]>([]);
    const bulkProcessorRef = useRef<BulkProcessor | null>(null);

    // Usage State
    const [usageStatus, setUsageStatus] = useState<{ allowed: boolean; message?: string }>({ allowed: true });

    // Privacy Controls State
    const [analyzeBody, setAnalyzeBody] = useState(false);
    const [analyzeAttachments, setAnalyzeAttachments] = useState(false);

    // Original input ref for re-analysis
    const [rawInput, setRawInput] = useState("");

    const checkUsage = async (): Promise<boolean> => {
        try {
            const { checkAndTrackUsage } = await import("@/actions/analysis");
            const serverResult = await checkAndTrackUsage();

            if (!serverResult.isGuest) {
                if (!serverResult.allowed) {
                    setUsageStatus({ allowed: false, message: serverResult.reason });
                    return false;
                }
                return true;
            }

            const GUEST_LIMIT = 3;
            const stored = localStorage.getItem('mxlens_guest_usage');
            const current = parseInt(stored || '0');

            if (current >= GUEST_LIMIT) {
                setUsageStatus({
                    allowed: false,
                    message: "Guest limit reached for this session (3/3)."
                });
                return false;
            }

            localStorage.setItem('mxlens_guest_usage', (current + 1).toString());
            return true;
        } catch (e) {
            console.error("Usage check failed", e);
            return true;
        }
    };

    const performAnalysis = async (content: string, runBody: boolean, runAttachments: boolean, skipUsageCheck = false) => {
        if (!content.trim()) return;

        if (!skipUsageCheck) {
            const allowed = await checkUsage();
            if (!allowed) return;
        }

        setLoading(true);
        const startTime = Date.now();
        setRawInput(content); // Store for re-runs

        try {
            const headerResPromise = HeaderParser.parse(content);
            const parser = new PostalMime();
            const emailPromise = parser.parse(content);
            const [headerRes, email] = await Promise.all([headerResPromise, emailPromise]);

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

            // Persist
            try {
                const { saveAnalysis } = await import("@/actions/analysis");
                const mapVerdict = (v: string): "CLEAN" | "SUSPICIOUS" | "MALICIOUS" | "UNKNOWN" => {
                    const normalized = v.toLowerCase();
                    if (normalized.includes("legitimate") || normalized === "clean") return "CLEAN";
                    if (normalized.includes("suspicious")) return "SUSPICIOUS";
                    if (normalized.includes("high") || normalized.includes("malicious")) return "MALICIOUS";
                    return "UNKNOWN";
                };

                const savedLog = await saveAnalysis({
                    verdict: mapVerdict(result.verdict.verdict),
                    score: result.trust.score,
                    hasAttachments: runAttachments,
                    hasBody: runBody,
                    processingTimeMs: Date.now() - startTime
                });

                if (savedLog && savedLog.id) {
                    // Redirect to persistent analysis page (survives refresh)
                    router.push(`/analysis/${savedLog.id}`);
                    return; // Stop here, let the new page take over
                }

            } catch (err) {
                console.error("Failed to save analysis history:", err);
                // Still show results locally if save fails
                setAnalysis(prev => prev ? ({ ...prev, id: undefined }) : null);
            }

        } catch (e: any) {
            console.error("Analysis failed", e);
            alert("Analysis failed. Please check the console or try a different file.");
        } finally {
            setLoading(false);
        }
    };

    // Re-run if settings change while viewing result
    useEffect(() => {
        if (analysis && rawInput) {
            const timer = setTimeout(() => {
                performAnalysis(rawInput, analyzeBody, analyzeAttachments, true); // Skip usage check on re-run
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [analyzeBody, analyzeAttachments]);

    const handleBulkStart = (processor: BulkProcessor, initialQueue: BulkFile[]) => {
        setViewMode('bulk');
        setAnalysis(null);
        bulkProcessorRef.current = processor;
        processor.subscribe(() => setBulkQueue(processor.getState()));
        setBulkQueue(initialQueue);
        // Processor is started by the Dropzone or here? 
        // Dropzone started it.
    };

    const handleClear = () => {
        setAnalysis(null);
        setRawInput("");
        setUsageStatus({ allowed: true });
    };

    return (
        <div className="h-full flex flex-col relative font-sans">
            <div className="absolute inset-0 z-0 pointer-events-none opacity-50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)]"></div>

            <div className="relative z-10 flex-1 flex flex-col">
                <UsageBanner allowed={usageStatus.allowed} message={usageStatus.message} />

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
                                setRawInput(result.header.rawHeaders || "");
                                setViewMode('single');
                            }}
                        />
                    </div>
                )}

                {!analysis && viewMode === 'single' && (
                    <AnalyzerDropzone
                        onAnalyze={performAnalysis}
                        onBulkStart={handleBulkStart}
                        loading={loading}
                        usageStatus={usageStatus}
                    />
                )}

                {analysis && viewMode === 'single' && (
                    <ResultsDashboard
                        analysis={analysis}
                        onClear={handleClear}
                        analyzeBody={analyzeBody}
                        setAnalyzeBody={setAnalyzeBody}
                        analyzeAttachments={analyzeAttachments}
                        setAnalyzeAttachments={setAnalyzeAttachments}
                        userPlan={userPlan}
                    />
                )}
            </div>
        </div>
    );
}
