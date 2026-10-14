/* eslint-disable @typescript-eslint/no-explicit-any */
import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createShellIncident } from "@/lib/incidents";
import { getDecryptedConfig } from "@/lib/integrations/config";

function safeEqual(a: string, b: string): boolean {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * Every ingest call must prove it knows the integration's secret, either as a shared
 * secret header or as an HMAC-SHA256 signature of the raw body (the scheme Jira and
 * most webhook senders support via X-Hub-Signature). Integrations without a secret
 * are rejected rather than trusted.
 */
function isAuthorized(req: NextRequest, rawBody: string, secret: unknown): boolean {
    if (typeof secret !== "string" || secret.length < 16) return false;

    const sharedSecret = req.headers.get("x-webhook-secret");
    if (sharedSecret && safeEqual(sharedSecret, secret)) return true;

    const signature = req.headers.get("x-hub-signature-256") ?? req.headers.get("x-hub-signature");
    if (signature) {
        const expected = "sha256=" + createHmac("sha256", secret).update(rawBody).digest("hex");
        if (safeEqual(signature, expected)) return true;
    }
    return false;
}

export async function POST(
    req: NextRequest,
    props: any
) {
    try {
        const { integrationId } = await props.params;

        // 1. Fetch Integration
        const integration = await db.integration.findUnique({
            where: { id: integrationId },
            select: { id: true, orgId: true, type: true, isActive: true }
        });

        if (!integration || !integration.isActive) {
            return NextResponse.json({ error: "Invalid or inactive integration" }, { status: 404 });
        }

        // 2. Authenticate the sender (all integration types; fail closed)
        const rawBody = await req.text();
        const config = await getDecryptedConfig(integrationId);
        if (!isAuthorized(req, rawBody, config?.secret)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 3. Parse Body
        let body: any;
        try {
            body = JSON.parse(rawBody);
        } catch {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }

        // 4. Map Payload based on Type
        let incidentData: any = {};

        if (integration.type === "JIRA") {
            // Sample Jira Webhook Payload Structure (simplified)
            // issue: { key: "INC-123", fields: { summary: "..." } }
            const issue = body.issue;
            if (!issue) return NextResponse.json({ error: "Invalid Jira payload" }, { status: 400 });

            incidentData = {
                source: "JIRA",
                externalId: issue.key,
                subject: issue.fields?.summary || "Jira Ticket",
                sender: issue.fields?.reporter?.emailAddress || "Jira User",
                body: issue.fields?.description
            };
        } else if (integration.type === "GENERIC_WEBHOOK") {
            // Expects: { subject, sender, externalId, body }
            incidentData = {
                source: "GENERIC_WEBHOOK",
                externalId: body.externalId || `WEBHOOK-${Date.now()}`,
                subject: body.subject || "Webhook Alert",
                sender: body.sender || "System",
                body: body.body
            };
        } else {
            return NextResponse.json({ error: "Integration type not supported for ingestion yet" }, { status: 400 });
        }

        // 5. Create Incident
        const log = await createShellIncident(integration.orgId, incidentData) as any;

        return NextResponse.json({ success: true, incidentId: log.incidentId, id: log.id });

    } catch (error) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
