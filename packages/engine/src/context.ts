import PostalMime from "postal-mime";
import type { Address, Email } from "postal-mime";
import type { AnalyzeOptions, AttachmentInfo, AuthenticationInfo, Hop, Link, Mailbox, MessageInfo } from "./types.ts";
import { analyzeAuthentication } from "./parse/auth.ts";
import { parseReceived } from "./parse/received.ts";
import { extractLinks, makeLink } from "./parse/links.ts";
import { inspectAttachment, toBytes } from "./parse/attachments.ts";
import type { RawAttachment } from "./parse/attachments.ts";
import { domainOfAddress, isFreemail, registrableDomain, brandOwningHost } from "./lib/domain.ts";
import { hiddenTextLength, htmlToText, looksEnglish } from "./lib/text.ts";

export type RawInput = string | Uint8Array | ArrayBuffer;

/** Everything rules need, computed once. Rules must treat it as read-only. */
export interface Context {
    options: Required<Pick<AnalyzeOptions, "analyzeBody" | "analyzeAttachments">> & AnalyzeOptions;
    now: Date;
    /** Header values by lower-case name, in order of appearance (top first). */
    headers: Map<string, string[]>;
    message: MessageInfo;
    fromDomain: string | null;
    fromOrg: string | null;
    replyToDomains: string[];
    returnPathDomain: string | null;
    freemailSender: boolean;
    /** Brand that owns the From domain, when the sender is that brand. */
    senderBrand: string | null;
    auth: AuthenticationInfo;
    hops: Hop[];
    /** Body text (plain part, or text derived from HTML). Empty when body analysis is off. */
    text: string;
    html: string | null;
    hiddenTextChars: number;
    english: boolean;
    links: Link[];
    attachments: AttachmentInfo[];
    rawAttachments: RawAttachment[];
    /** Whether the input contained anything beyond headers. */
    hasBody: boolean;
    notes: { check: string; reason: string }[];
}

function mailbox(addr: Address | undefined | null): Mailbox | null {
    if (!addr) return null;
    if ("group" in addr && addr.group) return addr.group[0] ? { name: addr.group[0].name, address: addr.group[0].address.toLowerCase() } : null;
    return addr.address ? { name: addr.name ?? "", address: addr.address.toLowerCase() } : null;
}

function mailboxes(list: Address[] | undefined): Mailbox[] {
    const out: Mailbox[] = [];
    for (const a of list ?? []) {
        if ("group" in a && a.group) out.push(...a.group.map((g) => ({ name: g.name, address: g.address.toLowerCase() })));
        else if (a.address) out.push({ name: a.name ?? "", address: a.address.toLowerCase() });
    }
    return out;
}

function cleanAngle(value: string | undefined | null): string | null {
    if (!value) return null;
    const v = value.trim().replace(/^<|>$/g, "").trim();
    return v || null;
}

