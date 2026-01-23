import { NextRequest, NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        await requireAdminApi();

        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const search = searchParams.get("search") || "";
        const plan = searchParams.get("plan");

        const where = {
            ...(search && {
                OR: [
                    { name: { contains: search, mode: "insensitive" as const } },
                    { slug: { contains: search, mode: "insensitive" as const } },
                ],
            }),
            ...(plan && { planTier: plan as "FREE" | "PRO" | "ENTERPRISE" }),
        };

        const [organizations, total] = await Promise.all([
            db.organization.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    _count: {
                        select: {
                            members: true,
                            analysisLogs: true,
                        },
                    },
                },
            }),
            db.organization.count({ where }),
        ]);

        const orgsWithStats = organizations.map((org) => ({
            id: org.id,
            name: org.name,
            slug: org.slug,
            plan: org.planTier,
            status: org.subscriptionStatus === "past_due" ? "suspended" : "active",
            members: org._count.members,
            analyses: org._count.analysisLogs,
            stripeCustomerId: org.stripeCustomerId,
            createdAt: org.createdAt.toISOString().split("T")[0],
        }));

        return NextResponse.json({
            organizations: orgsWithStats,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Admin organizations error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch organizations" },
            { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
        );
    }
}

// Generate a random password
function generatePassword(length = 12): string {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

export async function POST(request: NextRequest) {
    try {
        await requireAdminApi();

        const body = await request.json();
        const { name, slug, planTier, ownerEmail, ownerName } = body;

        // Validate required fields
        if (!name || !slug || !ownerEmail || !ownerName) {
            return NextResponse.json(
                { error: "Missing required fields: name, slug, ownerEmail, ownerName" },
                { status: 400 }
            );
        }

        // Check if slug is unique
        const existingOrg = await db.organization.findUnique({ where: { slug } });
        if (existingOrg) {
            return NextResponse.json(
                { error: "Organization slug already exists" },
                { status: 400 }
            );
        }

        // Check if user email already exists
        const existingUser = await db.user.findUnique({ where: { email: ownerEmail } });
        if (existingUser) {
            return NextResponse.json(
                { error: "User with this email already exists" },
                { status: 400 }
            );
        }

        // Generate password and hash it
        const tempPassword = generatePassword();
        const bcrypt = await import("bcryptjs");
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Create user and organization in a transaction
        const result = await db.$transaction(async (tx) => {
            // Create the owner user
            const user = await tx.user.create({
                data: {
                    name: ownerName,
                    email: ownerEmail,
                    hashedPassword,
                    emailVerified: new Date(), // Auto-verify admin-created users
                },
            });

            // Create the organization
            const org = await tx.organization.create({
                data: {
                    name,
                    slug,
                    planTier: planTier || "FREE",
                },
            });

            // Create membership (OWNER role)
            await tx.membership.create({
                data: {
                    userId: user.id,
                    orgId: org.id,
                    role: "OWNER",
                },
            });

            return { org, user, tempPassword };
        });

        return NextResponse.json({
            id: result.org.id,
            name: result.org.name,
            slug: result.org.slug,
            owner: {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
                tempPassword: result.tempPassword, // Return for admin to share with user
            },
            message: "Organization created successfully",
        });
    } catch (error) {
        console.error("Create organization error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to create organization" },
            { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
        );
    }
}
