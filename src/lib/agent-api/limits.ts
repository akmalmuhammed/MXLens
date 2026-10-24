export const MAX_EMAIL_BYTES = 10 * 1024 * 1024;
export const MAX_BATCH_ITEMS = 50;
export const BATCH_CONCURRENCY = 3;
export const FETCH_TIMEOUT_MS = 10_000;
export const FETCH_REDIRECT_LIMIT = 2;

export function assertValidEmailSize(byteLength: number) {
    if (byteLength > MAX_EMAIL_BYTES) {
        throw new Error(`Email exceeds ${MAX_EMAIL_BYTES} byte limit`);
    }
}

export function byteLength(value: string) {
    return Buffer.byteLength(value, "utf8");
}
