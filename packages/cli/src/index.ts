#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { analyzeEmail, toMarkdown, toCsv, toStix, listRules, ENGINE_VERSION } from "@mxlens/engine";
import type { AnalysisResult, Verdict } from "@mxlens/engine";
import { renderTerminal } from "./render.ts";

const HELP = `mxlens — analyze an email for phishing

Usage:
  mxlens <file.eml ...>            Analyze one or more .eml files
  cat mail.eml | mxlens -          Analyze standard input
  mxlens --rules                   List detection rules

Options:
  -f, --format <fmt>   text (default), json, markdown, csv, stix
  -q, --quiet          Only print the verdict line
  --trust <ids>        Comma-separated Authentication-Results authserv-ids to trust
  --no-body            Skip body, link and attachment analysis (headers only)
  --fail-on <verdict>  Exit non-zero at this verdict or worse: malicious (default), suspicious, clean
  --no-color           Disable colored output
  -h, --help           Show this help
  -v, --version        Show version

Exit codes: 0 below the threshold, 1 at or above it, 2 on error.
Everything runs locally; no network requests are made.`;

interface Options {
    format: "text" | "json" | "markdown" | "csv" | "stix";
    quiet: boolean;
    trust: string[] | undefined;
    body: boolean;
    failOn: Verdict;
    color: boolean;
    files: string[];
}

const RANK: Record<Verdict, number> = { clean: 0, suspicious: 1, malicious: 2 };

function parseArgs(argv: string[]): Options | "help" | "version" | "rules" {
    const opts: Options = { format: "text", quiet: false, trust: undefined, body: true, failOn: "malicious", color: process.stdout.isTTY ?? false, files: [] };
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        switch (arg) {
            case "-h": case "--help": return "help";
            case "-v": case "--version": return "version";
            case "--rules": return "rules";
            case "-f": case "--format": opts.format = argv[++i] as Options["format"]; break;
            case "-q": case "--quiet": opts.quiet = true; break;
            case "--trust": opts.trust = (argv[++i] ?? "").split(",").map((s) => s.trim()).filter(Boolean); break;
            case "--no-body": opts.body = false; break;
            case "--fail-on": opts.failOn = argv[++i] as Verdict; break;
            case "--no-color": opts.color = false; break;
            default:
                if (arg.startsWith("-") && arg !== "-") throw new Error(`Unknown option: ${arg}`);
                opts.files.push(arg);
        }
    }
    if (!["text", "json", "markdown", "csv", "stix"].includes(opts.format)) throw new Error(`Unknown format: ${opts.format}`);
    if (!["clean", "suspicious", "malicious"].includes(opts.failOn)) throw new Error(`Unknown verdict: ${opts.failOn}`);
    return opts;
}

async function readInput(file: string): Promise<Uint8Array> {
    if (file === "-") {
        const chunks: Buffer[] = [];
        for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
        return new Uint8Array(Buffer.concat(chunks));
    }
    return new Uint8Array(await readFile(file));
}

function render(result: AnalysisResult, opts: Options): string {
    switch (opts.format) {
        case "json": return JSON.stringify(result, null, 2);
        case "markdown": return toMarkdown(result);
        case "csv": return toCsv(result);
        case "stix": return JSON.stringify(toStix(result), null, 2);
        default: return renderTerminal(result, { color: opts.color, quiet: opts.quiet });
    }
}

export async function main(argv: string[]): Promise<number> {
    let parsed: ReturnType<typeof parseArgs>;
    try {
        parsed = parseArgs(argv);
    } catch (error) {
        process.stderr.write(`${error instanceof Error ? error.message : error}\n`);
        return 2;
    }
    if (parsed === "help") { process.stdout.write(HELP + "\n"); return 0; }
    if (parsed === "version") { process.stdout.write(`mxlens ${ENGINE_VERSION}\n`); return 0; }
    if (parsed === "rules") {
        for (const r of listRules()) process.stdout.write(`${r.id}  [${r.severity}]  ${r.title}\n            ${r.attack.map((a) => a.id).join(", ")}\n`);
        return 0;
    }
    const opts = parsed;
    if (opts.files.length === 0) {
        if (!process.stdin.isTTY) opts.files.push("-");
        else { process.stderr.write("No input. See mxlens --help.\n"); return 2; }
    }

    let worst: Verdict = "clean";
    const many = opts.files.length > 1;
    const jsonResults: AnalysisResult[] = [];
    for (const file of opts.files) {
        let result: AnalysisResult;
        try {
            result = await analyzeEmail(await readInput(file), { trustedAuthservIds: opts.trust, analyzeBody: opts.body, analyzeAttachments: opts.body });
        } catch (error) {
            process.stderr.write(`${file}: ${error instanceof Error ? error.message : error}\n`);
            return 2;
        }
        if (RANK[result.verdict] > RANK[worst]) worst = result.verdict;
        if (opts.format === "json") { jsonResults.push(result); continue; }
        if (many && opts.format === "text") process.stdout.write(`\n=== ${file} ===\n`);
        process.stdout.write(render(result, opts) + "\n");
    }
    if (opts.format === "json") process.stdout.write(JSON.stringify(many ? jsonResults : jsonResults[0], null, 2) + "\n");

    return RANK[worst] >= RANK[opts.failOn] ? 1 : 0;
}

const invokedDirectly = process.argv[1] && (import.meta.url === `file://${process.argv[1]}` || import.meta.url.endsWith(process.argv[1].split("/").pop() ?? ""));
if (invokedDirectly) {
    main(process.argv.slice(2)).then((code) => process.exit(code)).catch((error) => {
        process.stderr.write(`${error instanceof Error ? error.stack : error}\n`);
        process.exit(2);
    });
}
