import { db } from "@/lib/db";
import { auth } from "@/auth";
import { HistoryTable, type HistoryItem } from "@/components/dashboard/HistoryTable";

export default async function HistoryPage() {
    const session = await auth();
    const orgId = session?.user?.orgId;
    const logs = orgId ? await db.analysisLog.findMany({
        where: { orgId },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { _count: { select: { comments: true } } },
    }) : [];

    const items: HistoryItem[] = logs.map((log) => {
        const meta = (log.meta ?? {}) as Record<string, unknown>;
        return {
            id: log.id,
            createdAt: log.createdAt.toISOString(),
            verdict: log.verdict,
            subject: typeof meta.subject === "string" && meta.subject ? meta.subject : "Subject not retained",
            sender: typeof meta.sender === "string" && meta.sender ? meta.sender : "Sender not retained",
            classification: log.classification,
            commentCount: log._count.comments,
        };
    });

    return (
        <div className="mx-auto w-full max-w-6xl space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Analysis History</h1>
                <p className="text-muted-foreground">Saved privacy-safe reports for your organization.</p>
            </div>
            <HistoryTable items={items} />
        </div>
    );
}
