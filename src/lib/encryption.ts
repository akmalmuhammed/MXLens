import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// Use a secure key from environment
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

// Lazy key initialization to prevent build-time failures
let encryptionKey: Buffer | null = null;

function getKey(): Buffer {
    if (encryptionKey) {
        return encryptionKey;
    }

    const keyHex = process.env.ENCRYPTION_KEY;

    // Fail closed in every environment (the key is read lazily, so builds still succeed):
    // an all-zero or malformed key would make stored integration secrets trivially decryptable.
    if (!keyHex || !/^[0-9a-fA-F]{64}$/.test(keyHex)) {
        throw new Error("ENCRYPTION_KEY must be 64 hex characters (32 bytes). Generate one with: openssl rand -hex 32");
    }
    encryptionKey = Buffer.from(keyHex, "hex");

    return encryptionKey;
}

export interface EncryptedData {
    iv: string;
    content: string;
    tag: string;
}

export function encrypt(text: string): EncryptedData {
    const KEY = getKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, KEY, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const tag = cipher.getAuthTag();

    return {
        iv: iv.toString("hex"),
        content: encrypted,
        tag: tag.toString("hex")
    };
}

export function decrypt(data: EncryptedData): string | null {
    try {
        const KEY = getKey();
        const iv = Buffer.from(data.iv, "hex");
        const tag = Buffer.from(data.tag, "hex");
        const decipher = createDecipheriv(ALGORITHM, KEY, iv);

        decipher.setAuthTag(tag);

        let decrypted = decipher.update(data.content, "hex", "utf8");
        decrypted += decipher.final("utf8");

        return decrypted;
    } catch (error) {
        console.error("Decryption failed:", error);
        return null;
    }
}
