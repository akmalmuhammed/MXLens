import type { AnalysisResult } from "../email/HeaderParser";
import type { NormalizedSignals, ScoringResult, ValidationPenalty } from "../email/scoring/types";
import { getFirstHeaderValue, getHeaderValues } from "../email/parser/HeaderUtils";
import { organizationalDomain } from "../email/analysis/Domain";
import { allRecipients, recipientOrgs, visibleRecipients } from "../email/analysis/Recipients";
import { buildReceivedChain, formatDuration, isPrivateIp, type ChainHop, type ReceivedChain } from "./ReceivedChain";
import { buildHuntingQueries, type HuntingQuery } from "./Hunting";

/**
 * An analyst-style investigation of one message: the questions a SOC analyst answers when a
 * user reports an email, in the order they answer them, each with the evidence behind it.
 * Pure function of the engine output; it makes no network calls.
 */

export type Answer = "yes" | "no" | "likely" | "unlikely" | "unclear";

export interface InvestigationQuestion {
    id: "malicious" | "spoofed" | "sender" | "authentication" | "ask" | "delivered" | "targeted";
    question: string;
    answer: Answer;
    /** Short answer shown next to the question ("Yes", "Traced", "Scan a QR code"...). */
    label: string;
    summary: string;
    evidence: string[];
}

export interface InvestigationHop {
    index: number;
    role: ChainHop["role"];
    roleLabel: string;
    from: string;
    ip: string | null;
    by: string;
    operator: string | null;
    time: string | null;
    delay: string | null;
    notes: string[];
}

export interface AuthEvaluation {
    evaluator: string;
    stage: "edge" | "final";
    spf: string;
    dkim: string;
    dmarc: string;
    checkedIp: string | null;
    note: string;
}

export interface Ioc {
    type: "domain" | "url" | "ip" | "email" | "sha256" | "subject" | "message-id" | "filename" | "phone";
    value: string;
    role: string;
    /** Safe to block (attacker-controlled or compromised), as opposed to context only. */
    block: boolean;
}

export interface Technique {
    id: string;
    name: string;
    evidence: string;
}

export interface Investigation {
    verdict: { label: string; risk: number; confidence: string };
    attack: { id: string; label: string };
    headline: string;
    narrative: string[];
    lure: { themes: string[]; brand: string | null; ask: string };
    questions: InvestigationQuestion[];
    path: {
        summary: string;
        hops: InvestigationHop[];
        connectingIp: string | null;
        originIp: string | null;
        gateway: string | null;
        provider: string | null;
    };
    authentication: AuthEvaluation[];
    payload: { kind: string; detail: string }[];
    whyDelivered: { gap: string; fix: string }[];
    techniques: Technique[];
    iocs: Ioc[];
    actions: { when: "now" | "next" | "harden"; text: string }[];
    hunting: HuntingQuery[];
}

const ROLE_LABEL: Record<ChainHop["role"], string> = {
    origin: "Origin",
    "sender-relay": "Sender relay",
    entry: "Entered your mail system",
    gateway: "Gateway",
    "recipient-system": "Your mail system"
};

