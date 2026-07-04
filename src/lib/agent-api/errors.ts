import { NextResponse } from "next/server";

export class AgentApiError extends Error {
    status: number;
    code: string;
    details?: unknown;

    constructor(status: number, code: string, message: string, details?: unknown) {
        super(message);
        this.name = "AgentApiError";
        this.status = status;
        this.code = code;
        this.details = details;
    }
}

export function toAgentError(error: unknown): AgentApiError {
    if (error instanceof AgentApiError) return error;

    if (error instanceof Error) {
        return new AgentApiError(500, "internal_error", error.message);
    }

    return new AgentApiError(500, "internal_error", "Unexpected server error");
}

export function agentErrorResponse(error: unknown) {
    const apiError = toAgentError(error);

    return NextResponse.json(
        {
            error: {
                code: apiError.code,
                message: apiError.message,
                details: apiError.details
            }
        },
        { status: apiError.status }
    );
}
