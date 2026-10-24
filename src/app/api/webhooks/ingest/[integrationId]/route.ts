/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createShellIncident } from "@/lib/incidents";
import { getDecryptedConfig } from "@/lib/integrations/server-config";
import { createHmac, timingSafeEqual } from "node:crypto";
import { webhookRateLimiter } from "@/lib/rate-limit";

export async function POST(
    req: NextRequest,
    props: any
) {
    try {
        const params = props.params;
        const { integrationId } = params;

        const rate = await webhookRateLimiter.limit(`integration:${integrationId}`);
        if (!rate.success) {
            return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
        }

        // 1. Fetch Integration
        const integration = await db.integration.findUnique({
            where: { id: integrationId },
            select: { id: true, orgId: true, type: true, isActive: true }
        });

        if (!integration || !integration.isActive) {
            return NextResponse.json({ error: "Invalid or inactive integration" }, { status: 404 });
        }

        const config = await getDecryptedConfig(integrationId);
        const secret = config?.secret;
        const timestampHeader = req.headers.get("x-webhook-timestamp") || "";
        const signatureHeader = req.headers.get("x-webhook-signature") || "";
        const timestamp = Number(timestampHeader);
        if (!secret || !Number.isSafeInteger(timestamp) || Math.abs(Date.now() - timestamp) > 5 * 60 * 1000) {
            return NextResponse.json({ error: "Invalid webhook credentials" }, { status: 401 });
        }

        const rawBody = await req.text();
        if (Buffer.byteLength(rawBody, "utf8") > 64 * 1024) {
            return NextResponse.json({ error: "Payload too large" }, { status: 413 });
        }
        const expectedSignature = createHmac("sha256", secret).update(`${timestampHeader}.${rawBody}`).digest();
        const providedSignature = Buffer.from(signatureHeader.replace(/^sha256=/, ""), "hex");
        if (providedSignature.length !== expectedSignature.length || !timingSafeEqual(providedSignature, expectedSignature)) {
            return NextResponse.json({ error: "Invalid webhook credentials" }, { status: 401 });
        }

        let body: any;
        try {
            body = JSON.parse(rawBody);
        } catch {
            return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
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
                externalId: String(issue.key || "").slice(0, 200),
                subject: String(issue.fields?.summary || "Jira Ticket").slice(0, 500),
                sender: String(issue.fields?.reporter?.emailAddress || "Jira User").slice(0, 254),
                body: String(issue.fields?.description || "").slice(0, 4000)
            };
        } else if (integration.type === "GENERIC_WEBHOOK") {
            // Expects: { subject, sender, externalId, body }
            incidentData = {
                source: "GENERIC_WEBHOOK",
                externalId: String(body.externalId || `WEBHOOK-${Date.now()}`).slice(0, 200),
                subject: String(body.subject || "Webhook Alert").slice(0, 500),
                sender: String(body.sender || "System").slice(0, 254),
                body: String(body.body || "").slice(0, 4000)
            };
        } else {
            return NextResponse.json({ error: "Integration type not supported for ingestion yet" }, { status: 400 });
        }

        if (incidentData.externalId) {
            const existing = await db.analysisLog.findFirst({
                where: {
                    orgId: integration.orgId,
                    source: incidentData.source,
                    externalId: incidentData.externalId
                },
                select: { id: true, incidentId: true }
            });
            if (existing) {
                return NextResponse.json({ success: true, ...existing, duplicate: true });
            }
        }

        // 5. Create Incident
        const log = await createShellIncident(integration.orgId, incidentData) as any;

        return NextResponse.json({ success: true, incidentId: log.incidentId, id: log.id });

    } catch (error) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
