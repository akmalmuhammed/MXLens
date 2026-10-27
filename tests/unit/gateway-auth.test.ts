import { readFileSync } from "node:fs";
import path from "node:path";
import PostalMime from "postal-mime";
import { describe, expect, it } from "vitest";
import { HeaderParser } from "@/lib/email/HeaderParser";
import { AuthenticationAnalyzer } from "@/lib/email/parser/Authentication";
import { isKnownAuthServ } from "@/lib/email/scoring/Config";
import { AnalysisEngine } from "@/lib/email/scoring/AnalysisEngine";
import { buildReport, reportToText } from "@/lib/report/buildReport";

function fixture(name: string): string {
    return readFileSync(path.join(process.cwd(), "tests", "fixtures", "email", name), "utf8");
}

async function run(raw: string) {
    const header = await HeaderParser.parse(raw);
    const email = await new PostalMime().parse(raw);
    const { signals, result } = await AnalysisEngine.analyze(header, email, { checkBody: true, checkAttachments: true });
    return { header, signals, result, report: buildReport(header, signals, result) };
}

const reasons = (r: Awaited<ReturnType<typeof run>>) => r.result.trust.penalties.map(p => p.reason);

describe("Authentication-Results parsing", () => {
    it("reads verdicts, sender IP, action and domains from Microsoft and gateway formats", () => {
        const ms = AuthenticationAnalyzer.parseMethods(
            "mx.microsoft.com 1; spf=pass (sender IP is 203.0.113.61) smtp.mailfrom=corp.example; dkim=none (message not signed) header.d=none;dmarc=bestguesspass action=none header.from=corp.example;compauth=pass reason=109"
        );
        expect(ms).toMatchObject({ spf: "pass", dkim: "none", dmarc: "none", dmarcBestGuess: true, ip: "203.0.113.61", mailFrom: "corp.example", headerFrom: "corp.example", authserv: "mx.microsoft.com" });

        const gw = AuthenticationAnalyzer.parseMethods(
            "spf=softfail (sender IP address: 198.51.100.24) smtp.mailfrom=corp.example; dkim=none (no processed signatures) header.d=none; dmarc=fail action=no records header.from=corp.example; arc=none"
        );
        expect(gw).toMatchObject({ spf: "softfail", dmarc: "fail", dmarcAction: "no records", ip: "198.51.100.24" });
        expect(gw.dmarcBestGuess).toBe(false);
    });

    it("strips the authserv-id version token and the ARC instance prefix", () => {
        expect(AuthenticationAnalyzer.parseAuthServId("mx.microsoft.com 1; spf=pass")).toBe("mx.microsoft.com");
        expect(AuthenticationAnalyzer.parseAuthServId("i=2; mx.microsoft.com 1; spf=pass")).toBe("mx.microsoft.com");
        expect(AuthenticationAnalyzer.parseAuthServId("spf=pass; dkim=pass")).toBeUndefined();
    });

    it("recognizes the Exchange Online authserv-id without trusting lookalikes", () => {
        expect(isKnownAuthServ("mx.microsoft.com")).toBe(true);
        expect(isKnownAuthServ("mx.microsoft.com.attacker.example")).toBe(false);
        expect(isKnownAuthServ("notmicrosoft.com")).toBe(false);
    });
});

