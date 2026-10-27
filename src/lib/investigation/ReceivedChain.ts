import { getHeaderValues } from "../email/parser/HeaderUtils";
import type { HeaderMap } from "../email/parser/HeaderUtils";

/** Who operates a mail server, judged from its host name. */
export interface Infrastructure {
    name: string;
    kind: "mailbox-provider" | "gateway" | "esp" | "hosting";
}

const INFRA: { re: RegExp; infra: Infrastructure }[] = [
    { re: /\.mail\.protection\.outlook\.com$/i, infra: { name: "Microsoft 365 (EOP inbound)", kind: "mailbox-provider" } },
    { re: /\.(?:prod\.)?outlook\.com$|\.outlook\.office365\.com$|\.office365\.com$|\.prod\.exchangelabs\.com$/i, infra: { name: "Microsoft 365", kind: "mailbox-provider" } },
    { re: /^mx\.google\.com$|\.google\.com$|\.googlemail\.com$/i, infra: { name: "Google", kind: "mailbox-provider" } },
    { re: /\.tmes\.trendmicro\.(?:eu|com)$|\.trendmicro\.com$/i, infra: { name: "Trend Micro Email Security", kind: "gateway" } },
    { re: /\.pphosted\.com$|\.ppe-hosted\.com$/i, infra: { name: "Proofpoint", kind: "gateway" } },
    { re: /\.mimecast\.com$|\.mimecast-offshore\.com$/i, infra: { name: "Mimecast", kind: "gateway" } },
    { re: /\.iphmx\.com$|\.ironport\./i, infra: { name: "Cisco Secure Email (IronPort)", kind: "gateway" } },
    { re: /\.barracudanetworks\.com$|\.ess\.barracuda\.com$/i, infra: { name: "Barracuda", kind: "gateway" } },
    { re: /\.messagelabs\.com$/i, infra: { name: "Broadcom Email Security", kind: "gateway" } },
    { re: /\.hornetsecurity\.com$/i, infra: { name: "Hornetsecurity", kind: "gateway" } },
    { re: /\.amazonses\.com$|\.amazonaws\.com$/i, infra: { name: "Amazon SES / AWS", kind: "esp" } },
    { re: /\.sendgrid\.net$/i, infra: { name: "SendGrid", kind: "esp" } },
    { re: /\.mailgun\.(?:net|org)$/i, infra: { name: "Mailgun", kind: "esp" } },
    { re: /\.mcsv\.net$|\.mandrillapp\.com$|\.rsgsv\.net$/i, infra: { name: "Mailchimp / Mandrill", kind: "esp" } },
    { re: /\.sparkpostmail\.com$/i, infra: { name: "SparkPost", kind: "esp" } },
    { re: /\.zoho\.(?:com|eu|in)$/i, infra: { name: "Zoho Mail", kind: "mailbox-provider" } },
    { re: /\.yahoo\.com$|\.yahoodns\.net$/i, infra: { name: "Yahoo", kind: "mailbox-provider" } }
];

export function infrastructureOf(host: string | undefined): Infrastructure | null {
    if (!host) return null;
    const h = host.toLowerCase().replace(/\.$/, "");
    return INFRA.find(i => i.re.test(h))?.infra ?? null;
}

export type HopRole = "origin" | "sender-relay" | "entry" | "gateway" | "recipient-system";

export interface ChainHop {
    /** 1 = oldest hop. */
    index: number;
    /** Name the connecting client gave (HELO/EHLO). */
    helo: string;
    /** Reverse DNS of the connecting IP, as recorded ("unknown" when it had none). */
    rdns: string | null;
    /** Connecting IP as recorded by the receiving server. */
    ip: string | null;
    by: string;
    byInfra: Infrastructure | null;
    protocol: string | null;
    /** Mailbox the client authenticated as (SMTP AUTH), when recorded. */
    authenticatedAs: string | null;
    envelopeTo: string | null;
    time: string | null;
    timestamp: number | null;
    /** Seconds since the previous hop (null for the first). */
    delaySeconds: number | null;
    role: HopRole;
    notes: string[];
    raw: string;
}

