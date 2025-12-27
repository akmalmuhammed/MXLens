const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
// Mock Key (Zeroed)
const KEY = Buffer.from("0000000000000000000000000000000000000000000000000000000000000000", "hex");

function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const tag = cipher.getAuthTag();
    return { iv: iv.toString("hex"), content: encrypted, tag: tag.toString("hex") };
}

function decrypt(data) {
    const iv = Buffer.from(data.iv, "hex");
    const tag = Buffer.from(data.tag, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(data.content, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}

// Test
console.log("Testing Vault Logic (CJS)...");
const secret = "SUPER_SECRET_API_KEY_999";
console.log("Original:", secret);

const encrypted = encrypt(secret);
console.log("Encrypted:", encrypted);

const decrypted = decrypt(encrypted);
console.log("Decrypted:", decrypted);

if (decrypted === secret) {
    console.log("SUCCESS: Decryption matches original.");
    process.exit(0);
} else {
    console.error("FAILURE: Decryption mismatch.");
    process.exit(1);
}
