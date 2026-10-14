import { db } from "@/lib/db";
import type { AuthenticatedAgent } from "./auth";
import { AgentApiError, toAgentError } from "./errors";
import {
    describePendingInput,
    resolvePendingInput,
    type EmailAnalysisOptions,
    type PendingEmailInput
} from "./ingestion";
import { analyzeResolvedEmail, summarizeForBatch } from "./analysis-service";
import { BATCH_CONCURRENCY, MAX_BATCH_ITEMS } from "./limits";
import { attachPersistence, persistAgentAnalysis } from "./persistence";

export interface BatchWorkItem {
    batchItemId: string;
    position: number;
    input: PendingEmailInput;
}

export async function createAnalysisBatch(params: {
    agent: AuthenticatedAgent;
    items: PendingEmailInput[];
    options: EmailAnalysisOptions;
    clientReferenceId?: string;
}) {
    const { agent, items, clientReferenceId } = params;

    if (items.length < 1 || items.length > MAX_BATCH_ITEMS) {
        throw new AgentApiError(400, "invalid_batch_size", `Batch must contain 1-${MAX_BATCH_ITEMS} items`);
    }

    const batch = await db.analysisBatch.create({
        data: {
            orgId: agent.orgId,
            apiKeyId: agent.apiKeyId,
            status: "QUEUED",
            totalItems: items.length,
            clientReferenceId,
            items: {
                create: items.map((input, index) => ({
                    position: index,
                    ...describePendingInput(input, index)
                }))
            }
        } as any,
        include: {
            items: {
                orderBy: { position: "asc" }
            }
        }
    });

    return {
        batch,
        workItems: batch.items.map((item, index) => ({
            batchItemId: item.id,
            position: item.position,
            input: items[index]
        }))
    };
}

export async function processAnalysisBatch(params: {
    agent: AuthenticatedAgent;
    batchId: string;
    options: EmailAnalysisOptions;
    workItems: BatchWorkItem[];
}) {
    const { agent, batchId, options, workItems } = params;

    await db.analysisBatch.updateMany({
        where: {
            id: batchId,
            orgId: agent.orgId
        },
        data: { status: "PROCESSING" }
    });

    await runWithConcurrency(workItems, BATCH_CONCURRENCY, async (item) => {
        await processBatchItem({ agent, batchId, options, item });
    });

    const itemCounts = await db.analysisBatchItem.groupBy({
        by: ["status"],
        where: { batchId },
        _count: { status: true }
    } as any) as Array<{ status: string; _count: { status: number } }>;

    const completed = itemCounts.find(row => row.status === "COMPLETED")?._count.status || 0;
    const failed = itemCounts.find(row => row.status === "FAILED")?._count.status || 0;
    const finalStatus = failed === 0 ? "COMPLETED" : completed === 0 ? "FAILED" : "PARTIAL_FAILED";

    await db.analysisBatch.updateMany({
        where: {
            id: batchId,
            orgId: agent.orgId
        },
        data: {
            status: finalStatus,
            completedItems: completed,
            failedItems: failed
        } as any
    });
}

export async function getBatchForAgent(agent: AuthenticatedAgent, batchId: string) {
    const batch = await db.analysisBatch.findFirst({
        where: {
            id: batchId,
            orgId: agent.orgId
        },
        include: {
            items: {
                orderBy: { position: "asc" },
                select: {
                    id: true,
                    position: true,
                    status: true,
                    sourceType: true,
                    sourceLabel: true,
                    filename: true,
                    externalId: true,
                    clientReferenceId: true,
                    errorCode: true,
                    errorMessage: true,
                    resultSummary: true,
                    processingMs: true,
                    analysisLogId: true,
                    createdAt: true,
                    updatedAt: true
                }
            }
        }
    });

    if (!batch) {
        throw new AgentApiError(404, "batch_not_found", "Batch not found");
    }

    return formatBatch(batch as any);
}

function formatBatch(batch: any) {
    return {
        batchId: batch.id,
        status: batch.status,
        totalItems: batch.totalItems,
        completedItems: batch.completedItems,
        failedItems: batch.failedItems,
        clientReferenceId: batch.clientReferenceId,
        createdAt: batch.createdAt,
        updatedAt: batch.updatedAt,
        items: batch.items.map((item: any) => ({
            id: item.id,
            position: item.position,
            status: item.status,
            sourceType: item.sourceType,
            sourceLabel: item.sourceLabel,
            filename: item.filename,
            externalId: item.externalId,
            clientReferenceId: item.clientReferenceId,
            errorCode: item.errorCode,
            errorMessage: item.errorMessage,
            analysisId: item.analysisLogId,
            processingMs: item.processingMs,
            result: item.resultSummary,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
        }))
    };
}

async function processBatchItem(params: {
    agent: AuthenticatedAgent;
    batchId: string;
    options: EmailAnalysisOptions;
    item: BatchWorkItem;
}) {
    const { agent, batchId, options, item } = params;

    await db.analysisBatchItem.updateMany({
        where: {
            id: item.batchItemId,
            batchId
        },
        data: { status: "PROCESSING" }
    });

    try {
        const resolved = await resolvePendingInput(item.input);
        const analysis = await analyzeResolvedEmail(resolved, options);
        const persisted = await persistAgentAnalysis({ agent, input: resolved, options, result: analysis });
        const finalResult = attachPersistence(analysis, persisted);

        await db.analysisBatchItem.updateMany({
            where: {
                id: item.batchItemId,
                batchId
            },
            data: {
                status: "COMPLETED",
                analysisLogId: persisted.analysisId,
                resultSummary: summarizeForBatch(finalResult),
                processingMs: finalResult.processingMs
            } as any
        });
    } catch (error) {
        const apiError = toAgentError(error);
        await db.analysisBatchItem.updateMany({
            where: {
                id: item.batchItemId,
                batchId
            },
            data: {
                status: "FAILED",
                errorCode: apiError.code,
                errorMessage: apiError.message
            }
        });
    }
}

async function runWithConcurrency<T>(
    items: T[],
    concurrency: number,
    worker: (item: T) => Promise<void>
) {
    let index = 0;

    async function next() {
        while (index < items.length) {
            const item = items[index++];
            await worker(item);
        }
    }

    await Promise.all(
        Array.from({ length: Math.min(concurrency, items.length) }, () => next())
    );
}
