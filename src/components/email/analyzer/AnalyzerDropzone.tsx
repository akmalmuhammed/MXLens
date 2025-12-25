import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Search, ShieldCheck, Scan, Download } from "lucide-react";
import { BulkProcessor, BulkFile } from "../BulkProcessor";
import { PrivacyControls } from "../PrivacyControls";

// Type definitions for props
interface DropzoneProps {
    onAnalyze: (content: string, body: boolean, attachments: boolean) => void;
    onBulkStart: (processor: BulkProcessor, initialQueue: BulkFile[]) => void;
    loading: boolean;
    usageStatus: { allowed: boolean; message?: string };
}

export function AnalyzerDropzone({ onAnalyze, onBulkStart, loading, usageStatus }: DropzoneProps) {
    const [input, setInput] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const [analyzeBody, setAnalyzeBody] = useState(false);
    const [analyzeAttachments, setAnalyzeAttachments] = useState(false);
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

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

        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;

        handleFiles(files);
    };

    const handleFiles = async (files: File[]) => {
        if (files.length > 1) {
            if (files.length > 50) {
                alert("Bulk limit is currently capped at 50 files for browser stability.");
                return;
            }

            const processor = new BulkProcessor(files, { analyzeBody, analyzeAttachments });
            // Start immediately or return control? Returning control is safer for orchestration
            // But we need to subscribe first? The parent will handle subscriptions. 
            // Actually, best to return the initialized processor.
            onBulkStart(processor, processor.getState());
            // processor.start() should be called by parent if needed, or here.
            // Let's call it here for UX consistency, but parent handles state.
            processor.start();
            return;
        }

        const file = files[0];
        if (file.size > MAX_FILE_SIZE) {
            alert("File is too large (>50MB).");
            return;
        }
        try {
            const text = await file.text();
            setInput(text);
            // Slight delay to allow state update
            setTimeout(() => onAnalyze(text, analyzeBody, analyzeAttachments), 100);
        } catch (e) {
            alert("Failed to read file.");
        }
    };

    return (
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
            {/* Visual Anchor */}
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
                    {/* Privacy Toggles reuse existing component */}
                    <div className="flex justify-center">
                        <PrivacyControls
                            analyzeBody={analyzeBody}
                            setAnalyzeBody={setAnalyzeBody}
                            analyzeAttachments={analyzeAttachments}
                            setAnalyzeAttachments={setAnalyzeAttachments}
                            minimal={true}
                        />
                    </div>

                    <div className="flex gap-4 items-stretch h-14">
                        <Button
                            onClick={() => onAnalyze(input, analyzeBody, analyzeAttachments)}
                            disabled={!input || !usageStatus.allowed}
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
                                multiple
                                onChange={(e) => {
                                    const files = Array.from(e.target.files || []);
                                    if (files.length > 0) handleFiles(files);
                                    e.target.value = '';
                                }}
                                id="file-upload-input"
                            />
                            <Button
                                variant="outline"
                                className="h-full w-full rounded-xl border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all"
                                onClick={() => document.getElementById('file-upload-input')?.click()}
                                title="Upload Files (Single or Bulk)"
                                disabled={!usageStatus.allowed}
                            >
                                <Download className="w-6 h-6 text-muted-foreground" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
