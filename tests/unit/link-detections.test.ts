import PostalMime from "postal-mime";
import { describe, expect, it } from "vitest";
import { HeaderParser } from "@/lib/email/HeaderParser";
import { AnalysisEngine } from "@/lib/email/scoring/AnalysisEngine";
import { decodeHtmlEntities, extractAnchors, htmlToVisibleText } from "@/lib/email/analysis/HtmlText";

function message(html: string, opts: { from?: string; to?: string; auth?: string } = {}): string {
    return [
        "Received: from mail.example.net (mail.example.net [203.0.113.10]) by mx.example.org with ESMTPS id t1; Thu, 1 Jan 2026 00:05:10 +0000",
        "Received: from out.example.net (out.example.net [203.0.113.9]) by mail.example.net with ESMTP id t0; Thu, 1 Jan 2026 00:05:00 +0000",
        `Authentication-Results: mx.example.org; ${opts.auth ?? "spf=pass smtp.mailfrom=sender.example; dkim=pass header.d=sender.example; dmarc=pass header.from=sender.example"}`,
        `From: ${opts.from ?? "Sender <news@sender.example>"}`,
        `To: ${opts.to ?? "<alice@recipient.example>"}`,
        "Subject: Hello",
        "Date: Thu, 1 Jan 2026 00:04:58 +0000",
        "Message-ID: <t@sender.example>",
        "MIME-Version: 1.0",
        "Content-Type: text/html; charset=utf-8",
        "",
        html
    ].join("\r\n");
}

async function penalties(raw: string): Promise<string[]> {
    const header = await HeaderParser.parse(raw);
    const email = await new PostalMime().parse(raw);
    const { result } = await AnalysisEngine.analyze(header, email, { checkBody: true, checkAttachments: false });
    return result.trust.penalties.map(p => p.reason);
}

describe("HTML helpers", () => {
    it("decodes named and numeric entities", () => {
        expect(decodeHtmlEntities("a&amp;b &#x41;&#66; &nbsp;c &unknown;")).toBe("a&b AB  c &unknown;");
    });

    it("returns only what the recipient reads", () => {
        const html = "<html><head><title>x</title><style>.a{color:red}</style></head><body><!-- hidden --><script>evil()</script><p>Hello&nbsp;<b>world</b></p></body></html>";
        expect(htmlToVisibleText(html)).toBe("Hello world");
    });

    it("extracts anchors with text, image flag and Gmail rewrite", () => {
        const anchors = extractAnchors(
            `<a href="http://a.example/x?y=1&amp;z=2" data-saferedirecturl="https://www.google.com/url?q=http://a.example">Go <b>now</b></a><a href='http://b.example'><img src="cid:x"></a><a href=http://c.example>&nbsp;</a>`
        );
        expect(anchors).toEqual([
            { href: "http://a.example/x?y=1&z=2", text: "Go now", hasImage: false, safeRedirectUrl: "https://www.google.com/url?q=http://a.example" },
            { href: "http://b.example", text: "", hasImage: true, safeRedirectUrl: undefined },
            { href: "http://c.example", text: "", hasImage: false, safeRedirectUrl: undefined }
        ]);
    });
});

