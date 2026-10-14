import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; // Assuming these exist or using raw divs for speed if not verified, but usually in ui folder. I will use standard HTML to be safe and fast.
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function AuditLogsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Audit Logs</h1>
                <p className="text-muted-foreground">Track security events and analysis history for compliance reviews.</p>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Filter by event or user..." />
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                        <tr>
                            <th className="px-4 py-3 font-medium">Timestamp</th>
                            <th className="px-4 py-3 font-medium">User</th>
                            <th className="px-4 py-3 font-medium">Event</th>
                            <th className="px-4 py-3 font-medium">Details</th>
                            <th className="px-4 py-3 font-medium">IP Address</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 bg-card">
                        <LogRow
                            time="Dec 21, 14:02:55"
                            user="akmal@mxlens.com"
                            event="ANALYSIS_COMPLETED"
                            details="File: urgent_invoice.eml (Malicious)"
                            ip="192.168.1.5"
                        />
                        <LogRow
                            time="Dec 21, 13:45:10"
                            user="john@mxlens.com"
                            event="API_KEY_CREATED"
                            details="Label: SOAR Integration"
                            ip="10.0.0.42"
                        />
                        <LogRow
                            time="Dec 21, 11:20:00"
                            user="akmal@mxlens.com"
                            event="LOGIN_SUCCESS"
                            details="Method: Password"
                            ip="192.168.1.5"
                        />
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function LogRow({ time, user, event, details, ip }: any) {
    return (
        <tr className="hover:bg-muted/5">
            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{time}</td>
            <td className="px-4 py-3 font-medium">{user}</td>
            <td className="px-4 py-3">
                <span className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs font-mono">{event}</span>
            </td>
            <td className="px-4 py-3 text-muted-foreground">{details}</td>
            <td className="px-4 py-3 text-xs text-muted-foreground">{ip}</td>
        </tr>
    )
}
