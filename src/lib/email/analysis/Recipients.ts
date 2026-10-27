import { getHeaderValues } from "../parser/HeaderUtils";
import type { HeaderMap } from "../parser/HeaderUtils";
import { organizationalDomain } from "./Domain";

export const EMAIL_PATTERN = /[a-z0-9._%+-]{1,64}@[a-z0-9.-]{1,255}\.[a-z]{2,24}/gi;

function addresses(headers: HeaderMap, keys: string[]): string[] {
    const out = new Set<string>();
    for (const key of keys) {
        for (const value of getHeaderValues(headers, key)) {
            for (const m of value.matchAll(new RegExp(EMAIL_PATTERN.source, "gi"))) out.add(m[0].toLowerCase());
        }
    }
    return [...out];
}

/** Addresses the message is visibly addressed to (To and Cc). */
export function visibleRecipients(headers: HeaderMap): string[] {
    return addresses(headers, ["To", "Cc"]);
}

/**
 * Addresses the message was actually delivered to, from envelope evidence:
 * Delivered-To, X-Original-To, and "for <addr>" clauses in Received headers.
 */
export function envelopeRecipients(headers: HeaderMap): string[] {
    const out = new Set(addresses(headers, ["Delivered-To", "X-Original-To", "Envelope-To", "X-Envelope-To"]));
    for (const received of getHeaderValues(headers, "Received")) {
        const m = received.match(/\bfor\s+<?([a-z0-9._%+-]{1,64}@[a-z0-9.-]{1,255}\.[a-z]{2,24})>?/i);
        if (m) out.add(m[1].toLowerCase());
    }
    return [...out];
}

/** Every recipient address the headers reveal. */
export function allRecipients(headers: HeaderMap): string[] {
    return [...new Set([...visibleRecipients(headers), ...envelopeRecipients(headers)])];
}

/** Organizational domains of all recipients (usually the recipient's own company). */
export function recipientOrgs(headers: HeaderMap): string[] {
    return [...new Set(allRecipients(headers).map(a => organizationalDomain(a.split("@")[1])))];
}
