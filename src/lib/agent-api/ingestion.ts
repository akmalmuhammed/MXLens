import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { NextRequest } from "next/server";
import { AgentApiError } from "./errors";
import {
    FETCH_REDIRECT_LIMIT,
    FETCH_TIMEOUT_MS,
    MAX_BATCH_ITEMS,
    MAX_EMAIL_BYTES,
    byteLength
} from "./limits";

export type EmailInputSource = "upload" | "raw" | "base64" | "fetch_url";

export interface EmailAnalysisOptions {
    analyzeBody: boolean;
    analyzeAttachments: boolean;
}

export interface PendingEmailInput {
    sourceType: EmailInputSource;
    rawEmail?: string;
    contentBase64?: string;
    fetchUrl?: string;
    filename?: string;
    externalId?: string;
    clientReferenceId?: string;
}

export interface ResolvedEmailInput {
    sourceType: EmailInputSource;
    rawEmail: string;
    filename?: string;
    externalId?: string;
    clientReferenceId?: string;
    sourceLabel?: string;
}

export interface ParsedAnalyzeRequest {
    input: PendingEmailInput;
    options: EmailAnalysisOptions;
}

export interface ParsedBatchRequest {
    items: PendingEmailInput[];
    options: EmailAnalysisOptions;
    clientReferenceId?: string;
}

export function normalizeOptions(value: unknown): EmailAnalysisOptions {
    const options = isRecord(value) ? value : {};

    return {
        analyzeBody: booleanValue(options.analyzeBody ?? options.checkBody),
        analyzeAttachments: booleanValue(options.analyzeAttachments ?? options.checkAttachments)
    };
}

export async function parseAnalyzeRequest(req: NextRequest): Promise<ParsedAnalyzeRequest> {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        const file = formData.get("file");
        const fetchUrl = stringValue(formData.get("fetchUrl"));
        const options = normalizeOptions({
            analyzeBody: formData.get("analyzeBody"),
            analyzeAttachments: formData.get("analyzeAttachments")
        });

        if (file instanceof File) {
            assertFileSize(file.size);
            return {
                input: {
                    sourceType: "upload",
                    rawEmail: await file.text(),
                    filename: file.name || undefined,
                    externalId: stringValue(formData.get("externalId")),
                    clientReferenceId: stringValue(formData.get("clientReferenceId"))
                },
                options
            };
        }

        if (fetchUrl) {
            return {
                input: {
                    sourceType: "fetch_url",
                    fetchUrl,
                    filename: stringValue(formData.get("filename")),
                    externalId: stringValue(formData.get("externalId")),
                    clientReferenceId: stringValue(formData.get("clientReferenceId"))
                },
                options
            };
        }

        throw new AgentApiError(400, "missing_input", "Expected multipart file or fetchUrl");
    }

    const body = await parseJson(req);
    const input = parsePendingJsonInput(body);

    return {
        input,
        options: normalizeOptions(body.options)
    };
}

export async function parseBatchRequest(req: NextRequest): Promise<ParsedBatchRequest> {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        const files = [
            ...formData.getAll("file"),
            ...formData.getAll("files")
        ].filter((value): value is File => value instanceof File);

        if (files.length === 0) {
            throw new AgentApiError(400, "missing_input", "Expected one or more multipart files");
        }

        assertBatchSize(files.length);

        const items: PendingEmailInput[] = [];
        for (const file of files) {
            assertFileSize(file.size);
            items.push({
                sourceType: "upload",
                rawEmail: await file.text(),
                filename: file.name || undefined
            });
        }

        return {
            items,
            options: normalizeOptions({
                analyzeBody: formData.get("analyzeBody"),
                analyzeAttachments: formData.get("analyzeAttachments")
            }),
            clientReferenceId: stringValue(formData.get("clientReferenceId"))
        };
    }

    const body = await parseJson(req);
    const bodyItems = Array.isArray(body.items) ? body.items : null;

    if (!bodyItems) {
        throw new AgentApiError(400, "missing_items", "Expected items array");
    }

    assertBatchSize(bodyItems.length);

    return {
        items: bodyItems.map(parsePendingJsonInput),
        options: normalizeOptions(body.options),
        clientReferenceId: stringValue(body.clientReferenceId)
    };
}

