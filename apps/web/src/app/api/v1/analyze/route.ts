import { analyzeEmail, toStix } from "@mxlens/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 15 * 1024 * 1024;

/**
 * POST /api/v1/analyze
 *
 * Body:
 *   - raw email as text/plain or message/rfc822, OR
 *   - JSON { "email": "<raw>", "encoding"?: "base64", "trustedAuthservIds"?: string[], "format"?: "json"|"stix" }
 *
 * Returns the full analysis result as JSON (or a STIX 2.1 bundle).
 * Analysis happens here on the server; the request body is not stored.
 */
export async function POST(req: Request): Promise<Response> {
    const contentType = req.headers.get("content-type") ?? "";
    let raw: Uint8Array;
    let trustedAuthservIds: string[] | undefined;
    let format: "json" | "stix" = "json";

    try {
        if (contentType.includes("application/json")) {
            const body = await req.json();
            if (typeof body.email !== "string") return err(400, "Provide the email as a string in the \"email\" field.");
            raw = body.encoding === "base64" ? toBytes(atob(body.email)) : new TextEncoder().encode(body.email);
            if (Array.isArray(body.trustedAuthservIds)) trustedAuthservIds = body.trustedAuthservIds.map(String);
            if (body.format === "stix") format = "stix";
        } else {
            const buf = new Uint8Array(await req.arrayBuffer());
            if (buf.byteLength === 0) return err(400, "Empty request body.");
            raw = buf;
            const fmt = new URL(req.url).searchParams.get("format");
            if (fmt === "stix") format = "stix";
        }
    } catch {
        return err(400, "Could not read the request body.");
    }

    if (raw.byteLength > MAX_BYTES) return err(413, "Email exceeds the 15 MB limit.");

    try {
        const result = await analyzeEmail(raw, { trustedAuthservIds });
        const payload = format === "stix" ? toStix(result) : result;
        return new Response(JSON.stringify(payload), {
            status: 200,
            headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
        });
    } catch (error) {
        return err(422, error instanceof Error ? error.message : "Could not analyze the message.");
    }
}

export async function GET(): Promise<Response> {
    return Response.json({
        service: "mxlens",
        endpoint: "POST /api/v1/analyze",
        accepts: ["text/plain", "message/rfc822", "application/json"],
        json_body: { email: "<raw email>", encoding: "base64 (optional)", trustedAuthservIds: "string[] (optional)", format: "json | stix (optional)" },
    });
}

function toBytes(binary: string): Uint8Array {
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
}

function err(status: number, message: string): Response {
    return new Response(JSON.stringify({ error: message }), { status, headers: { "content-type": "application/json" } });
}
