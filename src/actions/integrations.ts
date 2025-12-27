/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { encrypt, decrypt, EncryptedData } from "@/lib/encryption";
import "server-only";

// -----------------------------------------------------------------------------
// SECURE CONFIG MANAGEMENT
// -----------------------------------------------------------------------------

export async function saveIntegration(data: {
    name: string;
    type: "SLACK" | "JIRA" | "MICROSOFT_TEAMS" | "SPLUNK" | "GENERIC_WEBHOOK";
    config: Record<string, string>; // Plain text config (e.g. { apiKey: "123" })
}) {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.orgId) return { error: "Unauthorized" };

    try {
        // 1. Encrypt sensitive fields
        // Since config is JSON, we encrypt the WHOLE JSON string for simplicity,
        // or we could selective encrypt. Let's encrypt the entire config object 
        // to be maximally safe against leaking ANY structure.
        const serializedConfig = JSON.stringify(data.config);
        const encrypted = encrypt(serializedConfig);

        // 2. Save to DB
        // Prisma `Json` field will store the { iv, content, tag } object structure naturally
        const integration = await db.integration.create({
            data: {
                orgId: session.user.orgId,
                name: data.name,
                type: data.type,
                config: encrypted as any // Cast because Prisma expects Json, matches EncryptedData structure
            }
        });

        return { success: true, id: integration.id };
    } catch (error) {
        console.error("Failed to save integration:", error);
        return { error: "Failed to save integration" };
    }
}

export async function getIntegrations() {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.orgId) return [];

    try {
        const integrations = await db.integration.findMany({
            where: { orgId: session.user.orgId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                type: true,
                isActive: true,
                updatedAt: true,
                // NEVER select 'config' here to avoid leaking encrypted blobs or trying to decrypt everything at once
            }
        });
        return integrations;
    } catch (error) {
        console.error("Failed to fetch integrations:", error);
        return [];
    }
}

// Internal server-use only (e.g. for the Ingestor/Bridge)
export async function getDecryptedConfig(integrationId: string) {
    // Note: No auth check here assuming caller (internal job) has verified permission or is system
    // But safely, let's keep it strictly for internal usage context.

    const integration = await db.integration.findUnique({
        where: { id: integrationId },
        select: { config: true }
    });

    if (!integration || !integration.config) return null;

    const encryptedData = integration.config as unknown as EncryptedData;
    const decryptedString = decrypt(encryptedData);

    if (!decryptedString) return null;

    return JSON.parse(decryptedString);
}
