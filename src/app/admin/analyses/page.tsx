"use client";

import { useEffect, useState } from "react";
import { Shield, Search, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Analysis {
    id: string;
    dbId: string;
    verdict: string;
    riskScore: number;
    confidence: string;
    org: string;
    source: string;
    severity: string;
    triageStatus: string;
    timestamp: string;
    user: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const getVerdictStyle = (verdict: string) => {
    switch (verdict) {
        case "MALICIOUS":
            return "bg-destructive/20 text-destructive border-destructive/30";
        case "SUSPICIOUS":
            return "bg-warning/20 text-warning border-warning/30";
        case "CLEAN":
            return "bg-secure/20 text-secure border-secure/30";
        default:
            return "bg-muted text-muted-foreground border-border";
    }
};

const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
        case "MALICIOUS":
            return AlertTriangle;
        case "SUSPICIOUS":
            return AlertCircle;
        case "CLEAN":
            return CheckCircle2;
        default:
            return Shield;
    }
};

export default function AnalysesPage() {
    const [analyses, setAnalyses] = useState<Analysis[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [verdictFilter, setVerdictFilter] = useState("");

    useEffect(() => {
        async function fetchAnalyses() {
            try {
                setLoading(true);
                const params = new URLSearchParams();
                if (verdictFilter) params.set("verdict", verdictFilter);

                const res = await fetch(`/api/admin/analyses?${params}`);
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || "Failed to fetch analyses");
                }
                const data = await res.json();
                setAnalyses(data.analyses);
                setPagination(data.pagination);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load analyses");
            } finally {
                setLoading(false);
            }
        }

        fetchAnalyses();
    }, [verdictFilter]);

    const stats = {
        total: pagination?.total || 0,
        safe: analyses.filter(a => a.verdict === "CLEAN").length,
        suspicious: analyses.filter(a => a.verdict === "SUSPICIOUS").length,
        malicious: analyses.filter(a => a.verdict === "MALICIOUS").length,
    };

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-destructive">{error}</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Analyses</h1>
                    <p className="text-muted-foreground font-mono text-sm">
                        Global feed of all email analyses across the platform
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-4">
                <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold font-mono">{stats.total}</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Safe</p>
                    <p className="text-2xl font-bold font-mono text-secure">{stats.safe}</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Suspicious</p>
                    <p className="text-2xl font-bold font-mono text-warning">{stats.suspicious}</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Malicious</p>
                    <p className="text-2xl font-bold font-mono text-destructive">{stats.malicious}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <select
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={verdictFilter}
                    onChange={(e) => setVerdictFilter(e.target.value)}
                >
                    <option value="">All Verdicts</option>
                    <option value="CLEAN">Safe</option>
                    <option value="SUSPICIOUS">Suspicious</option>
                    <option value="MALICIOUS">Malicious</option>
                </select>
            </div>

            {/* Table */}
            <div className="rounded-lg border border-border bg-card overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="text-muted-foreground">Loading...</div>
                    </div>
                ) : analyses.length === 0 ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="text-muted-foreground">No analyses found</div>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                    Incident ID
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                    Verdict
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                    Risk Score
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                    Organization
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                    Confidence
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                    Time
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {analyses.map((analysis) => {
                                const Icon = getVerdictIcon(analysis.verdict);
                                return (
                                    <tr key={analysis.dbId} className="hover:bg-muted/30 transition-colors cursor-pointer">
                                        <td className="px-4 py-3">
                                            <span className="font-mono text-sm font-medium text-primary">
                                                #{analysis.id}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={cn(
                                                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border",
                                                getVerdictStyle(analysis.verdict)
                                            )}>
                                                <Icon className="h-3 w-3" />
                                                {analysis.verdict === "CLEAN" ? "SAFE" : analysis.verdict}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            "h-full rounded-full",
                                                            analysis.riskScore >= 70 ? "bg-destructive" :
                                                                analysis.riskScore >= 40 ? "bg-warning" : "bg-secure"
                                                        )}
                                                        style={{ width: `${analysis.riskScore}%` }}
                                                    />
                                                </div>
                                                <span className="font-mono text-sm">{analysis.riskScore}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm">{analysis.org}</td>
                                        <td className="px-4 py-3">
                                            <span className={cn(
                                                "text-xs font-mono",
                                                analysis.confidence === "HIGH" ? "text-secure" :
                                                    analysis.confidence === "MEDIUM" ? "text-warning" : "text-muted-foreground"
                                            )}>
                                                {analysis.confidence}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{analysis.timestamp}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
