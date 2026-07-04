import { after, NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest, maybeEnforceAgentRateLimit } from "@/lib/agent-api/auth";
import { agentErrorResponse } from "@/lib/agent-api/errors";
import { createAnalysisBatch, processAnalysisBatch } from "@/lib/agent-api/batch-processor";
import { parseBatchRequest } from "@/lib/agent-api/ingestion";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const agent = await authenticateApiRequest(req, "analyze:write");
        await maybeEnforceAgentRateLimit(agent, "batch");

        const { items, options, clientReferenceId } = await parseBatchRequest(req);
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