export async function buildContext(input: RawInput, options: AnalyzeOptions = {}): Promise<Context> {
    const opts = { analyzeBody: true, analyzeAttachments: true, ...options };
    const email: Email = await PostalMime.parse(input, { attachmentEncoding: "arraybuffer", maxNestingDepth: 50 });

    const headers = new Map<string, string[]>();
    for (const h of email.headers) {
        const list = headers.get(h.key) ?? [];
        list.push(h.value);
        headers.set(h.key, list);
    }
    const one = (name: string): string | null => headers.get(name)?.[0] ?? null;

    const from = mailbox(email.from);
    const returnPath = cleanAngle(email.returnPath ?? one("return-path"));
    const message: MessageInfo = {
        subject: email.subject ?? null,
        date: email.date ?? one("date"),
        messageId: cleanAngle(email.messageId),
        inReplyTo: cleanAngle(email.inReplyTo),
        references: email.references ?? null,
        from,
        sender: mailbox(email.sender),
        replyTo: mailboxes(email.replyTo),
        to: mailboxes(email.to),
        cc: mailboxes(email.cc),
        returnPath,
        listId: one("list-id"),
    };

    const fromDomain = domainOfAddress(from?.address);
    const notes: Context["notes"] = [];

    const auth = analyzeAuthentication(
        {
            authenticationResults: headers.get("authentication-results") ?? [],
            arcSeals: headers.get("arc-seal") ?? [],
            arcAuthResults: headers.get("arc-authentication-results") ?? [],
            dkimSignatures: headers.get("dkim-signature") ?? [],
            fromAddress: from?.address ?? null,
            returnPath,
        },
        opts.trustedAuthservIds,
    );
    if (!auth.present) {
        notes.push({ check: "Authentication results", reason: "No Authentication-Results header, so SPF, DKIM and DMARC outcomes are unknown." });
    } else if (auth.trust === "none") {
        notes.push({ check: "Authentication results", reason: "None of the Authentication-Results headers came from a configured trusted server." });
    } else if (auth.trust === "assumed") {
        notes.push({
            check: "Authentication results",
            reason: `Used the top-most Authentication-Results header (${auth.authservId ?? "unknown server"}) without verifying it. Configure trusted servers, or verify signatures with the CLI's --verify-auth, for stronger guarantees.`,
        });
    }

    const html = opts.analyzeBody ? email.html ?? null : null;
    const plain = opts.analyzeBody ? email.text ?? null : null;
    // Rules read both parts: attackers often put different wording in text and HTML.
    const htmlText = html ? htmlToText(html) : "";
    const plainText = plain?.trim() ?? "";
    const text = plainText && htmlText && !htmlText.includes(plainText.slice(0, 60)) ? `${plainText}\n\n${htmlText}` : plainText || htmlText;
    const hasBody = Boolean((email.text && email.text.trim()) || email.html || email.attachments.length);
    if (!opts.analyzeBody) notes.push({ check: "Body and links", reason: "Body analysis was turned off." });
    else if (!hasBody) notes.push({ check: "Body and links", reason: "Only headers were provided." });

    const english = looksEnglish(text);
    if (opts.analyzeBody && text && !english) {
        notes.push({ check: "Language rules", reason: "The body does not look English; English keyword rules were skipped." });
    }

    const links = opts.analyzeBody ? extractLinks(html, plain) : [];

    const rawAttachments: RawAttachment[] = email.attachments.map((a) => ({
        filename: a.filename,
        mimeType: (a.mimeType || "application/octet-stream").toLowerCase(),
        disposition: a.disposition,
        content: toBytes(a.content),
    }));
    const attachments: AttachmentInfo[] = [];
    if (opts.analyzeAttachments) {
        for (const a of rawAttachments) {
            // Inline images referenced by the HTML are presentation, not attachments, unless named suspiciously.
            if (a.disposition === "inline" && a.mimeType.startsWith("image/") && !a.filename) continue;
            attachments.push(await inspectAttachment(a));
        }
    } else if (rawAttachments.length) {
        notes.push({ check: "Attachments", reason: "Attachment analysis was turned off." });
    }

    // QR codes in images: decoded by a caller-supplied decoder, then treated as links.
    if (opts.analyzeAttachments && opts.qrDecoder) {
        for (const a of rawAttachments.filter((r) => r.mimeType.startsWith("image/"))) {
            try {
                for (const value of await opts.qrDecoder({ filename: a.filename, contentType: a.mimeType, content: a.content })) {
                    const link = makeLink(value, "qr", a.filename);
                    if (link) links.push(link);
                }
            } catch {
                notes.push({ check: "QR codes", reason: `Could not decode image ${a.filename ?? "(inline)"}.` });
            }
        }
    } else if (rawAttachments.some((r) => r.mimeType.startsWith("image/"))) {
        notes.push({ check: "QR codes", reason: "Images were not scanned for QR codes (no decoder available in this environment)." });
    }

    const replyToDomains = [...new Set(message.replyTo.map((m) => domainOfAddress(m.address)).filter((d): d is string => !!d))];

    return {
        options: opts,
        now: opts.now ?? new Date(),
        headers,
        message,
        fromDomain,
        fromOrg: registrableDomain(fromDomain),
        replyToDomains,
        returnPathDomain: domainOfAddress(returnPath),
        freemailSender: isFreemail(fromDomain),
        senderBrand: brandOwningHost(fromDomain)?.name ?? null,
        auth,
        hops: parseReceived(headers.get("received") ?? []),
        text,
        html,
        hiddenTextChars: html ? hiddenTextLength(html) : 0,
        english,
        links,
        attachments,
        rawAttachments,
        hasBody,
        notes,
    };
}

/** True when the sender's identity is cryptographically tied to the From domain. */
export function senderAuthenticated(ctx: Context): boolean {
    if (ctx.auth.trust === "none") return false;
    if (ctx.auth.dmarc.result === "pass") return true;
    return ctx.auth.alignment.dkim || ctx.auth.alignment.spf;
}
