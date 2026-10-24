"use client";

import { useEffect, useState } from "react";
import { resolveMxRecords } from "@/actions/dns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network, CheckCircle2, AlertCircle } from "lucide-react";

interface MxRecordCardProps {
    domain: string;
    rawFrom?: string;
}

export function MxRecordCard({ domain, rawFrom }: MxRecordCardProps) {
    const [status, setStatus] = useState<'loading' | 'active' | 'missing' | 'error'>('loading');
    const [records, setRecords] = useState<any[]>([]);

    useEffect(() => {
        if (!domain) {
            setStatus('missing'); // If no domain, it's missing
            return;
        }

        setStatus('loading');
        resolveMxRecords(domain)
            .then(records => {
                if (!records || records.length === 0) {
                    setStatus('missing');
                } else {
                    setStatus('active');
                    setRecords(records);
                }
            })
            .catch(() => setStatus('error'));
    }, [domain]);

    if (!domain) {
        return (
            <Card className="bg-card/50 border-white/5 border-dashed">
                <CardContent className="p-4 text-xs text-muted-foreground flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        MX Analysis: No domain detected.
                    </div>
                    {rawFrom && (
                        <div className="text-[10px] opacity-70 border-t border-white/5 pt-2 mt-1">
                            Header: <span className="font-mono">{rawFrom.substring(0, 50)}</span>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-card/50 border-white/5">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                        <Network className="w-4 h-4" />
                        MX Authorization
                    </CardTitle>
                    {status !== 'loading' && (
                        <Badge variant="outline" className={records && records.length > 0
                            ? "bg-green-500/10 text-green-500 border-green-500/20"
                            : "bg-red-500/10 text-red-500 border-red-500/20"
                        }>
                            {records && records.length > 0 ? (
                                <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Active</span>
                            ) : (
                                <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Missing</span>
                            )}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {status === 'loading' ? (
                    <div className="space-y-2 animate-pulse">
                        <div className="h-4 bg-muted/20 rounded w-3/4"></div>
                        <div className="h-4 bg-muted/20 rounded w-1/2"></div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {records && records.length > 0 ? (
                            <div className="flex flex-col gap-1.5">
                                {records.slice(0, 3).map((mx, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs font-mono bg-muted/20 p-2 rounded">
                                        <span className="truncate max-w-[200px] text-foreground/80">{mx.exchange}</span>
                                        <span className="text-muted-foreground px-1.5 py-0.5 bg-background rounded border border-white/5">
                                            Priority: {mx.priority}
                                        </span>
                                    </div>
                                ))}
                                {records.length > 3 && (
                                    <div className="text-[10px] text-center text-muted-foreground mt-1">
                                        + {records.length - 3} more records
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-xs text-red-400 p-3 bg-red-500/5 rounded border border-red-500/10">
                                This domain has no Mail Exchange (MX) records. It cannot receive emails, which is highly suspicious for a sender domain.
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
