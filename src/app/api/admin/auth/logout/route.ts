
import { destroyAdminSession } from "@/lib/admin/auth";
import { NextResponse } from "next/server";

export async function POST() {
    await destroyAdminSession();
    return NextResponse.json({ success: true });
}
