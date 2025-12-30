import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// Use a secure key from environment or fallback for dev (WARN in logs)
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
// FAIL SECURE: Never use a hardcoded fallback in production
const KEY = process.env.ENCRYPTION_KEY
    ? Buffer.from(process.env.ENCRYPTION_KEY, "hex")
    : (() => {
        if (process.env.NODE_ENV === "production") {
            throw new Error("FATAL: ENCRYPTION_KEY is missing in production");
        }
        console.warn("WARNING: Using insecure dev key for encryption");
        return Buffer.from("0000000000000000000000000000000000000000000000000000000000000000", "hex");
    })();

export interface EncryptedData {
    iv: string;
    content: string;
    tag: string;
}

export function encrypt(text: string): EncryptedData {
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