describe("gateway-masked phishing fixture", () => {
    it("does not present dmarc=bestguesspass as a DMARC pass", async () => {
        const { header } = await run(fixture("gateway-masked-phish.eml"));
        expect(header.auth.spf.status).toBe("pass");
        expect(header.auth.dmarc.status).toBe("none");
        expect(header.auth.dmarc.bestGuess).toBe(true);
        expect(header.auth.dmarc.explanation).toMatch(/inferred/i);
    });

    it("recovers the original evaluation hidden behind the gateway", async () => {
        const { header } = await run(fixture("gateway-masked-phish.eml"));
        expect(header.originAuth).toMatchObject({
            spf: "softfail",
            dmarc: "fail",
            dmarcAction: "no records",
            spfIp: "198.51.100.24",
            finalSpfIp: "203.0.113.61",
            unverified: true,
            masked: true
        });
        // The broken ARC chain still reports what the first hop saw, under a label that cannot feed the ARC override.
        expect(header.arc?.details.join(" ")).toMatch(/Unverified first-hop results \(i=1\): SPF softfail \(198\.51\.100\.24\)/);
        expect(header.arc?.details.some(d => d.startsWith("Origin SPF"))).toBe(false);
    });

    it("reads Exchange handling and flags the filtering bypass", async () => {
        const { header } = await run(fixture("gateway-masked-phish.eml"));
        expect(header.exchange).toMatchObject({ scl: -1, authAs: "Anonymous", compauth: "pass", compauthReason: "109", filteringBypassed: true });
    });

    it("scores the message High Risk and explains why", async () => {
        const r = await run(fixture("gateway-masked-phish.eml"));
        expect(r.result.verdict.verdict).toBe("High Risk");

        const joined = reasons(r).join("\n");
        expect(joined).toContain("Authentication Masked by Intermediary");
        expect(joined).toContain("Spam Filtering Bypassed");
        expect(joined).toContain("bestguesspass");
        expect(joined).toContain("IPFS gateway");
        expect(joined).toContain("CMS plugin/theme/upload directory");
        expect(joined).toContain("embeds the recipient's own email address");
        expect(joined).toContain("[[-Email-]]");
        expect(joined).toContain("no visible text");
        expect(joined).toContain("recipient's own domain");
        expect(joined).toContain("injected by a local process");
    });

    it("no longer penalizes the Exchange Online authserv-id as unrecognized", async () => {
        const r = await run(fixture("gateway-masked-phish.eml"));
        expect(r.signals.authservId).toBe("mx.microsoft.com");
        expect(reasons(r).some(x => x.includes("unrecognized server"))).toBe(false);
        expect(r.result.confidence.factors.map(f => f.reason)).toContain("Trusted Authentication Source");
    });

    it("detects urgency and credential language in an HTML-only body", async () => {
        const r = await run(fixture("gateway-masked-phish.eml"));
        expect(r.signals.hasUrgency).toBe(true);
        expect(r.signals.hasCredentialHarvesting).toBe(true);
        // Gmail's data-saferedirecturl rewrite is not a link the recipient follows.
        expect(r.signals.extractedUrls.some(u => u.includes("google.com/url"))).toBe(false);
    });

    it("keeps the headers-only verdict at High Risk, so it does not depend on body heuristics", async () => {
        const raw = fixture("gateway-masked-phish.eml");
        const header = await HeaderParser.parse(raw);
        const { result } = await AnalysisEngine.analyze(header, null, { checkBody: false, checkAttachments: false });
        expect(result.verdict.verdict).toBe("High Risk");
    });

    it("surfaces the origin evidence in the report and the ticket summary", async () => {
        const { report } = await run(fixture("gateway-masked-phish.eml"));
        expect(report.auth.origin).toMatchObject({ masked: true, spf: "softfail", spfIp: "198.51.100.24", finalSpfIp: "203.0.113.61" });
        expect(report.auth.receiver).toMatchObject({ scl: -1, filteringBypassed: true });
        expect(report.auth.checks.find(c => c.name === "DMARC")?.tone).toBe("warn");

        const text = reportToText(report);
        expect(text).toContain("Earliest evaluation");
        expect(text).toContain("final result hides this");
        expect(text).not.toContain("198.51.100.24");
        expect(text).toContain("198[.]51[.]100[.]24");
    });
});

describe("gateway masking does not misfire on legitimate patterns", () => {
    it("does not flag a forwarded list message whose origin DKIM/DMARC passed", async () => {
        const r = await run(fixture("arc-forwarded-list.eml"));
        expect(r.header.originAuth?.masked).toBe(false);
        expect(reasons(r).some(x => x.includes("Masked by Intermediary"))).toBe(false);
        expect(r.result.verdict.verdict).not.toBe("High Risk");
    });

    it("does not flag a gateway message where the edge evaluation also passed", async () => {
        const raw = fixture("gateway-masked-phish.eml")
            .replace("spf=softfail (sender IP address: 198.51.100.24)", "spf=pass (sender IP address: 198.51.100.24)")
            .replace(/dmarc=fail action=no records/g, "dmarc=pass action=none");
        const { header } = await run(raw);
        expect(header.originAuth?.masked).toBe(false);
    });

    it("does not flag an SPF softfail at the edge when DMARC passed through DKIM", async () => {
        const raw = fixture("gateway-masked-phish.eml").replace(/dmarc=fail action=no records/g, "dmarc=pass action=none");
        const { header } = await run(raw);
        expect(header.originAuth?.spf).toBe("softfail");
        expect(header.originAuth?.masked).toBe(false);
    });

    it("skips the self-domain rule for mail Exchange attributed as internal", async () => {
        const raw = fixture("gateway-masked-phish.eml").replace("AuthAs: Anonymous", "AuthAs: Internal");
        const r = await run(raw);
        expect(reasons(r).some(x => x.includes("recipient's own domain"))).toBe(false);
    });
});
