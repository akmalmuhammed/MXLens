import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeResolvedEmail } from "@/lib/agent-api/analysis-service";

function sample(name: string): string {
    return readFileSync(path.join(process.cwd(), "public", "samples", name), "utf8");
}

describe("agent analysis service", () => {
    it("returns a privacy-safe result shape for a raw email", async () => {
        const result = await analyzeResolvedEmail(
            {
                sourceType: "raw",
                rawEmail: sample("demo-phishing.eml"),
                filename: "demo-phishing.eml"
            },
            {
                analyzeBody: true,
                analyzeAttachments: false
            }
        );

        expect(result.verdict).toMatch(/clean|suspicious|malicious|unknown/);
        expect(result.riskScore).toBeGreaterThanOrEqual(0);
        expect(result.riskScore).toBeLessThanOrEqual(100);
        expect(result.trustScore).toBeGreaterThanOrEqual(0);
        expect(result.trustScore).toBeLessThanOrEqual(100);
        expect(result.signals.content).toHaveProperty("extractedUrlCount");
        expect(JSON.stringify(result)).not.toContain("Urgent action required");
    });

    it("handles minimal raw emails without authentication headers", async () => {
        const result = await analyzeResolvedEmail(
            {
                sourceType: "raw",
                rawEmail: [
                    "From: sender@example.com",
                    "To: user@example.com",
                    "Subject: Smoke Test",
                    "",
                    "Hello from unauthenticated API smoke test."
                ].join("\r\n")
            },
            {
                analyzeBody: true,
                analyzeAttachments: false
            }
        );

        expect(result.verdict).toMatch(/clean|suspicious|malicious|unknown/);
        expect(result.signals.authentication.authenticationResultsPresent).toBe(false);
        expect(result.signals.authentication.dmarc).toBe("none");
    });
});
