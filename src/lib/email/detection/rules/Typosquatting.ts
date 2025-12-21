import { Detector, DetectionContext, DetectionResult } from "../Detector";

export class TyposquattingDetector implements Detector {
    id = "typosquatting";
    name = "Typosquatting Detector";
    description = "Detects look-alike domains mimicking high-value targets.";
    tags: ('auth' | 'content' | 'link' | 'malware' | 'identity')[] = ['identity'];

    // List of high-value brands often impersonated
    private protectedDomains = [
        "gmail.com", "yahoo.com", "outlook.com", "microsoft.com", "apple.com",
        "paypal.com", "amazon.com", "netflix.com", "facebook.com", "instagram.com",
        "linkedin.com", "dropbox.com", "docu sign.com", "adobe.com", "chase.com",
        "wellsfargo.com", "bankofamerica.com", "mxlens.com"
    ];

    detect(context: DetectionContext): DetectionResult | null {
        const fromDomain = context.signals.fromDomain.toLowerCase();

        // Skip if it's an exact match (legitimate)
        if (this.protectedDomains.includes(fromDomain)) return null;

        let closestMatch = "";
        let minDistance = Infinity;

        for (const target of this.protectedDomains) {
            if (Math.abs(fromDomain.length - target.length) > 2) continue; // Optimization

            const distance = this.levenshtein(fromDomain, target);
            if (distance < minDistance) {
                minDistance = distance;
                closestMatch = target;
            }
        }

        // Threshold: Distance of 1 or 2 implies a very close match (e.g. gmai.com vs gmail.com)
        // We strictly catch distance 1 for short domains, up to 2 for longer ones.
        const threshold = closestMatch.length > 8 ? 2 : 1;

        if (minDistance > 0 && minDistance <= threshold) {
            return {
                triggered: true,
                score: 0.8,
                penalty: -20,
                name: this.name,
                reason: `Potential Typosquatting: Domain "${fromDomain}" mimics "${closestMatch}"`,
                metadata: { target: closestMatch, distance: minDistance }
            };
        }

        return null;
    }

    // classic Levenshtein v3
    private levenshtein(a: string, b: string): number {
        const matrix = [];
        let i, j;

        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;

        for (i = 0; i <= b.length; i++) matrix[i] = [i];
        for (j = 0; j <= a.length; j++) matrix[0][j] = j;

        for (i = 1; i <= b.length; i++) {
            for (j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        Math.min(
                            matrix[i][j - 1] + 1, // insertion
                            matrix[i - 1][j] + 1 // deletion
                        )
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    }
}
