import { after, NextRequest, NextResponse } from "next/server";
import {
    authenticateApiRequest,
    authenticateOptionalApiRequest,
    maybeEnforceAgentRateLimit,
    type AuthenticatedAgent
} from "@/lib/agent-api/auth";
import { createAnalysisBatch, getBatchForAgent, processAnalysisBatch } from "@/lib/agent-api/batch-processor";
import { AgentApiError, toAgentError } from "@/lib/agent-api/errors";
import {
    normalizeOptions,
    parsePendingJsonInput,
    resolvePendingInput,
    type PendingEmailInput
} from "@/lib/agent-api/ingestion";
import { analyzeResolvedEmail, summarizeForBatch } from "@/lib/agent-api/analysis-service";
import { attachPersistence, persistAgentAnalysis } from "@/lib/agent-api/persistence";
import { getAnalysisForAgent } from "@/lib/agent-api/queries";

export const runtime = "nodejs";

interface JsonRpcRequest {
    jsonrpc?: "2.0";
    id?: string | number | null;
    method?: string;
    params?: unknown;
}

export async function POST(req: NextRequest) {
    let message: JsonRpcRequest;

    try {
        const parsed = await req.json();
        if (Array.isArray(parsed)) {
            throw new AgentApiError(400, "batch_json_rpc_unsupported", "MCP JSON-RPC batch requests are not supported");
        }
        message = parsed as JsonRpcRequest;
    } catch (error) {
        const apiError = toAgentError(error);
        return NextResponse.json(jsonRpcError(null, apiError.code, apiError.message), { status: apiError.status });
    }

    if (!message.method) {
        return NextResponse.json(jsonRpcError(message.id ?? null, "invalid_request", "Missing method"), { status: 400 });
    }

    if (message.method.startsWith("notifications/")) {
        return new NextResponse(null, { status: 202 });
    }

    try {
        if (message.method === "initialize") {
            return NextResponse.json(jsonRpcResult(message.id, {
                protocolVersion: "2025-11-25",
                capabilities: {
                    tools: {}
                },
                serverInfo: {
                    name: "mxlens",
                    version: "1.0.0"
                }
            }));
        }

        if (message.method === "tools/list") {
            return NextResponse.json(jsonRpcResult(message.id, { tools: MCP_TOOLS }));
        }

        if (message.method === "tools/call") {
            const { name, arguments: args } = getToolCall(message.params);
            const requiredScope = name === "mxlens_analyze_email" || name === "mxlens_create_batch"
                ? "analyze:write"
                : "analyze:read";
            const agent = name === "mxlens_get_batch" || name === "mxlens_get_analysis"
                ? await authenticateApiRequest(req, requiredScope)
                : await authenticateOptionalApiRequest(req, requiredScope);
            const result = await callTool(agent, name, args);

            return NextResponse.json(jsonRpcResult(message.id, {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(result, null, 2)
                    }
                ],
                structuredContent: result
            }));
        }

        return NextResponse.json(jsonRpcError(message.id ?? null, "method_not_found", "Unsupported MCP method"), { status: 404 });
    } catch (error) {
        const apiError = toAgentError(error);
        return NextResponse.json(jsonRpcError(message.id ?? null, apiError.code, apiError.message, apiError.details), {
            status: apiError.status
        });
    }
}

async function callTool(agent: AuthenticatedAgent | null, name: string, args: unknown) {
    switch (name) {
        case "mxlens_analyze_email":
            if (agent) await maybeEnforceAgentRateLimit(agent, "mcp-single");
            return analyzeViaMcp(agent, args);
        case "mxlens_create_batch":
            if (agent) await maybeEnforceAgentRateLimit(agent, "mcp-batch");
            return createBatchViaMcp(agent, args);
        case "mxlens_get_batch":
            if (!agent) throw new AgentApiError(401, "missing_api_key", "API key is required to retrieve persisted batches");
            return getBatchForAgent(agent, requireStringArg(args, "batchId"));
        case "mxlens_get_analysis":
            if (!agent) throw new AgentApiError(401, "missing_api_key", "API key is required to retrieve persisted analyses");
            return getAnalysisForAgent(agent, requireStringArg(args, "analysisId"));
        default:
            throw new AgentApiError(404, "tool_not_found", `Unsupported MCP tool: ${name}`);
    }
}

async function analyzeViaMcp(agent: AuthenticatedAgent | null, args: unknown) {
    const input = parsePendingJsonInput(args);
    const options = normalizeOptions(isRecord(args) ? args.options : undefined);
    const resolved = await resolvePendingInput(input);
    const analysis = await analyzeResolvedEmail(resolved, options);

    if (!agent) {
        return {
            ...analysis,
            usage: {
                free: true,
                persisted: false
            }
        };
    }

    const persisted = await persistAgentAnalysis({ agent, input: resolved, options, result: analysis });

    return attachPersistence(analysis, persisted);
}