export interface ReceivedChain {
    hops: ChainHop[];
    /** Hop where the message crossed into the recipient's mail system from the internet. */
    entry: ChainHop | null;
    /** The internet-facing IP that handed the message to the recipient's system. */
    connectingIp: string | null;
    /** The earliest client IP recorded (often the attacker's machine or VPS). */
    originIp: string | null;
    /** Gateway in front of the mailbox provider, if any. */
    gateway: Infrastructure | null;
    mailboxProvider: Infrastructure | null;
    /** Longest queueing delay and where it happened. */
    longestDelay: { seconds: number; at: string } | null;
}

const PRIVATE_IP = /^(?:10\.|127\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.|169\.254\.|::1$|fe80:|fc|fd)/i;
export const isPrivateIp = (ip: string) => PRIVATE_IP.test(ip);

function parseHop(raw: string): Omit<ChainHop, "index" | "delaySeconds" | "role" | "notes"> {
    const text = raw.replace(/\s+/g, " ").trim();
    const helo = text.match(/^from\s+(\S+)/i)?.[1] ?? "";
    const paren = text.match(/^from\s+\S+\s+\(([^)]*)\)/i)?.[1] ?? "";
    const bracketIp = paren.match(/\[(?:IPv6:)?([0-9a-f:.]+)\]/i)?.[1];
    const bareIp = paren.match(/(?:^|\s)((?:\d{1,3}\.){3}\d{1,3}|[0-9a-f]{1,4}(?::[0-9a-f]{0,4}){2,7})(?:\s|$)/i)?.[1];
    // HELO itself may be a literal: "from [203.0.113.5]"
    const heloIp = helo.match(/^\[(?:IPv6:)?([0-9a-f:.]+)\]$/i)?.[1];
    const ip = bracketIp ?? bareIp ?? heloIp ?? null;
    const rdnsRaw = paren.replace(/\[[^\]]*\]/g, "").replace(/(?:^|\s)(?:\d{1,3}\.){3}\d{1,3}(?:\s|$)/g, " ").trim().split(/\s+/)[0] || null;
    // A bare IPv6 address in the comment is the IP, not a reverse-DNS name.
    const rdns = rdnsRaw && !/^[0-9a-f]*:[0-9a-f:.]*$/i.test(rdnsRaw) ? rdnsRaw : null;
    const by = text.match(/\bby\s+(\S+)/i)?.[1]?.replace(/[;,]$/, "") ?? "";
    const protocol = text.match(/\bwith\s+(Microsoft SMTP Server|[A-Z][A-Z0-9-]{2,15})\b/i)?.[1] ?? null;
    const authenticatedAs = text.match(/Authenticated sender:\s*([^\s)]+)/i)?.[1] ?? null;
    const envelopeTo = text.match(/\bfor\s+<?([^>\s;]+@[^>\s;]+)>?/i)?.[1] ?? null;
    const datePart = text.split(";").pop()?.trim() ?? "";
    const parsed = Date.parse(datePart.replace(/\s*\([^)]*\)\s*$/, ""));
    return {
        helo,
        rdns,
        ip,
        by,
        byInfra: infrastructureOf(by),
        protocol,
        authenticatedAs,
        envelopeTo,
        time: Number.isNaN(parsed) ? null : new Date(parsed).toISOString(),
        timestamp: Number.isNaN(parsed) ? null : parsed,
        raw
    };
}

/**
 * Rebuilds the delivery path from Received headers (newest first in the message), oldest
 * first, and labels each hop: where the message started, which servers relayed it on the
 * sender's side, where it entered the recipient's system, and the gateway/provider hops.
 */
