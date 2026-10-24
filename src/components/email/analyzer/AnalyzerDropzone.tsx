"use client";

import { useId, useRef, useState } from "react";
import { AlertCircle, ArrowRight, FileUp, FlaskConical, Github, Loader2, Lock, MonitorSmartphone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { GITHUB_URL } from "@/lib/site";
import { BulkProcessor, BulkFile, validateEmailFile } from "../BulkProcessor";

const MAX_BULK_FILES = 50;

const SAMPLES = [
    { file: "demo-phishing.eml", label: "Phishing sample" },
    { file: "demo-legitimate.eml", label: "Legitimate sample" },
];

interface DropzoneProps {
    onAnalyze: (content: string, body: boolean, attachments: boolean) => void;
    onBulkStart: (processor: BulkProcessor, initialQueue: BulkFile[]) => void;
    loading: boolean;
    analyzeBody: boolean;
    setAnalyzeBody: (value: boolean) => void;
    analyzeAttachments: boolean;
    setAnalyzeAttachments: (value: boolean) => void;
    enrichmentEnabled?: boolean;
}

export function AnalyzerDropzone({
    onAnalyze,
    onBulkStart,
    loading,
    analyzeBody,
    setAnalyzeBody,
    analyzeAttachments,
    setAnalyzeAttachments,
    enrichmentEnabled = false,
}: DropzoneProps) {
    const [input, setInput] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInput = useRef<HTMLInputElement>(null);
    const pasteId = useId();
    const errorId = useId();

    const handleFiles = async (files: File[]) => {
        setError(null);
        if (files.length === 0) return;

        if (files.length > 1) {
            if (files.length > MAX_BULK_FILES) {
                setError(`Bulk analysis takes up to ${MAX_BULK_FILES} files at a time.`);
                return;
            }
            const processor = new BulkProcessor(files, { analyzeBody, analyzeAttachments });
            onBulkStart(processor, processor.getState());
            processor.start();
            return;
        }

        const validationError = validateEmailFile(files[0]);
        if (validationError) {
            setError(validationError);
            return;
        }
        try {
            onAnalyze(await files[0].text(), analyzeBody, analyzeAttachments);
        } catch {
            setError("Could not read that file.");
        }
    };

    const runSample = async (file: string) => {
        setError(null);
        try {
            const response = await fetch(`/samples/${file}`);
            if (!response.ok) throw new Error(String(response.status));
            onAnalyze(await response.text(), analyzeBody, analyzeAttachments);
        } catch {
            setError("Could not load the sample.");
        }
    };

    const submitPaste = () => {
        if (!input.trim()) return;
        setError(null);
        onAnalyze(input, analyzeBody, analyzeAttachments);
    };

    return (
        <div className="mx-auto w-full max-w-5xl space-y-6 py-4 animate-in fade-in duration-500 sm:py-8">
            <div className="space-y-3 text-center">
                <p className="inline-flex items-center gap-2 rounded-full border border-hairline bg-panel px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-sev-info">
                    <ShieldCheck className="h-3.5 w-3.5" /> Local analysis
                </p>
                <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Is this email phishing?</h1>
                <p className="mx-auto max-w-xl text-balance text-muted-foreground">
                    Drop a suspicious <span className="font-mono text-foreground/90">.eml</span> file and get a verdict with the
                    evidence behind it: authentication, sender, links, attachments and delivery path.
                </p>
            </div>

            {error && (
                <div id={errorId} role="alert" className="mx-auto flex max-w-2xl items-center gap-2 rounded-lg border border-sev-critical/30 bg-sev-critical/10 px-3 py-2 text-sm text-sev-critical">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                </div>
            )}

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
                <div
                    onDragOver={e => {
                        e.preventDefault();
                        setIsDragging(true);
                    }}
                    onDragLeave={e => {
                        e.preventDefault();
                        setIsDragging(false);
                    }}
                    onDrop={e => {
                        e.preventDefault();
                        setIsDragging(false);
                        handleFiles(Array.from(e.dataTransfer.files));
                    }}
                    className={cn(
                        "relative flex min-h-[280px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed p-8 text-center transition-all duration-300",
                        isDragging ? "border-sev-info bg-sev-info/10 shadow-[0_0_0_4px] shadow-sev-info/15" : "border-foreground/20 bg-panel hover:border-sev-info/60"
                    )}
                >
                    <div className="report-grid-bg pointer-events-none absolute inset-0 opacity-70" />
                    <div className="relative flex flex-col items-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-sev-info/30 bg-sev-info/10 text-sev-info shadow-[0_0_30px] shadow-sev-info/20">
                            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <FileUp className="h-6 w-6" />}
                        </div>
                        <p className="text-lg font-medium text-foreground">{loading ? "Analyzing…" : isDragging ? "Drop to analyze" : "Drop .eml files here"}</p>
                        <p className="mt-1 text-sm text-muted-foreground">One file for a full report, up to {MAX_BULK_FILES} for bulk triage</p>
                        <input
                            ref={fileInput}
                            type="file"
                            className="sr-only"
                            accept=".eml,.txt,message/rfc822,text/plain"
                            multiple
                            aria-label="Choose .eml files"
                            onChange={e => {
                                handleFiles(Array.from(e.target.files || []));
                                e.target.value = "";
                            }}
                        />
                        <Button
                            type="button"
                            onClick={() => fileInput.current?.click()}
                            disabled={loading}
                            className="mt-5 h-10 gap-2 bg-sev-info px-5 font-semibold text-background hover:bg-sev-info/90"
                        >
                            Choose files
                        </Button>
                        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                            <FlaskConical className="h-3.5 w-3.5" /> Try:
                            {SAMPLES.map(sample => (
                                <button
                                    key={sample.file}
                                    type="button"
                                    disabled={loading}
                                    onClick={() => runSample(sample.file)}
                                    className="rounded-md border border-hairline px-2 py-1 text-foreground/80 transition-colors hover:border-sev-info/50 hover:text-foreground disabled:opacity-50"
                                >
                                    {sample.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col rounded-2xl border border-hairline bg-panel">
                    <label htmlFor={pasteId} className="border-b border-hairline px-4 py-3 text-sm font-medium text-foreground">
                        Or paste the message source
                        <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                            In Outlook: File, Properties, Internet headers. In Gmail: More, Show original.
                        </span>
                    </label>
                    <textarea
                        id={pasteId}
                        value={input}
                        onChange={e => {
                            setInput(e.target.value);
                            setError(null);
                        }}
                        onKeyDown={e => {
                            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitPaste();
                        }}
                        aria-describedby={error ? errorId : undefined}
                        placeholder={"Received: from ...\nFrom: ...\nSubject: ..."}
                        spellCheck={false}
                        className="min-h-[180px] flex-1 resize-none bg-transparent px-4 py-3 font-mono text-[12.5px] leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                    />
                    <div className="flex items-center justify-between gap-3 border-t border-hairline px-4 py-3">
                        <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">Ctrl + Enter</span>
                        <Button type="button" onClick={submitPaste} disabled={!input.trim() || loading} variant="outline" className="ml-auto h-9 gap-2 border-hairline">
                            Analyze <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-hairline bg-panel px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Scope</span>
                    <ScopeSwitch id="scope-body-entry" label="Body" checked={analyzeBody} onChange={setAnalyzeBody} aria="Analyze email body content" />
                    <ScopeSwitch id="scope-attachments-entry" label="Attachments" checked={analyzeAttachments} onChange={setAnalyzeAttachments} aria="Analyze email attachments" />
                </div>
                <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <li className="inline-flex items-center gap-1.5"><MonitorSmartphone className="h-3.5 w-3.5 text-sev-info" /> Runs in your browser</li>
                    <li className="inline-flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-sev-info" /> {enrichmentEnabled ? "Only indicators are looked up" : "Nothing uploaded"}
                    </li>
                    <li>
                        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-foreground">
                            <Github className="h-3.5 w-3.5 text-sev-info" /> Open source
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    );
}

function ScopeSwitch({ id, label, checked, onChange, aria }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void; aria: string }) {
    return (
        <label htmlFor={id} className="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground/90">
            <Switch id={id} checked={checked} onCheckedChange={onChange} aria-label={aria} />
            {label}
        </label>
    );
}
