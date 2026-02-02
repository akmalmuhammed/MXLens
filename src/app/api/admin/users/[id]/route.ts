import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { db } from "@/lib/db";

interface Props {
    params: Promise<{ id: string }>;
}

// GET - Fetch single user with full details
export async function GET(request: NextRequest, { params }: Props) {
    try {
        await requireAdminApi();
        const { id } = await params;

        const user = await db.user.findUnique({
            where: { id },
            include: {
                memberships: {
                    include: {
                        organization: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                planTier: true,
                                subscriptionStatus: true,
                            },
                        },
                    },
                },
                accounts: {
                    select: {
                        provider: true,
                    },
                },
                sessions: {
                    select: {
                        id: true,
                        expires: true,
                    },
                    orderBy: { expires: "desc" },
                    take: 5,
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Calculate status based on sessions
        const now = new Date();
        const activeSessions = user.sessions.filter((s) => s.expires > now);
        const lastActive = user.sessions[0]?.expires;

        let status = "inactive";
        if (activeSessions.length > 0) {
            status = "active";
        }

        return NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                emailVerified: user.emailVerified?.toISOString() || null,
                image: user.image,
                isPlatformAdmin: user.isPlatformAdmin,
                adminRole: user.adminRole,
                status,
                createdAt: user.createdAt.toISOString(),
                updatedAt: user.updatedAt.toISOString(),
                lastActive: lastActive?.toISOString() || null,
                organizations: user.memberships.map((m) => ({
                    id: m.organization.id,
                    name: m.organization.name,
                    slug: m.organization.slug,
                    role: m.role,
                    planTier: m.organization.planTier,
                    subscriptionStatus: m.organization.subscriptionStatus,
                    joinedAt: m.joinedAt.toISOString(),
                })),
                authProviders: user.accounts.map((a) => ({
                    provider: a.provider,
                })),
                activeSessions: activeSessions.length,
            },
        });
    } catch (error) {
        console.error("Admin user detail error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch user" },
            { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
        );
    }
}

// PATCH - Update user details
export async function PATCH(request: NextRequest, { params }: Props) {
    try {
        await requireAdminApi();
        const { id } = await params;
        const body = await request.json();

        const {
            name,
            email,
            isPlatformAdmin,
            adminRole,
            emailVerified,
        } = body;

        // Check user exists
        const existingUser = await db.user.findUnique({ where: { id } });
        if (!existingUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Build update data
        const updateData: Record<string, unknown> = {};

        if (name !== undefined) updateData.name = name;
        if (email !== undefined) {
            // Check email uniqueness
            const emailExists = await db.user.findFirst({
                where: { email, id: { not: id } },
            });
            if (emailExists) {
                return NextResponse.json({ error: "Email already in use" }, { status: 400 });
            }
            updateData.email = email;
        }
        if (isPlatformAdmin !== undefined) updateData.isPlatformAdmin = isPlatformAdmin;
        if (adminRole !== undefined) updateData.adminRole = adminRole;
        if (emailVerified !== undefined) {
            updateData.emailVerified = emailVerified ? new Date() : null;
        }

        const updatedUser = await db.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                isPlatformAdmin: true,
                adminRole: true,
                emailVerified: true,
            },
        });

        return NextResponse.json({
            message: "User updated successfully",
            user: updatedUser,
        });
    } catch (error) {
        console.error("Admin user update error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to update user" },
            { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
        );
    }
}

// DELETE - Suspend/deactivate user (soft delete - invalidates sessions)
export async function DELETE(request: NextRequest, { params }: Props) {
    try {
        await requireAdminApi();
        const { id } = await params;

        const user = await db.user.findUnique({ where: { id } });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Clear all sessions (effectively logs them out)
        await db.session.deleteMany({ where: { userId: id } });

        // Can optionally add a 'suspended' flag if you have one
        // For now, clearing sessions is the safest approach

        return NextResponse.json({
            message: "User sessions invalidated. User must re-authenticate.",
        });
    } catch (error) {
        console.error("Admin user delete error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to delete user" },
            { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
        );
    }
}
