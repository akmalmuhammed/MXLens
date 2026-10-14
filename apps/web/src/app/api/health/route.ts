import { ENGINE_VERSION } from "@mxlens/engine";

export const runtime = "nodejs";

export function GET(): Response {
    return Response.json({ status: "ok", engine: ENGINE_VERSION });
}
