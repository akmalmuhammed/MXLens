import { NormalizedSignals, ScoreComponent } from "./types";

// High-Profile Targets often spoofed
const PROTECTED_DISPLAY_NAMES = [
    "microsoft", "google", "support", "security", "warning", "system",
    "admin", "administrator", "payroll", "hr", "finance", "ceo", "president",
    "meta", "facebook", "instagram", "whatsapp", "apple", "amazon", "netflix"
];

// Domains that are allowed to send as these names (simplified whitelist)
// In a real system, this would be much more comprehensive
const AUTHORIZED_DOMAINS: Record<string, string[]> = {
    "microsoft": ["microsoft.com", "microsoftonline.com", "office365.com", "office.com", "azure.com", "sharepointonline.com", "microsoft365.com", "outlook.com", "live.com", "mail.microsoft", "microsoft"],
    "google": ["google.com", "youtube.com", "android.com", "googlemail.com"],
    "support": [], // Context-dependent, usually suspiciously generic if from gmail.com
    "apple": ["apple.com", "icloud.com"],
    "amazon": ["amazon.com", "aws.amazon.com"],
    "meta": ["meta.com", "facebook.com"],
    "facebook": ["facebook.com", "fb.com"],
    "instagram": ["instagram.com"],
    "whatsapp": ["whatsapp.com"]
};

const FREE_EMAIL_PROVIDERS = [
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "icloud.com", "protonmail.com"
];

export class ImpersonationScorer {
    static score(signals: NormalizedSignals): ScoreComponent {
        let score = 100;
        const penalties = [];

        const displayName = signals.fromDisplayName.toLowerCase();
        const fromDomain = signals.fromDomain.toLowerCase();

        // Check if Display Name contains a protected brand/role as a whole word, so
        // "Christopher" is not "hr" and "Ceola" is not "ceo".
        for (const brand of PROTECTED_DISPLAY_NAMES) {
            if (new RegExp(`(?:^|[^a-z0-9])${brand}(?:$|[^a-z0-9])`).test(displayName)) {
                // Check if the domain is authorized for this brand
                // If it's a specific brand like "Microsoft", validation is strict
                // If it's a role like "HR", we check if it comes from a Free Email Provider (suspicious)

                let isAuthorized = false;
                const allowed = AUTHORIZED_DOMAINS[brand];
                // An empty list (e.g. "support") means "generic role", not "no domain may use
                // it": [] is truthy, so it used to flag every helpdesk ("Acme Support") at -80.
                if (allowed && allowed.length > 0) {
                    // Label boundary: "notmicrosoft.com" must not pass as "microsoft.com".
                    isAuthorized = allowed.some(d => fromDomain === d || fromDomain.endsWith(`.${d}`));
                } else {
                    // For generic roles (HR, CEO), we just check if it's a free provider
                    // "HR Dept" <hr@gmail.com> is suspicious
                    isAuthorized = !FREE_EMAIL_PROVIDERS.includes(fromDomain);
                }

                if (!isAuthorized) {
                    score -= 80;
                    penalties.push({
                        reason: `Display Name Spoofing: Claims to be "${signals.fromDisplayName}" but sends from "${fromDomain}"`,
                        value: -80,
                        critical: true,
                        source: 'header' as const
                    });
                    break; // One critical hit is enough
                }
            }
        }

        // Check for "me" or "self" impersonation attempts
        // e.g. "Note to Self" from external domain
        if (["me", "note to self", "self"].includes(displayName)) {
            // In a client-side app, we can't easily know the user's real email, 
            // but we can flag if it claims to be "me" from a weird domain.
            // Skipping for now to avoid false positives without user context.
        }

        return {
            score: Math.max(0, score),
            penalties
        };
    }
}
