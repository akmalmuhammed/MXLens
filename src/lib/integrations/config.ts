import "server-only";

import { db } from "@/lib/db";
import { decrypt, EncryptedData } from "@/lib/encryption";

/**
 * Decrypt an integration's stored config (webhook secrets, OAuth tokens).
 *
 * Lives outside src/actions on purpose: every export of a "use server" file is a
 * remotely callable server action, and this function performs no auth check.
 * Only call it from route handlers that have already authorized the request.
 */
export async function getDecryptedConfig(integrationId: string) {
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