async function createBatchViaMcp(agent: AuthenticatedAgent | null, args: unknown) {
    if (!isRecord(args) || !Array.isArray(args.items)) {
        throw new AgentApiError(400, "invalid_arguments", "items array is required");
    }

    const items = args.items.map((item: unknown): PendingEmailInput => parsePendingJsonInput(item));
    const options = normalizeOptions(args.options);
    const clientReferenceId = typeof args.clientReferenceId === "string" ? args.clientReferenceId : undefined;

    if (!agent) {
        const results = [];

        for (let index = 0; index < items.length; index++) {
            const item = items[index];
            try {
                const resolved = await resolvePendingInput(item);
                const analysis = await analyzeResolvedEmail(resolved, options);
                results.push({
                    id: `public-${index + 1}`,
                    position: index,
                    status: "COMPLETED",
                    sourceType: item.sourceType,
                    sourceLabel: resolved.sourceLabel || item.filename || `item-${index + 1}`,
                    filename: item.filename,
                    externalId: item.externalId,
                    clientReferenceId: item.clientReferenceId,
                    result: summarizeForBatch(analysis),
                    processingMs: analysis.processingMs
                });
            } catch (error) {
                results.push({
                    id: `public-${index + 1}`,
                    position: index,
                    status: "FAILED",
                    sourceType: item.sourceType,
                    sourceLabel: item.filename || `item-${index + 1}`,
                    filename: item.filename,
                    externalId: item.externalId,
                    clientReferenceId: item.clientReferenceId,
                    errorCode: "analysis_failed",
                    errorMessage: error instanceof Error ? error.message : "Analysis failed"
                });
            }
        }

        const failedItems = results.filter(item => item.status === "FAILED").length;

        return {
            batchId: `public-${Date.now()}`,
            status: failedItems === 0 ? "COMPLETED" : failedItems === results.length ? "FAILED" : "PARTIAL_FAILED",
            totalItems: results.length,
            completedItems: results.length - failedItems,
            failedItems,
            clientReferenceId,
            statusUrl: null,
            persisted: false,
            items: results
        };
    }

    const { batch, workItems } = await createAnalysisBatch({ agent, items, options, clientReferenceId });

    after(async () => {
        try {
            await processAnalysisBatch({ agent, batchId: batch.id, options, workItems });
        } catch (error) {
            console.error("[MCP_BATCH] Processing failed:", error);
        }
    });

    return {
        batchId: batch.id,
        status: batch.status,
        totalItems: batch.totalItems,
        completedItems: batch.completedItems,
        failedItems: batch.failedItems,
        clientReferenceId: batch.clientReferenceId,
        statusUrl: `/api/v1/batches/${batch.id}`,
        createdAt: batch.createdAt
    };
}

function getToolCall(params: unknown) {
    if (!isRecord(params) || typeof params.name !== "string") {
        throw new AgentApiError(400, "invalid_tool_call", "tools/call requires a tool name");
    }

    return {
        name: params.name,
        arguments: params.arguments
    };
}

function requireStringArg(args: unknown, key: string) {
    if (!isRecord(args) || typeof args[key] !== "string" || !args[key]) {
        throw new AgentApiError(400, "invalid_arguments", `${key} is required`);
    }

    return args[key];
}

function jsonRpcResult(id: JsonRpcRequest["id"], result: unknown) {
    return {
        jsonrpc: "2.0",
        id: id ?? null,
        result
    };
}

function jsonRpcError(id: JsonRpcRequest["id"], code: string, message: string, data?: unknown) {
    return {
        jsonrpc: "2.0",
        id: id ?? null,
        error: {
            code: toJsonRpcErrorCode(code),
            message,
            data: {
                code,
                details: data
            }
        }
    };
}

function toJsonRpcErrorCode(code: string) {
    if (code === "invalid_request") return -32600;
    if (code === "method_not_found" || code === "tool_not_found") return -32601;
    if (code === "invalid_tool_call" || code === "invalid_arguments") return -32602;
    return -32000;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

const EMAIL_INPUT_SCHEMA = {
    type: "object",
    properties: {
        rawEmail: { type: "string", description: "Raw RFC 822 email content." },
        contentBase64: { type: "string", description: "Base64-encoded RFC 822 email content." },
        fetchUrl: { type: "string", description: "HTTPS signed URL to fetch the email from." },
        filename: { type: "string" },
        externalId: { type: "string" },
        clientReferenceId: { type: "string" },
        options: {
            type: "object",
            properties: {
                analyzeBody: { type: "boolean", default: false },
                analyzeAttachments: { type: "boolean", default: false }
            }
        }
    }
};

const MCP_TOOLS = [
    {
        name: "mxlens_analyze_email",
        description: "Analyze one email and return the MXLens verdict, risk score, findings, and privacy-safe signals.",
        inputSchema: EMAIL_INPUT_SCHEMA
    },
    {
        name: "mxlens_create_batch",
        description: "Create a bulk email analysis batch and return a batch ID for polling.",
        inputSchema: {
            type: "object",
            properties: {
                items: {
                    type: "array",
                    maxItems: 50,
                    items: EMAIL_INPUT_SCHEMA
                },
                clientReferenceId: { type: "string" },
                options: EMAIL_INPUT_SCHEMA.properties.options
            },
            required: ["items"]
        }
    },
    {
        name: "mxlens_get_batch",
        description: "Fetch batch status and item-level analysis summaries.",
        inputSchema: {
            type: "object",
            properties: {
                batchId: { type: "string" }
            },
            required: ["batchId"]
        }
    },
    {
        name: "mxlens_get_analysis",
        description: "Fetch a persisted MXLens analysis result by ID.",
        inputSchema: {
            type: "object",
            properties: {
                analysisId: { type: "string" }
            },
            required: ["analysisId"]
        }
    }
];