export async function resolvePendingInput(input: PendingEmailInput): Promise<ResolvedEmailInput> {
    if (input.rawEmail) {
        assertRawSize(input.rawEmail);
        return {
            ...input,
            rawEmail: input.rawEmail,
            sourceLabel: input.filename
        };
    }

    if (input.contentBase64) {
        const byteCount = base64DecodedByteLength(input.contentBase64);
        assertFileSize(byteCount);
        const rawEmail = Buffer.from(input.contentBase64, "base64").toString("utf8");

        return {
            ...input,
            rawEmail,
            sourceType: "base64",
            sourceLabel: input.filename
        };
    }

    if (input.fetchUrl) {
        const fetched = await fetchSafeEmailUrl(input.fetchUrl);

        return {
            ...input,
            rawEmail: fetched.rawEmail,
            sourceType: "fetch_url",
            sourceLabel: fetched.sourceLabel
        };
    }

    throw new AgentApiError(400, "missing_input", "Expected rawEmail, contentBase64, fetchUrl, or file upload");
}

export async function fetchSafeEmailUrl(fetchUrl: string) {
    let currentUrl = validateFetchUrl(fetchUrl);

    for (let redirectCount = 0; redirectCount <= FETCH_REDIRECT_LIMIT; redirectCount++) {
        await assertHostnameIsPublic(currentUrl.hostname);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

        try {
            const response = await fetch(currentUrl, {
                method: "GET",
                redirect: "manual",
                signal: controller.signal
            });

            if (isRedirect(response.status)) {
                const location = response.headers.get("location");
                if (!location) {
                    throw new AgentApiError(400, "bad_redirect", "Remote URL redirected without a Location header");
                }

                currentUrl = validateFetchUrl(new URL(location, currentUrl).toString());
                continue;
            }

            if (!response.ok) {
                throw new AgentApiError(400, "fetch_failed", `Remote URL returned HTTP ${response.status}`);
            }

            const contentLength = response.headers.get("content-length");
            if (contentLength && Number(contentLength) > MAX_EMAIL_BYTES) {
                throw new AgentApiError(413, "email_too_large", `Remote email exceeds ${MAX_EMAIL_BYTES} byte limit`);
            }

            const rawEmail = await readLimitedResponse(response);
            return {
                rawEmail,
                sourceLabel: `${currentUrl.hostname}${currentUrl.pathname}`
            };
        } catch (error) {
            if (error instanceof AgentApiError) throw error;
            if (error instanceof DOMException && error.name === "AbortError") {
                throw new AgentApiError(408, "fetch_timeout", "Remote URL fetch timed out");
            }
            throw new AgentApiError(400, "fetch_failed", "Remote URL fetch failed");
        } finally {
            clearTimeout(timeout);
        }
    }

    throw new AgentApiError(400, "too_many_redirects", `Remote URL exceeded ${FETCH_REDIRECT_LIMIT} redirects`);
}

export function validateFetchUrl(fetchUrl: string) {
    let url: URL;

    try {
        url = new URL(fetchUrl);
    } catch {
        throw new AgentApiError(400, "invalid_fetch_url", "fetchUrl must be a valid URL");
    }

    if (url.protocol !== "https:") {
        throw new AgentApiError(400, "invalid_fetch_url", "fetchUrl must use HTTPS");
    }

    if (url.username || url.password) {
        throw new AgentApiError(400, "invalid_fetch_url", "fetchUrl must not include embedded credentials");
    }

    if (!url.hostname) {
        throw new AgentApiError(400, "invalid_fetch_url", "fetchUrl must include a hostname");
    }

    if (isPrivateIpAddress(url.hostname)) {
        throw new AgentApiError(400, "blocked_fetch_url", "fetchUrl hostname resolves to a blocked address");
    }

    return url;
}

export function isPrivateIpAddress(address: string) {
    const normalized = address.toLowerCase().replace(/^\[|\]$/g, "");
    const ipVersion = isIP(normalized);

    if (ipVersion === 0) return false;

    if (ipVersion === 6) {
        if (normalized === "::" || normalized === "::1") return true;
        if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
        if (normalized.startsWith("fe80:")) return true;
        if (normalized.startsWith("::ffff:")) {
            return isPrivateIpAddress(normalized.replace("::ffff:", ""));
        }
        return false;
    }

    const parts = normalized.split(".").map(Number);
    const [a, b] = parts;

    return (
        a === 0 ||
        a === 10 ||
        a === 127 ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        (a === 100 && b >= 64 && b <= 127) ||
        (a === 192 && b === 0) ||
        (a === 198 && (b === 18 || b === 19)) ||
        a >= 224
    );
}

