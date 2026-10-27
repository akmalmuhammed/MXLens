import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { analyzeEmail, type EmailAnalysis, type Verdict } from "@/lib/email/analyze";
import { investigationToMarkdown } from "@/lib/investigation/markdown";
import { mapWithConcurrency } from "@/lib/utils/concurrency";

declare const __MXLENS_VERSION__: string;
const VERSION = typeof __MXLENS_VERSION__ === "string" ? __MXLENS_VERSION__ : "dev";

const HELP = `mxlens ${VERSION} - analyze .eml files for phishing, locally

Usage:
  mxlens [analyze] <file|dir|-> [...more] [options]

Inputs:
  file.eml          A single message
  dir/              Every .eml file in the directory (recursive)
  -                 Read one message from stdin

Options:
  --json            Print JSON (an object for one input, an array for several)
  --investigate     Print the full analyst write-up (Markdown): key questions,
                    delivery path, why it got through, IOCs, response steps,
                    hunting and purge queries
  --no-defang       With --investigate, print live URLs/domains/IPs
  --headers-only    Skip body and attachment analysis
  --no-body         Skip body analysis (links, forms, urgency, hidden text)
  --no-attachments  Skip attachment analysis
  --fail-on <level> Exit with code 2 if any message is at least this bad:
                    suspicious | malicious
  -v, --version     Print the version
  -h, --help        Print this help

Exit codes: 0 ok, 1 usage or read error, 2 --fail-on threshold met.
Nothing is sent over the network.`;

const SEVERITY_RANK: Record<Verdict, number> = { clean: 0, unknown: 1, suspicious: 2, malicious: 3 };
const MAX_EMAIL_BYTES = 50 * 1024 * 1024;

export interface Io {
    stdout: (text: string) => void;
    stderr: (text: string) => void;
    readStdin: () => Promise<string>;
    color: boolean;
}

interface Outcome {
    input: string;
    result?: EmailAnalysis;
    error?: string;
}

export async function run(argv: string[], io: Io): Promise<number> {
    let parsed;
    try {
        parsed = parseArgs({
            args: argv,
            allowPositionals: true,
            options: {
                json: { type: "boolean" },
                investigate: { type: "boolean" },
                "no-defang": { type: "boolean" },
                "headers-only": { type: "boolean" },
                "no-body": { type: "boolean" },
                "no-attachments": { type: "boolean" },
                "fail-on": { type: "string" },
                version: { type: "boolean", short: "v" },
                help: { type: "boolean", short: "h" },
            },
        });
    } catch (error) {
        io.stderr(`${(error as Error).message}\n\n${HELP}\n`);
        return 1;
    }

    const { values } = parsed;
    let positionals = parsed.positionals;
    if (values.help) {
        io.stdout(`${HELP}\n`);
        return 0;
    }
    if (values.version) {
        io.stdout(`${VERSION}\n`);
        return 0;
    }
    if (positionals[0] === "analyze") positionals = positionals.slice(1);
    if (positionals.length === 0) {
        io.stderr(`No input given.\n\n${HELP}\n`);
        return 1;
    }

    const failOn = values["fail-on"];
    if (failOn !== undefined && failOn !== "suspicious" && failOn !== "malicious") {
        io.stderr(`--fail-on must be "suspicious" or "malicious", got "${failOn}"\n`);
        return 1;
    }

    const options = {
        body: !(values["headers-only"] || values["no-body"]),
        attachments: !(values["headers-only"] || values["no-attachments"]),
    };

    let inputs: string[];
    try {
        inputs = await expandInputs(positionals);
    } catch (error) {
        io.stderr(`${(error as Error).message}\n`);
        return 1;
    }
    if (inputs.length === 0) {
        io.stderr("No .eml files found.\n");
        return 1;
    }

    const outcomes = await mapWithConcurrency(inputs, 4, async (input): Promise<Outcome> => {
        try {
            const raw = input === "-" ? await io.readStdin() : await readEmailFile(input);
            return { input, result: await analyzeEmail(raw, options) };
        } catch (error) {
            return { input, error: (error as Error).message };
        }
    });

    if (values.investigate && !values.json) {
        const docs = outcomes.map(o => o.result
            ? investigationToMarkdown(o.result.investigation, { defang: !values["no-defang"], title: o.result.message.subject || (o.input === "-" ? "stdin" : path.basename(o.input)) })
            : `# ${o.input}

error: ${o.error}`);
        io.stdout(`${docs.join("\n\n---\n\n")}\n`);
    } else if (values.json) {
        const rows = outcomes.map(o => (o.result ? { input: o.input, ...o.result } : { input: o.input, error: o.error }));
        io.stdout(`${JSON.stringify(rows.length === 1 ? rows[0] : rows, null, 2)}\n`);
    } else {
        io.stdout(outcomes.map(o => formatOutcome(o, io.color)).join("\n"));
        if (outcomes.length > 1) io.stdout(formatSummary(outcomes, io.color));
    }

    if (outcomes.some(o => o.error)) return 1;
    if (failOn) {
        const threshold = SEVERITY_RANK[failOn as Verdict];
        if (outcomes.some(o => o.result && SEVERITY_RANK[o.result.verdict] >= threshold)) return 2;
    }
    return 0;
}

