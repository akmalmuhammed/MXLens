import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const session = await auth();

        // 1. Parse Metadata
        const body = await req.json();
        const { verdict, score, hasAttachments, processingTimeMs } = body;

        // 2. Authenticated User Tracking
        if (session?.user?.id) {
            // Transaction: Increment count & Log usage
            await db.$transaction([
                db.user.update({
                    where: { id: session.user.id },
                    data: {
                        usageCount: { increment: 1 },
                        lastUsageReset: new Date(), // Updates activity timestamp
                    },
                }),
                db.usageLog.create({
                    data: {
                        userId: session.user.id,
                        verdict: verdict || "unknown",
                        score: score || 0,
                        hasAttachments: !!hasAttachments,
                        hasBody: false, // Privacy mode default
                        processingTimeMs: processingTimeMs || 0,
                    },
                }),
            ]);

            return NextResponse.json({ success: true, tracking: "persisted" });
        }

        // 3. Guest Tracking (Stateless)
        // We don't store guest logs in DB to save space/cost. 
        // Usage limits are enforced via Client-Side Cookie/LocalStorage.
        // However, we might want to log anonymized telemetry here later.
        return NextResponse.json({ success: true, tracking: "ephemeral" });

    } catch (error) {
        console.error("Usage Tracking Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
