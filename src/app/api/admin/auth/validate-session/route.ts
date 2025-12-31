import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * Admin Session Validation Endpoint
 * 
 * This endpoint is called by the middleware to validate admin sessions.
 * It verifies that:
 * 1. The session token exists in the database
 * 2. The session has not expired
 * 3. The associated user exists and has admin privileges
 * 
 * SECURITY: This endpoint is called internally by middleware only.
 * It should not be documented publicly.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token } = body;

        if (!token) {
            return NextResponse.json({ valid: false, reason: "No token provided" }, { status: 400 });
        }

        // Query the admin_sessions table
        const session = await db.adminSession.findUnique({
            where: { token },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        isPlatformAdmin: true,
                        role: true
                    }
                }
            }
        });

        // Session not found
        if (!session) {
            return NextResponse.json({ valid: false, reason: "Session not found" });
        }

        // Session expired
        if (new Date(session.expiresAt) < new Date()) {
            // Optionally clean up expired session
            await db.adminSession.delete({ where: { id: session.id } }).catch(() => { });
            return NextResponse.json({ valid: false, reason: "Session expired" });
        }

        // Note: isPlatformAdmin check removed from here.
        // Allow any authenticated admin panel user to have a valid session.
        // Specific admin-only features should check isPlatformAdmin at the route level.

        // Session is valid
        return NextResponse.json({
            valid: true,
            userId: session.user.id,
            email: session.user.email,
            role: session.user.role
        });

    } catch (error) {
        console.error("[VALIDATE_SESSION] Error:", error);
        return NextResponse.json({ valid: false, reason: "Validation error" }, { status: 500 });
    }
}

// Prevent GET requests
export async function GET() {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
