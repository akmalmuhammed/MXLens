/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getDecryptedConfig } from "@/lib/integrations/server-config";

/**
 * GET /api/bridge/content/[incidentId]
 * 
 * Proxies external attachment content (Microsoft 365, Jira) to the browser.
 * NEVER stores the content on the server disk.
 */
export async function GET(
    req: NextRequest,
    props: any
) {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.orgId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { incidentId } = props.params;

    try {
        // 1. Fetch Incident & Integration Info
        // We need to know WHICH integration this incident is from to get the right credentials.
        // Currently, AnalysisLog has 'source', but we might need to link it to a specific Integration ID if multiples exist.
        // For MVP: We look for the first ACTIVE integration of the MATCHING TYPE for this Org.

        const incident = await db.analysisLog.findUnique({
            where: { id: incidentId, orgId: session.user.orgId },
            select: { source: true, externalId: true, triageStatus: true }
        });

        if (!incident) return new NextResponse("Incident not found", { status: 404 });
        if (!incident.externalId) return new NextResponse("No external ID linked", { status: 400 });

        // Map Source -> Integration Type
        let integrationType: "JIRA" | "MICROSOFT_TEAMS" | "GENERIC_WEBHOOK" | null = null;
        if (incident.source === "JIRA") integrationType = "JIRA";
        if (incident.source === "GRAPH_API") integrationType = "MICROSOFT_TEAMS";

        if (!integrationType) return new NextResponse("Source not supported for bridging", { status: 400 });

        // Find the Integration Config
        const integration = await db.integration.findFirst({
            where: { orgId: session.user.orgId, type: integrationType, isActive: true }
        });

        if (!integration) return new NextResponse("Integration configuration not found", { status: 404 });

        // 2. Decrypt Credentials
        const config = await getDecryptedConfig(integration.id);
        if (!config) return new NextResponse("Invalid configuration", { status: 500 });

        // 3. Proxy Request based on Type
        let externalResponse: Response | null = null;

        if (integrationType === "MICROSOFT_TEAMS") {
            // Graph API Logic
            // Fetch raw MIME content of the message
            // GET /users/{id}/messages/{id}/$value
            const accessToken = config.accessToken; // Assumed valid for MVP/Service Principal
            const messageId = incident.externalId;
            const userEmail = config.targetMailbox; // Or sender if we track it

            if (!accessToken) return new NextResponse("Missing Graph Token", { status: 401 });

            // Note: In real world, we might need a User ID, not just email.
            // For MVP: Assuming externalId is the full resource path or we have a known mailbox.
            const url = `https://graph.microsoft.com/v1.0/users/${userEmail}/messages/${messageId}/$value`;

            externalResponse = await fetch(url, {
                headers: { "Authorization": `Bearer ${accessToken}` }
            });

        } else if (integrationType === "JIRA") {
            // Jira Attachment Logic
            // We need to find the attachment ID from the Issue? Or is externalId the attachment ID?
            // Usually complex: Issue -> Get Attachments -> Find .eml -> Download.
            // For MVP: Let's assume externalId points to an attachment URL if source=JIRA (or we simplify).
            // Skipping Jira Bridge for now as Graph API is the priority for EML.
            return new NextResponse("Jira Bridge not fully implemented yet", { status: 501 });
        }

        if (!externalResponse || !externalResponse.ok || !externalResponse.body) {
            console.error("Bridge Fetch Failed:", externalResponse?.statusText);
            return new NextResponse("Failed to fetch content from provider", { status: 502 });
        }

        // 4. Stream Response to Client
        // We propagate Content-Type but ensure security headers
        return new NextResponse(externalResponse.body as any, {
            headers: {
                "Content-Type": "message/rfc822",
                "Content-Disposition": `attachment; filename="incident-${incidentId}.eml"`,
                "Cache-Control": "no-store"
            }
        });

    } catch (error) {
        console.error("Bridge Error:", error);
        return new NextResponse("Internal Bridge Error", { status: 500 });
    }
}
