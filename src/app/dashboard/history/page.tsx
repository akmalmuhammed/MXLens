import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Calendar, ArrowRight, MessageSquare } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export default async function HistoryPage() {
    const session = await auth();
    const orgId = session?.user?.orgId;

    const logs = orgId ? await db.analysisLog.findMany({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
        take: 50, // Limit to last 50 for now
        include: {
            _count: {
                select: { comments: true }
            }
        }
    }) : [];

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Analysis History</h1>
                    <p className="text-muted-foreground">Archive of all scanned emails.</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search subject, sender..." className="pl-9" />
                    </div>
                    <Button variant="outline"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
                    <Button variant="outline"><Calendar className="w-4 h-4 mr-2" /> Date</Button>
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm text-left">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-[120px]">Date</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-[120px]">Verdict</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Subject</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Sender</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-[140px]">Classification</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-[80px]">Notes</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right w-[80px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                        No analysis history found. Scan an email to see it here.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => {
                                    // Parse meta safely
                                    const meta = log.meta as any || {};
                                    const subject = meta.subject || "No Subject";
                                    const sender = meta.sender || "Unknown Sender";
                                    const commentCount = (log as any)._count?.comments || 0;

                                    return (
                                        <tr key={log.id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 align-middle text-muted-foreground whitespace-nowrap">
                                                {formatDistanceToNow(log.createdAt)} ago
                                            </td>
                                            <td className="p-4 align-middle">
                                                <Badge variant="outline" className={
                                                    log.verdict === 'MALICIOUS' ? 'bg-rose-100 text-rose-600 border-rose-200' :
                                                        log.verdict === 'SUSPICIOUS' ? 'bg-amber-100 text-amber-600 border-amber-200' :
                                                            'bg-emerald-100 text-emerald-600 border-emerald-200'
                                                }>
                                                    {log.verdict}
                                                </Badge>
                                            </td>
                                            <td className="p-4 align-middle font-medium truncate max-w-[200px]" title={subject}>{subject}</td>
                                            <td className="p-4 align-middle text-muted-foreground truncate max-w-[150px]" title={sender}>{sender}</td>
                                            <td className="p-4 align-middle">
                                                {log.classification ? (
                                                    <Badge variant="secondary" className="text-xs">
                                                        {log.classification.replace('_', ' ')}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground opacity-50 text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="p-4 align-middle">
                                                {commentCount > 0 && (
                                                    <div className="flex items-center gap-1 text-muted-foreground">
                                                        <MessageSquare className="w-4 h-4" />
                                                        <span className="text-xs">{commentCount}</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                <Link href={`/analysis/${log.id}`}>
                                                    <Button variant="ghost" size="icon">
                                                        <ArrowRight className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex items-center justify-end space-x-2 py-4">
                <Button variant="outline" size="sm" disabled>Previous</Button>
                <Button variant="outline" size="sm" disabled={logs.length < 50}>Next</Button>
            </div>
        </div>
    );
}
