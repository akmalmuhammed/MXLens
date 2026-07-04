import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { AgentApiError } from "./errors";
import type { ApiKeyScope } from "./limits";

const KEY_PREFIX_LENGTH = 18;
const API_KEY_PREFIX = "mxl_live_";

export interface AuthenticatedAgent {
    apiKeyId: string;
    apiKeyName: string;
    orgId: string;
    scopes: string[];
    planTier: string;
}

export function generateApiKeySecret() {
    const secret = randomBytes(32).toString("base64url");
    const key = `${API_KEY_PREFIX}${secret}`;

    return {
        key,
        keyPrefix: key.slice(0, KEY_PREFIX_LENGTH)
    };
}

export function extractBearerToken(req: NextRequest | Request) {
    const authHeader = req.headers.get("authorization");

    if (authHeader?.toLowerCase().startsWith("bearer ")) {
        return authHeader.slice("bearer ".length).trim();
    }

    return req.headers.get("x-api-key")?.trim() || null;
}

export async function authenticateApiRequest(
    req: NextRequest | Request,
    requiredScope: ApiKeyScope
): Promise<AuthenticatedAgent> {
    const presentedKey = extractBearerToken(req);

    if (!presentedKey) {
        throw new AgentApiError(401, "missing_api_key", "Missing API key");
    }

    if (!presentedKey.startsWith(API_KEY_PREFIX) || presentedKey.length <= KEY_PREFIX_LENGTH) {
        throw new AgentApiError(401, "invalid_api_key", "Invalid API key");
    }

    const keyPrefix = presentedKey.slice(0, KEY_PREFIX_LENGTH);
    const candidates = await db.apiKey.findMany({
        where: {
            keyPrefix,
            isActive: true
        },
        include: {
            organization: {
                select: {
                    id: true,
                    planTier: true
                }
            }
        }
    });

    for (const candidate of candidates) {
        const matches = await bcrypt.compare(presentedKey, candidate.hashedKey);
        if (!matches) continue;

        if (candidate.expiresAt && candidate.expiresAt.getTime() <= Date.now()) {
            throw new AgentApiError(401, "expired_api_key", "API key has expired");
        }

        if (!candidate.scopes.includes(requiredScope) && !candidate.scopes.includes("*")) {
            throw new AgentApiError(403, "missing_scope", `API key requires ${requiredScope} scope`);
        }

        if (!["PRO", "ENTERPRISE"].includes(candidate.organization.planTier)) {
            throw new AgentApiError(403, "plan_required", "Agent API access requires a PRO or ENTERPRISE plan");
        }

        await db.apiKey.update({
            where: { id: candidate.id },
            data: { lastUsedAt: new Date() }
        });

        return {
            apiKeyId: candidate.id,
            apiKeyName: candidate.name,
            orgId: candidate.orgId,
            scopes: candidate.scopes,
            planTier: candidate.organization.planTier
        };
    }

    throw new AgentApiError(401, "invalid_api_key", "Invalid API key");
}

export async function maybeEnforceAgentRateLimit(agent: AuthenticatedAgent, bucket: string) {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        return null;
    }

    const { analysisRateLimiter } = await import("@/lib/rate-limit");
    const result = await analysisRateLimiter.limit(`api:${agent.orgId}:${agent.apiKeyId}:${bucket}`);

    if (!result.success) {
        throw new AgentApiError(429, "rate_limited", "Rate limit exceeded", {
            limit: result.limit,
            remaining: result.remaining,
            reset: new Date(result.reset).toISOString()
        });
    }

    return {
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset
    };
}