const ASSET_URL = /\.(?:png|jpe?g|gif|svg|webp|ico|css|js|woff2?|ttf)(?:[?#]|$)/i;
const SAFE_ASSET_HOSTS = /(?:^|\.)(?:akamaihd\.net|gstatic\.com|googleusercontent\.com|office\.net|msauth\.net|msftauth\.net|dropboxstatic\.com|cloudfront\.net)$/i;

function hostOf(u: string): string {
    try {
        return new URL(u).hostname.toLowerCase();
    } catch {
        return "";
    }
}

function fired(penalties: ValidationPenalty[], id: string): ValidationPenalty | undefined {
    return penalties.find(p => p.detectorId === id);
}

function has(penalties: ValidationPenalty[], text: string): ValidationPenalty | undefined {
    return penalties.find(p => p.value < 0 && p.reason.toLowerCase().includes(text.toLowerCase()));
}

const THEMES: [string, RegExp][] = [
    ["a document signature request", /\b(?:docu-?sign|e-?sign|signature|review and sign|sign (?:the|your) document|envelope)\b/i],
    ["a shared file or document", /\b(?:shared (?:a |an )?(?:file|document|folder)|onedrive|sharepoint|dropbox|wetransfer|view (?:the )?document|secure (?:document|message))\b/i],
    ["a voicemail or fax notice", /\b(?:voice ?mail|voice message|missed call|caller left|fax)\b/i],
    ["an invoice or payment notice", /\b(?:invoice|payment|remittance|wire transfer|ach|overdue|purchase order|statement of account)\b/i],
    ["an account or mailbox verification notice", /\b(?:(?:verify|confirm|validate|update) (?:your )?(?:account|identity|e-?mail|mailbox|password)|mailbox (?:is )?(?:full|quota|storage)|password (?:expir|reset)|account (?:will be )?(?:suspend|lock|block|deactivat|clos))/i],
    ["an HR, payroll or benefits notice", /\b(?:payroll|salary|bonus|benefits|human resources|hr department|401\(?k\)?|pension|handbook|policy update)\b/i],
    ["a parcel delivery notice", /\b(?:shipment|parcel|package|tracking number|delivery (?:attempt|failed|notice))\b/i],
    ["an MFA or security alert", /\b(?:mfa|2fa|multi-?factor|security alert|unusual sign-?in|unrecognized (?:device|sign-?in)|authenticator)\b/i],
    ["a subscription renewal notice", /\b(?:subscription|auto-?renew(?:al)?|renewal)\b/i]
];

export function buildInvestigation(header: AnalysisResult, signals: NormalizedSignals, scoring: ScoringResult): Investigation {
    const penalties = scoring.trust.penalties;
    const chain = buildReceivedChain(header.headers, recipientOrgs(header.headers));
    const risk = Math.max(0, Math.min(100, 100 - Math.round(scoring.trust.score)));
    const verdictLabel = scoring.verdict.verdict;
    const subject = getFirstHeaderValue(header.headers, "Subject").replace(/\s+/g, " ").trim();
    const fromAddress = (getFirstHeaderValue(header.headers, "From").match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i)?.[0] || "").toLowerCase();
    const fromDomain = signals.fromDomain;
    const fromOrg = fromDomain ? organizationalDomain(fromDomain) : "";
    const myOrgs = recipientOrgs(header.headers);
    const recipients = visibleRecipients(header.headers);
    const allRcpt = allRecipients(header.headers);
    const undelivered = !signals.hasReceivedHeaders && !signals.authenticationResultsPresent;
    const dmarcVerified = signals.dmarcResult === "pass" && !signals.dmarcBestGuess;
    const origin = header.originAuth;
    const qrUrls = (signals.qrPayloads || []).filter(p => /^https?:\/\//i.test(p));
    const embedded = signals.embeddedMessages || [];

    // ------------------------------------------------------------------ lure
    const themes = THEMES.filter(([, re]) => re.test(subject)).map(([t]) => t);
    for (const [t, re] of THEMES) if (themes.length < 2 && !themes.includes(t) && re.test(signals.visibleText || "")) themes.push(t);
    const brandFinding = fired(penalties, "brand-template");
    const brand = (brandFinding?.reason.match(/^(\w+) impersonation/)?.[1])
        ?? (has(penalties, "Display Name Spoofing: Claims to be")?.reason.match(/(DocuSign|Microsoft|Google|Apple|Amazon|PayPal|Dropbox|Adobe|WeTransfer|Netflix|Meta|Facebook)/i)?.[1] ?? null);

    const linkUrls = [...new Set((signals.extractedUrls || []).filter(u => !ASSET_URL.test(u) && !qrUrls.includes(u)))];
    const attachments = signals.attachments || [];
    const riskyAttachments = attachments.filter(a => a.isExecutable || a.isScript || a.macroDetected || a.isMasquerading || a.hasDoubleExtension || a.hasBidiOverride || a.isDiskImage || a.isShortcut || (a.dangerousFunctions?.length ?? 0) > 0);

    // ------------------------------------------------------------------ attack type
    const attack = classify();
    function classify(): { id: string; label: string } {
        if (fired(penalties, "clickfix")) return { id: "clickfix", label: "Malware delivery by paste-and-run (ClickFix)" };
        if (fired(penalties, "device-code-oauth")) return /consent/i.test(fired(penalties, "device-code-oauth")!.reason)
            ? { id: "oauth-consent", label: "OAuth consent phishing (token theft)" }
            : { id: "device-code", label: "Device-code phishing (token theft)" };
        if (fired(penalties, "markup-attachment")) return { id: "html-attachment", label: "Phishing or malware in an HTML/SVG attachment" };
        if (riskyAttachments.length > 0 && scoring.verdict.verdict !== "Likely Legitimate") return { id: "malware-attachment", label: "Malicious attachment" };
        if (qrUrls.length > 0 || fired(penalties, "qr-lure")) return { id: "qr-phishing", label: "Credential phishing via QR code" };
        if (fired(penalties, "callback-phishing")) return { id: "callback", label: "Callback phishing (TOAD)" };
        if (fired(penalties, "bec-request")) return { id: "bec", label: "Business email compromise" };
        if (fired(penalties, "ai-prompt-injection")) return { id: "prompt-injection", label: "AI assistant manipulation (prompt injection)" };
        const linkLure = linkUrls.length > 0 && (signals.hasCredentialHarvesting || ["phishing-kit-link", "personalized-link", "hosting-abuse", "url-obfuscation", "invisible-link", "link-obfuscation"].some(id => fired(penalties, id)));
        if (linkLure && verdictLabel !== "Likely Legitimate") return { id: "credential-link", label: "Credential phishing via link" };
        if (fired(penalties, "notification-abuse")) return { id: "notification-abuse", label: "Abuse of a genuine service notification" };
        const spoof = signals.dmarcResult === "fail" || signals.originAuthMasked || fired(penalties, "self-domain-spoof") || has(penalties, "Display Name Spoofing");
        if (spoof && verdictLabel !== "Likely Legitimate") return { id: "impersonation", label: "Sender impersonation" };
        if (verdictLabel === "Likely Legitimate") return { id: "none", label: "No malicious activity found" };
        return { id: "suspicious", label: "Suspicious message (inconclusive)" };
    }

    const ask = describeAsk();
    function describeAsk(): string {
        switch (attack.id) {
            case "qr-phishing": return "scan a QR code with a phone and sign in on the page it opens";
            case "clickfix": return "paste and run a command on their computer";
            case "device-code": return "enter a code on a genuine sign-in page, which signs the attacker's device in";
            case "oauth-consent": return "grant a third-party app access to their mailbox or files";
            case "html-attachment": return "open an HTML/SVG attachment that runs in the browser";
            case "malware-attachment": return "open an attachment that can run code";
            case "callback": return "call a phone number";
            case "bec": return "make a payment, change bank details or buy gift cards";
            case "credential-link": return "click a link and sign in";
            case "prompt-injection": return "trust an AI assistant's summary that the email manipulates";
            default: return linkUrls.length ? "click a link" : "read and reply";
        }
    }

    // ------------------------------------------------------------------ path
    const hops: InvestigationHop[] = chain.hops.map(h => ({
        index: h.index,
        role: h.role,
        roleLabel: ROLE_LABEL[h.role],
        from: h.rdns && h.rdns !== "unknown" ? h.rdns : h.helo,
        ip: h.ip,
        by: h.by,
        operator: h.byInfra?.name ?? null,
        time: h.time,
        delay: h.delaySeconds !== null && h.index > 1 ? formatDuration(h.delaySeconds) : null,
        notes: h.notes
    }));
    const pathSummary = describePath(chain, undelivered);

    // ------------------------------------------------------------------ authentication
    const authentication: AuthEvaluation[] = [];
    if (origin) {
        authentication.push({
            evaluator: origin.authserv || origin.source,
            stage: "edge",
            spf: origin.spf ?? "none",
            dkim: origin.dkim ?? "none",
            dmarc: origin.dmarc ? `${origin.dmarc}${origin.dmarcAction ? ` (${origin.dmarcAction})` : ""}` : "none",
            checkedIp: origin.spfIp ?? null,
            note: origin.unverified ? "Recorded by the first server that saw the message (not cryptographically verified)." : "Recorded by the first server that saw the message."
        });
    }
    if (signals.authenticationResultsPresent) {
        const finalSpfIp = origin?.finalSpfIp ?? getFirstHeaderValue(header.headers, "Authentication-Results").match(/sender ip(?: address)?(?: is)?[:\s]+([0-9a-f.:]+)/i)?.[1] ?? null;
        const viaGateway = chain.gateway && finalSpfIp && chain.hops.some(h => h.ip === finalSpfIp && h.byInfra?.kind === "mailbox-provider" && h.helo && /trendmicro|pphosted|mimecast|iphmx|barracuda|messagelabs|hornetsecurity/i.test(h.helo));
        authentication.push({
            evaluator: signals.authservId || "final receiver",
            stage: "final",
            spf: header.auth.spf.status,
            dkim: header.auth.dkim.status,
            dmarc: `${header.auth.dmarc.status}${header.auth.dmarc.bestGuess ? " (bestguesspass: no DMARC record)" : ""}`,
            checkedIp: finalSpfIp,
            note: viaGateway
                ? `Evaluated against ${finalSpfIp}, the ${chain.gateway!.name} gateway, not the real sender.`
                : "Result recorded by the receiving mail system."
        });
    }

    // ------------------------------------------------------------------ questions
    const questions: InvestigationQuestion[] = [];

    // Q1 malicious?
    {
        const top = [...penalties].filter(p => p.value < 0).sort((a, b) => a.value - b.value).slice(0, 5).map(p => p.reason);
        const answer: Answer = verdictLabel === "High Risk" ? "yes" : verdictLabel === "Suspicious" ? "likely" : verdictLabel === "Likely Legitimate" ? "no" : "unclear";
        questions.push({
            label: "",
            id: "malicious",
            question: "Is this email malicious?",
            answer,
            summary: answer === "no"
                ? "No phishing or malware indicators were found."
                : `${attack.label}${brand ? ` impersonating ${brand}` : ""}. Risk ${risk}/100 (${scoring.confidence.level.toLowerCase()} confidence).`,
            evidence: answer === "no" ? scoring.confidence.factors.map(f => f.reason).slice(0, 4) : top
        });
    }

    // Q2 spoofed?
    questions.push(spoofQuestion());
    function spoofQuestion(): InvestigationQuestion {
        const q = "Is the sender spoofed?";
        const ev: string[] = [];
        const submission = fired(penalties, "submission-anomaly");
        const selfDomain = fired(penalties, "self-domain-spoof");
        const forgedInner = embedded.find(m => m.fromDomain && myOrgs.includes(organizationalDomain(m.fromDomain)) && !myOrgs.includes(fromOrg));
        if (forgedInner) ev.push(`The attached email claims to be from ${forgedInner.from} (your organization) but has no delivery headers: it was written as a file, never sent by that mailbox.`);

        if (undelivered) {
            const internal = fromOrg && myOrgs.includes(fromOrg);
            return {
                label: "", id: "spoofed", question: q, answer: internal ? "likely" : "unclear",
                summary: `This file has no delivery or authentication headers, so the From line (${fromAddress || "none"}) is just text written by whoever made the file and cannot be verified.${internal ? " A message \"from\" your own organization with no delivery trail is almost certainly forged." : ""}`,
                evidence: ["No Received headers", "No Authentication-Results header"]
            };
        }
        if (signals.originAuthMasked && origin) {
            ev.unshift(`The first server that saw it recorded SPF ${origin.spf}${origin.spfIp ? ` for ${origin.spfIp}` : ""} and DMARC ${origin.dmarc ?? "none"}${origin.dmarcAction ? ` (${origin.dmarcAction})` : ""} for ${fromDomain}.`);
            if (origin.finalSpfIp) ev.push(`The later "SPF pass" was computed against ${origin.finalSpfIp}, your gateway, which ${fromDomain}'s SPF happens to allow.`);
            return { label: "", id: "spoofed", question: q, answer: "yes", summary: `Yes. ${fromDomain} did not authorize the server that actually sent it; the passing result you see was evaluated against your own gateway.`, evidence: ev };
        }
        if (signals.dmarcResult === "fail") {
            ev.unshift(`DMARC failed for ${fromDomain}: neither SPF nor DKIM aligned with the From domain.`);
            return { label: "", id: "spoofed", question: q, answer: "yes", summary: `Yes. The From domain ${fromDomain} failed DMARC.`, evidence: ev };
        }
        if (selfDomain) {
            ev.unshift(selfDomain.reason);
            return { label: "", id: "spoofed", question: q, answer: "yes", summary: `Yes. It claims to come from your own domain (${fromOrg}) but arrived from outside without a verified DMARC pass.`, evidence: ev };
        }
        if (submission) {
            ev.unshift(submission.reason);
            return {
                label: "", id: "spoofed", question: q, answer: "likely",
                summary: `Not forged at the protocol level, but abused: it was sent by logging in to an unrelated mailbox (${(submission.reason.match(/logging in as (\S+?),/) || [])[1] ?? "another account"}), so ${fromDomain} is either compromised or attacker-controlled.${brand ? ` The ${brand} identity in the display name is fake.` : ""}`,
                evidence: ev
            };
        }
        if (dmarcVerified) {
            const notif = fired(penalties, "notification-abuse");
            return {
                label: "", id: "spoofed", question: q, answer: "no",
                summary: `No. ${fromDomain} authenticated this message (DMARC pass).${notif ? " A genuine service sent it, but attacker-controlled content was injected into it." : " That proves who sent it, not that it is safe: the account or service may be compromised."}`,
                evidence: [header.auth.dmarc.details, ...(notif ? [notif.reason] : []), ...ev].filter(Boolean)
            };
        }
        const displaySpoof = has(penalties, "Display Name Spoofing") || has(penalties, "Display name shows the domain");
        if (signals.spfResult === "pass" || origin?.spf === "pass") {
            ev.unshift(`SPF passed for the envelope domain ${signals.returnPathDomain || fromDomain}, but ${fromDomain} has no enforced DMARC policy.`);
            if (displaySpoof) ev.push(displaySpoof.reason);
            return {
                label: "", id: "spoofed", question: q, answer: displaySpoof ? "likely" : "unlikely",
                summary: displaySpoof
                    ? `The address itself is not forged (its server is authorized), but the display name impersonates someone else. Whoever controls ${fromOrg} sent it.`
                    : `The address does not look forged: the sending server is authorized by ${fromDomain}'s SPF. Without DMARC, that is weaker proof than it seems.`,
                evidence: ev
            };
        }
        return {
            label: "", id: "spoofed", question: q, answer: "unclear",
            summary: `Authentication for ${fromDomain || "the sender"} is inconclusive (SPF ${signals.spfResult}, DKIM ${signals.dkimResult}, DMARC ${signals.dmarcResult}).`,
            evidence: ev
        };
    }

    // Q3 who sent it?
    {
        const ev: string[] = [];
        if (chain.originIp && chain.originIp !== chain.connectingIp) {
            const o = chain.hops.find(h => h.ip === chain.originIp);
            ev.push(`Origin client ${chain.originIp}${o?.helo ? ` (called itself ${o.helo})` : ""}${o?.authenticatedAs ? `, logged in as ${o.authenticatedAs}` : ""}.`);
        }
        if (chain.entry) ev.push(`Handed to ${chain.entry.byInfra?.name ?? chain.entry.by} by ${chain.entry.rdns && chain.entry.rdns !== "unknown" ? chain.entry.rdns : chain.entry.helo} [${chain.entry.ip ?? "unknown IP"}]${chain.entry.rdns === "unknown" ? " (no reverse DNS)" : ""}.`);
        const xOrig = getFirstHeaderValue(header.headers, "X-Originating-IP").replace(/[[\]]/g, "").trim();
        if (xOrig) ev.push(`X-Originating-IP header: ${xOrig} (set by the sender's mail client or webmail; not verified).`);
        if (signals.returnPathDomain && organizationalDomain(signals.returnPathDomain) !== fromOrg) ev.push(`Bounces go to ${signals.returnPathDomain}, a different domain from the From address.`);
        const dkimDomains = dkimSigners(header);
        if (dkimDomains.length) ev.push(`DKIM-signed by ${dkimDomains.join(", ")}${dkimDomains.every(d => organizationalDomain(d) !== fromOrg) ? " (not the From domain, so the signature does not vouch for it)" : ""}.`);
        questions.push({
            label: "",
            id: "sender",
            question: "Who actually sent it, and from where?",
            answer: undelivered ? "unclear" : chain.connectingIp || chain.originIp ? "yes" : "unclear",
            summary: undelivered
                ? "Unknown: the file carries no delivery trail. Find the delivered copy (see hunting queries) to see where it came from."
                : pathSummary,
            evidence: ev
        });
    }

    // Q4 authentication explained (including the Return-Path question)
    {
        const ev: string[] = [];
        const rp = signals.returnPathDomain;
        if (rp && fromDomain) {
            ev.push(organizationalDomain(rp) === fromOrg
                ? `Return-Path (${rp}) matches the From domain. That only means the sender typed the same domain into both fields; it is not authentication. SPF/DKIM/DMARC decide whether the domain approved the sending server.`
                : `Return-Path (${rp}) differs from the From domain (${fromDomain}), common for bulk mail services but also for spoofing.`);
        }
        for (const a of authentication) ev.push(`${a.stage === "edge" ? "First server" : "Final server"} (${a.evaluator}): SPF ${a.spf}${a.checkedIp ? ` for ${a.checkedIp}` : ""}, DKIM ${a.dkim}, DMARC ${a.dmarc}. ${a.note}`);
        if (origin?.dmarcAction === "no records") ev.push(`"${origin.dmarc} (no records)" means ${fromDomain} has no DMARC record at all; the gateway's DMARC result carries no weight.`);
        if (signals.dmarcBestGuess) ev.push("\"bestguesspass\" means the domain has no DMARC record and Microsoft guessed; it is not a DMARC pass.");
        if (signals.compauthResult) ev.push(`Microsoft composite authentication: ${signals.compauthResult}${signals.compauthReason ? ` (reason ${signals.compauthReason})` : ""}.`);
        // "Do they prove anything?" Yes only for a real DMARC pass not contradicted by the edge.
        const answer: Answer = undelivered || !signals.authenticationResultsPresent ? "unclear" : dmarcVerified && !signals.originAuthMasked ? "yes" : "no";
        questions.push({
            label: "",
            id: "authentication",
            question: "Do the authentication results (and a matching Return-Path) prove anything?",
            answer,
            summary: answer === "unclear"
                ? "There are no authentication results to read in this file."
                : signals.originAuthMasked
                    ? "The final results look better than reality: they describe your gateway, not the sender. The first server's results are the real ones."
                    : dmarcVerified
                        ? "Yes, DMARC passed, so the From domain approved this message. It proves origin, not intent."
                        : "No. Without a DMARC pass, a passing SPF or a matching Return-Path does not stop someone from sending as this domain.",
            evidence: ev
        });
    }

    // Q5 what does it want?
    const payload: { kind: string; detail: string }[] = [];
    for (const u of qrUrls) payload.push({ kind: "QR code", detail: `Opens ${u}` });
    for (const m of embedded) payload.push({ kind: "Attached email", detail: `"${m.subject || m.filename}" from ${m.from || "unknown"}${m.hasReceived ? "" : " (never delivered: no Received headers)"}` });
    for (const u of linkUrls.slice(0, 8)) payload.push({ kind: "Link", detail: u });
    for (const a of attachments) {
        const flags = [a.isExecutable && "executable", a.isScript && "script/active content", a.macroDetected && "macros", a.hasDoubleExtension && "double extension", a.hasBidiOverride && "right-to-left override", a.isMasquerading && `really ${a.magicType}`, a.isDiskImage && "disk image", a.isShortcut && "shortcut"].filter(Boolean);
        payload.push({ kind: "Attachment", detail: `${a.filename} (${a.extension || "no extension"}, ${a.size} bytes${flags.length ? `; ${flags.join(", ")}` : ""})${a.sha256 ? ` sha256 ${a.sha256}` : ""}` });
    }
    const phones = fired(penalties, "callback-phishing")?.reason.match(/call ([+()\d\s.-]{10,})/)?.[1]?.trim();
    if (phones) payload.push({ kind: "Phone number", detail: phones });
    questions.push({
        label: "",
        id: "ask",
        question: "What does it want the recipient to do?",
        answer: attack.id === "none" ? "no" : "yes",
        summary: attack.id === "none"
            ? "Nothing suspicious: no credential, payment or execution request was found."
            : `It ${themes.length ? `poses as ${themes.join(" / ")}${brand ? ` from ${brand}` : ""} and ` : ""}asks the recipient to ${ask}.`,
        evidence: payload.map(p => `${p.kind}: ${p.detail}`).slice(0, 8)
    });

    // Q6 why delivered?
    const whyDelivered = deliveryGaps();
    function deliveryGaps(): { gap: string; fix: string }[] {
        const gaps: { gap: string; fix: string }[] = [];
        if (signals.exchangeFilteringBypassed || header.exchange?.scl === -1) {
            gaps.push({ gap: "Exchange Online skipped spam filtering (SCL -1), typically because a transport rule or connector trusts everything from the gateway.", fix: "Remove the SCL -1 bypass for gateway traffic, or narrow it, so Microsoft Defender for Office 365 still scans these messages." });
        }
        if (chain.gateway && authentication.some(a => a.stage === "final" && /gateway/.test(a.note))) {
            gaps.push({ gap: `Microsoft evaluated SPF against the ${chain.gateway.name} gateway's IP instead of the real sender.`, fix: "Turn on Enhanced Filtering for Connectors (skip listing) on the inbound connector so Microsoft sees the original sending IP." });
        }
        if (signals.dmarcBestGuess || (signals.dmarcResult === "none" && !undelivered && fromDomain)) {
            gaps.push({ gap: `${fromDomain} publishes no DMARC policy, so nothing tells receivers to reject mail that fails SPF/DKIM.`, fix: myOrgs.includes(fromOrg) ? `Publish DMARC for ${fromOrg} and move to p=reject.` : "Treat mail from domains without DMARC with more suspicion (for example, external tagging plus stricter rules for credential lures)." });
        }
        if (qrUrls.length) gaps.push({ gap: "The link was inside an image (QR code), so URL rewriting and Safe Links never saw it, and the scan happens on a personal phone.", fix: "Enable QR code scanning in the gateway/Defender policy and train users that QR codes in email are links." });
        if (embedded.length) gaps.push({ gap: "The lure was inside an attached .eml, so the delivered message looked like an empty disclaimer.", fix: "Make the gateway inspect nested message/rfc822 attachments, or quarantine external mail whose only content is an attached email." });
        if (fired(penalties, "markup-attachment")) gaps.push({ gap: "The payload is an HTML/SVG file that renders locally, outside link scanning.", fix: "Block or sandbox HTML/SVG attachments from external senders." });
        if (["callback", "bec"].includes(attack.id)) gaps.push({ gap: "There is no link or attachment for a scanner to judge; it is pure social engineering.", fix: "Use impersonation protection (users and domains), external-sender banners, and a verify-by-phone rule for payment changes." });
        if (fired(penalties, "submission-anomaly")) gaps.push({ gap: "It was sent through a real, compromised mailbox on legitimate hosting, so the sending IP and domain have a clean reputation.", fix: "Report the abused account to the hosting provider; reputation alone will not stop these." });
        if (fired(penalties, "self-domain-spoof") && /Direct Send/.test(fired(penalties, "self-domain-spoof")!.reason)) gaps.push({ gap: "Microsoft 365 Direct Send accepted unauthenticated mail claiming to be internal.", fix: "Run Set-OrganizationConfig -RejectDirectSend $true if nothing legitimately uses Direct Send." });
        const tmQr = header.xHeaders?.find(x => x.key.toLowerCase() === "x-tm-has-qrcode");
        if (tmQr && /yes/i.test(tmQr.value)) gaps.push({ gap: "The Trend Micro gateway detected the QR code (X-TM-Has-Qrcode: yes) but still delivered the message.", fix: "Add a gateway rule that quarantines or tags external messages with QR codes plus credential/document lure wording." });
        if (dmarcVerified && attack.id !== "none") gaps.push({ gap: "It passed authentication, so reputation and DMARC checks had nothing to object to.", fix: "Rely on content and behavior controls (sandboxing, link detonation) for authenticated senders." });
        return gaps;
    }
    questions.push({
        label: "",
        id: "delivered",
        question: "Why was it not blocked?",
        answer: whyDelivered.length ? "yes" : "unclear",
        summary: whyDelivered.length ? whyDelivered.map(g => g.gap).slice(0, 2).join(" ") : attack.id === "none" ? "Nothing needed blocking." : "No specific control gap was identified from the headers.",
        evidence: whyDelivered.map(g => g.gap)
    });

    // Q7 targeted?
    {
        const ev: string[] = [];
        for (const id of ["personalized-link", "attachment-lure", "org-lookalike", "self-domain-spoof"]) {
            const f = fired(penalties, id);
            if (f && !(id === "attachment-lure" && !/mailbox name|address/.test(f.reason))) ev.push(f.reason);
        }
        const inSubject = allRcpt.find(r => subject.toLowerCase().includes(r) || subject.toLowerCase().includes(r.split("@")[0]));
        if (inSubject) ev.push(`The subject contains the recipient's address or name (${inSubject}).`);
        const forged = embedded.find(m => m.fromDomain && myOrgs.includes(organizationalDomain(m.fromDomain)));
        if (forged) ev.push(`It impersonates your own organization (${forged.from}).`);
        const orgName = myOrgs.map(o => o.split(".")[0]).find(label => label.length >= 4 && new RegExp(`\\b${label}\\b`, "i").test(subject));
        if (orgName) ev.push(`The subject names your organization ("${orgName}").`);
        questions.push({
            label: "",
            id: "targeted",
            question: "Is it targeted at us?",
            answer: ev.length >= 2 ? "yes" : ev.length === 1 ? "likely" : attack.id === "none" ? "no" : "unlikely",
            summary: ev.length
                ? "Yes: it was tailored to the recipient or your organization, so expect other colleagues to have received variants with their own names."
                : attack.id === "none" ? "Not applicable." : "No personalization found; it looks like a bulk campaign.",
            evidence: ev
        });
    }

    // Short labels shown next to each question.
    for (const q of questions) {
        q.label = labelFor(q);
    }
    function labelFor(q: InvestigationQuestion): string {
        switch (q.id) {
            case "sender": return q.answer === "unclear" ? "Unknown" : "Traced";
            case "ask": return q.answer === "no" ? "Nothing" : ({
                "qr-phishing": "Scan a QR code", "clickfix": "Run a command", "device-code": "Enter a code", "oauth-consent": "Grant app access",
                "html-attachment": "Open an attachment", "malware-attachment": "Open an attachment", "callback": "Call a number", "bec": "Pay or share data",
                "credential-link": "Click and sign in", "prompt-injection": "Trust an AI summary"
            } as Record<string, string>)[attack.id] ?? "Click or reply";
            case "delivered": return q.answer === "yes" ? `${whyDelivered.length} gap${whyDelivered.length === 1 ? "" : "s"}` : "None found";
            default: return ({ yes: "Yes", no: "No", likely: "Likely", unlikely: "Unlikely", unclear: "Unclear" } as Record<Answer, string>)[q.answer];
        }
    }

    // ------------------------------------------------------------------ techniques
    const techniques = mapTechniques();
    function mapTechniques(): Technique[] {
        const t: Technique[] = [];
        const add = (id: string, name: string, evidence: string) => { if (!t.some(x => x.id === id)) t.push({ id, name, evidence }); };
        if (qrUrls.length || linkUrls.length && ["credential-link", "qr-phishing", "device-code", "oauth-consent"].includes(attack.id)) add("T1566.002", "Phishing: Spearphishing Link", qrUrls.length ? "Link delivered as a QR code" : "Credential lure link");
        if (fired(penalties, "markup-attachment") || riskyAttachments.length) add("T1566.001", "Phishing: Spearphishing Attachment", "Malicious attachment");
        if (attack.id === "callback") add("T1566.004", "Phishing: Spearphishing Voice", "Callback phone number");
        if (["qr-phishing", "credential-link"].includes(attack.id)) add("T1204.001", "User Execution: Malicious Link", "Recipient must open the link/QR");
        if (fired(penalties, "markup-attachment") || riskyAttachments.length) add("T1204.002", "User Execution: Malicious File", "Recipient must open the file");
        if (fired(penalties, "clickfix")) add("T1204.004", "User Execution: Malicious Copy and Paste", "Paste-and-run instructions");
        if (/HTML smuggling/i.test(fired(penalties, "markup-attachment")?.reason ?? "")) add("T1027.006", "Obfuscated Files or Information: HTML Smuggling", "File assembled in the browser");
        if (attachments.some(a => a.hasBidiOverride)) add("T1036.002", "Masquerading: Right-to-Left Override", "RTLO in a filename");
        if (attachments.some(a => a.hasDoubleExtension)) add("T1036.007", "Masquerading: Double File Extension", "Decoy extension");
        if (fired(penalties, "device-code-oauth")) add("T1528", "Steal Application Access Token", "Device-code/OAuth consent flow");
        if (brand || fired(penalties, "self-domain-spoof") || fired(penalties, "org-lookalike") || has(penalties, "Display Name Spoofing") || embedded.some(m => myOrgs.includes(organizationalDomain(m.fromDomain || "")))) add("T1656", "Impersonation", brand ? `Poses as ${brand}` : "Poses as a trusted sender");
        if (fired(penalties, "submission-anomaly")) add("T1586.002", "Compromise Accounts: Email Accounts", "Sent through an unrelated, compromised mailbox");
        if (fired(penalties, "phishing-kit-link") || (qrUrls.length && attack.id === "qr-phishing")) add("T1584", "Compromise Infrastructure", "Phishing page on a third-party (likely compromised) site");
        return t;
    }

    // ------------------------------------------------------------------ IOCs
    const iocs = collectIocs();
    function collectIocs(): Ioc[] {
        const out: Ioc[] = [];
        const add = (i: Ioc) => { if (i.value && !out.some(o => o.type === i.type && o.value.toLowerCase() === i.value.toLowerCase())) out.push(i); };
        const malicious = attack.id !== "none";
        if (fromAddress) add({ type: "email", value: fromAddress, role: "Sender (From)", block: malicious && !myOrgs.includes(fromOrg) });
        const envelope = (getFirstHeaderValue(header.headers, "Return-Path").match(/[a-z0-9._%+-]+@[a-z0-9.-]+/i)?.[0] || "").toLowerCase();
        if (envelope && envelope !== fromAddress) add({ type: "email", value: envelope, role: "Envelope sender (Return-Path)", block: malicious });
        for (const h of chain.hops) if (h.authenticatedAs) add({ type: "email", value: h.authenticatedAs.toLowerCase(), role: "Mailbox used to send it (likely compromised)", block: false });
        for (const m of embedded) if (m.from) add({ type: "email", value: (m.from.match(/<([^>]+)>/)?.[1] || m.from).toLowerCase(), role: "Forged sender inside attached email", block: false });
        if (fromOrg && malicious && !myOrgs.includes(fromOrg)) add({ type: "domain", value: fromOrg, role: "Sending domain", block: !dmarcVerified });
        for (const u of qrUrls) {
            add({ type: "url", value: u, role: "QR code destination", block: true });
            add({ type: "domain", value: organizationalDomain(hostOf(u)), role: "QR code destination domain", block: true });
        }
        for (const u of linkUrls) {
            const host = hostOf(u);
            if (!host || SAFE_ASSET_HOSTS.test(host)) continue;
            const org = organizationalDomain(host);
            if (org === fromOrg && dmarcVerified) continue;
            add({ type: "url", value: u, role: "Link in message", block: malicious });
            add({ type: "domain", value: org, role: "Link domain", block: malicious && !myOrgs.includes(org) });
        }
        if (chain.originIp && !isPrivateIp(chain.originIp)) add({ type: "ip", value: chain.originIp, role: "Origin client IP", block: malicious });
        if (chain.connectingIp && chain.connectingIp !== chain.originIp) add({ type: "ip", value: chain.connectingIp, role: "Sending server IP (connected to your gateway)", block: malicious && !dmarcVerified });
        const relay = chain.entry?.rdns && chain.entry.rdns !== "unknown" ? chain.entry.rdns : chain.entry?.helo;
        if (relay && /\./.test(relay) && !/^\[/.test(relay)) add({ type: "domain", value: organizationalDomain(relay), role: "Sending relay host", block: false });
        const xOrig = getFirstHeaderValue(header.headers, "X-Originating-IP").replace(/[[\]]/g, "").trim();
        if (xOrig) add({ type: "ip", value: xOrig, role: "X-Originating-IP (sender's client, unverified)", block: false });
        for (const a of header.attachments || []) if (a.hash) add({ type: "sha256", value: a.hash, role: `Attachment ${a.filename}`, block: malicious && attachments.some(x => x.sha256 === a.hash && (x.isExecutable || x.isScript || x.macroDetected || x.isMasquerading)) });
        for (const a of attachments) if (a.sha256 && !out.some(o => o.value === a.sha256)) add({ type: "sha256", value: a.sha256, role: `Attachment ${a.filename}`, block: false });
        if (phones) add({ type: "phone", value: phones, role: "Callback number", block: true });
        if (subject) add({ type: "subject", value: subject, role: "Subject", block: false });
        const mid = getFirstHeaderValue(header.headers, "Message-ID").replace(/[<>\s]/g, "");
        if (mid) add({ type: "message-id", value: mid, role: "Internet Message-ID", block: false });
        const nmid = getFirstHeaderValue(header.headers, "X-MS-Exchange-Organization-Network-Message-Id").trim();
        if (nmid) add({ type: "message-id", value: nmid, role: "Exchange Network Message ID", block: false });
        return out;
    }

    // ------------------------------------------------------------------ actions
    const actions = buildActions();
    function buildActions(): Investigation["actions"] {
        const a: Investigation["actions"] = [];
        if (attack.id === "none") {
            a.push({ when: "now", text: "No action needed. If a user reported it, thank them and close the report." });
            return a;
        }
        a.push({ when: "now", text: "Find and purge every copy (see the hunting and purge queries), not only the reported one." });
        const webDomains = iocs.filter(i => i.block && i.type === "domain" && i.role !== "Sending domain").map(i => i.value);
        const senderBlocks = iocs.filter(i => i.block && (i.type === "email" || i.role === "Sending domain")).map(i => i.value);
        if (webDomains.length) a.push({ when: "now", text: `Block ${webDomains.join(", ")} at the web proxy/DNS (and as URLs in the Tenant Allow/Block List).` });
        if (senderBlocks.length) a.push({ when: "now", text: `Block the sender ${senderBlocks.join(", ")} in the Tenant Allow/Block List (or your gateway).` });
        if (["qr-phishing", "credential-link", "html-attachment"].includes(attack.id)) {
            a.push({ when: "now", text: `Ask ${recipients.length ? recipients.join(", ") : "the recipients"} whether they scanned/clicked and entered credentials${attack.id === "qr-phishing" ? " (QR codes are opened on phones, so proxy logs will not show it)" : ""}.` });
            a.push({ when: "next", text: "Review sign-ins for these users since delivery (new IPs, countries, devices, MFA registrations). If any are suspicious: reset the password, revoke sessions, and remove unknown MFA methods." });
        }
        if (attack.id === "device-code") a.push({ when: "now", text: "Review sign-ins with authentication protocol 'deviceCode'; revoke refresh tokens and remove unknown registered devices; block device-code flow with Conditional Access where it is not needed." });
        if (attack.id === "oauth-consent") a.push({ when: "now", text: "Review enterprise applications the recipients consented to; revoke the app's grants and disable it." });
        if (["clickfix", "malware-attachment", "html-attachment"].includes(attack.id)) a.push({ when: "now", text: "Check endpoints (EDR) of recipients for execution after delivery: PowerShell/mshta/rundll32 started by explorer.exe or the browser, new files from the attachment; isolate any hit." });
        if (attack.id === "bec") a.push({ when: "now", text: "Do not act on the request. Confirm with the supposed requester by phone using a known number, and alert finance/payroll." });
        if (attack.id === "callback") a.push({ when: "now", text: "Warn recipients not to call the number; if anyone called, check for remote-access tools installed afterwards." });
        if (fired(penalties, "submission-anomaly")) a.push({ when: "next", text: `Report the abused mailbox (${iocs.find(i => i.role.startsWith("Mailbox used"))?.value ?? "see IOCs"}) to its hosting provider.` });
        if (questions.find(q => q.id === "targeted")?.answer === "yes") a.push({ when: "next", text: "Warn the organization: this campaign is tailored to you and other staff will have their own variants." });
        for (const g of whyDelivered) a.push({ when: "harden", text: g.fix });
        return a;
    }

    // ------------------------------------------------------------------ narrative
    const headline = `${attack.label}${brand ? ` impersonating ${brand}` : ""}${extras()}.`;
    function extras(): string {
        const parts: string[] = [];
        if (embedded.length && fired(penalties, "embedded-message")) parts.push("hidden in an attached email");
        if (fired(penalties, "submission-anomaly")) parts.push("sent through a compromised mailbox");
        if (signals.originAuthMasked) parts.push("with authentication masked by the gateway");
        if (fired(penalties, "self-domain-spoof")) parts.push("spoofing your own domain");
        return parts.length ? `, ${parts.join(", ")}` : "";
    }
    const narrative: string[] = [];
    if (attack.id === "none") {
        narrative.push(`MXLens found no phishing or malware indicators. ${scoring.verdict.reason}`);
    } else {
        const spoofQ = questions.find(q => q.id === "spoofed")!;
        const askQ = questions.find(q => q.id === "ask")!;
        narrative.push(askQ.summary);
        if (qrUrls.length) narrative.push(`The QR code decodes to ${qrUrls[0]}${qrUrls.length > 1 ? ` (and ${qrUrls.length - 1} more)` : ""}.`);
        else if (linkUrls.length && ["credential-link", "device-code", "oauth-consent"].includes(attack.id)) narrative.push(`The main link goes to ${hostOf(linkUrls[0])}.`);
        narrative.push(`Sender: ${spoofQ.summary}`);
        if (!undelivered) narrative.push(`Delivery: ${pathSummary}`);
        if (whyDelivered.length) narrative.push(`Why it got through: ${whyDelivered.slice(0, 2).map(g => g.gap).join(" ")}`);
    }

    const hunting = buildHuntingQueries({
        subject,
        fromAddress,
        envelope: iocs.find(i => i.role.startsWith("Envelope"))?.value ?? null,
        domains: iocs.filter(i => i.type === "domain" && i.block).map(i => i.value),
        urls: iocs.filter(i => i.type === "url" && i.block).map(i => i.value),
        sha256: iocs.filter(i => i.type === "sha256").map(i => i.value),
        senderIp: chain.gateway ? null : chain.connectingIp,
        networkMessageId: getFirstHeaderValue(header.headers, "X-MS-Exchange-Organization-Network-Message-Id").trim() || null,
        internetMessageId: getFirstHeaderValue(header.headers, "Message-ID").trim() || null,
        recipients,
        since: chain.hops[0]?.time ?? (Date.parse(getFirstHeaderValue(header.headers, "Date")) ? new Date(Date.parse(getFirstHeaderValue(header.headers, "Date"))).toISOString() : null),
        attack: attack.id,
        hasGateway: !!chain.gateway
    });

    return {
        verdict: { label: verdictLabel, risk, confidence: scoring.confidence.level },
        attack,
        headline: headline.charAt(0).toUpperCase() + headline.slice(1),
        narrative,
        lure: { themes, brand, ask },
        questions,
        path: { summary: pathSummary, hops, connectingIp: chain.connectingIp, originIp: chain.originIp, gateway: chain.gateway?.name ?? null, provider: chain.mailboxProvider?.name ?? null },
        authentication,
        payload,
        whyDelivered,
        techniques,
        iocs,
        actions,
        hunting
    };
}

function dkimSigners(header: AnalysisResult): string[] {
    const out = new Set<string>();
    for (const sig of getHeaderValues(header.headers, "DKIM-Signature")) {
        const d = sig.match(/\bd=([a-z0-9.-]+)/i)?.[1];
        if (d) out.add(d.toLowerCase());
    }
    const ar = getFirstHeaderValue(header.headers, "Authentication-Results").match(/header\.d=([a-z0-9.-]+)/i)?.[1];
    if (ar && ar !== "none") out.add(ar.toLowerCase());
    return [...out];
}

function describePath(chain: ReceivedChain, undelivered: boolean): string {
    if (undelivered || chain.hops.length === 0) return "There are no Received headers, so the delivery path cannot be traced from this file.";
    const parts: string[] = [];
    const first = chain.hops[0];
    const entry = chain.entry;
    if (first && entry && first !== entry) {
        if (!first.ip || isPrivateIp(first.ip)) {
            parts.push(`It was created on ${first.by} by a local program (it called itself ${first.helo || "unknown"})`);
        } else {
            parts.push(`It started at ${first.ip}${first.helo ? ` (client named ${first.helo})` : ""}${first.authenticatedAs ? `, logged in as ${first.authenticatedAs},` : ""} and was relayed by ${first.by}`);
        }
    }
    if (entry) {
        const sender = entry.rdns && entry.rdns !== "unknown" ? entry.rdns : entry.helo;
        parts.push(`${parts.length ? "then " : "It "}entered ${entry.byInfra?.name ?? entry.by} from ${sender}${entry.ip ? ` [${entry.ip}]` : ""}`);
    }
    if (chain.gateway && chain.mailboxProvider) parts.push(`passed through ${chain.gateway.name} and reached ${chain.mailboxProvider.name}`);
    else if (chain.mailboxProvider && entry?.byInfra !== chain.mailboxProvider) parts.push(`reached ${chain.mailboxProvider.name}`);
    let s = `${parts.join(", ")}.`;
    if (chain.longestDelay) s += ` It was held for ${formatDuration(chain.longestDelay.seconds)} before ${chain.longestDelay.at}.`;
    return s.charAt(0).toUpperCase() + s.slice(1);
}
