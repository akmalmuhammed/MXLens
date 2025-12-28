import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    // List all cookies
    const cookies = request.cookies.getAll();

    return NextResponse.json({
        message: "Debug cookies",
        cookies: cookies.map(c => ({ name: c.name, value: c.value.substring(0, 20) + "..." })),
        hasAdminSession: !!request.cookies.get("admin.session_token"),
        hasAdminSessionToken: !!request.cookies.get("admin_session_token"),
        hasSessionToken: !!request.cookies.get("session_token"),
    });
}
