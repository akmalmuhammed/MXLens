"use client";

import { useState, useRef, useEffect } from "react";
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

function getSafeHeaderMetadata(headers: AnalysisResult["headers"], name: string, maxLength: number) {
    const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase());
    const value = Array.isArray(entry?.[1]) ? entry[1][0] : entry?.[1];

    return (value || "")
        .replace(/[\r\n\t]+/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim()
        .slice(0, maxLength);
}

export function EmailAnalyzer({ userPlan = "FREE" }: EmailAnalyzerProps) {
    const [analysis, setAnalysis] = useState<EnhancedAnalysis | null>(null);
    const [loading, setLoading] = useState(false);

    // Bulk State
    const [viewMode, setViewMode] = useState<'single' | 'bulk'>('single');
    const [bulkQueue, setBulkQueue] = useState<BulkFile[]>([]);
    const bulkProcessorRef = useRef<BulkProcessor | null>(null);
    const bulkUnsubscribeRef = useRef<(() => void) | null>(null);

    // Privacy Controls State
    const [analyzeBody, setAnalyzeBody] = useState(false);
    const [analyzeAttachments, setAnalyzeAttachments] = useState(false);

    // Original input ref for re-analysis
    const [rawInput, setRawInput] = useState("");
    const analysisRunRef = useRef(0);
    const previousPrivacySettingsRef = useRef({ analyzeBody, analyzeAttachments });

    // Session Storage Key
    const SESSION_KEY = "mxlens_current_analysis";

    // Restore from sessionStorage on mount
    useEffect(() => {
        try {
            const cached = sessionStorage.getItem(SESSION_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                setAnalysis(parsed.analysis);
                setRawInput(parsed.rawInput || "");
                setAnalyzeBody(parsed.analyzeBody || false);
                setAnalyzeAttachments(parsed.analyzeAttachments || false);
            }
        } catch (e) {
            console.warn("Failed to restore analysis from session:", e);
        }
    }, []);

    const performAnalysis = async (content: string, runBody: boolean, runAttachments: boolean) => {
        if (!content.trim()) return;

        const runId = ++analysisRunRef.current;

        setLoading(true);
        const startTime = Date.now();
        setRawInput(content); // Store for re-runs

        try {
            const headerResPromise = HeaderParser.parse(content);
            const parser = new PostalMime();
            const emailPromise = parser.parse(content);
            const [headerRes, email] = await Promise.all([headerResPromise, emailPromise]);

            if (runId !== analysisRunRef.current) return;

            const { signals, result } = await AnalysisEngine.analyze(
                headerRes,
                email,
                { checkBody: runBody, checkAttachments: runAttachments }
            );

            if (runId !== analysisRunRef.current) return;

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

            // Save to sessionStorage for refresh persistence
            try {
                sessionStorage.setItem(SESSION_KEY, JSON.stringify({
                    analysis: {
                        header: headerRes,
                        signals: signals,
                        scoring: result,
                        emailContent: { text: email.text || "", html: email.html || "" },
                        timestamp: Date.now()
                    },
                    rawInput: content,
                    analyzeBody: runBody,
                    analyzeAttachments: runAttachments
                }));
            } catch (e) {
                console.warn("Failed to cache analysis:", e);
            }

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

                const persistenceData = {
                    verdict: mapVerdict(result.verdict.verdict),
                    score: result.trust.score,
                    hasAttachments: runAttachments,
                    hasBody: runBody,
                    processingTimeMs: Date.now() - startTime,
                    subject: getSafeHeaderMetadata(headerRes.headers, "Subject", 512),
                    sender: getSafeHeaderMetadata(headerRes.headers, "From", 320),
                    spfStatus: headerRes.auth.spf.status,
                    dkimStatus: headerRes.auth.dkim.status,
                    dmarcStatus: headerRes.auth.dmarc.status
                };
                const savedLog = await saveAnalysis(persistenceData);

                if (runId === analysisRunRef.current && savedLog && savedLog.id) {
                    // Just update state with ID - stay on same page
                    setAnalysis(prev => prev ? ({ ...prev, id: savedLog.id }) : null);
                }

            } catch (err) {
                console.error("Failed to save analysis history:", err);
            }

        } catch (error) {
            console.error("Analysis failed", error);
            alert("Analysis failed. Please check the console or try a different file.");
        } finally {
            if (runId === analysisRunRef.current) setLoading(false);
        }
    };

    // Re-run if settings change while viewing result
    useEffect(() => {
        const previousSettings = previousPrivacySettingsRef.current;
        const settingsChanged = previousSettings.analyzeBody !== analyzeBody ||
            previousSettings.analyzeAttachments !== analyzeAttachments;
        previousPrivacySettingsRef.current = { analyzeBody, analyzeAttachments };

        if (!settingsChanged || !analysis || !rawInput) return;

        const timer = setTimeout(() => {
            performAnalysis(rawInput, analyzeBody, analyzeAttachments);
        }, 200);
        return () => clearTimeout(timer);
    }, [analysis, rawInput, analyzeBody, analyzeAttachments]);

    const disposeBulkProcessor = () => {
        bulkUnsubscribeRef.current?.();
        bulkUnsubscribeRef.current = null;
        bulkProcessorRef.current?.cancel();
        bulkProcessorRef.current = null;
    };

    useEffect(() => {
        return () => {
            bulkUnsubscribeRef.current?.();
            bulkUnsubscribeRef.current = null;
            bulkProcessorRef.current?.cancel();
            bulkProcessorRef.current = null;
        };
    }, []);

    const handleBulkStart = (processor: BulkProcessor, initialQueue: BulkFile[]) => {
        analysisRunRef.current++;
        setLoading(false);
        disposeBulkProcessor();
        setViewMode('bulk');
        setAnalysis(null);
        bulkProcessorRef.current = processor;
        bulkUnsubscribeRef.current = processor.subscribe(() => setBulkQueue(processor.getState()));
        setBulkQueue(initialQueue);
    };

    const handleBulkCancel = () => {
        bulkProcessorRef.current?.cancel();
    };

    const handleBackToSingle = () => {
        disposeBulkProcessor();
        setBulkQueue([]);
        setViewMode('single');
    };

    const handleClear = () => {
        analysisRunRef.current++;
        setLoading(false);
        disposeBulkProcessor();
        setAnalysis(null);
        setRawInput("");
        setBulkQueue([]);
        setViewMode('single');
        // Clear sessionStorage cache
        try {
            sessionStorage.removeItem(SESSION_KEY);
        } catch (e) {
            console.warn("Failed to clear session cache:", e);
        }
    };

    return (
        <div className="h-full flex flex-col relative font-sans">
            <div className="absolute inset-0 z-0 pointer-events-none opacity-50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)]"></div>

            <div className="relative z-10 flex-1 flex flex-col">
                {viewMode === 'bulk' && (
                    <div className="h-full animate-in fade-in zoom-in-95 duration-300">
                        <div className="mb-4 flex items-center">
                            <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-primary" onClick={() => {
                                handleBackToSingle();
                            }}>
                                <ArrowLeft className="h-4 w-4" /> Back to Single Analysis
                            </Button>
                        </div>
                        <BulkAnalysisDashboard
                            files={bulkQueue}
                            onClear={() => {
                                handleBackToSingle();
                            }}
                            onCancel={handleBulkCancel}
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
                        analyzeBody={analyzeBody}
                        setAnalyzeBody={setAnalyzeBody}
                        analyzeAttachments={analyzeAttachments}
                        setAnalyzeAttachments={setAnalyzeAttachments}
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
