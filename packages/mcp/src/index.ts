#!/usr/bin/env node
/**
 * MXLens MCP server (stdio).
 *
 * Lets an AI agent analyze an email for phishing locally: the message is parsed
 * and scored in this process and never sent anywhere. Point an MCP client
 * (Claude Desktop, Cursor, ...) at the `mxlens-mcp` command.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { listRules, ENGINE_VERSION } from "@mxlens/engine";
import { runAnalyze } from "./analyze.ts";

export function createServer(): McpServer {
    const server = new McpServer({ name: "mxlens", version: ENGINE_VERSION });

    server.registerTool(
        "analyze_email",
        {
            title: "Analyze an email for phishing",
            description:
                "Analyze a raw email (.eml / RFC 5322 text, or base64) for phishing. Returns a verdict (malicious, suspicious or clean), a 0-100 risk score, explained findings with MITRE ATT&CK techniques, authentication results, and extracted indicators. Runs locally; the message is never sent anywhere.",
            inputSchema: {
                email: z.string().describe("The raw email: full .eml / MIME text (headers and body), a block of headers, or base64 of either."),
                encoding: z.enum(["auto", "base64"]).default("auto").describe("How to decode the email string. 'auto' detects base64."),
                trustedAuthservIds: z
                    .array(z.string())
                    .optional()
                    .describe("authserv-ids of mail servers whose Authentication-Results you trust (e.g. your inbound gateway). Without this, results are read but marked unverified."),
                format: z.enum(["summary", "full", "markdown", "stix"]).default("summary").describe("summary: compact digest. full: complete structured result. markdown: ticket-ready report. stix: STIX 2.1 indicators."),
            },
            annotations: { readOnlyHint: true, openWorldHint: false },
        },
        async (args) => {
            const { text, structured } = await runAnalyze(args);
            return { content: [{ type: "text", text }], structuredContent: structured };
        },
    );

    server.registerTool(
        "list_rules",
        {
            title: "List detection rules",
            description: "List every MXLens detection rule with its id, severity, description, known false positives and MITRE ATT&CK techniques.",
            inputSchema: {},
            annotations: { readOnlyHint: true, openWorldHint: false },
        },
        async () => {
            const rules = listRules();
            return { content: [{ type: "text", text: JSON.stringify(rules, null, 2) }], structuredContent: { count: rules.length, rules } };
        },
    );

    return server;
}

export async function main(): Promise<void> {
    await createServer().connect(new StdioServerTransport());
}

const invokedDirectly = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (invokedDirectly) {
    main().catch((error) => {
        process.stderr.write(`mxlens-mcp failed to start: ${error instanceof Error ? error.stack : error}\n`);
        process.exit(1);
    });
}
