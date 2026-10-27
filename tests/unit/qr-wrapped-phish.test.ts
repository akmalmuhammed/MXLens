import { readFileSync } from "node:fs";
import path from "node:path";
import PostalMime from "postal-mime";
import { describe, expect, it } from "vitest";
import { HeaderParser } from "@/lib/email/HeaderParser";
import { AnalysisEngine } from "@/lib/email/scoring/AnalysisEngine";
import { buildReport } from "@/lib/report/buildReport";
import { decodeQrImages } from "@/lib/email/analysis/QrDecoder";

const QR_URL = "https://edoc-notification.compromised-clinic.example/ls/click?upn=U3ludGhldGljVG9rZW5Gb3JUZXN0c09ubHk0Mjg0Njg2";

function fixture(name: string) {
    return readFileSync(path.join(process.cwd(), "tests", "fixtures", "email", name), "utf8");
}

async function run(raw: string, opts = { checkBody: true, checkAttachments: true }) {
    const header = await HeaderParser.parse(raw);
    const email = await new PostalMime().parse(raw);
    const { signals, result } = await AnalysisEngine.analyze(header, email, opts);
    const reasons = result.trust.penalties.map(p => p.reason);
    return { header, signals, result, reasons, report: buildReport(header, signals, result), has: (s: string) => reasons.some(r => r.includes(s)) };
}

describe("QR decoding (ZXing, works outside the browser)", () => {
    it("decodes a high-error-correction QR without a quiet zone from PNG bytes", async () => {
        const raw = fixture("qr-docusign-payload.eml");
        const email = await new PostalMime().parse(raw);
        const png = email.attachments.find(a => a.filename === "QR_alice.smith.png")!;
        const payloads = await decodeQrImages([new Uint8Array(png.content as ArrayBuffer)]);
        expect(payloads).toEqual([QR_URL]);
    });

    it("skips images that declare decompression-bomb dimensions", async () => {
        const { imageDimensions } = await import("@/lib/email/analysis/QrDecoder");
        // PNG signature + IHDR claiming 40000 x 40000 pixels in a few dozen bytes.
        const bomb = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, 0, 0, 0x9c, 0x40, 0, 0, 0x9c, 0x40, 8, 6, 0, 0, 0, ...new Array(64).fill(0)]);
        expect(imageDimensions(bomb)).toEqual({ width: 40000, height: 40000 });
        expect(await decodeQrImages([bomb])).toEqual([]);
    });

    it("returns nothing for non-image bytes instead of throwing", async () => {
        expect(await decodeQrImages([new TextEncoder().encode("not an image at all, just text bytes ".repeat(5))])).toEqual([]);
    });
});

describe("DocuSign QR lure wrapped in an attached email (delivered message)", () => {
    it("opens the attached .eml and scores the message High Risk", async () => {
        const r = await run(fixture("qr-docusign-wrapped.eml"));
        expect(r.signals.embeddedMessages).toHaveLength(1);
        expect(r.signals.embeddedMessages?.[0]).toMatchObject({ fromDomain: "corp.example", hasReceived: false });
        expect(r.result.verdict.verdict).toBe("High Risk");
    });

    it("decodes the QR inside the attached email and runs link rules on it", async () => {
        const r = await run(fixture("qr-docusign-wrapped.eml"));
        expect(r.signals.qrPayloads).toEqual([QR_URL]);
        expect(r.signals.extractedUrls).toContain(QR_URL);
        expect(r.has("QR code in the message opens edoc-notification.compromised-clinic.example")).toBe(true);
        expect(r.report.links.find(l => l.url === QR_URL)?.flags).toContain("From QR code");
    });

    it("explains the wrapper evasion, the forged internal sender and the brand impersonation", async () => {
        const r = await run(fixture("qr-docusign-wrapped.eml"));
        expect(r.has("claims to be from your organization (<hr@corp.example>) but was delivered by vendor-mailer.example")).toBe(true);
        expect(r.has("no delivery (Received) headers")).toBe(true);
        expect(r.has("no content besides banners/disclaimers")).toBe(true);
        expect(r.has("DocuSign impersonation")).toBe(true);
        expect(r.has("and the action leads to compromised-clinic.example")).toBe(true);
        expect(r.has('Claims to be "Human Resources Via DocuSign')).toBe(true);
        expect(r.has("padded with a")).toBe(true);
    });

    it("flags submission through an unrelated, script-driven mailbox", async () => {
        const r = await run(fixture("qr-docusign-wrapped.eml"));
        expect(r.has("logging in as info@unrelated-shop.example")).toBe(true);
        expect(r.has("[127.0.0.1]")).toBe(true);
    });

    it("surfaces the gateway's own QR flag in the header notes", async () => {
        const r = await run(fixture("qr-docusign-wrapped.eml"));
        expect(r.report.headerNotes.some(n => n.key === "X-TM-Has-Qrcode")).toBe(true);
    });
});

