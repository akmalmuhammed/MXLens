import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth();

    return NextResponse.json({
        timestamp: new Date().toISOString(),
        hasSession: !!session,
        user: session?.user ? {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            isPlatformAdmin: session.user.isPlatformAdmin,
            adminRole: session.user.adminRole,
            orgId: session.user.orgId,
        } : null,
    }, { status: 200 });
}
