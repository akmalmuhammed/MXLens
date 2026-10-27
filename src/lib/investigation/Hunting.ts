/**
 * Ready-to-run follow-up queries for the indicators of one message: Microsoft Defender XDR
 * advanced hunting (the same tables exist in Microsoft Sentinel with the Defender XDR
 * connector), Entra ID sign-in logs, and a Microsoft Purview search-and-purge.
 */

export interface HuntingQuery {
    id: string;
    platform: "Microsoft Defender XDR / Sentinel" | "Microsoft Sentinel (Entra ID)" | "Microsoft Purview (PowerShell)";
    title: string;
    purpose: string;
    language: "kql" | "powershell";
    query: string;
}

export interface HuntingInput {
    subject: string;
    fromAddress: string;
    envelope: string | null;
    domains: string[];
    urls: string[];
    sha256: string[];
    /** Only when no gateway sits in front of Microsoft 365 (otherwise SenderIPv4 is the gateway). */
    senderIp: string | null;
    networkMessageId: string | null;
    internetMessageId: string | null;
    recipients: string[];
    since: string | null;
    attack: string;
    hasGateway: boolean;
}

/** KQL string literal: escape backslashes and double quotes. */
export function kql(value: string): string {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

const list = (values: string[]) => values.map(kql).join(", ");

/** Subject without tenant tags ("EXTERNAL:", "[EXT]") so variants still match. */
export function coreSubject(subject: string): string {
    return subject.replace(/^\s*(?:\[?(?:external|ext|caution|warning|spam|suspicious)\]?\s*[:\-]?\s*)+/i, "").replace(/\s+/g, " ").trim().slice(0, 120);
}

export function buildHuntingQueries(input: HuntingInput): HuntingQuery[] {
    const out: HuntingQuery[] = [];
    const lookback = "ago(30d)";
    const subject = coreSubject(input.subject);
    const senders = [...new Set([input.fromAddress, input.envelope].filter((v): v is string => !!v))];

    const conditions: string[] = [];
    if (subject.length >= 8) conditions.push(`Subject contains ${kql(subject)}`);
    if (senders.length) conditions.push(`SenderFromAddress in~ (${list(senders)}) or SenderMailFromAddress in~ (${list(senders)})`);
    if (input.senderIp) conditions.push(`SenderIPv4 == ${kql(input.senderIp)}`);
    if (conditions.length) {
        out.push({
            id: "email-campaign",
            platform: "Microsoft Defender XDR / Sentinel",
            title: "Every copy of this campaign",
            purpose: `Who else received it and where it was delivered.${input.hasGateway ? " SenderIPv4 is omitted because a gateway relays your mail, so it would only show the gateway." : ""}`,
            language: "kql",
            query: [
                "EmailEvents",
                `| where Timestamp > ${lookback}`,
                `| where ${conditions.join("\n    or ")}`,
                "| project Timestamp, RecipientEmailAddress, SenderFromAddress, SenderMailFromAddress, SenderIPv4, Subject, DeliveryAction, DeliveryLocation, ThreatTypes, NetworkMessageId",
                "| order by Timestamp desc"
            ].join("\n")
        });
    }

    if (input.networkMessageId || input.internetMessageId) {
        const id = input.networkMessageId
            ? `NetworkMessageId == ${kql(input.networkMessageId)}`
            : `InternetMessageId == ${kql(input.internetMessageId!.startsWith("<") ? input.internetMessageId! : `<${input.internetMessageId}>`)}`;
        out.push({
            id: "email-exact",
            platform: "Microsoft Defender XDR / Sentinel",
            title: "This exact message",
            purpose: "Delivery details and verdicts Microsoft recorded for the reported message.",
            language: "kql",
            query: ["EmailEvents", `| where Timestamp > ${lookback}`, `| where ${id}`, "| project Timestamp, RecipientEmailAddress, DeliveryAction, DeliveryLocation, ThreatTypes, DetectionMethods, AuthenticationDetails, ConfidenceLevel"].join("\n")
        });
    }

    if (input.domains.length) {
        out.push({
            id: "email-urls",
            platform: "Microsoft Defender XDR / Sentinel",
            title: "Other emails linking to the same domains",
            purpose: "Catches variants with different senders or subjects. QR-code URLs appear here only if your Defender plan extracts them.",
            language: "kql",
            query: [
                "EmailUrlInfo",
                `| where Timestamp > ${lookback}`,
                `| where UrlDomain has_any (${list(input.domains)})`,
                "| join kind=inner (EmailEvents | where Timestamp > " + lookback + " | project NetworkMessageId, RecipientEmailAddress, SenderFromAddress, Subject, DeliveryAction) on NetworkMessageId",
                "| project Timestamp, RecipientEmailAddress, SenderFromAddress, Subject, Url, UrlLocation, DeliveryAction"
            ].join("\n")
        });
        out.push({
            id: "clicks",
            platform: "Microsoft Defender XDR / Sentinel",
            title: "Who clicked (Safe Links)",
            purpose: "Clicks on wrapped links. A QR code scanned on a phone will not appear here.",
            language: "kql",
            query: ["UrlClickEvents", `| where Timestamp > ${lookback}`, `| where Url has_any (${list(input.domains)})`, "| project Timestamp, AccountUpn, Url, ActionType, IsClickedThrough, IPAddress, Workload"].join("\n")
        });
        out.push({
            id: "endpoint-network",
            platform: "Microsoft Defender XDR / Sentinel",
            title: "Devices that contacted the domains",
            purpose: "Connections from managed endpoints (laptops), including clicks that bypassed Safe Links.",
            language: "kql",
            query: ["DeviceNetworkEvents", `| where Timestamp > ${lookback}`, `| where RemoteUrl has_any (${list(input.domains)})`, "| project Timestamp, DeviceName, InitiatingProcessAccountName, InitiatingProcessFileName, RemoteUrl, RemoteIP"].join("\n")
        });
    }

    if (input.sha256.length) {
        out.push({
            id: "attachments",
            platform: "Microsoft Defender XDR / Sentinel",
            title: "Same attachments anywhere",
            purpose: "Emails and endpoints that saw the same files.",
            language: "kql",
            query: [
                "let hashes = dynamic([" + list(input.sha256) + "]);",
                "union",
                `  (EmailAttachmentInfo | where Timestamp > ${lookback} | where SHA256 in (hashes) | project Timestamp, Source = "email", Who = RecipientEmailAddress, FileName, SHA256),`,
                `  (DeviceFileEvents | where Timestamp > ${lookback} | where SHA256 in (hashes) | project Timestamp, Source = "endpoint", Who = DeviceName, FileName, SHA256)`
            ].join("\n")
        });
    }

    if (input.recipients.length && !["none", "bec", "callback"].includes(input.attack)) {
        const since = input.since ? `datetime(${input.since.slice(0, 19)}Z)` : "ago(7d)";
        const deviceCode = input.attack === "device-code" ? `\n| where AuthenticationProtocol =~ "deviceCode"` : "";
        out.push({
            id: "signins",
            platform: "Microsoft Sentinel (Entra ID)",
            title: input.attack === "device-code" ? "Device-code sign-ins by recipients" : "Recipients' sign-ins since delivery",
            purpose: "New IPs, countries, devices or apps after the email arrived suggest stolen credentials or tokens.",
            language: "kql",
            query: [
                "SigninLogs",
                `| where TimeGenerated > ${since}`,
                `| where UserPrincipalName in~ (${list(input.recipients)})${deviceCode}`,
                "| summarize Attempts = count(), First = min(TimeGenerated), Last = max(TimeGenerated) by UserPrincipalName, IPAddress, Country = tostring(LocationDetails.countryOrRegion), AppDisplayName, ClientAppUsed, ResultType",
                "| order by First asc"
            ].join("\n")
        });
    }

    const purgeParts: string[] = [];
    if (subject.length >= 8) purgeParts.push(`(Subject:"${subject.replace(/["']/g, " ").replace(/\s+/g, " ").trim()}")`);
    if (input.fromAddress) purgeParts.push(`(From:"${input.fromAddress}")`);
    if (purgeParts.length) {
        const name = `MXLens-${(input.networkMessageId || input.internetMessageId || subject).replace(/[^A-Za-z0-9]/g, "").slice(0, 24) || "search"}`;
        const query = purgeParts.join(" AND ").replace(/'/g, "''");
        out.push({
            id: "purge",
            platform: "Microsoft Purview (PowerShell)",
            title: "Search and purge all copies",
            purpose: "Run in Security & Compliance PowerShell (Connect-IPPSSession). Review the search results before purging.",
            language: "powershell",
            query: [
                `New-ComplianceSearch -Name "${name}" -ExchangeLocation All -ContentMatchQuery '${query}'`,
                `Start-ComplianceSearch -Identity "${name}"`,
                `# When the search completes and the hit count looks right:`,
                `New-ComplianceSearchAction -SearchName "${name}" -Purge -PurgeType SoftDelete`
            ].join("\n")
        });
    }
    return out;
}