export function describePendingInput(input: PendingEmailInput, position: number) {
    const sourceLabel = input.fetchUrl
        ? safeUrlLabel(input.fetchUrl)
        : input.filename || `item-${position + 1}`;

    return {
        sourceType: input.sourceType,
        sourceLabel,
        filename: input.filename,
        externalId: input.externalId,
        clientReferenceId: input.clientReferenceId
    };
}

async function assertHostnameIsPublic(hostname: string) {
    if (isPrivateIpAddress(hostname)) {
        throw new AgentApiError(400, "blocked_fetch_url", "fetchUrl hostname resolves to a blocked address");
    }

    if (isIP(hostname)) return;

    const addresses = await lookup(hostname, { all: true, verbatim: false });
    if (addresses.length === 0 || addresses.some(result => isPrivateIpAddress(result.address))) {
        throw new AgentApiError(400, "blocked_fetch_url", "fetchUrl resolved to a blocked address");
    }
}

async function readLimitedResponse(response: Response) {
    if (!response.body) {
        return "";
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (!value) continue;

        total += value.byteLength;
        if (total > MAX_EMAIL_BYTES) {
            throw new AgentApiError(413, "email_too_large", `Email exceeds ${MAX_EMAIL_BYTES} byte limit`);
        }
        chunks.push(value);
    }

    return Buffer.concat(chunks).toString("utf8");
}

export function parsePendingJsonInput(value: unknown): PendingEmailInput {
    if (!isRecord(value)) {
        throw new AgentApiError(400, "invalid_input", "Input must be an object");
    }

    const rawEmail = stringValue(value.rawEmail);
    const contentBase64 = stringValue(value.contentBase64);
    const fetchUrl = stringValue(value.fetchUrl);
    const filename = stringValue(value.filename);
    const externalId = stringValue(value.externalId);
    const clientReferenceId = stringValue(value.clientReferenceId);

    const presentInputs = [rawEmail, contentBase64, fetchUrl].filter(Boolean);
    if (presentInputs.length !== 1) {
        throw new AgentApiError(400, "invalid_input", "Provide exactly one of rawEmail, contentBase64, or fetchUrl");
    }

    if (rawEmail) assertRawSize(rawEmail);
    if (contentBase64) assertFileSize(base64DecodedByteLength(contentBase64));

    return {
        sourceType: rawEmail ? "raw" : contentBase64 ? "base64" : "fetch_url",
        rawEmail,
        contentBase64,
        fetchUrl,
        filename,
        externalId,
        clientReferenceId
    };
}

async function parseJson(req: NextRequest) {
    try {
        const body = await req.json();
        if (!isRecord(body)) {
            throw new AgentApiError(400, "invalid_json", "Request body must be a JSON object");
        }
        return body;
    } catch (error) {
        if (error instanceof AgentApiError) throw error;
        throw new AgentApiError(400, "invalid_json", "Request body must be valid JSON");
    }
}

function assertBatchSize(count: number) {
    if (count < 1) {
        throw new AgentApiError(400, "missing_items", "Batch requires at least one item");
    }

    if (count > MAX_BATCH_ITEMS) {
        throw new AgentApiError(400, "too_many_items", `Batch cannot exceed ${MAX_BATCH_ITEMS} items`);
    }
}

function assertRawSize(rawEmail: string) {
    assertFileSize(byteLength(rawEmail));
}

function assertFileSize(size: number) {
    if (size > MAX_EMAIL_BYTES) {
        throw new AgentApiError(413, "email_too_large", `Email exceeds ${MAX_EMAIL_BYTES} byte limit`);
    }
}

function base64DecodedByteLength(value: string) {
    try {
        return Buffer.from(value, "base64").byteLength;
    } catch {
        throw new AgentApiError(400, "invalid_base64", "contentBase64 must be valid base64");
    }
}

function safeUrlLabel(fetchUrl: string) {
    try {
        const url = new URL(fetchUrl);
        return `${url.hostname}${url.pathname}`;
    } catch {
        return "fetch-url";
    }
}

function stringValue(value: unknown) {
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function booleanValue(value: unknown) {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") return value.toLowerCase() === "true" || value === "1";
    return false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

function isRedirect(status: number) {
    return status >= 300 && status < 400;
}
