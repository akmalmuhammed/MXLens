import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { db } from "@/lib/db";

// POST: Add existing user to organization
export async function POST(request: NextRequest) {
    try {
        await requireAdmin();

        const body = await request.json();
        const { orgId, userId, role } = body;

        // Validate required fields
        if (!orgId || !userId || !role) {
            return NextResponse.json(
                { error: "Missing required fields: orgId, userId, role" },
                { status: 400 }
            );
        }

        // Validate role
        const validRoles = ["OWNER", "ADMIN", "ANALYST", "VIEWER"];
        if (!validRoles.includes(role)) {
            return NextResponse.json(
                { error: "Invalid role. Must be OWNER, ADMIN, ANALYST, or VIEWER" },
                { status: 400 }
            );
        }

        // Check if organization exists
        const org = await db.organization.findUnique({ where: { id: orgId } });
        if (!org) {
            return NextResponse.json({ error: "Organization not found" }, { status: 404 });
        }

        // Check if user exists
        const user = await db.user.findUnique({ where: { id: userId } });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if membership already exists
        const existingMembership = await db.membership.findFirst({
            where: { userId, orgId },
        });
        if (existingMembership) {
            return NextResponse.json(
                { error: "User is already a member of this organization" },
                { status: 400 }
            );
        }

        // Create membership
        const membership = await db.membership.create({
            data: {
                userId,
                orgId,
                role: role as "OWNER" | "ADMIN" | "ANALYST" | "VIEWER",
            },
        });

        return NextResponse.json({
            id: membership.id,
            userId: membership.userId,
            orgId: membership.orgId,
            role: membership.role,
            message: "User added to organization successfully",
        });
    } catch (error) {
        console.error("Add member error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to add member" },
            { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
        );
    }
}
