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
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
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
                status: user.emailVerified ? "active" : "pending",
                createdAt: user.createdAt.toISOString(),
                updatedAt: user.updatedAt.toISOString(),
                lastActive: null,
                organizations: user.memberships.map((m) => ({
                    id: m.organization.id,
                    name: m.organization.name,
                    slug: m.organization.slug,
                    role: m.role,
                    planTier: m.organization.planTier,
                    subscriptionStatus: m.organization.subscriptionStatus,
                    joinedAt: m.joinedAt.toISOString(),
                })),
                authProviders: [{ provider: "clerk" }],
                activeSessions: 0,
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
        await requireAdminApi({ roles: ["SUPER_ADMIN"] });
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

        // SYNC LOGIC: If promoting to platform admin, ensure AdminUser exists
        if (updateData.isPlatformAdmin === true && updatedUser.email) {
            try {
                const adminEmail = updatedUser.email;
                const existingAdmin = await db.adminUser.findUnique({
                    where: { email: adminEmail }
                });

                if (existingAdmin) {
                    // Update role if changed
                    if (updateData.adminRole) {
                        await db.adminUser.update({
                            where: { id: existingAdmin.id },
                            data: { role: updateData.adminRole as any } // Cast to fit enum if needed
                        });
                    }
                } else {
                    console.log(`Platform admin flag set for ${adminEmail}. Clerk handles user authentication.`);
                }
            } catch (syncError) {
                console.error("Failed to sync AdminUser:", syncError);
                // Don't fail the request, just log it
            }
        } else if (updateData.isPlatformAdmin === false) {
            // If demoting, should we delete AdminUser?
            // Maybe safer to keep but disable? Schema doesn't have disable.
            // Let's delete to enforce no access.
            if (updatedUser.email) {
                await db.adminUser.deleteMany({
                    where: { email: updatedUser.email }
                });
            }
        }

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

// DELETE - Suspend/deactivate user placeholder.
export async function DELETE(request: NextRequest, { params }: Props) {
    try {
        await requireAdminApi({ roles: ["SUPER_ADMIN"] });
        const { id } = await params;

        const user = await db.user.findUnique({ where: { id } });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            message: "User found. Clerk session revocation is managed by Clerk.",
        });
    } catch (error) {
        console.error("Admin user delete error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to delete user" },
            { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
        );
    }
}
