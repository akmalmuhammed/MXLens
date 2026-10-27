import type { Investigation } from "./Investigation";

const ANSWER_LABEL: Record<string, string> = { yes: "Yes", no: "No", likely: "Likely", unlikely: "Unlikely", unclear: "Unclear" };

function defangValue(v: string): string {
    return v.replace(/^http(s?):\/\//i, (_, s) => `hxxp${s}://`).replace(/\./g, "[.]");
}

const FILE_EXT = /\.(?:eml|msg|png|jpe?g|gif|bmp|svg|pdf|html?|txt|docx?|xlsx?|pptx?|csv|rtf|zip|rar|7z|gz|iso|img|exe|dll|js|vbs|ps1|bat|cmd|scr|lnk|one|hta|msi|jar|json|xml|ics|mp3|wav|mp4|webp)$/i;
const PRIVATE_V4 = /^(?:10\.|127\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.|169\.254\.|0\.)/;

/**
 * Defangs URLs, email domains, host names and public IPv4 addresses inside free text, while
 * leaving file names, email local parts and private/loopback IPs readable.
 */
export function defangText(text: string): string {
    const saved: string[] = [];
    const keep = (v: string) => `\u0000${saved.push(v) - 1}\u0000`;
    let out = text
        // URLs (without trailing sentence punctuation)
        .replace(/\bhttps?:\/\/[^\s)"'<>]+/gi, m => {
            const trail = m.match(/[.,;:!?]+$/)?.[0] ?? "";
            return keep(defangValue(m.slice(0, m.length - trail.length))) + trail;
        })
        // email addresses: defang only the domain part
        .replace(/\b([a-z0-9._%+-]+)@([a-z0-9.-]+\.[a-z]{2,24})\b/gi, (_, local: string, domain: string) => keep(`${local}@${domain.replace(/\./g, "[.]")}`))
        // file names with a known extension
        .replace(/[^\s"'<>()[\]]+\.[a-z0-9]{2,5}\b/gi, m => (FILE_EXT.test(m) ? keep(m) : m));
    out = out
        .replace(/(?<![\d.])(?:\d{1,3}\.){3}\d{1,3}(?![\d.])/g, m => (PRIVATE_V4.test(m) ? m : m.replace(/\./g, "[.]")))
        .replace(/\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,24}\b/gi, m => m.replace(/\./g, "[.]"));
    return out.replace(/\u0000(\d+)\u0000/g, (_, i: string) => saved[Number(i)]);
}

/** Full analyst write-up as Markdown, for tickets, wikis and chat. */
export function investigationToMarkdown(inv: Investigation, options: { defang?: boolean; title?: string } = {}): string {
    const d = options.defang === false ? (s: string) => s : defangText;
    const lines: string[] = [];
    lines.push(`# ${options.title ? d(options.title) : "Email investigation"}`);
    lines.push("");
    lines.push(`**Verdict:** ${inv.verdict.label} (risk ${inv.verdict.risk}/100, ${inv.verdict.confidence.toLowerCase()} confidence)  `);
    lines.push(`**Assessment:** ${d(inv.headline)}`);
    lines.push("");
    lines.push("## What happened");
    for (const p of inv.narrative) lines.push(`- ${d(p)}`);
    lines.push("");
    lines.push("## Key questions");
    for (const q of inv.questions) {
        lines.push(`### ${q.question} **${q.label || ANSWER_LABEL[q.answer]}**`);
        lines.push(d(q.summary));
        for (const e of q.evidence) lines.push(`- ${d(e)}`);
        lines.push("");
    }
    if (inv.path.hops.length) {
        lines.push("## Delivery path (oldest first)");
        lines.push("| # | Role | From | IP | Received by | Delay | Notes |");
        lines.push("|---|---|---|---|---|---|---|");
        for (const h of inv.path.hops) {
            lines.push(`| ${h.index} | ${h.roleLabel} | ${d(h.from || "")} | ${h.ip ? d(h.ip) : ""} | ${d(h.by)}${h.operator ? ` (${h.operator})` : ""} | ${h.delay ?? ""} | ${d(h.notes.join("; "))} |`);
        }
        lines.push("");
    }
    if (inv.authentication.length) {
        lines.push("## Authentication");
        lines.push("| Stage | Evaluator | SPF | DKIM | DMARC | Checked IP | Note |");
        lines.push("|---|---|---|---|---|---|---|");
        for (const a of inv.authentication) lines.push(`| ${a.stage === "edge" ? "First server" : "Final server"} | ${d(a.evaluator)} | ${a.spf} | ${a.dkim} | ${a.dmarc} | ${a.checkedIp ? d(a.checkedIp) : ""} | ${d(a.note)} |`);
        lines.push("");
    }
    if (inv.whyDelivered.length) {
        lines.push("## Why it was not blocked");
        for (const g of inv.whyDelivered) lines.push(`- **Gap:** ${d(g.gap)}  \n  **Fix:** ${d(g.fix)}`);
        lines.push("");
    }
    if (inv.techniques.length) {
        lines.push("## MITRE ATT&CK");
        for (const t of inv.techniques) lines.push(`- **${t.id}** ${t.name}: ${d(t.evidence)}`);
        lines.push("");
    }
    if (inv.iocs.length) {
        lines.push("## Indicators");
        lines.push("| Type | Value | Role | Block |");
        lines.push("|---|---|---|---|");
        for (const i of inv.iocs) lines.push(`| ${i.type} | \`${["subject", "message-id", "sha256", "phone"].includes(i.type) ? i.value : d(i.value)}\` | ${i.role} | ${i.block ? "yes" : "context"} |`);
        lines.push("");
    }
    if (inv.actions.length) {
        lines.push("## Response");
        const groups: [string, string][] = [["now", "Now"], ["next", "Next"], ["harden", "Prevent a repeat"]];
        for (const [key, label] of groups) {
            const items = inv.actions.filter(a => a.when === key);
            if (!items.length) continue;
            lines.push(`**${label}**`);
            for (const a of items) lines.push(`- [ ] ${d(a.text)}`);
        }
        lines.push("");
    }
    if (inv.hunting.length) {
        lines.push("## Hunting and purge queries");
        lines.push("_Queries use the original (not defanged) values._");
        for (const h of inv.hunting) {
            lines.push(`### ${h.title} (${h.platform})`);
            lines.push(h.purpose);
            lines.push("```" + h.language);
            lines.push(h.query);
            lines.push("```");
        }
        lines.push("");
    }
    lines.push("_Generated by MXLens. Everything was analyzed locally; nothing was looked up online._");
    return lines.join("\n");
}
