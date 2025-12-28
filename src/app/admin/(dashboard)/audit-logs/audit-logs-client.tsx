"use client";

import { FileText, Search, Download, Filter, BarChart3, User, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface AuditEntry {
    id: string;
    type: "ANALYSIS" | "USER" | "ORGANIZATION";
    action: string;
    details: string;
    orgName: string;
    timestamp: string;
}

interface Props {
    entries: AuditEntry[];
}

export function AuditLogsClient({ entries }: Props) {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<string>("all");

    const filteredEntries = entries.filter((entry) => {
        const matchesSearch =
            entry.action.toLowerCase().includes(search.toLowerCase()) ||
            entry.details.toLowerCase().includes(search.toLowerCase()) ||
            entry.orgName.toLowerCase().includes(search.toLowerCase());

        const matchesFilter = filter === "all" || entry.type === filter;

        return matchesSearch && matchesFilter;
    });

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "ANALYSIS":
                return <BarChart3 className="h-4 w-4 text-primary" />;
            case "USER":
                return <User className="h-4 w-4 text-secure" />;
            case "ORGANIZATION":
                return <Building2 className="h-4 w-4 text-secondary" />;
            default:
                return <FileText className="h-4 w-4 text-muted-foreground" />;
        }
    };

    const getTypeBadgeClass = (type: string) => {
        switch (type) {
            case "ANALYSIS":
                return "bg-primary/20 text-primary border-primary/30";
            case "USER":
                return "bg-secure/20 text-secure border-secure/30";
            case "ORGANIZATION":
                return "bg-secondary/20 text-secondary border-secondary/30";
            default:
                return "bg-muted text-muted-foreground border-border";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <FileText className="h-6 w-6 text-primary" />
                        Audit Logs
                    </h1>
                    <p className="text-muted-foreground font-mono text-sm">
                        Platform-wide activity and security audit trail
                    </p>
                </div>
                <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export CSV
                </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search logs..."
                        className="pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={filter === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilter("all")}
                    >
                        All
                    </Button>
                    <Button
                        variant={filter === "ANALYSIS" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilter("ANALYSIS")}
                    >
                        Analyses
                    </Button>
                    <Button
                        variant={filter === "USER" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilter("USER")}
                    >
                        Users
                    </Button>
                    <Button
                        variant={filter === "ORGANIZATION" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilter("ORGANIZATION")}
                    >
                        Orgs
                    </Button>
                </div>
            </div>

            {/* Logs Table */}
            <div className="rounded-lg border border-border bg-card overflow-hidden">
                {filteredEntries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Audit Logs</h3>
                        <p className="text-muted-foreground text-sm">
                            Activity logs will appear here as actions are performed.
                        </p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                    Type
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                    Action
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                    Details
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                    Organization
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                    Timestamp
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredEntries.map((entry) => (
                                <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {getTypeIcon(entry.type)}
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getTypeBadgeClass(entry.type)}`}>
                                                {entry.type}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 font-medium">{entry.action}</td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground font-mono">
                                        {entry.details}
                                    </td>
                                    <td className="px-4 py-3 text-sm">{entry.orgName}</td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                        {new Date(entry.timestamp).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
