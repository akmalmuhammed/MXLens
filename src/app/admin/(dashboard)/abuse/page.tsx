"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, Trash2, RefreshCcw } from "lucide-react";
import { getAbuseStats, unblockIpAction } from "@/actions/admin/abuse"; // We need to create this server action wrapper
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export default function AbusePage() {
    const [blockedIps, setBlockedIps] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const load = () => {
        setLoading(true);
        getAbuseStats()
            .then(data => setBlockedIps(data.blockedIps))
            .catch(() => toast.error("Failed to load abuse stats"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const handleUnblock = async (ip: string) => {
        try {
            await unblockIpAction(ip);
            toast.success(`Unblocked IP: ${ip}`);
            load(); // Reload list
        } catch (error) {
            toast.error("Failed to unblock IP");
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <ShieldAlert className="h-6 w-6 text-red-500" />
                    Abuse Prevention
                </h1>
                <p className="text-muted-foreground font-mono text-sm">
                    Manage rate limits and blocked identifiers.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Global Blocklist</CardTitle>
                            <CardDescription>IP addresses permanently blocked from usage.</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                            <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {blockedIps.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No IPs are currently blocked.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>IP Address</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {blockedIps.map(ip => (
                                    <TableRow key={ip}>
                                        <TableCell className="font-mono">{ip}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">Manual Block / Abuse Detected</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleUnblock(ip)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Unblock
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
