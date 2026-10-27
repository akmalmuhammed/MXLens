import { readFileSync } from "node:fs";
import path from "node:path";
import PostalMime from "postal-mime";
import { describe, expect, it } from "vitest";
import { HeaderParser } from "@/lib/email/HeaderParser";
import { AnalysisEngine } from "@/lib/email/scoring/AnalysisEngine";
import { buildInvestigation } from "@/lib/investigation/Investigation";
import { coreSubject, kql } from "@/lib/investigation/Hunting";
import { defangText, investigationToMarkdown } from "@/lib/investigation/markdown";
import { buildReceivedChain } from "@/lib/investigation/ReceivedChain";
import { analyzeEmail } from "@/lib/email/analyze";

const read = (p: string) => readFileSync(path.join(process.cwd(), p), "utf8");

async function investigate(file: string) {
    const raw = read(file);
    const header = await HeaderParser.parse(raw);
    const email = await new PostalMime().parse(raw);
    const { signals, result } = await AnalysisEngine.analyze(header, email, { checkBody: true, checkAttachments: true });
    return buildInvestigation(header, signals, result);
}

const q = (inv: Awaited<ReturnType<typeof investigate>>, id: string) => inv.questions.find(x => x.id === id)!;

describe("delivery path reconstruction", () => {
    it("labels origin, sender relay, entry, gateway and mailbox hops, oldest first", async () => {
        const header = await HeaderParser.parse(read("tests/fixtures/email/qr-docusign-wrapped.eml"));
        const chain = buildReceivedChain(header.headers);
        expect(chain.hops.map(h => h.role)).toEqual(["origin", "entry", "recipient-system", "recipient-system"]);
        expect(chain.hops[0]).toMatchObject({ helo: "[127.0.0.1]", ip: "198.51.100.98", authenticatedAs: "info@unrelated-shop.example" });
        expect(chain.originIp).toBe("198.51.100.98");
        expect(chain.connectingIp).toBe("198.51.100.119");
        expect(chain.gateway?.name).toBe("Trend Micro Email Security");
        expect(chain.mailboxProvider?.name).toMatch(/Microsoft 365/);
    });

    it("finds a gateway hold and a local-process origin", async () => {
        const header = await HeaderParser.parse(read("tests/fixtures/email/gateway-masked-phish.eml"));
        const chain = buildReceivedChain(header.headers);
        expect(chain.hops[0].notes.join(" ")).toMatch(/local process/);
        expect(chain.longestDelay?.seconds).toBeGreaterThan(36 * 3600);
        expect(chain.connectingIp).toBe("198.51.100.24");
    });
});

describe("investigation of the wrapped DocuSign QR lure", () => {
    it("classifies the attack and writes a one-line assessment", async () => {
        const inv = await investigate("tests/fixtures/email/qr-docusign-wrapped.eml");
        expect(inv.attack.id).toBe("qr-phishing");
        expect(inv.headline).toBe("Credential phishing via QR code impersonating DocuSign, hidden in an attached email, sent through a compromised mailbox.");
        expect(inv.lure.themes[0]).toBe("a document signature request");
    });

    it("answers the analyst questions with evidence", async () => {
        const inv = await investigate("tests/fixtures/email/qr-docusign-wrapped.eml");
        expect(q(inv, "malicious")).toMatchObject({ answer: "yes", label: "Yes" });
        expect(q(inv, "spoofed").answer).toBe("likely");
        expect(q(inv, "spoofed").summary).toMatch(/logging in to an unrelated mailbox \(info@unrelated-shop\.example\)/);
        expect(q(inv, "spoofed").evidence.join(" ")).toMatch(/attached email claims to be from <hr@corp\.example>/);
        expect(q(inv, "sender")).toMatchObject({ label: "Traced" });
        expect(q(inv, "sender").summary).toMatch(/started at 198\.51\.100\.98.*logged in as info@unrelated-shop\.example.*entered Trend Micro Email Security/);
        expect(q(inv, "authentication").answer).toBe("no");
        expect(q(inv, "authentication").evidence.join(" ")).toMatch(/Return-Path \(vendor-mailer\.example\) matches the From domain\. That only means/);
        expect(q(inv, "ask").label).toBe("Scan a QR code");
        expect(q(inv, "targeted").answer).toBe("yes");
    });

    it("explains why it was delivered and how to fix it", async () => {
        const inv = await investigate("tests/fixtures/email/qr-docusign-wrapped.eml");
        const gaps = inv.whyDelivered.map(g => g.gap).join("\n");
        expect(gaps).toMatch(/SCL -1/);
        expect(gaps).toMatch(/QR code/);
        expect(gaps).toMatch(/attached \.eml/);
        expect(gaps).toMatch(/X-TM-Has-Qrcode: yes/);
        expect(inv.whyDelivered.map(g => g.fix).join("\n")).toMatch(/Enhanced Filtering for Connectors|SCL -1 bypass/);
    });

    it("lists indicators with their role and whether to block them", async () => {
        const inv = await investigate("tests/fixtures/email/qr-docusign-wrapped.eml");
        const ioc = (v: string) => inv.iocs.find(i => i.value === v);
        expect(ioc("https://edoc-notification.compromised-clinic.example/ls/click?upn=U3ludGhldGljVG9rZW5Gb3JUZXN0c09ubHk0Mjg0Njg2")).toMatchObject({ role: "QR code destination", block: true });
        expect(ioc("compromised-clinic.example")).toMatchObject({ block: true });
        expect(ioc("info@unrelated-shop.example")).toMatchObject({ role: "Mailbox used to send it (likely compromised)", block: false });
        expect(ioc("hr@corp.example")).toMatchObject({ role: "Forged sender inside attached email", block: false });
        expect(ioc("198.51.100.98")).toMatchObject({ role: "Origin client IP" });
        // Your own gateway and Microsoft are never listed as indicators.
        expect(inv.iocs.some(i => i.value === "203.0.113.106")).toBe(false);
    });

    it("maps ATT&CK techniques", async () => {
        const inv = await investigate("tests/fixtures/email/qr-docusign-wrapped.eml");
        expect(inv.techniques.map(t => t.id)).toEqual(expect.arrayContaining(["T1566.002", "T1204.001", "T1656", "T1586.002"]));
    });

    it("produces hunting and purge queries with the real values", async () => {
        const inv = await investigate("tests/fixtures/email/qr-docusign-wrapped.eml");
        const byId = Object.fromEntries(inv.hunting.map(h => [h.id, h.query]));
        expect(byId["email-campaign"]).toContain('Subject contains "Corp Academy Confidential: Document Requires Your Signature"');
        expect(byId["email-campaign"]).not.toContain("SenderIPv4 ==");
        expect(byId["email-urls"]).toContain('"compromised-clinic.example"');
        expect(byId["signins"]).toContain('"alice.smith@corp.example"');
        expect(byId["purge"]).toContain("New-ComplianceSearch");
        expect(byId["purge"]).toContain('(From:"edocnotification@vendor-mailer.example")');
        expect(inv.actions.some(a => a.when === "now" && /scanned\/clicked/.test(a.text))).toBe(true);
    });
});

