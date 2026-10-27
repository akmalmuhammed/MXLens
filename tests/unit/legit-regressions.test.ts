import PostalMime from "postal-mime";
import { describe, expect, it } from "vitest";
import { HeaderParser } from "@/lib/email/HeaderParser";
import { AnalysisEngine } from "@/lib/email/scoring/AnalysisEngine";

/**
 * Legitimate-mail shapes that the 2026 detectors must leave alone. Each case names the
 * detector it guards against; a failure here means a new rule is too eager.
 */
const NEW_DETECTOR_MARKERS = [
    "AI email assistant", "ClickFix", "paste", "device-login", "device-code", "OAuth", "HTML attachment", "SVG attachment",
    "pretext", "embeds the recipient", "TOAD", "Business email compromise", "tunnelling", "free hosting", "abuse-heavy TLD",
    "Obfuscated link", "imitates the recipient", "DKIM replay", "signed for", "QR", "Direct Send", "compauth"
];

function msg(lines: { from: string; to: string; auth: string; subject: string; html?: string; text?: string; extra?: string[] }) {
    return [
        "Received: from out.vendor.example (out.vendor.example [203.0.113.20]) by mx.acmewidgets.example with ESMTPS id a1; Thu, 1 Jan 2026 10:00:02 +0000",
        "Received: from app.vendor.example (app.vendor.example [203.0.113.21]) by out.vendor.example with ESMTP id a0; Thu, 1 Jan 2026 10:00:01 +0000",
        `Authentication-Results: mx.acmewidgets.example; ${lines.auth}`,
        `From: ${lines.from}`,
        `To: ${lines.to}`,
        `Subject: ${lines.subject}`,
        "Date: Thu, 1 Jan 2026 10:00:00 +0000",
        "Message-ID: <legit@vendor.example>",
        ...(lines.extra ?? []),
        "MIME-Version: 1.0",
        `Content-Type: ${lines.html ? "text/html" : "text/plain"}; charset=utf-8`,
        "",
        lines.html ?? lines.text ?? ""
    ].join("\r\n");
}

async function newFindings(raw: string) {
    const header = await HeaderParser.parse(raw);
    const email = await new PostalMime().parse(raw);
    const { result } = await AnalysisEngine.analyze(header, email, { checkBody: true, checkAttachments: true });
    return {
        verdict: result.verdict.verdict,
        hits: result.trust.penalties.map(p => p.reason).filter(r => NEW_DETECTOR_MARKERS.some(m => r.includes(m)))
    };
}

const vendorAuth = (d: string) => `spf=pass smtp.mailfrom=${d}; dkim=pass header.d=${d}; dmarc=pass action=none header.from=${d}`;

