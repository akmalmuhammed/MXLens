import { after, NextRequest, NextResponse } from "next/server";
import { authenticateOptionalApiRequest, maybeEnforceAgentRateLimit } from "@/lib/agent-api/auth";
import { agentErrorResponse } from "@/lib/agent-api/errors";
import { createAnalysisBatch, processAnalysisBatch } from "@/lib/agent-api/batch-processor";
import { parseBatchRequest, resolvePendingInput } from "@/lib/agent-api/ingestion";
import { analyzeResolvedEmail, summarizeForBatch } from "@/lib/agent-api/analysis-service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const agent = await authenticateOptionalApiRequest(req, "analyze:write");
        if (agent) {
            await maybeEnforceAgentRateLimit(agent, "batch");
        }

        const { items, options, clientReferenceId } = await parseBatchRequest(req);

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
                    const message = error instanceof Error ? error.message : "Analysis failed";
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
                        errorMessage: message
                    });
                }
            }

            const failedItems = results.filter(item => item.status === "FAILED").length;

            return NextResponse.json({
                batchId: `public-${Date.now()}`,
                status: failedItems === 0 ? "COMPLETED" : failedItems === results.length ? "FAILED" : "PARTIAL_FAILED",
                totalItems: results.length,
                completedItems: results.length - failedItems,
                failedItems,
                clientReferenceId,
                statusUrl: null,
                persisted: false,
                items: results
            });
        }

        const { batch, workItems } = await createAnalysisBatch({
            agent,
            items,
            options,
            clientReferenceId
        });

        after(async () => {
            try {
                await processAnalysisBatch({
                    agent,
                    batchId: batch.id,
                    options,
                    workItems
                });
            } catch (error) {
                console.error("[AGENT_BATCH] Processing failed:", error);
            }
        });

        return NextResponse.json(
            {
                batchId: batch.id,
                status: batch.status,
                totalItems: batch.totalItems,
                completedItems: batch.completedItems,
                failedItems: batch.failedItems,
                clientReferenceId: batch.clientReferenceId,
                statusUrl: `/api/v1/batches/${batch.id}`,
                createdAt: batch.createdAt
            },
            { status: 202 }
        );
    } catch (error) {
        return agentErrorResponse(error);
    }
}
