"use client";

import { useState, useRef, useEffect } from "react";
import PostalMime from 'postal-mime';
import { HeaderParser, AnalysisResult } from "@/lib/email/HeaderParser";
import { AnalysisEngine } from "@/lib/email/scoring/AnalysisEngine";
import { NormalizedSignals, ScoringResult } from "@/lib/email/scoring/types";
import { BulkProcessor, BulkFile } from "./BulkProcessor";
import { BulkAnalysisDashboard } from "./BulkAnalysisDashboard";

// Sub-components
import { AnalyzerDropzone } from "./analyzer/AnalyzerDropzone";
import { ReportView } from "@/components/report/ReportView";

export interface EnhancedAnalysis {
    header: AnalysisResult;
    signals: NormalizedSignals;
    scoring: ScoringResult;
    emailContent: { text: string; html: string };
    timestamp: number;
}

interface EmailAnalyzerProps {
    enrichmentEnabled?: boolean;
}

export function EmailAnalyzer({ enrichmentEnabled = false }: EmailAnalyzerProps) {
    const [analysis, setAnalysis] = useState<EnhancedAnalysis | null>(null);
    const [loading, setLoading] = useState(false);

    // Bulk State
    const [viewMode, setViewMode] = useState<'single' | 'bulk'>('single');
    const [bulkQueue, setBulkQueue] = useState<BulkFile[]>([]);
    const bulkProcessorRef = useRef<BulkProcessor | null>(null);
    const bulkUnsubscribeRef = useRef<(() => void) | null>(null);

    // Analysis scope. Everything runs locally, so the full analysis is the default.
    const [analyzeBody, setAnalyzeBody] = useState(true);
    const [analyzeAttachments, setAnalyzeAttachments] = useState(true);

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
                setAnalyzeBody(parsed.analyzeBody ?? true);
                setAnalyzeAttachments(parsed.analyzeAttachments ?? true);
            }
        } catch (e) {
            console.warn("Failed to restore analysis from session:", e);
        }
    }, []);

    const performAnalysis = async (content: string, runBody: boolean, runAttachments: boolean) => {
        if (!content.trim()) return;

        const runId = ++analysisRunRef.current;

        setLoading(true);
        setRawInput(content); // Store for re-runs

        try {
            const headerResPromise = HeaderParser.parse(content, { checkAttachments: runAttachments });
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
            <div className="relative flex-1 flex flex-col">
                {viewMode === 'bulk' && (
                    <div className="h-full animate-in fade-in duration-300">
                        <BulkAnalysisDashboard
                            files={bulkQueue}
                            onClear={() => {
                                handleBackToSingle();
                            }}
                            onCancel={handleBulkCancel}
                            onSelectFile={(result) => {
                                setAnalysis(result);
                                setRawInput(result.rawEmail);
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
                        enrichmentEnabled={enrichmentEnabled}
                    />
                )}

                {analysis && viewMode === 'single' && (
                    <ReportView
                        analysis={analysis}
                        onClear={handleClear}
                        onBack={bulkQueue.length > 0 ? () => setViewMode('bulk') : undefined}
                        backLabel={`Back to batch (${bulkQueue.length})`}
                        analyzeBody={analyzeBody}
                        setAnalyzeBody={setAnalyzeBody}
                        analyzeAttachments={analyzeAttachments}
                        setAnalyzeAttachments={setAnalyzeAttachments}
                        enrichmentEnabled={enrichmentEnabled}
                    />
                )}
            </div>
        </div>
    );
}
