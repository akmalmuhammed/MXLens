import { AnalysisResult, HeaderParser } from "@/lib/email/HeaderParser";
import { AnalysisEngine } from "@/lib/email/scoring/AnalysisEngine";
import PostalMime from 'postal-mime';

export interface BulkFile {
    file: File;
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    result?: any; // EnhancedAnalysis
    error?: string;
}

export class BulkProcessor {
    private queue: BulkFile[] = [];
    private activeCount = 0;
    private maxConcurrent = 3;
    private listeners: (() => void)[] = [];

    // Configuration
    private analyzeBody = false;
    private analyzeAttachments = false;

    constructor(
        files: File[],
        options: { analyzeBody: boolean; analyzeAttachments: boolean }
    ) {
        this.queue = files.map(f => ({
            file: f,
            id: Math.random().toString(36).substring(7),
            status: 'pending'
        }));
        this.analyzeBody = options.analyzeBody;
        this.analyzeAttachments = options.analyzeAttachments;
    }

    public start() {
        this.processNext();
    }

    private async processNext() {
        if (this.activeCount >= this.maxConcurrent) return;

        const next = this.queue.find(item => item.status === 'pending');
        if (!next) return;

        next.status = 'processing';
        this.activeCount++;
        this.notify();

        this.processNext(); // Try to start more if concurrency allows

        try {
            const content = await next.file.text();

            // 1. Header Parse
            const headerResPromise = HeaderParser.parse(content);

            // 2. MIME Parse
            const parser = new PostalMime();
            const emailPromise = parser.parse(content);

            const [headerRes, email] = await Promise.all([headerResPromise, emailPromise]);

            // 3. Engine Analysis
            const { signals, result } = await AnalysisEngine.analyze(
                headerRes,
                email,
                { checkBody: this.analyzeBody, checkAttachments: this.analyzeAttachments }
            );

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
            // Save to history (fire and forget)
            import("@/actions/analysis").then(({ saveAnalysis }) => {
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
                    processingTimeMs: 0 // approximate
                }).catch(console.error);
            });

            next.status = 'completed';

        } catch (e: any) {
            console.error("Bulk processing error", e);
            next.status = 'error';
            next.error = e.message || "Unknown error";
        } finally {
            this.activeCount--;
            this.notify();
            this.processNext();
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
