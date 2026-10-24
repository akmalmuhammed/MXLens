import "server-only";

import { db } from "@/lib/db";
import { decrypt, type EncryptedData } from "@/lib/encryption";

/** Internal server-to-server config lookup, never export from a Server Action module. */
export async function getDecryptedConfig(integrationId: string) {
    const integration = await db.integration.findUnique({
        where: { id: integrationId },
        select: { config: true }
    });

    if (!integration?.config) return null;

    const decrypted = decrypt(integration.config as unknown as EncryptedData);
    return decrypted ? JSON.parse(decrypted) as Record<string, string> : null;
}
