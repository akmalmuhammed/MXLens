/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createShellIncident } from "@/lib/incidents";
import { getDecryptedConfig } from "@/actions/integrations";

export async function POST(
    req: NextRequest,
    props: any
) {
    try {
        const params = props.params;
        const { integrationId } = params;

        // 1. Fetch Integration
        const integration = await db.integration.findUnique({
            where: { id: integrationId },
            select: { id: true, orgId: true, type: true, isActive: true }
        });

        if (!integration || !integration.isActive) {
            return NextResponse.json({ error: "Invalid or inactive integration" }, { status: 404 });
        }

        // 2. Validate Secret (if GENERIC_WEBHOOK)
        // For JIRA/Others, we might trust the ID + header based, but good to check signature if possible.
        // For this MVP, we rely on the obscure 'integrationId' in URL URL + checking 'x-secret' if configured.

        const config = await getDecryptedConfig(integrationId);
        if (integration.type === "GENERIC_WEBHOOK" && config?.secret) {
            const providedSecret = req.headers.get("x-webhook-secret");
            if (providedSecret !== config.secret) {
                return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
            }
        }

        // 3. Parse Body
        const body = await req.json();

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
