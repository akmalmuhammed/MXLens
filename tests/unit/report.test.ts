import { readFileSync } from "node:fs";
import path from "node:path";
import PostalMime from "postal-mime";
import { describe, expect, it } from "vitest";
import { HeaderParser } from "@/lib/email/HeaderParser";
import { AnalysisEngine } from "@/lib/email/scoring/AnalysisEngine";
import { buildReport, categoryOf, defang, organizationalDomain, reportToText, severityOf } from "@/lib/report/buildReport";

async function reportFor(file: string) {
    const raw = readFileSync(path.join(process.cwd(), file), "utf8");
    const header = await HeaderParser.parse(raw);
    const email = await new PostalMime().parse(raw);
    const { signals, result } = await AnalysisEngine.analyze(header, email, { checkBody: true, checkAttachments: true });
    return { report: buildReport(header, signals, result), result };
}

describe("buildReport", () => {
    it("uses one risk score that is the inverse of trust", async () => {
        const { report, result } = await reportFor("public/samples/demo-phishing.eml");
        expect(report.verdict).toBe("malicious");
        expect(report.risk).toBe(100 - result.trust.score);
    });

    it("orders findings by severity and impact without duplicates", async () => {
        const { report } = await reportFor("public/samples/demo-phishing.eml");
        const titles = report.findings.map(f => f.title);
        expect(new Set(titles).size).toBe(titles.length);
        expect(report.findings[0].severity).toBe("critical");
        expect(report.findings.find(f => f.title === "DMARC Fail")?.category).toBe("authentication");
        expect(report.findings.find(f => f.title.includes("URL shortener"))?.category).toBe("links");
    });

    it("reports positive score adjustments as mitigations, not findings", async () => {
        const { report } = await reportFor("tests/fixtures/email/arc-forwarded-list.eml");
        expect(report.mitigations.some(m => m.title.startsWith("ARC Override"))).toBe(true);
        expect(report.findings.every(f => f.impact > 0)).toBe(true);
        expect(report.auth.checks.find(c => c.name === "ARC")?.tone).toBe("pass");
    });

    it("treats a missing DKIM signature as neutral, not failed", async () => {
        const { report } = await reportFor("public/samples/demo-phishing.eml");
        const dkim = report.auth.checks.find(c => c.name === "DKIM");
        expect(dkim?.status).toBe("none");
        expect(dkim?.tone).toBe("neutral");
    });

    it("flags a bounce domain that differs from the sender", async () => {
        const { report } = await reportFor("public/samples/demo-phishing.eml");
        const bounce = report.identity.rows.find(r => r.label === "Return-Path");
        expect(bounce?.matchesFrom).toBe(false);
        expect(report.identity.checks.some(c => c.tone === "warn")).toBe(true);
    });

    it("presents the delivery path oldest hop first", async () => {
        const { report } = await reportFor("public/samples/demo-phishing.eml");
        const times = report.hops.map(h => Date.parse(h.time));
        expect(times).toEqual([...times].sort((a, b) => a - b));
        expect(report.ips.find(i => i.ip === "192.168.1.100")?.isPrivate).toBe(true);
    });

    it("gives a clean verdict for the legitimate sample with a calm action list", async () => {
        const { report } = await reportFor("public/samples/demo-legitimate.eml");
        expect(report.verdict).toBe("clean");
        expect(report.actions).toHaveLength(1);
    });

    it("produces a defanged ticket summary", async () => {
        const { report } = await reportFor("public/samples/demo-phishing.eml");
        const text = reportToText(report);
        expect(text).toContain("HIGH RISK");
        expect(text).toContain("hxxp://bit[.]ly");
        expect(text).not.toMatch(/https?:\/\//);
    });
});

describe("helpers", () => {
    it("defangs URLs and domains", () => {
        expect(defang("https://evil.example.com/a.b")).toBe("hxxps://evil[.]example[.]com/a[.]b");
    });

    it("finds the organizational domain", () => {
        expect(organizationalDomain("mail.lists.example.co.uk")).toBe("example.co.uk");
        expect(organizationalDomain("bounces.example.com")).toBe("example.com");
    });

    it("maps severity and category", () => {
        expect(severityOf({ value: -5 })).toBe("low");
        expect(severityOf({ value: -10, critical: true })).toBe("critical");
        expect(categoryOf({ reason: "Executable Attachment: a.exe", value: -60, source: "attachment" })).toBe("attachments");
        expect(categoryOf({ reason: "Timestamp Anomaly", value: -20, source: "header" })).toBe("routing");
    });
});
