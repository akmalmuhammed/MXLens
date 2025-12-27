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
        const adminOnly = searchParams.get("adminOnly") === "true";

        const where = {
            ...(search && {
                OR: [
                    { name: { contains: search, mode: "insensitive" as const } },
                    { email: { contains: search, mode: "insensitive" as const } },
                ],
            }),
            ...(adminOnly && { isPlatformAdmin: true }),
        };

        const [users, total] = await Promise.all([
            db.user.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    memberships: {
                        include: {
                            organization: { select: { name: true } },
                        },
                    },
                    sessions: {
                        orderBy: { expires: "desc" },
                        take: 1,
                    },
                },
            }),
            db.user.count({ where }),
        ]);

        const usersWithStats = users.map((user) => {
            const lastSession = user.sessions[0];
            const isActive = lastSession && new Date(lastSession.expires) > new Date();

            return {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                isPlatformAdmin: user.isPlatformAdmin,
                adminRole: user.adminRole,
                orgs: user.memberships.length,
                organizations: user.memberships.map((m) => ({
                    id: m.orgId,
                    name: m.organization.name,
                    role: m.role,
                })),
                status: isActive ? "active" : "inactive",
                mfaEnabled: user.mfaEnabled,
                lastActive: lastSession
                    ? getRelativeTime(lastSession.expires)
                    : "Never",
                createdAt: user.createdAt.toISOString().split("T")[0],
            };
        });

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

function getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(Math.abs(diffMs) / 60000);
    const diffHours = Math.floor(Math.abs(diffMs) / 3600000);
    const diffDays = Math.floor(Math.abs(diffMs) / 86400000);

    if (diffMs < 0) return "Active now";
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}