describe("legitimate mail is not caught by the 2026 detectors", () => {
    it("order confirmation with a support phone number and portal links (callback)", async () => {
        const r = await newFindings(msg({
            from: "Store <orders@shop.vendor.example>", to: "<alice@acmewidgets.example>", auth: vendorAuth("shop.vendor.example"),
            subject: "Order confirmation #4471",
            html: `<p>Thanks for your purchase. Your order #4471 ships tomorrow.</p><p><a href="https://shop.vendor.example/orders/4471">Track order</a></p><p>Questions? Contact customer service at +1 (206) 555-0100.</p>`
        }));
        expect(r.hits).toEqual([]);
    });

    it("marketing newsletter with a hidden preheader and mobile-only block (hidden text, AI injection)", async () => {
        const r = await newFindings(msg({
            from: "Vendor News <news@vendor.example>", to: "<alice@acmewidgets.example>", auth: vendorAuth("vendor.example"),
            subject: "October product update",
            html: `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">New dashboards, faster exports and more.</div><table><tr><td>Read about our new dashboards.</td></tr></table><div class="mobile" style="display:none">Open the app to see more.</div><a href="https://www.vendor.example/blog">Read more</a>`
        }));
        expect(r.hits).toEqual([]);
    });

    it("verified internal IT notice asking staff to scan an MFA QR code (QR lure)", async () => {
        const r = await newFindings(msg({
            from: "IT Service Desk <servicedesk@acmewidgets.example>", to: "<alice@acmewidgets.example>", auth: vendorAuth("acmewidgets.example"),
            subject: "Set up your authenticator",
            html: `<p>Scan the QR code below with your phone camera to finish multi-factor sign in setup.</p><img src="cid:qr">`
        }));
        expect(r.hits).toEqual([]);
    });

    it("Google Calendar invite with dial-in numbers (notification abuse)", async () => {
        const r = await newFindings(msg({
            from: "Google Calendar <calendar-notification@google.com>", to: "<alice@acmewidgets.example>", auth: vendorAuth("google.com"),
            extra: ["Delivered-To: alice@acmewidgets.example"],
            subject: "Invitation: Weekly sync",
            text: "Join with Google Meet: https://meet.google.com/abc-defg-hij Join by phone: +1 650-555-0123 PIN: 123456. Reply to cancel or change your RSVP."
        }));
        expect(r.hits).toEqual([]);
    });

    it("vendor remittance PDF and eFax PDF (attachment lure)", async () => {
        const raw = [
            "Received: from out.vendor.example (out.vendor.example [203.0.113.20]) by mx.acmewidgets.example with ESMTPS id a1; Thu, 1 Jan 2026 10:00:02 +0000",
            "Received: from app.vendor.example (app.vendor.example [203.0.113.21]) by out.vendor.example with ESMTP id a0; Thu, 1 Jan 2026 10:00:01 +0000",
            `Authentication-Results: mx.acmewidgets.example; ${vendorAuth("vendor.example")}`,
            "From: AP <ap@vendor.example>", "To: <alice@acmewidgets.example>", "Subject: Remittance", "Date: Thu, 1 Jan 2026 10:00:00 +0000",
            "MIME-Version: 1.0", 'Content-Type: multipart/mixed; boundary="b"', "",
            "--b", "Content-Type: text/plain", "", "Remittance and fax attached.",
            "--b", 'Content-Type: application/pdf; name="Remittance_Advice_2026.pdf"', "Content-Transfer-Encoding: base64", 'Content-Disposition: attachment; filename="Remittance_Advice_2026.pdf"', "", Buffer.from("%PDF-1.4\n%%EOF").toString("base64"),
            "--b", 'Content-Type: application/pdf; name="Fax_3pages.pdf"', "Content-Transfer-Encoding: base64", 'Content-Disposition: attachment; filename="Fax_3pages.pdf"', "", Buffer.from("%PDF-1.4\n%%EOF").toString("base64"),
            "--b--", ""
        ].join("\r\n");
        const r = await newFindings(raw);
        expect(r.hits).toEqual([]);
    });

    it("developer newsletter linking to github.io and vercel.app without a sign-in lure (hosting)", async () => {
        const r = await newFindings(msg({
            from: "Weekly <hello@devweekly.example>", to: "<alice@acmewidgets.example>", auth: vendorAuth("devweekly.example"),
            subject: "This week in frontend",
            html: `<p>Demo: <a href="https://someone.github.io/demo">github.io demo</a>, starter: <a href="https://starter-kit.vercel.app/">vercel starter</a>.</p>`
        }));
        // Informational -5 is acceptable; it must stay below the lure tier and never escalate the verdict.
        expect(r.verdict).not.toBe("High Risk");
        expect(r.hits.every(h => h.includes("free hosting"))).toBe(true);
    });

    it("vendor payment status update (BEC)", async () => {
        const r = await newFindings(msg({
            from: "Billing <billing@vendor.example>", to: "<alice@acmewidgets.example>", auth: "spf=pass smtp.mailfrom=vendor.example; dkim=none; dmarc=none header.from=vendor.example",
            subject: "Payment received",
            text: "We received your payment today. Thank you. Your next invoice will be issued on the 1st."
        }));
        expect(r.hits).toEqual([]);
    });

    it("security newsletter discussing prompt injection and ClickFix in visible text", async () => {
        const r = await newFindings(msg({
            from: "Threat Brief <brief@secnews.example>", to: "<alice@acmewidgets.example>", auth: vendorAuth("secnews.example"),
            subject: "This week: ClickFix and prompt injection",
            html: `<p>ClickFix pages tell victims to press Win+R. Prompt-injection emails may say "ignore previous instructions". Train users to report both.</p>`
        }));
        expect(r.hits).toEqual([]);
        expect(r.verdict).toBe("Likely Legitimate");
    });
});
