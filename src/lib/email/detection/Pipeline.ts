import { DetectionContext, DetectionResult, Detector } from "./Detector";
import { TyposquattingDetector } from "./rules/Typosquatting";
import { DisplayNameSpoofingDetector } from "./rules/DisplayNameSpoofing";
import { ContentUrgencyDetector } from "./rules/ContentUrgency";
import { ReplyToMismatchDetector } from "./rules/ReplyToMismatch";
import { IpUrlDetector } from "./rules/IpUrlDetector";
import { OpenRedirectDetector } from "./rules/OpenRedirect";
import { SpellingGrammarDetector } from "./rules/SpellingGrammar";
// import { SemanticIntentDetector } from "./rules/SemanticIntentDetector";
import { QuishingDetector } from "./rules/QuishingDetector";
import { CredentialFormDetector } from "./rules/CredentialFormDetector";
import { LinkObfuscationDetector } from "./rules/LinkObfuscationDetector";

export class DetectionPipeline {
    private detectors: Detector[] = [];

    constructor() {
        // Register Core Detectors
        this.detectors.push(new TyposquattingDetector());
        this.detectors.push(new DisplayNameSpoofingDetector());
        this.detectors.push(new ReplyToMismatchDetector());
        this.detectors.push(new ContentUrgencyDetector());

        // Advanced Phishing
        this.detectors.push(new QuishingDetector()); // Check QR before IP/URL
        this.detectors.push(new IpUrlDetector());

        this.detectors.push(new OpenRedirectDetector());
        this.detectors.push(new SpellingGrammarDetector());

        this.detectors.push(new CredentialFormDetector());
        this.detectors.push(new LinkObfuscationDetector());

        // AI Detector (POC) - Disabled per user request
        // this.detectors.push(new SemanticIntentDetector());
    }

    public async run(context: DetectionContext): Promise<{ results: DetectionResult[], totalPenalty: number, performance: { id: string, name: string, durationMs: number, status: 'success' | 'timeout' | 'error' }[] }> {
        const results: DetectionResult[] = [];
        const telemetry: { id: string, name: string, durationMs: number, status: 'success' | 'timeout' | 'error' }[] = [];
        let totalPenalty = 0;

        // Map detectors to promises
        const detectionPromises = this.detectors.map(async (detector) => {
            const t0 = performance.now();
            let status: 'success' | 'timeout' | 'error' = 'success';
            let result: DetectionResult | null = null;

            try {
                result = await this.runDetectorWithTimeout(detector, context, 2000);

                if (result && result.triggered) {
                    return { ...result, tags: detector.tags }; // Value to be collected
                }
            } catch (e: unknown) {
                const message = e instanceof Error ? e.message : String(e);
                status = message.includes("Timeout") ? 'timeout' : 'error';
                console.warn(`Detector ${detector.id} skipped - ${message}`);
            } finally {
                const t1 = performance.now();
                const duration = t1 - t0;
                // Add to telemetry
                telemetry.push({
                    id: detector.id,
                    name: detector.name,
                    durationMs: Math.round(duration * 100) / 100, // Round to 2 decimals
                    status
                });
            }
            return result;
        });

        // Execute all in parallel
        const outcome = await Promise.allSettled(detectionPromises);

        // Process outcomes
        outcome.forEach(o => {
            if (o.status === 'fulfilled' && o.value) {
                results.push(o.value);
                totalPenalty += o.value.penalty;
            }
        });

        return { results, totalPenalty, performance: telemetry };
    }

    private async runDetectorWithTimeout(detector: Detector, context: DetectionContext, timeoutMs: number): Promise<DetectionResult | null> {
        let timeout: ReturnType<typeof setTimeout> | undefined;

        try {
            return await new Promise<DetectionResult | null>((resolve, reject) => {
                timeout = setTimeout(() => reject(new Error(`Timeout (${detector.id})`)), timeoutMs);

                Promise.resolve(detector.detect(context)).then(resolve, reject);
            });
        } finally {
            if (timeout) clearTimeout(timeout);
        }
    }
}
