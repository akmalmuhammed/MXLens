"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, MessageSquare, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface HistoryItem {
    id: string;
    createdAt: string;
    verdict: "CLEAN" | "SUSPICIOUS" | "MALICIOUS" | "UNKNOWN";
    subject: string;
    sender: string;
    classification: string | null;
    commentCount: number;
}

const verdictClasses: Record<HistoryItem["verdict"], string> = {
    CLEAN: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    SUSPICIOUS: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    MALICIOUS: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400",
    UNKNOWN: "border-border bg-muted text-muted-foreground",
};

export function HistoryTable({ items }: { items: HistoryItem[] }) {
    const [query, setQuery] = useState("");
    const [verdict, setVerdict] = useState<"ALL" | HistoryItem["verdict"]>("ALL");

    const filteredItems = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return items.filter((item) => {
            const matchesQuery = !normalizedQuery
                || item.subject.toLowerCase().includes(normalizedQuery)
                || item.sender.toLowerCase().includes(normalizedQuery);
            const matchesVerdict = verdict === "ALL" || item.verdict === verdict;
            return matchesQuery && matchesVerdict;
        });
    }, [items, query, verdict]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search subject or sender"
                        aria-label="Search analysis history"
                        className="pl-9"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={verdict}
                        onChange={(event) => setVerdict(event.target.value as "ALL" | HistoryItem["verdict"])}
                        aria-label="Filter analysis history by verdict"
                        className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        <option value="ALL">All verdicts</option>
                        <option value="CLEAN">Clean</option>
                        <option value="SUSPICIOUS">Suspicious</option>
                        <option value="MALICIOUS">Malicious</option>
                        <option value="UNKNOWN">Unknown</option>
                    </select>
                    <span className="whitespace-nowrap text-sm text-muted-foreground" aria-live="polite">
                        {filteredItems.length} of {items.length}
                    </span>
                </div>
            </div>

            <div className="overflow-hidden rounded-md border bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] caption-bottom text-left text-sm">
                        <thead className="border-b bg-muted/30">
                            <tr>
                                <th className="h-12 px-4 font-medium text-muted-foreground">Date</th>
                                <th className="h-12 px-4 font-medium text-muted-foreground">Verdict</th>
                                <th className="h-12 px-4 font-medium text-muted-foreground">Subject</th>
                                <th className="h-12 px-4 font-medium text-muted-foreground">Sender</th>
                                <th className="h-12 px-4 font-medium text-muted-foreground">Classification</th>
                                <th className="h-12 px-4 font-medium text-muted-foreground">Notes</th>
                                <th className="h-12 px-4 text-right font-medium text-muted-foreground"><span className="sr-only">View report</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                        {items.length === 0 ? "No analysis history yet. Analyze an email to create a saved report." : "No analyses match this search."}
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item) => (
                                    <tr key={item.id} className="border-b transition-colors last:border-0 hover:bg-muted/40">
                                        <td className="whitespace-nowrap p-4 text-muted-foreground">
                                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                                        </td>
                                        <td className="p-4">
                                            <Badge variant="outline" className={verdictClasses[item.verdict]}>{item.verdict}</Badge>
                                        </td>
                                        <td className="max-w-[260px] truncate p-4 font-medium" title={item.subject}>{item.subject}</td>
                                        <td className="max-w-[220px] truncate p-4 text-muted-foreground" title={item.sender}>{item.sender}</td>
                                        <td className="p-4">
                                            {item.classification ? <Badge variant="secondary" className="text-xs">{item.classification.replace(/_/g, " ")}</Badge> : <span className="text-muted-foreground">-</span>}
                                        </td>
                                        <td className="p-4">
                                            {item.commentCount > 0 ? <span className="flex items-center gap-1 text-muted-foreground"><MessageSquare className="h-4 w-4" aria-hidden="true" />{item.commentCount}</span> : <span className="text-muted-foreground">-</span>}
                                        </td>
                                        <td className="p-4 text-right">
                                            <Button asChild variant="ghost" size="icon" className="h-8 w-8" aria-label={`View ${item.subject}`}>
                                                <Link href={`/analysis/${item.id}`}><ArrowRight className="h-4 w-4" /></Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
