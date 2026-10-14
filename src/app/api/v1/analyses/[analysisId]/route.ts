import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/agent-api/auth";
import { agentErrorResponse } from "@/lib/agent-api/errors";
import { getAnalysisForAgent } from "@/lib/agent-api/queries";

export const runtime = "nodejs";

export async function GET(
    req: NextRequest,
    props: { params: Promise<{ analysisId: string }> }
) {
    try {
        const agent = await authenticateApiRequest(req, "analyze:read");
        const { analysisId } = await props.params;
        return NextResponse.json(await getAnalysisForAgent(agent, analysisId));
    } catch (error) {
        return agentErrorResponse(error);
    }
}
