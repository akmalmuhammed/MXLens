import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/admin/admin-auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        await requireAdminAccess();

        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const verdict = searchParams.get("verdict");
        const orgId = searchParams.get("orgId");

        const where = {
            ...(verdict && { verdict: verdict as "CLEAN" | "SUSPICIOUS" | "MALICIOUS" | "UNKNOWN" }),
            ...(orgId && { orgId }),
        };

        const [analyses, total] = await Promise.all([
            db.analysisLog.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    organization: { select: { name: true, slug: true } },
                    user: { select: { name: true, email: true } },
                },
            }),
            db.analysisLog.count({ where }),
        ]);

        const analysesFormatted = analyses.map((analysis) => ({
            id: analysis.incidentId || analysis.id.slice(0, 8).toUpperCase(),
            dbId: analysis.id,
            verdict: analysis.verdict,
            riskScore: analysis.riskScore,
            confidence: analysis.confidence,
            org: analysis.organization.name,
            orgSlug: analysis.organization.slug,
            source: analysis.source,
            severity: analysis.severity,
            triageStatus: analysis.triageStatus,
            processingMs: analysis.processingMs,
            timestamp: getRelativeTime(analysis.createdAt),
            createdAt: analysis.createdAt.toISOString(),
            user: analysis.user?.email || "API Key",
        }));

        return NextResponse.json({
            analyses: analysesFormatted,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Admin analyses error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch analyses" },
            { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
        );
    }
}

function getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}
