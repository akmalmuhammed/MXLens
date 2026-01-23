
import { verifyAdminSession } from "@/lib/admin/auth";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await verifyAdminSession();

    if (!session) {
        return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user: session });
}
