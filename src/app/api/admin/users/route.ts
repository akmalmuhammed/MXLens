import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { db } from "@/lib/db";

// Generate a random password
function generatePassword(length = 12): string {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

export async function GET(request: NextRequest) {
    try {
        await requireAdmin();

        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const search = searchParams.get("search") || "";

        const where = search
            ? {
                OR: [
                    { name: { contains: search, mode: "insensitive" as const } },
                    { email: { contains: search, mode: "insensitive" as const } },
                ],
            }
            : {};

        const [users, total] = await Promise.all([
            db.user.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    isPlatformAdmin: true,
                    createdAt: true,
                    memberships: {
                        include: {
                            organization: {
                                select: {
                                    id: true,
                                    name: true,
                                    slug: true,
                                },
                            },
                        },
                    },
                },
            }),
            db.user.count({ where }),
        ]);

        const usersWithStats = users.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            isPlatformAdmin: user.isPlatformAdmin,
            organizations: user.memberships.map((m) => ({
                id: m.organization.id,
                name: m.organization.name,
                role: m.role,
            })),
            createdAt: user.createdAt.toISOString().split("T")[0],
        }));

        return NextResponse.json({
            users: usersWithStats,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Admin users error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch users" },
            { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        await requireAdmin();

        const body = await request.json();
        const { orgId, name, email, role } = body;

        // Validate required fields
        if (!orgId || !name || !email || !role) {
            return NextResponse.json(
                { error: "Missing required fields: orgId, name, email, role" },
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
            return NextResponse.json(
                { error: "Organization not found" },
                { status: 404 }
            );
        }

        // Check if user email already exists
        const existingUser = await db.user.findUnique({ where: { email } });
        if (existingUser) {
            // User exists - check if already member of this org
            const existingMembership = await db.membership.findFirst({
                where: { userId: existingUser.id, orgId },
            });
            if (existingMembership) {
                return NextResponse.json(
                    { error: "User is already a member of this organization" },
                    { status: 400 }
                );
            }
            // Add existing user to org
            await db.membership.create({
                data: {
                    userId: existingUser.id,
                    orgId,
                    role: role as "OWNER" | "ADMIN" | "ANALYST" | "VIEWER",
                },
            });
            return NextResponse.json({
                id: existingUser.id,
                email: existingUser.email,
                name: existingUser.name,
                message: "Existing user added to organization",
            });
        }

        // Generate password and hash it
        const tempPassword = generatePassword();
        const bcrypt = await import("bcryptjs");
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Create user and membership in a transaction
        const result = await db.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    hashedPassword,
                    emailVerified: new Date(), // Auto-verify admin-created users
                },
            });

            await tx.membership.create({
                data: {
                    userId: user.id,
                    orgId,
                    role: role as "OWNER" | "ADMIN" | "ANALYST" | "VIEWER",
                },
            });

            return { user, tempPassword };
        });

        return NextResponse.json({
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            tempPassword: result.tempPassword,
            message: "User created successfully",
        });
    } catch (error) {
        console.error("Create user error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to create user" },
            { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
        );
    }
}
