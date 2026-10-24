import { db } from "@/lib/db";
import { AgentApiError } from "./errors";
import type { AuthenticatedAgent } from "./auth";
import type { ResolvedEmailInput, EmailAnalysisOptions } from "./ingestion";
import type { PublicAnalysisResult } from "./analysis-service";
import { toAnalysisVerdict } from "./analysis-service";
import { getDailyAnalysisLimit } from "./limits";

export interface PersistedAnalysis {
    analysisId: string;
    incidentId: string | null;
    usage: {
        used: number;
        limit: number;
        remaining: number;
    };
}

export async function persistAgentAnalysis(params: {
    agent: AuthenticatedAgent;
    input: ResolvedEmailInput;
    options: EmailAnalysisOptions;
    result: PublicAnalysisResult;
}): Promise<PersistedAnalysis> {
    const { agent, input, options, result } = params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return db.$transaction(async (tx) => {
        const org = await tx.organization.findUnique({
            where: { id: agent.orgId },
            select: {
                planTier: true,
                incidentCounter: true
            } as any
        });

        if (!org) {
            throw new AgentApiError(404, "organization_not_found", "Organization not found");
        }

        const safeOrg = org as any;
        const limit = getDailyAnalysisLimit(safeOrg.planTier);
        const usedBefore = await tx.analysisLog.count({
            where: {
                orgId: agent.orgId,
                createdAt: { gte: today }
            }
        });

        if (usedBefore >= limit) {
            throw new AgentApiError(429, "daily_quota_exceeded", "Daily analysis limit reached", {
                used: usedBefore,
                limit,
                remaining: 0
            });
        }

        let incidentId: string | null = null;

        if (safeOrg.planTier === "PRO" || safeOrg.planTier === "ENTERPRISE") {
            const updatedOrg = await tx.organization.update({
                where: { id: agent.orgId },
                data: { incidentCounter: { increment: 1 } } as any,
                select: { incidentCounter: true }
            });
            incidentId = `#INC-${updatedOrg.incidentCounter}`;
        }

        const log = await tx.analysisLog.create({
            data: {
                orgId: agent.orgId,
                apiKeyId: agent.apiKeyId,
                verdict: toAnalysisVerdict(result.verdict),
                riskScore: result.riskScore,
                confidence: result.confidence.level,
                processingMs: result.processingMs,
                clientVersion: "api-v1",
                source: "API",
                externalId: input.externalId,
                incidentId,
                meta: {
                    apiVersion: "v1",
                    sourceType: input.sourceType,
                    sourceLabel: input.sourceLabel,
                    filename: input.filename,
                    externalId: input.externalId,
                    clientReferenceId: input.clientReferenceId,
                    options,
                    apiResult: result
                }
            } as any
        });

        const used = usedBefore + 1;

        return {
            analysisId: log.id,
            incidentId,
            usage: {
                used,
                limit,
                remaining: Math.max(0, limit - used)
            }
        };
    });
}

export function attachPersistence(result: PublicAnalysisResult, persisted: PersistedAnalysis): PublicAnalysisResult & {
    usage: PersistedAnalysis["usage"];
    incidentId: string | null;
} {
    return {
        ...result,
        analysisId: persisted.analysisId,
        usage: persisted.usage,
        incidentId: persisted.incidentId
    };
}
