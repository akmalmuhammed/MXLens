"use client";

import { useEffect, useState } from "react";
import { ClipboardList, RefreshCcw, User as UserIcon } from "lucide-react";
import { getAuditLogs } from "@/actions/admin/audit";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AuditPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const load = () => {
        setLoading(true);
        getAuditLogs()
            .then(setLogs)
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <ClipboardList className="h-6 w-6 text-primary" />
                    Audit Logs
                </h1>
                <p className="text-muted-foreground font-mono text-sm">
                    Track system changes and administrative actions.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Activity Feed</CardTitle>
                            <CardDescription>Last 50 recorded actions.</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                            <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Time</TableHead>
                                <TableHead>Actor</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead className="text-right">IP Address</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
                                </TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No audit logs found.</TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={log.user?.image || ""} />
                                                    <AvatarFallback>
                                                        <UserIcon className="h-3 w-3" />
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm font-medium">{log.user?.name || log.actorEmail}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-mono text-xs">
                                                {log.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-[300px] truncate text-xs text-muted-foreground font-mono">
                                            {JSON.stringify(log.details)}
                                        </TableCell>
                                        <TableCell className="text-right text-xs font-mono text-muted-foreground">
                                            {log.ipAddress}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