describe("link and kit detectors", () => {
    it("flags a Google redirect that carries its target in q=", async () => {
        const out = await penalties(message(`<p>See <a href="https://www.google.com/url?q=http://evil.example/login&amp;sa=D">this</a></p>`));
        expect(out.some(r => r.startsWith("Potential Open Redirect"))).toBe(true);
    });

    it("flags IPFS gateway links by gateway, CID subdomain and /ipfs/ path", async () => {
        for (const url of [
            "https://ipfs.io/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
            "https://dweb.link/anything",
            "https://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi.ipfs.dweb.link/"
        ]) {
            const out = await penalties(message(`<a href="${url}">Open</a>`));
            expect(out.some(r => r.includes("IPFS gateway")), url).toBe(true);
        }
    });

    it("flags a script planted in another site's CMS plugin directory but not the sender's own site", async () => {
        const kit = await penalties(message(`<a href="http://other.example/wp-content/plugins/x/y/index.php?e=1">Open</a>`));
        expect(kit.some(r => r.includes("CMS plugin/theme/upload directory"))).toBe(true);

        const own = await penalties(message(`<a href="https://www.sender.example/wp-content/plugins/x/y/index.php?e=1">Open</a>`));
        expect(own.some(r => r.includes("CMS plugin/theme/upload directory"))).toBe(false);

        const asset = await penalties(message(`<a href="http://other.example/wp-content/uploads/2026/report.pdf">Report</a>`));
        expect(asset.some(r => r.includes("CMS plugin/theme/upload directory"))).toBe(false);
    });

    it("flags third-party links that embed the recipient address, but not unsubscribe or first-party links", async () => {
        const hit = await penalties(message(`<a href="https://track.other.example/login?email=alice@recipient.example">Sign in</a>`));
        expect(hit.some(r => r.includes("embeds the recipient's own email address"))).toBe(true);

        const fragment = await penalties(message(`<a href="https://track.other.example/#alice@recipient.example">Sign in</a>`));
        expect(fragment.some(r => r.includes("embeds the recipient's own email address"))).toBe(true);

        const unsub = await penalties(message(`<a href="https://lists.other.example/unsubscribe?email=alice@recipient.example">Unsubscribe</a>`));
        expect(unsub.some(r => r.includes("email address"))).toBe(false);

        const own = await penalties(message(`<a href="https://app.sender.example/verify?email=alice@recipient.example">Verify</a>`));
        expect(own.some(r => r.includes("email address"))).toBe(false);
    });

    it("flags unrendered merge tags in links and visible text", async () => {
        for (const html of [
            `<a href="https://x.example/?u=%5B%5B-Email-%5D%5D">Go</a>`,
            `<p>Dear {{ name }}, hello</p>`,
            `<p>Dear %%FIRSTNAME%%, hello</p>`
        ]) {
            const out = await penalties(message(html));
            expect(out.some(r => r.includes("Template placeholder left unrendered")), html).toBe(true);
        }
        const clean = await penalties(message(`<p>Dear Alice, ${"{"}a${"}"} in code is fine</p>`));
        expect(clean.some(r => r.includes("Template placeholder"))).toBe(false);
    });

    it("flags a blank anchor, more strongly when it leads to a different site, and ignores image anchors", async () => {
        const diverge = await penalties(message(`<a href="https://www.sender.example/a">Read</a><a href="http://other.example/z">&nbsp;</a>`));
        expect(diverge.some(r => r.includes("different site from the visible links"))).toBe(true);

        const same = await penalties(message(`<a href="https://www.sender.example/a">Read</a><a href="https://www.sender.example/b">&nbsp;</a>`));
        expect(same.some(r => r.includes("Clickable link with no visible text") && !r.includes("different site"))).toBe(true);

        const image = await penalties(message(`<a href="http://other.example/z"><img src="cid:logo"></a>`));
        expect(image.some(r => r.includes("no visible text"))).toBe(false);
    });
});

describe("sender detectors", () => {
    const external = (extra = "") => ({
        from: "corp.example <noreply@corp.example>",
        to: "<alice@corp.example>",
        auth: `spf=pass smtp.mailfrom=corp.example; dkim=none; dmarc=${extra || "none"} header.from=corp.example`
    });

    it("flags external mail from the recipient's own domain without a real DMARC pass", async () => {
        const out = await penalties(message("<p>Hi</p>", external()));
        expect(out.some(r => r.includes("recipient's own domain"))).toBe(true);
        expect(out.some(r => r.includes("display name is just the domain"))).toBe(true);
    });

    it("treats dmarc=bestguesspass as unverified", async () => {
        const out = await penalties(message("<p>Hi</p>", external("bestguesspass action=none")));
        expect(out.some(r => r.includes("recipient's own domain"))).toBe(true);
    });

    it("accepts a verified DMARC pass and ignores mail to other organizations", async () => {
        const pass = await penalties(message("<p>Hi</p>", external("pass")));
        expect(pass.some(r => r.includes("recipient's own domain"))).toBe(false);

        const other = await penalties(message("<p>Hi</p>", { from: "News <news@sender.example>", to: "<alice@recipient.example>", auth: "spf=pass; dkim=none; dmarc=none" }));
        expect(other.some(r => r.includes("recipient's own domain"))).toBe(false);
    });
});
