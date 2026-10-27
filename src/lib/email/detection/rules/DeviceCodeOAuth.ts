import { Detector, DetectionContext, DetectionResult } from "../Detector";
import { organizationalDomain } from "../../analysis/Domain";

/**
 * Device-code phishing (Storm-2372, EvilTokens and similar kits) and OAuth consent phishing
 * hand the attacker a token without ever stealing a password, so MFA does not help. The
 * links point at genuine Microsoft/Google pages, which makes URL reputation useless; the
 * signal is the combination of a device-login or consent URL with a lure in an email.
 */
export class DeviceCodeOAuthDetector implements Detector {
    id = "device-code-oauth";
    name = "Device Code / OAuth Consent Phishing";
    description = "Detects device-code login lures and OAuth consent links in email.";
    tags: ('auth' | 'content' | 'link' | 'malware' | 'identity')[] = ['link'];

    private deviceUrl = /(?:microsoft\.com\/devicelogin|aka\.ms\/devicelogin|login\.microsoftonline\.com\/[^/\s"']*\/?oauth2\/(?:v2\.0\/)?deviceauth|login\.microsoftonline\.com\/common\/oauth2\/deviceauth|login\.live\.com\/oauth20_remoteconnect|microsoft\.com\/link\b|google\.com\/device\b|github\.com\/login\/device)/i;
    private deviceText = /\b(?:device\s+(?:login|code|sign-?in)|enter\s+(?:the\s+|this\s+|your\s+)?(?:following\s+)?(?:security\s+|one-?time\s+|verification\s+|access\s+)?code)\b/i;
    private codeToken = /\b(?=[A-Z0-9-]*[A-Z])(?=[A-Z0-9-]*\d)[A-Z0-9]{4}-?[A-Z0-9]{4,5}\b/;
    private oauthAuthorize = /(?:login\.microsoftonline\.com|login\.microsoft\.com|login\.windows\.net)\/[^\s"'<>]*\/oauth2\/(?:v2\.0\/)?authorize\?[^\s"'<>]*client_id=|accounts\.google\.com\/o\/oauth2\/(?:v2\/)?auth\?[^\s"'<>]*client_id=/i;
    private riskyScope = /(?:offline_access|mail\.(?:read|send|readwrite)|files\.read(?:write)?(?:\.all)?|sites\.read|user\.read\.all|directory\.|full_access_as_user|\.default|gmail\.|auth%2Fdrive|auth\/drive|prompt=consent)/i;

    detect(context: DetectionContext): DetectionResult | null {
        const { signals } = context;
        const fromOrg = signals.fromDomain ? organizationalDomain(signals.fromDomain) : "";
        // Genuine provider mail (verified DMARC) legitimately talks about sign-in codes.
        const genuineProvider = ["microsoft.com", "microsoftonline.com", "google.com", "github.com"].includes(fromOrg)
            && signals.dmarcResult === "pass" && !signals.dmarcBestGuess;
        if (genuineProvider) return null;

        const urls = signals.extractedUrls || [];
        const text = `${signals.subject || ""} ${signals.visibleText || context.emailBody?.text || ""}`;
        const corpus = `${urls.join(" ")} ${text}`;

        const deviceLink = this.deviceUrl.test(corpus);
        if (deviceLink) {
            const withCode = this.codeToken.test(text) || this.deviceText.test(text);
            return {
                triggered: true,
                score: withCode ? 0.9 : 0.7,
                penalty: withCode ? -35 : -25,
                name: this.name,
                reason: withCode
                    ? "Message sends the reader to a device-login page with a code to enter. Entering it signs the attacker's device into the account (device-code phishing), bypassing MFA."
                    : "Message points to a device-code sign-in page. Unsolicited device-login requests are used to steal tokens without a password.",
                metadata: { kind: "device-code", withCode }
            };
        }

        const consent = urls.find(u => this.oauthAuthorize.test(u));
        if (consent) {
            const risky = this.riskyScope.test(decodeURIComponentSafe(consent));
            return {
                triggered: true,
                score: risky ? 0.85 : 0.6,
                penalty: risky ? -30 : -15,
                name: this.name,
                reason: risky
                    ? "Link opens an OAuth consent screen requesting mailbox/file or offline access. Granting it gives a third-party app persistent access without the password (consent phishing)."
                    : "Link opens an OAuth app authorization page from an email; verify the app before consenting.",
                metadata: { kind: "oauth-consent", risky }
            };
        }
        return null;
    }
}

function decodeURIComponentSafe(v: string): string {
    try {
        return decodeURIComponent(v);
    } catch {
        return v;
    }
}
