import { HeaderParser, type AnalysisResult } from "@/lib/email/HeaderParser";
import { AnalysisEngine } from "@/lib/email/scoring/AnalysisEngine";
import type { NormalizedSignals, ScoringResult } from "@/lib/email/scoring/types";
import PostalMime from 'postal-mime';

export const MAX_EMAIL_FILE_SIZE = 50 * 1024 * 1024;
export const SUPPORTED_EMAIL_FILE_EXTENSIONS = [".eml", ".txt"] as const;

export function validateEmailFile(file: File): string | null {
    const extension = file.name.includes(".")
        ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
        : "";

    if (file.size === 0) {
        return `File "${file.name}" is empty.`;
    }

    if (file.size > MAX_EMAIL_FILE_SIZE) {
        return `File "${file.name}" is too large (max 50MB).`;
    }

    if (!SUPPORTED_EMAIL_FILE_EXTENSIONS.includes(extension as typeof SUPPORTED_EMAIL_FILE_EXTENSIONS[number])) {
        if (extension === ".msg") {
            return `File "${file.name}" is a .msg file, which is not supported. Upload an .eml or .txt file instead.`;
        }

        return `File "${file.name}" has an unsupported format. Upload an .eml or .txt file instead.`;
    }

    return null;
}

export interface BulkFile {
    file: File;
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'error' | 'cancelled';
    result?: BulkAnalysisResult;
    error?: string;
}

export interface BulkAnalysisResult {
    header: AnalysisResult;
    signals: NormalizedSignals;
    scoring: ScoringResult;
    emailContent: { text: string; html: string };
    timestamp: number;
    filename: string;
}

export class BulkProcessor {
    private queue: BulkFile[] = [];
    private activeCount = 0;
    private maxConcurrent = 3;
    private listeners: (() => void)[] = [];
    private cancelled = false;

    // Configuration
    private analyzeBody = false;
    private analyzeAttachments = false;

    constructor(
        files: File[],
        options: { analyzeBody: boolean; analyzeAttachments: boolean }
    ) {
        this.queue = files.map(file => {
            const error = validateEmailFile(file);

            return {
                file,
                id: Math.random().toString(36).substring(7),
                status: error ? 'error' : 'pending',
                error: error || undefined
            };
        });
        this.analyzeBody = options.analyzeBody;
        this.analyzeAttachments = options.analyzeAttachments;
    }

    public start() {
        if (this.cancelled) return;
        this.processNext();
    }

    public cancel() {
        if (this.cancelled) return;

        this.cancelled = true;
        this.queue.forEach(item => {
            if (item.status === 'pending' || item.status === 'processing') {
                item.status = 'cancelled';
            }
        });
        this.notify();
    }

    private async processNext() {
        if (this.cancelled || this.activeCount >= this.maxConcurrent) return;

        const next = this.queue.find(item => item.status === 'pending');
        if (!next) return;

        next.status = 'processing';
        this.activeCount++;
        this.notify();

        this.processNext(); // Try to start more if concurrency allows

        try {
            const content = await next.file.text();
            if (this.cancelled) return;

            // 1. Header Parse
            const headerResPromise = HeaderParser.parse(content);

            // 2. MIME Parse
            const parser = new PostalMime();
            const emailPromise = parser.parse(content);

            const [headerRes, email] = await Promise.all([headerResPromise, emailPromise]);
            if (this.cancelled) return;

            // 3. Engine Analysis
            const { signals, result } = await AnalysisEngine.analyze(
                headerRes,
                email,
                { checkBody: this.analyzeBody, checkAttachments: this.analyzeAttachments }
            );
            if (this.cancelled) return;

            next.result = {
                header: headerRes,
                signals: signals,
                scoring: result,
                emailContent: {
                    text: email.text || "",
                    html: email.html || ""
                },
                timestamp: Date.now(),
                filename: next.file.name
            };

            // Save to history (fire and forget)
            import("@/actions/analysis").then(({ saveAnalysis }) => {
                if (this.cancelled) return;

                const getHeader = (name: string) => {
                    const entry = Object.entries(headerRes.headers).find(([key]) => key.toLowerCase() === name.toLowerCase());
                    const value = Array.isArray(entry?.[1]) ? entry[1][0] : entry?.[1];
                    return (value || "").replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, 256);
                };

                const mapVerdict = (v: string): "CLEAN" | "SUSPICIOUS" | "MALICIOUS" | "UNKNOWN" => {
                    const normalized = v.toLowerCase();
                    if (normalized.includes("legitimate") || normalized === "clean") return "CLEAN";
                    if (normalized.includes("suspicious")) return "SUSPICIOUS";
                    if (normalized.includes("high") || normalized.includes("malicious")) return "MALICIOUS";
                    return "UNKNOWN";
                };

                saveAnalysis({
                    verdict: mapVerdict(result.verdict.verdict),
                    score: result.trust.score,
                    hasAttachments: this.analyzeAttachments,
                    hasBody: this.analyzeBody,
                    processingTimeMs: 0, // approximate
                    subject: getHeader("Subject"),
                    sender: getHeader("From"),
                    spfStatus: headerRes.auth.spf.status,
                    dkimStatus: headerRes.auth.dkim.status,
                    dmarcStatus: headerRes.auth.dmarc.status
                }).catch(console.error);
            });

            next.status = 'completed';

        } catch (error) {
            console.error("Bulk processing error", error);
            next.status = 'error';
            next.error = error instanceof Error ? error.message : "Unknown error";
        } finally {
            this.activeCount--;
            this.notify();
            if (!this.cancelled) this.processNext();
        }
    }

    public getState() {
        return [...this.queue];
    }

    public subscribe(listener: () => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notify() {
        this.listeners.forEach(l => l());
    }
}