describe("investigation of other shapes", () => {
    it("says the gateway hid a spoof and that the results prove nothing", async () => {
        const inv = await investigate("tests/fixtures/email/gateway-masked-phish.eml");
        expect(q(inv, "spoofed").answer).toBe("yes");
        expect(q(inv, "spoofed").summary).toMatch(/evaluated against your own gateway/);
        expect(q(inv, "authentication").answer).toBe("no");
        expect(inv.authentication.map(a => a.stage)).toEqual(["edge", "final"]);
        expect(inv.whyDelivered.some(g => /Enhanced Filtering/.test(g.fix))).toBe(true);
        expect(inv.path.summary).toMatch(/created on .* by a local program.*held for/);
    });

    it("is honest about a file with no delivery headers", async () => {
        const inv = await investigate("tests/fixtures/email/qr-docusign-payload.eml");
        expect(q(inv, "spoofed").answer).toBe("likely");
        expect(q(inv, "sender")).toMatchObject({ label: "Unknown" });
        expect(q(inv, "authentication").answer).toBe("unclear");
    });

    it("clears a legitimate message without inventing problems", async () => {
        const inv = await investigate("public/samples/demo-legitimate.eml");
        expect(inv.attack.id).toBe("none");
        expect(q(inv, "malicious").answer).toBe("no");
        expect(q(inv, "spoofed").answer).toBe("no");
        expect(q(inv, "authentication").answer).toBe("yes");
        expect(inv.actions).toEqual([{ when: "now", text: "No action needed. If a user reported it, thank them and close the report." }]);
        expect(inv.path.summary).toMatch(/entered .* from out-1\.smtp\.github\.com/);
    });

    it("is returned by analyzeEmail for the CLI and API", async () => {
        const out = await analyzeEmail(read("tests/fixtures/email/qr-docusign-wrapped.eml"));
        expect(out.investigation.attack.id).toBe("qr-phishing");
    });
});

describe("output helpers", () => {
    it("escapes KQL string literals and strips tenant subject tags", () => {
        expect(kql('a"b\\c')).toBe('"a\\"b\\\\c"');
        expect(coreSubject("EXTERNAL: [EXT] Invoice 42")).toBe("Invoice 42");
    });

    it("defangs hosts, URLs and public IPs but not file names, local parts or private IPs", () => {
        expect(defangText("See https://evil.example/a. Then 198.51.100.7 and 10.0.0.1, QR_alice.smith.png, alice.smith@corp.example")).toBe(
            "See hxxps://evil[.]example/a. Then 198[.]51[.]100[.]7 and 10.0.0.1, QR_alice.smith.png, alice.smith@corp[.]example"
        );
    });

    it("renders a Markdown write-up that is defanged outside the query blocks", async () => {
        const inv = await investigate("tests/fixtures/email/qr-docusign-wrapped.eml");
        const md = investigationToMarkdown(inv, { title: "Corp Academy Confidential" });
        const [prose, queries] = md.split("## Hunting and purge queries");
        expect(prose).toContain("## Key questions");
        expect(prose).toContain("### Is the sender spoofed? **Likely**");
        expect(prose).not.toMatch(/https?:\/\//);
        expect(prose).not.toMatch(/198\.51\.100\.98/);
        expect(queries).toContain("```kql");
        expect(queries).toContain('"compromised-clinic.example"');
    });
});
