import { db } from "@/lib/db";
import type { AuthenticatedAgent } from "./auth";
import { AgentApiError } from "./errors";

export async function getAnalysisForAgent(agent: AuthenticatedAgent, analysisId: string) {
    const log = await db.analysisLog.findFirst({
        where: {
            id: analysisId,
            orgId: agent.orgId
        },
        select: {
            id: true,
            incidentId: true,
            verdict: true,
            riskScore: true,
            confidence: true,
            processingMs: true,
            source: true,
            externalId: true,
            meta: true,
            createdAt: true
        }
    });

    if (!log) {
        throw new AgentApiError(404, "analysis_not_found", "Analysis not found");
    }

    const meta = isRecord(log.meta) ? log.meta : {};
    const apiResult = isRecord(meta.apiResult) ? meta.apiResult : null;

    if (apiResult) {
        return {
            ...apiResult,
            analysisId: log.id,
            incidentId: log.incidentId,
            createdAt: log.createdAt
        };
    }

    return {
        analysisId: log.id,
        incidentId: log.incidentId,
        verdict: log.verdict.toLowerCase(),
        riskScore: log.riskScore,
        confidence: {
            level: log.confidence
        },
        processingMs: log.processingMs,
        source: log.source,
        externalId: log.externalId,
        meta,
        createdAt: log.createdAt
    };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === "object" && !Array.isArray(value);
}