export function buildReceivedChain(headers: HeaderMap, recipientOrgs: string[] = []): ReceivedChain {
    const raws = getHeaderValues(headers, "Received");
    const parsed = raws.map(parseHop).reverse();
    const orgOf = (host: string) => host.toLowerCase().split(".").slice(-2).join(".");

    // Entry = first hop received by a known gateway/provider, else by the recipient's own
    // servers, else the newest hop.
    let entryIdx = parsed.findIndex(h => h.byInfra && (h.byInfra.kind === "gateway" || h.byInfra.kind === "mailbox-provider") && !(h.ip && isPrivateIp(h.ip)));
    if (entryIdx < 0 && recipientOrgs.length) entryIdx = parsed.findIndex(h => recipientOrgs.includes(orgOf(h.by)) && !(h.ip && isPrivateIp(h.ip)));
    if (entryIdx < 0) entryIdx = parsed.length - 1;

    const hops: ChainHop[] = parsed.map((h, i) => {
        const prev = i > 0 ? parsed[i - 1] : null;
        const delaySeconds = prev && prev.timestamp !== null && h.timestamp !== null ? Math.max(0, Math.round((h.timestamp - prev.timestamp) / 1000)) : null;
        let role: HopRole;
        if (i === 0) role = "origin";
        else if (entryIdx >= 0 && i < entryIdx) role = "sender-relay";
        else if (i === entryIdx) role = "entry";
        else if (h.byInfra?.kind === "gateway") role = "gateway";
        else role = "recipient-system";
        if (i === 0 && entryIdx === 0) role = "entry";

        const notes: string[] = [];
        if (/^\[?(?:127\.0\.0\.1|::1|localhost)\]?$/i.test(h.helo) || /\blocalhost\b/i.test(h.rdns || "")) {
            notes.push(h.ip && !isPrivateIp(h.ip) ? `client called itself ${h.helo} but connected from ${h.ip}` : "handed over by a local process");
        }
        if (h.authenticatedAs || /^(?:ESMTPSA|ESMTPA|LMTPA|ESMTPSA)$/i.test(h.protocol || "")) notes.push(h.authenticatedAs ? `authenticated as ${h.authenticatedAs}` : "client authenticated (SMTP AUTH)");
        if (h.rdns === "unknown" && h.ip && !isPrivateIp(h.ip)) notes.push("no reverse DNS");
        if (delaySeconds !== null && delaySeconds >= 3600) notes.push(`held ${formatDuration(delaySeconds)} before this hop`);
        return { ...h, index: i + 1, delaySeconds, role, notes };
    });

    const entry = entryIdx >= 0 ? hops[entryIdx] : null;
    const firstPublic = hops.find(h => h.ip && !isPrivateIp(h.ip));
    const gateway = hops.find(h => h.byInfra?.kind === "gateway")?.byInfra ?? null;
    const mailboxProvider = [...hops].reverse().find(h => h.byInfra?.kind === "mailbox-provider")?.byInfra ?? null;
    const longest = hops.reduce<{ seconds: number; at: string } | null>((best, h) =>
        h.delaySeconds !== null && h.delaySeconds > (best?.seconds ?? 0) ? { seconds: h.delaySeconds, at: h.by } : best, null);

    return {
        hops,
        entry,
        connectingIp: entry?.ip && !isPrivateIp(entry.ip) ? entry.ip : null,
        originIp: firstPublic?.ip ?? null,
        gateway,
        mailboxProvider,
        longestDelay: longest && longest.seconds >= 600 ? longest : null
    };
}

export function formatDuration(seconds: number): string {
    if (seconds < 90) return `${seconds}s`;
    if (seconds < 5400) return `${Math.round(seconds / 60)} min`;
    if (seconds < 172800) return `${(seconds / 3600).toFixed(1).replace(/\.0$/, "")} h`;
    return `${(seconds / 86400).toFixed(1).replace(/\.0$/, "")} days`;
}
