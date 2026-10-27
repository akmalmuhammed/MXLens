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
import { PhishingKitLinkDetector } from "./rules/PhishingKitLink";
import { PersonalizedLinkDetector } from "./rules/PersonalizedLink";
import { TemplateArtifactsDetector } from "./rules/TemplateArtifacts";
import { InvisibleLinkDetector } from "./rules/InvisibleLink";
import { SelfDomainSpoofDetector } from "./rules/SelfDomainSpoof";
import { LocalMailInjectionDetector } from "./rules/LocalMailInjection";
import { PromptInjectionDetector } from "./rules/PromptInjection";
import { ClickFixDetector } from "./rules/ClickFix";
import { DeviceCodeOAuthDetector } from "./rules/DeviceCodeOAuth";
import { MarkupAttachmentDetector } from "./rules/MarkupAttachment";
import { AttachmentLureDetector } from "./rules/AttachmentLure";
import { CallbackPhishingDetector } from "./rules/CallbackPhishing";
import { BecRequestDetector } from "./rules/BecRequest";
import { HostingAbuseDetector } from "./rules/HostingAbuse";
import { UrlObfuscationDetector } from "./rules/UrlObfuscation";
import { OrgLookalikeDetector } from "./rules/OrgLookalike";
import { NotificationAbuseDetector } from "./rules/NotificationAbuse";
import { QrLureDetector } from "./rules/QrLure";
import { EmbeddedMessageDetector } from "./rules/EmbeddedMessage";
import { BrandTemplateDetector } from "./rules/BrandTemplate";
import { SubmissionAnomalyDetector } from "./rules/SubmissionAnomaly";

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

        // Phishing kit / infrastructure patterns
        this.detectors.push(new PhishingKitLinkDetector());
        this.detectors.push(new PersonalizedLinkDetector());
        this.detectors.push(new TemplateArtifactsDetector());
        this.detectors.push(new InvisibleLinkDetector());
        this.detectors.push(new SelfDomainSpoofDetector());
        this.detectors.push(new LocalMailInjectionDetector());

        // 2026 tradecraft: MFA-bypass lures, payloads that skip link scanning, AI-era tricks
        this.detectors.push(new DeviceCodeOAuthDetector());
        this.detectors.push(new ClickFixDetector());
        this.detectors.push(new MarkupAttachmentDetector());
        this.detectors.push(new AttachmentLureDetector());
        this.detectors.push(new QrLureDetector());
        this.detectors.push(new UrlObfuscationDetector());
        this.detectors.push(new HostingAbuseDetector());
        this.detectors.push(new OrgLookalikeDetector());
        this.detectors.push(new CallbackPhishingDetector());
        this.detectors.push(new BecRequestDetector());
        this.detectors.push(new NotificationAbuseDetector());
        this.detectors.push(new PromptInjectionDetector());
        this.detectors.push(new EmbeddedMessageDetector());
        this.detectors.push(new BrandTemplateDetector());
        this.detectors.push(new SubmissionAnomalyDetector());

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
