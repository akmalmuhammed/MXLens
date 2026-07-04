"use server";

import bcrypt from "bcryptjs";
import { AuditAction } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logAuditAction } from "@/lib/audit";
import { generateApiKeySecret } from "@/lib/agent-api/auth";
import { API_KEY_SCOPES, type ApiKeyScope } from "@/lib/agent-api/limits";

export interface ApiKeyListItem {
    id: string;
    name: string;
    keyPrefix: string;
    scopes: string[];
    isActive: boolean;
    lastUsedAt: string | null;
    expiresAt: string | null;
    createdAt: string;
}

export async function listApiKeys(): Promise<ApiKeyListItem[]> {
    const session = await requireApiKeyAdmin();

    const keys = await db.apiKey.findMany({
        where: {
            orgId: session.orgId
        },
        orderBy: {
            createdAt: "desc"
        },
        select: {
            id: true,
            name: true,
            keyPrefix: true,
            scopes: true,
            isActive: true,
            lastUsedAt: true,
            expiresAt: true,
            createdAt: true
        }
    });

    return keys.map(key => ({
        ...key,
        lastUsedAt: key.lastUsedAt?.toISOString() || null,
        expiresAt: key.expiresAt?.toISOString() || null,
        createdAt: key.createdAt.toISOString()
    }));
}

export async function createApiKey(data: {
    name: string;
    scopes?: ApiKeyScope[];
    expiresAt?: string | null;
}) {
    const session = await requireApiKeyAdmin();

    const org = await db.organization.findUnique({
        where: { id: session.orgId },
        select: {
            planTier: true
        }
    });

    if (!org || !["PRO", "ENTERPRISE"].includes(org.planTier)) {
        return { error: "API access requires a PRO or ENTERPRISE plan." };
    }

    const name = data.name.trim();
    if (name.length < 2 || name.length > 80) {
        return { error: "Name must be between 2 and 80 characters." };
    }

    const scopes = sanitizeScopes(data.scopes);
    const expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
        return { error: "Invalid expiration date." };
    }

    const { key, keyPrefix } = generateApiKeySecret();
    const hashedKey = await bcrypt.hash(key, 12);

    const created = await db.apiKey.create({
        data: {
            name,
            keyPrefix,
            hashedKey,
            scopes,
            expiresAt,
            orgId: session.orgId
        }
    });

    await logAuditAction(AuditAction.API_KEY_CREATE, {
        apiKeyId: created.id,
        name,
        scopes,
        expiresAt: expiresAt?.toISOString() || null
    }, created.id);

    revalidatePath("/settings/api-keys");

    return {
        success: true,
        key,
        apiKey: {
            id: created.id,
            name: created.name,
            keyPrefix: created.keyPrefix,
            scopes: created.scopes,
            isActive: created.isActive,
            lastUsedAt: null,
            expiresAt: created.expiresAt?.toISOString() || null,
            createdAt: created.createdAt.toISOString()
        }
    };
}

export async function revokeApiKey(apiKeyId: string) {
    const session = await requireApiKeyAdmin();

    const updated = await db.apiKey.updateMany({
        where: {
            id: apiKeyId,
            orgId: session.orgId,
            isActive: true
        },
        data: {
            isActive: false
        }
    });

    if (updated.count === 0) {
        return { error: "API key not found or already revoked." };
    }

    await logAuditAction(AuditAction.API_KEY_REVOKE, { apiKeyId }, apiKeyId);
    revalidatePath("/settings/api-keys");

    return { success: true };
}

async function requireApiKeyAdmin() {
    const session = await auth();

    if (!session?.user?.id || !session.user.orgId) {
        throw new Error("Unauthorized");
    }

    if (!["OWNER", "ADMIN"].includes(session.user.role || "")) {
        throw new Error("Only organization owners and admins can manage API keys");
    }

    return {
        userId: session.user.id,
        orgId: session.user.orgId
    };
}

function sanitizeScopes(scopes?: ApiKeyScope[]) {
    if (!scopes || scopes.length === 0) {
        return [...API_KEY_SCOPES];
    }

    const allowed = new Set(API_KEY_SCOPES);
    const cleaned = scopes.filter(scope => allowed.has(scope));

    return cleaned.length > 0 ? Array.from(new Set(cleaned)) : [...API_KEY_SCOPES];
}
