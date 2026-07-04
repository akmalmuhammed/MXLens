import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest, maybeEnforceAgentRateLimit } from "@/lib/agent-api/auth";
import { agentErrorResponse } from "@/lib/agent-api/errors";
import { parseAnalyzeRequest, resolvePendingInput } from "@/lib/agent-api/ingestion";
import { analyzeResolvedEmail } from "@/lib/agent-api/analysis-service";
import { attachPersistence, persistAgentAnalysis } from "@/lib/agent-api/persistence";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const agent = await authenticateApiRequest(req, "analyze:write");
        await maybeEnforceAgentRateLimit(agent, "single");

        const { input, options } = await parseAnalyzeRequest(req);
        const resolved = await resolvePendingInput(input);
        const analysis = await analyzeResolvedEmail(resolved, options);
        const persisted = await persistAgentAnalysis({ agent, input: resolved, options, result: analysis });

        return NextResponse.json(attachPersistence(analysis, persisted));
    } catch (error) {
        return agentErrorResponse(error);
    }
}
