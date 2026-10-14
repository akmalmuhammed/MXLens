import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { db } from "@/lib/db";

interface Props {
    params: Promise<{ id: string }>;
}

// GET - Fetch single organization with full details
export async function GET(request: NextRequest, { params }: Props) {
    try {
        await requireAdminApi();
        const { id } = await params;

        const organization = await db.organization.findUnique({
            where: { id },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        analysisLogs: true,
                        apiKeys: true,
                    },
                },
            },
        });

        if (!organization) {
            return NextResponse.json({ error: "Organization not found" }, { status: 404 });
        }

        return NextResponse.json({
            organization: {
                id: organization.id,
                name: organization.name,
                slug: organization.slug,
                planTier: organization.planTier,
                stripeCustomerId: organization.stripeCustomerId,
                subscriptionId: organization.subscriptionId,
                subscriptionStatus: organization.subscriptionStatus,
                subscriptionCurrentPeriodEnd: null, // Not in schema yet
                monthlyAnalysisLimit: null, // Not in schema yet
                analysisUsedThisMonth: null, // Not in schema yet
                createdAt: organization.createdAt.toISOString(),
                updatedAt: organization.updatedAt.toISOString(),
                members: organization.members.map((m) => ({
                    id: m.id,
                    userId: m.user.id,
                    name: m.user.name,
                    email: m.user.email,
                    image: m.user.image,
                    role: m.role,
                    joinedAt: m.joinedAt.toISOString(),
                })),
                stats: {
                    analyses: organization._count.analysisLogs,
                    apiKeys: organization._count.apiKeys,
                    members: organization.members.length,
                },
            },
        });
    } catch (error) {
        console.error("Admin organization detail error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch organization" },
            { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
        );
    }
}

// PATCH - Update organization details
export async function PATCH(request: NextRequest, { params }: Props) {
    try {
        await requireAdminApi();
        const { id } = await params;
        const body = await request.json();

        const {
            name,
            slug,
            planTier,
            subscriptionStatus,
            monthlyAnalysisLimit,
            analysisUsedThisMonth,
        } = body;

        // Check org exists
        const existingOrg = await db.organization.findUnique({ where: { id } });
        if (!existingOrg) {
            return NextResponse.json({ error: "Organization not found" }, { status: 404 });
        }

        // Build update data
        const updateData: Record<string, unknown> = {};

        if (name !== undefined) updateData.name = name;
        if (slug !== undefined) {
            // Check slug uniqueness
            const slugExists = await db.organization.findFirst({
                where: { slug, id: { not: id } },
            });
            if (slugExists) {
                return NextResponse.json({ error: "Slug already in use" }, { status: 400 });
            }
            updateData.slug = slug;
        }
        if (planTier !== undefined) {
            const validPlans = ["FREE", "PRO", "ENTERPRISE"];
            if (!validPlans.includes(planTier)) {
                return NextResponse.json({ error: "Invalid plan tier" }, { status: 400 });
            }
            updateData.planTier = planTier;

            // Set default limits based on plan
            if (planTier === "FREE") {
                updateData.monthlyAnalysisLimit = 10;
            } else if (planTier === "PRO") {
                updateData.monthlyAnalysisLimit = 100;
            } else if (planTier === "ENTERPRISE") {
                updateData.monthlyAnalysisLimit = 10000;
            }
        }
        if (subscriptionStatus !== undefined) {
            updateData.subscriptionStatus = subscriptionStatus;
        }
        if (monthlyAnalysisLimit !== undefined) {
            updateData.monthlyAnalysisLimit = parseInt(monthlyAnalysisLimit);
        }
        if (analysisUsedThisMonth !== undefined) {
            updateData.analysisUsedThisMonth = parseInt(analysisUsedThisMonth);
        }

        const updatedOrg = await db.organization.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                slug: true,
                planTier: true,
                subscriptionStatus: true,
            },
        });

        return NextResponse.json({
            message: "Organization updated successfully",
            organization: updatedOrg,
        });
    } catch (error) {
        console.error("Admin organization update error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to update organization" },
            { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
        );
    }
}

// DELETE - Archive/delete organization
export async function DELETE(request: NextRequest, { params }: Props) {
    try {
        await requireAdminApi();
        const { id } = await params;

        const org = await db.organization.findUnique({ where: { id } });
        if (!org) {
            return NextResponse.json({ error: "Organization not found" }, { status: 404 });
        }

        // Soft delete: set status to archived instead of actually deleting
        // This preserves data for audit trails
        await db.organization.update({
            where: { id },
            data: {
                subscriptionStatus: "archived",
            },
        });

        return NextResponse.json({
            message: "Organization archived successfully",
        });
    } catch (error) {
        console.error("Admin organization delete error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to delete organization" },
            { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
        );
    }
}