describe("The same lure saved as a standalone file (no delivery headers)", () => {
    it("judges it on content: QR destination, DocuSign template, personalized QR filename", async () => {
        const r = await run(fixture("qr-docusign-payload.eml"));
        expect(r.result.verdict.verdict).toBe("High Risk");
        expect(r.has("QR code in the message opens")).toBe(true);
        expect(r.has("DocuSign impersonation")).toBe(true);
        expect(r.has('"QR_alice.smith.png" contains the recipient\'s own mailbox name')).toBe(true);
    });

    it("reports missing delivery headers once instead of as missing SPF, DKIM, DMARC and hops", async () => {
        const r = await run(fixture("qr-docusign-payload.eml"));
        expect(r.has("No Delivery Headers")).toBe(true);
        expect(r.has("Missing Received Headers")).toBe(false);
        expect(r.has("No DMARC Result Found")).toBe(false);
        expect(r.has("DKIM Signature Missing")).toBe(false);
    });
});

describe("legitimate patterns around attached emails, brands and QR codes", () => {
    const delivered = (lines: string[], body: string, extra = "") => [
        "Received: from mail.corp.example (mail.corp.example [203.0.113.5]) by mx.corp.example with ESMTPS id x1; Thu, 1 Jan 2026 10:00:02 +0000",
        "Received: from client.corp.example (client.corp.example [10.0.0.5]) by mail.corp.example with ESMTPSA id x0; Thu, 1 Jan 2026 10:00:01 +0000",
        ...lines,
        "Date: Thu, 1 Jan 2026 10:00:00 +0000",
        "MIME-Version: 1.0",
        extra || "Content-Type: text/html; charset=utf-8",
        "",
        body
    ].join("\r\n");

    it("a colleague forwarding a real message as an attachment with just 'FYI'", async () => {
        const original = [
            "Received: from out.partner.example (out.partner.example [203.0.113.40]) by mx.corp.example with ESMTPS id p1; Thu, 1 Jan 2026 09:00:00 +0000",
            "Authentication-Results: mx.corp.example; spf=pass smtp.mailfrom=partner.example; dkim=pass header.d=partner.example; dmarc=pass header.from=partner.example",
            "From: Partner <news@partner.example>", "To: <bob@corp.example>", "Subject: Q4 schedule", "Date: Thu, 1 Jan 2026 09:00:00 +0000",
            "Content-Type: text/plain", "", "Here is the Q4 schedule."
        ].join("\r\n");
        const raw = delivered([
            "Authentication-Results: mx.corp.example; spf=pass smtp.mailfrom=corp.example; dkim=pass header.d=corp.example; dmarc=pass action=none header.from=corp.example",
            "From: Bob <bob@corp.example>", "To: <alice@corp.example>", "Subject: FW: Q4 schedule"
        ], ["--B", "Content-Type: text/plain", "", "FYI", "--B", 'Content-Type: message/rfc822; name="Q4 schedule.eml"', 'Content-Disposition: attachment; filename="Q4 schedule.eml"', "", original, "--B--", ""].join("\r\n"),
            'Content-Type: multipart/mixed; boundary="B"');
        const r = await run(raw);
        expect(r.signals.embeddedMessages).toHaveLength(1);
        expect(r.has("Lure hidden in an attached email")).toBe(false);
        expect(r.result.verdict.verdict).toBe("Likely Legitimate");
    });

    it("a genuine DocuSign envelope from docusign.net", async () => {
        const raw = delivered([
            "Authentication-Results: mx.corp.example; spf=pass smtp.mailfrom=docusign.net; dkim=pass header.d=docusign.net; dmarc=pass action=none header.from=docusign.net",
            "From: HR via Docusign <dse_NA4@docusign.net>", "To: <alice@corp.example>", "Subject: Please DocuSign: Offer letter"
        ], `<img src="https://docucdn-a.akamaihd.net/olive/images/2.98.0/email/emailLogo.png" alt="Docusign"><a href="https://na4.docusign.net/Signing/EmailStart.aspx?a=1">Review document</a>`);
        const r = await run(raw);
        expect(r.has("impersonation")).toBe(false);
        expect(r.has("Display Name Spoofing")).toBe(false);
    });

    it("internal IT mail with a Microsoft Teams logo", async () => {
        const raw = delivered([
            "Authentication-Results: mx.corp.example; spf=pass smtp.mailfrom=corp.example; dkim=pass header.d=corp.example; dmarc=pass action=none header.from=corp.example",
            "From: IT <it@corp.example>", "To: <alice@corp.example>", "Subject: Town hall"
        ], `<img src="https://intranet.corp.example/teams.png" alt="Microsoft Teams"><p>Join the town hall on Microsoft Teams.</p>`);
        const r = await run(raw);
        expect(r.has("impersonation")).toBe(false);
    });

    it("an event ticket whose QR code holds no link", async () => {
        const raw = fixture("qr-docusign-payload.eml");
        const header = await HeaderParser.parse(raw);
        const email = await new PostalMime().parse(raw);
        const { result, signals } = await AnalysisEngine.analyze(header, email, { checkBody: true, checkAttachments: true });
        // Simulate a non-URL payload: the detector must stay quiet when no decoded payload is a URL.
        signals.qrPayloads = ["TICKET-2026-00042"];
        const { QuishingDetector } = await import("@/lib/email/detection/rules/QuishingDetector");
        const out = await new QuishingDetector().detect({ header, signals, emailBody: undefined, attachments: [], options: { checkBody: true, checkAttachments: true } });
        expect(out).toBeNull();
        expect(result).toBeDefined();
    });
});
