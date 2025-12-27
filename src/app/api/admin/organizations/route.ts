import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/admin/admin-auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        await requireAdminAccess();

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
