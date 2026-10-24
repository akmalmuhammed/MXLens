"use client"

import { useState } from "react";
import DOMPurify from "dompurify";
import {
    ShieldAlert,
    BookOpen,
    MoreVertical,
    X,
    Check,
    FileJson,
    FileText,
    ChevronDown,
    Gavel,
    Clock,
    User as UserIcon,
    Hash,
    AlertCircle,
    Activity,
    Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AnalysisResult } from "@/lib/email/HeaderParser";
import { NormalizedSignals, ScoringResult } from "@/lib/email/scoring/types";
import { AnalystTriagePanel } from "@/components/analysis/AnalystTriagePanel";

// Types matching schema
export type IncidentSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type IncidentStatus = "OPEN" | "IN_PROGRESS" | "CLOSED" | "ARCHIVED";

interface IncidentWorkbenchProps {
    analysis: any; // Using simplified type for now to speed up prototyping
    initialStatus: IncidentStatus;
    initialSeverity: IncidentSeverity;
    incidentId: string;
    currentUser: any;
}

export function IncidentWorkbench({ analysis, initialStatus, initialSeverity, incidentId, currentUser }: IncidentWorkbenchProps) {
    const [status, setStatus] = useState<IncidentStatus>(initialStatus);
    const [severity, setSeverity] = useState<IncidentSeverity>(initialSeverity);
    const [activeTab, setActiveTab] = useState("overview");
    const analystName = currentUser?.name || currentUser?.email || "Unassigned";
    const analystInitial = analystName.charAt(0).toUpperCase();

    const severityColors = {
        LOW: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        MEDIUM: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        HIGH: "bg-orange-500/10 text-orange-500 border-orange-500/20",
        CRITICAL: "bg-red-500/10 text-red-500 border-red-500/20 animate-pulse"
    };

    return (
        <div className="flex min-h-screen flex-col overflow-hidden bg-background lg:h-[calc(100vh-4rem)] lg:flex-row">
            {/* MAIN CONTENT (Left - 65%) */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-border/40">
                {/* Workbench Header */}
                <header className="h-16 px-6 border-b border-border/40 flex items-center justify-between bg-muted/5 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-base px-3 py-1 bg-muted/30">
                                {incidentId || "#INC-PENDING"}
                            </Badge>
                            <Badge className={severityColors[severity]}>{severity}</Badge>
                        </div>
                        <Separator orientation="vertical" className="h-6" />
                        <div>
                            <h1 className="font-semibold text-lg truncate max-w-[400px]">{analysis.header.subject}</h1>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="font-mono">{analysis.header.from}</span>
                                <span>•</span>
                                <span>{new Date(analysis.timestamp).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant={status === "CLOSED" ? "secondary" : "default"} size="sm" className="gap-2 w-32">
                                    {status === "CLOSED" ? <Check className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                                    {status} <ChevronDown className="w-3 h-3 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setStatus("OPEN")}>OPEN</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatus("IN_PROGRESS")}>IN PROGRESS</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setStatus("CLOSED")} className="text-green-500 font-medium">CLOSE CASE</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Email Preview & Analysis View */}
                <ScrollArea className="flex-1 p-6">
                    <div className="max-w-4xl mx-auto space-y-8">
                        {/* Compact Verdict */}
                        <div className={`p-6 rounded-xl border flex items-center justify-between ${analysis.scoring.verdict.verdict === 'High Risk' ? 'bg-red-500/5 border-red-500/20' : 'bg-muted/10'
                            }`}>
                            <div>
                                <h2 className={`text-2xl font-bold font-heading ${analysis.scoring.verdict.verdict === 'High Risk' ? 'text-red-500' : 'text-foreground'
                                    }`}>
                                    {analysis.scoring.verdict.verdict}
                                </h2>
                                <p className="text-muted-foreground mt-1">{analysis.scoring.verdict.reason}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-4xl font-black font-mono opacity-20">{analysis.scoring.trust.score}/100</div>
                                <div className="text-xs uppercase font-semibold text-muted-foreground tracking-widest">Risk Score</div>
                            </div>
                        </div>

                        {/* Email Content Preview (Simplified) */}
                        <div className="border rounded-lg bg-card overflow-hidden min-h-[400px]">
                            <div className="bg-muted/30 px-4 py-2 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Email Content Preview
                            </div>
                            <div className="p-8 prose dark:prose-invert max-w-none">
                                <div dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(
                                        analysis.emailContent.html || `<pre>${analysis.emailContent.text}</pre>`,
                                        {
                                            ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'pre', 'code', 'blockquote', 'img'],
                                            ALLOWED_ATTR: ['href', 'target', 'src', 'alt', 'title', 'class', 'width', 'height'],
                                            FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'object', 'embed', 'link', 'meta', 'base'],
                                            ADD_ATTR: ['target'],
                                        }
                                    )
                                }} />
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </div>

            {/* SIDEBAR (Right - 35%) */}
            <div className="flex w-full shrink-0 flex-col border-t border-border/40 bg-muted/5 lg:w-[400px] lg:border-l lg:border-t-0">
                <div className="p-4 border-b border-border/40">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="overview">Triage</TabsTrigger>
                            <TabsTrigger value="iocs">IOCs</TabsTrigger>
                            <TabsTrigger value="timeline">Timeline</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <div className="flex-1 overflow-hidden relative">
                    {/* Triage Tab */}
                    {activeTab === "overview" && (
                        <ScrollArea className="h-full p-4">
                            <div className="space-y-6">
                                {/* Assignee Card */}
                                <div className="p-4 rounded-lg bg-background border shadow-sm">
                                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Assignee</h3>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={currentUser?.image} />
                                                <AvatarFallback>{analystInitial}</AvatarFallback>
                                            </Avatar>
                                            <div className="text-sm">
                                                <div className="font-medium text-foreground">{analystName}</div>
                                                <div className="text-xs text-muted-foreground">Current analyst</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Classification & Notes */}
                                <AnalystTriagePanel
                                    analysisId={incidentId} // Pass actual ID 
                                    initialStatus={status}
                                    initialClassification={null} // To be connected
                                    initialComments={[]}
                                    currentUserEmail={currentUser?.email || ""}
                                />
                            </div>
                        </ScrollArea>
                    )}

                    {/* IOCs Tab */}
                    {activeTab === "iocs" && (
                        <ScrollArea className="h-full p-4">
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-purple-500" /> Detected Observables
                                </h3>
                                <div className="space-y-2">
                                    {analysis.signals.extractedUrls.length === 0 && (
                                        <div className="text-sm text-muted-foreground p-4 text-center border border-dashed rounded-lg">No URLs detected</div>
                                    )}
                                    {analysis.signals.extractedUrls.map((url: string, i: number) => (
                                        <div key={i} className="group flex items-start justify-between p-3 rounded-md bg-background border text-sm hover:border-purple-500/50 transition-colors">
                                            <div className="font-mono text-xs break-all line-clamp-2 text-muted-foreground group-hover:text-foreground">{url}</div>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 ml-2">
                                                <MoreVertical className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </ScrollArea>
                    )}

                    {/* Timeline Tab */}
                    {activeTab === "timeline" && (
                        <ScrollArea className="h-full p-4">
                            <div className="space-y-6 pl-2">
                                {/* Mock Timeline */}
                                <div className="relative border-l border-border/50 ml-2 space-y-6 pb-4">
                                    <div className="ml-6 relative">
                                        <div className="absolute -left-[31px] bg-background border p-1 rounded-full text-green-500"><Clock className="w-3 h-3" /></div>
                                        <div className="text-sm font-medium">Incident Created</div>
                                        <div className="text-xs text-muted-foreground">System • {new Date(analysis.timestamp).toLocaleTimeString()}</div>
                                    </div>
                                    <div className="ml-6 relative">
                                        <div className="absolute -left-[31px] bg-background border p-1 rounded-full text-blue-500"><UserIcon className="w-3 h-3" /></div>
                                        <div className="text-sm font-medium">Assigned to Akmal</div>
                                        <div className="text-xs text-muted-foreground">System • Just now</div>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    )}
                </div>
            </div>
        </div>
    );
}
