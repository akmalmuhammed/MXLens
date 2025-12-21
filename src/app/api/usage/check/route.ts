import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await auth();

    // 1. Authenticated User Check
    if (session?.user?.id) {
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: {
                usageCount: true,
                messageLimit: true,
                subscriptionStatus: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Enterprise / Pro logic can go here (unlimited?)
        const isPro = user.subscriptionStatus === "pro" || user.subscriptionStatus === "enterprise";
        const remaining = Math.max(0, user.messageLimit - user.usageCount);

        return NextResponse.json({
            allowed: isPro || remaining > 0,
            remaining: isPro ? 999999 : remaining,
            limit: user.messageLimit,
            isPro,
        });
    }

    // 2. Guest Check (Simplified - relies on client cookie/localStorage mostly, but we can do Basic IP check later)
    // For now, API mostly serves authenticated users. Guests are handled client-side until we add IP tracking.
    return NextResponse.json({
        allowed: true,
        remaining: 3,
        limit: 3,
        isGuest: true
    });
}
