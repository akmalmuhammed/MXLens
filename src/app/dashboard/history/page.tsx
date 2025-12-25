import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Calendar, MoreHorizontal, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

// Mock Data
const HISTORY_LOGS = [
    { id: 'mal-1', subject: "Urgent Invoice", sender: "billing@bad.com", verdict: "Malicious", score: 92, date: new Date() },
    { id: 'clean-1', subject: "Weekly Report", sender: "newsletter@company.com", verdict: "Clean", score: 5, date: new Date(Date.now() - 3600000) },
    { id: 'clean-2', subject: "Team Lunch", sender: "hr@company.com", verdict: "Clean", score: 0, date: new Date(Date.now() - 7200000) },
    { id: 'sus-1', subject: "Verify Account", sender: "security@g00gle.com", verdict: "Suspicious", score: 65, date: new Date(Date.now() - 86400000) },
    { id: 'clean-3', subject: "Project Update", sender: "pm@client.com", verdict: "Clean", score: 10, date: new Date(Date.now() - 172800000) },
];

export default function HistoryPage() {
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
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Verdict</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Subject</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Sender</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Score</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Date</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {HISTORY_LOGS.map((log) => (
                                <tr key={log.id} className="border-b transition-colors hover:bg-muted/50">
                                    <td className="p-4 align-middle">
                                        <Badge variant="outline" className={
                                            log.verdict === 'Malicious' ? 'bg-rose-100 text-rose-600 border-rose-200' :
                                                log.verdict === 'Suspicious' ? 'bg-amber-100 text-amber-600 border-amber-200' :
                                                    'bg-emerald-100 text-emerald-600 border-emerald-200'
                                        }>
                                            {log.verdict}
                                        </Badge>
                                    </td>
                                    <td className="p-4 align-middle font-medium">{log.subject}</td>
                                    <td className="p-4 align-middle text-muted-foreground">{log.sender}</td>
                                    <td className="p-4 align-middle font-mono">{log.score}</td>
                                    <td className="p-4 align-middle text-muted-foreground">{formatDistanceToNow(log.date)} ago</td>
                                    <td className="p-4 align-middle text-right">
                                        <Link href={`/analyze/results/${log.id}`}>
                                            <Button variant="ghost" size="sm">
                                                View <ArrowRight className="w-4 h-4 ml-1" />
                                            </Button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex items-center justify-end space-x-2 py-4">
                <Button variant="outline" size="sm" disabled>Previous</Button>
                <Button variant="outline" size="sm">Next</Button>
            </div>
        </div>
    );
}
