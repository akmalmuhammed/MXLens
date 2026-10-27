import { getHeaderValues } from "./HeaderUtils";
import type { HeaderMap } from "./HeaderUtils";

/**
 * What Microsoft Exchange Online / EOP recorded about how it handled the message.
 * These headers explain *why* a message that other signals flag still reached the inbox.
 */
export interface ExchangeSignals {
    /** Spam confidence level. -1 means spam filtering was skipped. */
    scl?: number;
    /** Authentication source Exchange attributed the connection to (Anonymous = external, unauthenticated). */
    authAs?: string;
    /** Composite authentication verdict (e.g. "pass", "fail"). */
    compauth?: string;
    /** Numeric reason code for compauth (109 = no DMARC record, passed implicit evaluation). */
    compauthReason?: string;
    /** SCL -1 on an anonymous (external) connection: filtering was bypassed by tenant configuration. */
    filteringBypassed: boolean;
}

function first(headers: HeaderMap, key: string): string | undefined {
    return getHeaderValues(headers, key)[0]?.trim() || undefined;
}

export class ExchangeAnalyzer {
    static analyze(headers: HeaderMap): ExchangeSignals | undefined {
        const sclRaw = first(headers, "X-MS-Exchange-Organization-SCL");
        const authAs = first(headers, "X-MS-Exchange-Organization-AuthAs");
        const authResults = getHeaderValues(headers, "Authentication-Results")[0] || "";
        const compauth = authResults.match(/\bcompauth=([a-z]+)/i)?.[1]?.toLowerCase();
        const compauthReason = authResults.match(/\bcompauth=[a-z]+\s+reason=(\d+)/i)?.[1];

        let scl: number | undefined;
        if (sclRaw !== undefined && /^-?\d+$/.test(sclRaw)) {
            scl = parseInt(sclRaw, 10);
        } else {
            // Fall back to the Forefront antispam report ("...;SCL:-1;...")
            const forefront = first(headers, "X-Forefront-Antispam-Report");
            const m = forefront?.match(/\bSCL:(-?\d+)/i);
            if (m) scl = parseInt(m[1], 10);
        }

        if (scl === undefined && !authAs && !compauth) return undefined;

        return {
            scl,
            authAs,
            compauth,
            compauthReason,
            filteringBypassed: scl === -1 && (authAs?.toLowerCase() === "anonymous")
        };
    }
}
