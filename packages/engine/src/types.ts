/**
 * Public types for @mxlens/engine.
 *
 * The result is a plain JSON-serializable object so it can be returned from an
 * API, written to disk by the CLI, or handed to an AI agent over MCP unchanged.
 */

export type Severity = "info" | "low" | "medium" | "high" | "critical";

export type Category =
    | "authentication"
    | "identity"
    | "links"
    | "attachments"
    | "content"
    | "headers";

/** `clean` means "no strong indicators found", never "proven safe". */
export type Verdict = "malicious" | "suspicious" | "clean";

export interface AttackTechnique {
    /** MITRE ATT&CK technique id, e.g. "T1566.002". */
    id: string;
    name: string;
}

export interface Evidence {
    /** What the value is, e.g. "From", "Link", "Attachment". */
    label: string;
    /** The exact value observed in the message (never rewritten). */
    value: string;
    /** Optional short explanation of why this value matters. */
    note?: string;
}

export interface Finding {
    ruleId: string;
    title: string;
    category: Category;
    severity: Severity;
    /** Points this finding contributes before scores are combined (0–100). */
    weight: number;
    /** One plain-language sentence an analyst can paste into a ticket. */
    summary: string;
    evidence: Evidence[];
    attack: AttackTechnique[];
}

export interface Mailbox {
    name: string;
    address: string;
}

export interface MessageInfo {
    subject: string | null;
    date: string | null;
    messageId: string | null;
    inReplyTo: string | null;
    references: string | null;
    from: Mailbox | null;
    sender: Mailbox | null;
    replyTo: Mailbox[];
    to: Mailbox[];
    cc: Mailbox[];
    returnPath: string | null;
    listId: string | null;
}

export type AuthResult =
    | "pass"
    | "fail"
    | "softfail"
    | "neutral"
    | "none"
    | "temperror"
    | "permerror"
    | "policy"
    | "unknown";

export interface DkimResult {
    result: AuthResult;
    domain: string | null;
    selector: string | null;
}

export interface AuthenticationInfo {
    /** True when at least one Authentication-Results header exists. */
    present: boolean;
    /** The authserv-id of the header the engine used, e.g. "mx.google.com". */
    authservId: string | null;
    /**
     * "configured": the header came from an authserv-id listed in options.
     * "assumed": no trusted ids were configured, so the top-most header was used.
     * "none": no usable header.
     */
    trust: "configured" | "assumed" | "none";
    spf: { result: AuthResult; domain: string | null };
    dkim: DkimResult[];
    dmarc: { result: AuthResult; policy: string | null; domain: string | null };
    /** Result of the receiver's own ARC validation, when it reported one. */
    arc: {
        result: AuthResult;
        instances: number;
        sealedBy: string[];
        original: { spf: AuthResult; dkim: AuthResult; dmarc: AuthResult } | null;
    };
    /** Microsoft composite authentication, when present. */
    compauth: AuthResult | null;
    /** Alignment computed by the engine from the From domain (relaxed mode). */
    alignment: { dkim: boolean; spf: boolean };
    /** Every Authentication-Results header seen, top first. */
    headers: { authservId: string; raw: string }[];
}

export interface Hop {
    /** 1 = first relay (oldest), increasing toward the recipient. */
    index: number;
    from: string | null;
    by: string | null;
    with: string | null;
    ip: string | null;
    timestamp: string | null;
    /** Seconds since the previous hop, when both timestamps parse. */
    delaySeconds: number | null;
    raw: string;
}

export type LinkSource = "html" | "text" | "form" | "qr" | "redirect";

export interface Link {
    url: string;
    /** Lower-case hostname (punycode for IDNs), or null for data:/javascript: URIs. */
    host: string | null;
    /** Registrable domain (eTLD+1) of the host. */
    domain: string | null;
    /** Visible anchor text, when the link came from HTML. */
    text: string | null;
    source: LinkSource;
    /** Rule ids that flagged this link. Filled in after analysis. */
    flags: string[];
}

export interface AttachmentInfo {
    filename: string;
    contentType: string;
    size: number;
    sha256: string | null;
    /** Type detected from the file's first bytes, e.g. "pdf", "zip", "pe-executable". */
    detectedType: string | null;
    /** Names inside a ZIP-based attachment, when readable. */
    archiveEntries: string[];
    encryptedArchive: boolean;
    flags: string[];
}

export interface Indicators {
    ips: string[];
    domains: string[];
    urls: string[];
    emails: string[];
    sha256: string[];
}

export interface Coverage {
    checked: string[];
    skipped: { check: string; reason: string }[];
}

export interface AnalysisResult {
    schemaVersion: "1.0";
    engineVersion: string;
    analyzedAt: string;
    verdict: Verdict;
    verdictLabel: string;
    /** 0 (no risk signals) to 100. Combined with noisy-OR so signals never double count. */
    riskScore: number;
    /** Up to three sentences explaining the verdict, most important first. */
    summary: string[];
    findings: Finding[];
    message: MessageInfo;
    identity: {
        fromDomain: string | null;
        fromOrgDomain: string | null;
        replyToDomains: string[];
        returnPathDomain: string | null;
        freemail: boolean;
        brand: string | null;
    };
    authentication: AuthenticationInfo;
    delivery: { hops: Hop[] };
    links: Link[];
    attachments: AttachmentInfo[];
    /** The HTML body, when present. Provided for safe preview; not analyzed further here. */
    bodyHtml: string | null;
    indicators: Indicators;
    coverage: Coverage;
}

export interface QrInput {
    filename: string | null;
    contentType: string;
    content: Uint8Array;
}

export interface AnalyzeOptions {
    /**
     * authserv-ids (e.g. "mx.example.org") whose Authentication-Results you trust.
     * Without this, the top-most Authentication-Results header is used and the
     * result is marked "assumed", because any earlier header may be forged.
     */
    trustedAuthservIds?: string[];
    /** Analyze body text, HTML and links. Default true. */
    analyzeBody?: boolean;
    /** Analyze attachments (hashes, types, archives). Default true. */
    analyzeAttachments?: boolean;
    /**
     * Optional QR decoder. Called for image attachments and inline images; return
     * the decoded strings. The engine has no image dependencies of its own.
     */
    qrDecoder?: (image: QrInput) => Promise<string[]>;
    /** Clock override for tests. */
    now?: Date;
}

export interface RuleMeta {
    id: string;
    title: string;
    category: Category;
    /** Highest severity this rule can report. */
    severity: Severity;
    attack: AttackTechnique[];
    description: string;
    /** Known legitimate cases that can trigger this rule. */
    falsePositives: string;
}
