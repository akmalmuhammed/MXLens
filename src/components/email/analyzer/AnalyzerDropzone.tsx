"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Search, ShieldCheck, Scan, Upload, AlertCircle, FileText, CheckCircle2 } from "lucide-react";
import { BulkProcessor, BulkFile, validateEmailFile } from "../BulkProcessor";
import { PrivacyControls } from "../PrivacyControls";

// Type definitions for props
interface DropzoneProps {
    onAnalyze: (content: string, body: boolean, attachments: boolean) => void;
    onBulkStart: (processor: BulkProcessor, initialQueue: BulkFile[]) => void;
    loading: boolean;
    analyzeBody: boolean;
    setAnalyzeBody: (value: boolean) => void;
    analyzeAttachments: boolean;
    setAnalyzeAttachments: (value: boolean) => void;
}

export function AnalyzerDropzone({
    onAnalyze,
    onBulkStart,
    loading,
    analyzeBody,
    setAnalyzeBody,
    analyzeAttachments,
    setAnalyzeAttachments
}: DropzoneProps) {
    const [input, setInput] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const rawInputId = useId();
    const fileInputId = useId();
    const errorId = useId();

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
        setError(null);

        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;

        handleFiles(files);
    };

    const handleFiles = async (files: File[]) => {
        setError(null);
        setUploadedFileName(null);

        if (files.length > 1) {
            if (files.length > 50) {
                setError("Bulk limit is capped at 50 files. Please select fewer files.");
                return;
            }

            const processor = new BulkProcessor(files, { analyzeBody, analyzeAttachments });
            onBulkStart(processor, processor.getState());
            processor.start();
            return;
        }

        const file = files[0];
        const validationError = validateEmailFile(file);
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            const text = await file.text();
            setInput(text);
            setUploadedFileName(file.name);
            // Slight delay to allow state update
            setTimeout(() => onAnalyze(text, analyzeBody, analyzeAttachments), 100);
        } catch {
            setError("Failed to read file. Please try again.");
        }
    };

    return (
        <div
                className={`
                relative flex flex-col items-center justify-center min-h-[600px]
                rounded-3xl border-2 border-dashed transition-all duration-500 group
                ${isDragging
                        ? 'border-primary bg-primary/10 scale-[0.99] shadow-2xl shadow-primary/20 ring-4 ring-primary/30'
                        : 'border-border/40 hover:border-primary/50 bg-gradient-to-br from-background/50 to-muted/20'}
                animate-in zoom-in-95 duration-500
            `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                role="region"
                aria-label="Email analysis upload area"
            >
                {/* Drag overlay message */}
                {isDragging && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/5 backdrop-blur-sm rounded-3xl">
                        <div className="text-center space-y-3 animate-pulse">
                            <Upload className="w-16 h-16 text-primary mx-auto" />
                            <p className="text-xl font-semibold text-primary">Drop files here</p>
                        </div>
                    </div>
                )}

                {/* Visual Anchor */}
                <div className={`
                    absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                    transition-all duration-700 pointer-events-none 
                    ${isDragging ? 'opacity-0' : 'opacity-[0.03] scale-100'}
                `}>
                    <Search className="w-96 h-96 text-foreground" />
                </div>

                <div className="relative z-10 w-full max-w-2xl px-6 space-y-8 text-center">

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
                        <p className="text-lg text-muted-foreground/80 max-w-lg mx-auto leading-relaxed">
                            Drag and drop files or paste raw email headers.
                            <br />
                            Advanced forensic logic runs entirely in your browser.
                        </p>
                    </div>

                    {/* Supported Formats */}
                    <div id="supported-file-formats" className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <FileText className="w-4 h-4" />
                        <span>Supported: <span className="text-foreground">.eml, .txt, raw headers, bulk (50 max)</span></span>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div id={errorId} role="alert" className="flex items-center justify-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Uploaded File Name */}
                    {uploadedFileName && !error && (
                        <div role="status" className="flex items-center justify-center gap-2 p-3 rounded-lg bg-accent/10 border border-accent/30 text-accent text-sm">
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                            Selected: <span className="font-mono">{uploadedFileName}</span>
                        </div>
                    )}

                    <div className="pt-2 w-full max-w-xl mx-auto">
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-500 to-blue-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                            <label htmlFor={rawInputId} className="sr-only">Raw email headers or content</label>
                            <Textarea
                                id={rawInputId}
                                placeholder="Paste raw email headers or content here..."
                                className="relative h-[400px] w-full font-mono text-sm border-0 bg-background/80 focus:bg-background shadow-xl rounded-lg focus-visible:ring-2 focus-visible:ring-primary/50 resize-none p-6 transition-all"
                                value={input}
                                aria-label="Raw email headers or content"
                                aria-describedby={error ? errorId : undefined}
                                onChange={(e) => {
                                    setInput(e.target.value);
                                    setError(null);
                                    setUploadedFileName(null);
                                }}
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-5 w-full max-w-xl mx-auto">
                        <div className="flex justify-center">
                            <PrivacyControls
                                analyzeBody={analyzeBody}
                                setAnalyzeBody={setAnalyzeBody}
                                analyzeAttachments={analyzeAttachments}
                                setAnalyzeAttachments={setAnalyzeAttachments}
                                idPrefix="upload-privacy"
                            />
                        </div>

                        <div className="flex gap-3 items-stretch h-14">
                            <Button
                                onClick={() => {
                                    setError(null);
                                    onAnalyze(input, analyzeBody, analyzeAttachments);
                                }}
                                disabled={!input || loading}
                                className="flex-1 text-lg font-semibold shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all rounded-xl"
                                size="lg"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <Scan className="animate-spin w-5 h-5" /> Analyzing...
                                    </span>
                                ) : "Run Forensic Analysis"}
                            </Button>

                            <div className="relative h-full">
                                <label htmlFor={fileInputId} className="sr-only">Upload .eml or .txt email files</label>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".eml,.txt,message/rfc822,text/plain"
                                    multiple
                                    aria-label="Upload .eml or .txt email files"
                                    aria-describedby="supported-file-formats"
                                    onChange={(e) => {
                                        const files = Array.from(e.target.files || []);
                                        if (files.length > 0) handleFiles(files);
                                        e.target.value = '';
                                    }}
                                    id={fileInputId}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-full px-4 rounded-xl border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all gap-2"
                                    onClick={() => document.getElementById(fileInputId)?.click()}
                                    disabled={loading}
                                    aria-label="Upload .eml or .txt email files"
                                    aria-controls={fileInputId}
                                >
                                    <Upload className="w-5 h-5" />
                                    <span className="hidden sm:inline">Upload File</span>
                                </Button>
                            </div>
                        </div>

                        {/* What happens next */}
                        <div className="pt-2 space-y-2">
                            <p className="text-xs text-muted-foreground">You&apos;ll get:</p>
                            <div className="flex flex-wrap justify-center gap-3 text-xs">
                                {[
                                    "Threat Score (0-100)",
                                    "Authentication Status",
                                    "Detected Threats",
                                    "Sender Reputation"
                                ].map((item, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted/50 text-muted-foreground">
                                        <CheckCircle2 className="w-3 h-3 text-accent" />
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    );
}
