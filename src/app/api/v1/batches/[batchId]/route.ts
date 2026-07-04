import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/agent-api/auth";
import { getBatchForAgent } from "@/lib/agent-api/batch-processor";
import { agentErrorResponse } from "@/lib/agent-api/errors";

export const runtime = "nodejs";

export async function GET(
    req: NextRequest,
    props: { params: Promise<{ batchId: string }> }
) {
    try {
        const agent = await authenticateApiRequest(req, "analyze:read");
        const { batchId } = await props.params;
        const batch = await getBatchForAgent(agent, batchId);

        return NextResponse.json(batch);
    } catch (error) {
        return agentErrorResponse(error);
    }
}
