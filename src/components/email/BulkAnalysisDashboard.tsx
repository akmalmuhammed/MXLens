import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ShieldCheck, AlertTriangle, ShieldAlert, Download, Search, X, Loader2, ArrowLeft } from "lucide-react";
import { BulkFile } from "./BulkProcessor";

interface BulkAnalysisDashboardProps {
    files: BulkFile[];
    onClear: () => void;
    onSelectFile: (analysis: any) => void;
}

export function BulkAnalysisDashboard({ files, onClear, onSelectFile }: BulkAnalysisDashboardProps) {
    const [filter, setFilter] = useState('');

    const stats = useMemo(() => {
        return {
            total: files.length,
            completed: files.filter(f => f.status === 'completed').length,
            pending: files.filter(f => f.status === 'pending' || f.status === 'processing').length,
            highRisk: files.filter(f => f.result?.scoring?.verdict?.verdict === 'High Risk').length,
            suspicious: files.filter(f => f.result?.scoring?.verdict?.verdict === 'Suspicious').length,
            clean: files.filter(f => f.result?.scoring?.verdict?.verdict === 'Likely Legitimate').length,
            errors: files.filter(f => f.status === 'error').length
        };
    }, [files]);

    const progress = (stats.completed / (stats.total || 1)) * 100;

    const filteredFiles = files.filter(f =>
        f.file.name.toLowerCase().includes(filter.toLowerCase()) ||
        f.result?.header?.headers['Subject']?.toString().toLowerCase().includes(filter.toLowerCase())
    );

    const handleExportCSV = () => {
        const headers = ["Filename", "Subject", "Sender", "Verdict", "Score", "Status"];
        const rows = files.map(f => {
            if (!f.result) return [f.file.name, "N/A", "N/A", "N/A", "N/A", f.status];

            const subject = f.result.header.headers['Subject']?.toString() || "";
            const from = f.result.header.headers['From']?.toString() || "";
            const verdict = f.result.scoring.verdict.verdict;
            const score = f.result.scoring.trust.score;

            return [
                `"${f.file.name}"`,
                `"${subject.replace(/"/g, '""')}"`,
                `"${from.replace(/"/g, '""')}"`,
                verdict,
                score,
                f.status
            ];
        });

        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bulk-analysis-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header / Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    label="Queue Progress"
                    value={`${Math.round(progress)}%`}
                    sub={`${stats.completed}/${stats.total} processed`}
                    icon={Loader2}
                    loading={stats.pending > 0}
                    color="text-blue-400"
                />
                <StatCard
                    label="Clean"
                    value={stats.clean}
                    sub="Likely Legitimate"
                    icon={ShieldCheck}
                    color="text-green-400"
                    bgColor="bg-green-500/10"
                />
                <StatCard
                    label="Suspicious"
                    value={stats.suspicious}
                    sub="Review Required"
                    icon={AlertTriangle}
                    color="text-yellow-400"
                    bgColor="bg-yellow-500/10"
                />
                <StatCard
                    label="High Risk"
                    value={stats.highRisk}
                    sub="Critical Threats"
                    icon={ShieldAlert}
                    color="text-red-400"
                    bgColor="bg-red-500/10"
                />
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 bg-muted/20 p-4 rounded-xl border border-white/5">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search filename or subject..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="pl-9 bg-background/50 border-input/50"
                    />
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={stats.completed === 0}>
                        <Download className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                    <Button variant="destructive" size="sm" onClick={onClear}>
                        <X className="mr-2 h-4 w-4" /> Clear All
                    </Button>
                </div>
            </div>

            {/* Progress Bar (Visible when processing) */}
            {stats.pending > 0 && (
                <Progress value={progress} className="h-1" />
            )}

            {/* Data Grid */}
            <div className="flex-1 rounded-xl border border-white/5 bg-black/20 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1">
                    <Table>
                        <TableHeader className="bg-muted/30 sticky top-0 z-10 backdrop-blur-md">
                            <TableRow className="hover:bg-transparent border-white/5">
                                <TableHead className="w-[50px]">Status</TableHead>
                                <TableHead>Filename</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Sender</TableHead>
                                <TableHead className="text-right">Score</TableHead>
                                <TableHead className="w-[150px] text-right">Verdict</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredFiles.map((item) => (
                                <TableRow key={item.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                    <TableCell>
                                        {item.status === 'processing' && <Loader2 className="h-4 w-4 animate-spin text-blue-400" />}
                                        {item.status === 'pending' && <div className="h-2 w-2 rounded-full bg-slate-600" />}
                                        {item.status === 'error' && <X className="h-4 w-4 text-red-500" />}
                                        {item.status === 'completed' && (
                                            <div className={`h-2 w-2 rounded-full ${item.result?.scoring.verdict.verdict === 'Likely Legitimate' ? 'bg-green-500' :
                                                    item.result?.scoring.verdict.verdict === 'High Risk' ? 'bg-red-500' : 'bg-yellow-500'
                                                }`} />
                                        )}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">{item.file.name}</TableCell>
                                    <TableCell className="font-medium max-w-[300px] truncate">
                                        {item.result?.header.headers['Subject']?.toString() || <span className="text-muted-foreground italic">Pending...</span>}
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                                        {item.result?.header.headers['From']?.toString() || "-"}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        {item.result ? (
                                            <span className={
                                                item.result.scoring.trust.score > 80 ? 'text-green-400' :
                                                    item.result.scoring.trust.score < 50 ? 'text-red-400' : 'text-yellow-400'
                                            }>
                                                {item.result.scoring.trust.score}
                                            </span>
                                        ) : "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {item.result ? (
                                            <Badge variant="outline" className={`
                                                ${item.result.scoring.verdict.verdict === 'Likely Legitimate' ? 'border-green-500/30 text-green-400 bg-green-500/5' :
                                                    item.result.scoring.verdict.verdict === 'High Risk' ? 'border-red-500/30 text-red-400 bg-red-500/5' :
                                                        'border-yellow-500/30 text-yellow-400 bg-yellow-500/5'}
                                            `}>
                                                {item.result.scoring.verdict.verdict}
                                            </Badge>
                                        ) : (
                                            <span className="text-xs text-muted-foreground capitalize">{item.status}</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {item.result && (
                                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onSelectFile(item.result)}>
                                                View
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, sub, icon: Icon, loading = false, color, bgColor }: any) {
    return (
        <div className={`p-4 rounded-xl border border-white/5 bg-card/50 backdrop-blur ${bgColor || 'bg-muted/10'}`}>
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
                <Icon className={`h-4 w-4 ${loading ? 'animate-spin' : ''} ${color}`} />
            </div>
            <div className="text-2xl font-bold font-mono">{value}</div>
            <div className={`text-xs ${color} mt-1 font-medium`}>{sub}</div>
        </div>
    );
}