async function expandInputs(args: string[]): Promise<string[]> {
    const files: string[] = [];
    for (const arg of args) {
        if (arg === "-") {
            files.push(arg);
            continue;
        }
        const info = await stat(arg).catch(() => {
            throw new Error(`Cannot read "${arg}": no such file or directory`);
        });
        if (info.isDirectory()) {
            files.push(...(await findEmlFiles(arg)));
        } else {
            files.push(arg);
        }
    }
    return files;
}

async function findEmlFiles(dir: string): Promise<string[]> {
    const entries = await readdir(dir, { withFileTypes: true });
    const nested = await Promise.all(
        entries
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(async entry => {
                const full = path.join(dir, entry.name);
                if (entry.isDirectory()) return findEmlFiles(full);
                return entry.isFile() && entry.name.toLowerCase().endsWith(".eml") ? [full] : [];
            })
    );
    return nested.flat();
}

async function readEmailFile(file: string): Promise<string> {
    const info = await stat(file);
    if (info.size > MAX_EMAIL_BYTES) throw new Error(`File is larger than ${MAX_EMAIL_BYTES / 1024 / 1024} MB`);
    return readFile(file, "utf8");
}

const ANSI = { red: 31, yellow: 33, green: 32, gray: 90, bold: 1 } as const;

function paint(text: string, style: keyof typeof ANSI, color: boolean) {
    return color ? `\x1b[${ANSI[style]}m${text}\x1b[0m` : text;
}

function verdictStyle(verdict: Verdict): keyof typeof ANSI {
    if (verdict === "malicious") return "red";
    if (verdict === "suspicious") return "yellow";
    if (verdict === "clean") return "green";
    return "gray";
}

function formatOutcome({ input, result, error }: Outcome, color: boolean): string {
    const name = input === "-" ? "<stdin>" : input;
    if (!result) return `${paint(name, "bold", color)}\n  ${paint("error", "red", color)}: ${error}\n`;

    const auth = result.signals.authentication;
    const lines = [
        paint(name, "bold", color),
        `  ${paint(result.verdictLabel.toUpperCase(), verdictStyle(result.verdict), color)}  risk ${result.riskScore}/100  confidence ${result.confidence.level.toLowerCase()}`,
        `  ${result.reason}`,
    ];
    if (result.message.subject) lines.push(`  ${paint("Subject", "gray", color)}  ${result.message.subject}`);
    if (result.message.from) lines.push(`  ${paint("From", "gray", color)}     ${result.message.from}`);
    lines.push(`  ${paint("Auth", "gray", color)}     SPF ${auth.spf}  DKIM ${auth.dkim}  DMARC ${auth.dmarc}  ARC ${auth.arc}`);
    lines.push(`  ${paint("Assessment", "gray", color)} ${result.investigation.headline}`);
    const spoof = result.investigation.questions.find(q => q.id === "spoofed");
    if (spoof) lines.push(`  ${paint("Spoofed?", "gray", color)}   ${spoof.answer}: ${spoof.summary}`);

    const findings = [...result.findings].sort((a, b) => b.impact - a.impact).slice(0, 8);
    if (findings.length > 0) {
        lines.push(`  ${paint("Findings", "gray", color)}`);
        for (const finding of findings) {
            const style = finding.severity === "critical" || finding.severity === "high" ? "red" : finding.severity === "medium" ? "yellow" : "gray";
            lines.push(`    ${paint(finding.severity.padEnd(8), style, color)} ${finding.reason}`);
        }
        const hidden = result.findings.length - findings.length;
        if (hidden > 0) lines.push(paint(`    ... ${hidden} more (use --json for all)`, "gray", color));
    }
    lines.push(paint("  Full write-up with IOCs, response steps and hunting queries: --investigate", "gray", color));
    return `${lines.join("\n")}\n`;
}

function formatSummary(outcomes: Outcome[], color: boolean): string {
    const counts: Record<string, number> = {};
    for (const o of outcomes) {
        const key = o.result ? o.result.verdict : "error";
        counts[key] = (counts[key] ?? 0) + 1;
    }
    const parts = (["malicious", "suspicious", "unknown", "clean", "error"] as const)
        .filter(key => counts[key])
        .map(key => `${counts[key]} ${key}`);
    return `\n${paint(`${outcomes.length} messages:`, "bold", color)} ${parts.join(", ")}\n`;
}
