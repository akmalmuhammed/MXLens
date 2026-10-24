import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeEmail } from "@/lib/email/analyze";

function sample(name: string): string {
    return readFileSync(path.join(process.cwd(), "public", "samples", name), "utf8");
}

describe("analyzeEmail", () => {
    it("returns a privacy-safe result shape for a raw email", async () => {
        const result = await analyzeEmail(sample("demo-phishing.eml"), { attachments: false });

        expect(result.verdict).toMatch(/clean|suspicious|malicious|unknown/);
        expect(result.riskScore).toBeGreaterThanOrEqual(0);
        expect(result.riskScore).toBeLessThanOrEqual(100);
        expect(result.trustScore).toBe(100 - result.riskScore);
        expect(result.signals.content).toHaveProperty("extractedUrlCount");
        expect(result.message.subject).toContain("Sample Phishing");
        // The body text itself is never echoed back.
        expect(JSON.stringify(result)).not.toContain("Urgent action required");
    });

    it("flags the demo phishing sample and clears the legitimate one", async () => {
        const phishing = await analyzeEmail(sample("demo-phishing.eml"));
        const legitimate = await analyzeEmail(sample("demo-legitimate.eml"));

        expect(phishing.verdict).toBe("malicious");
        expect(phishing.findings.length).toBeGreaterThan(0);
        expect(legitimate.riskScore).toBeLessThan(phishing.riskScore);
    });

    it("handles minimal raw emails without authentication headers", async () => {
        const result = await analyzeEmail(
            [
                "From: sender@example.com",
                "To: user@example.com",
                "Subject: Smoke Test",
                "",
                "Hello from an unauthenticated smoke test."
            ].join("\r\n"),
            { attachments: false }
        );

        expect(result.verdict).toMatch(/clean|suspicious|malicious|unknown/);
        expect(result.message.from).toBe("sender@example.com");
        expect(result.signals.authentication.authenticationResultsPresent).toBe(false);
        expect(result.signals.authentication.dmarc).toBe("none");
    });
});
