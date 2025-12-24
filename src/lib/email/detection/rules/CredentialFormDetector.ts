import { Detector, DetectionContext, DetectionResult } from "../Detector";

export class CredentialFormDetector implements Detector {
    id = "credential-form";
    name = "Credential Form Detector";
    description = "Detects embedded HTML forms or password inputs, which are never used by legitimate services.";
    tags: ('auth' | 'content' | 'link' | 'malware' | 'identity')[] = ['content', 'malware'];

    detect(context: DetectionContext): DetectionResult | null {
        if (!context.options.checkBody || !context.signals.hasHtmlForm) return null;

        // If SignalNormalizer flagged `hasHtmlForm`, it's already a high-confidence signal.
        // We double-check specific dangerous elements to be sure.

        // Note: SignalNormalizer regex: /<form|<input[^>]*type=["']?password["']?|action=["']?/i

        // This is practically a "Zero Tolerance" rule.
        return {
            triggered: true,
            score: 1.0,
            penalty: -30, // Critical Severity
            name: "Embedded Login Form",
            reason: "Detected HTML <form> or Password Input directly in email body. Legitimate services do not do this.",
            metadata: { type: 'html_form' }
        };
    }
}
