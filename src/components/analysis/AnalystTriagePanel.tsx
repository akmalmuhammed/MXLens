"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, CheckCircle2, AlertTriangle, Archive, ChevronDown, Send } from "lucide-react";
import { updateTriageStatus, updateClassification, addComment } from "@/actions/analysis";
import { cn } from "@/lib/utils";

type TriageStatus = "OPEN" | "IN_PROGRESS" | "CLOSED" | "ARCHIVED";
type AnalysisClassification = "TRUE_POSITIVE" | "FALSE_POSITIVE" | "UNDETERMINED";

interface Comment {
    id: string;
    content: string;
    createdAt: Date;
    user: {
        name: string | null;
        image: string | null;
    };
}

interface AnalystTriagePanelProps {
    analysisId: string;
    initialStatus: TriageStatus;
    initialClassification: AnalysisClassification | null;
    initialComments: Comment[];
    currentUserEmail: string;
    onStatusChange?: (status: TriageStatus) => void; // Callback for instant parent update
}

export function AnalystTriagePanel({
    analysisId,
    initialStatus,
    initialClassification,
    initialComments,
    currentUserEmail,
    onStatusChange
}: AnalystTriagePanelProps) {
    const [status, setStatus] = useState<TriageStatus>(initialStatus);
    const [classification, setClassification] = useState<AnalysisClassification | null>(initialClassification);
    const [comments, setComments] = useState<Comment[]>(initialComments);
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOpen, setIsOpen] = useState(false); // Collapsible state

    async function handleStatusChange(newStatus: TriageStatus) {
        setStatus(newStatus);
        // Immediately notify parent for instant UI update
        if (onStatusChange) onStatusChange(newStatus);
        // Then persist to server (non-blocking)
        updateTriageStatus(analysisId, newStatus);
    }

    async function handleClassificationChange(value: string) {
        const newClass = value as AnalysisClassification;
        setClassification(newClass);
        await updateClassification(analysisId, newClass);
    }

    async function handleAddComment() {
        if (!newComment.trim()) return;
        setIsSubmitting(true);

        try {
            const result = await addComment(analysisId, newComment);
            if (result.success && result.comment) {
                setComments([...comments, {
                    ...result.comment,
                    user: result.comment.user
                }]);
                setNewComment("");
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    // Styles for statuses
    const statusColors = {
        OPEN: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        IN_PROGRESS: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        CLOSED: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        ARCHIVED: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    };

    return (
        <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
            {/* Header / Summary Bar */}
            <div className="p-4 flex items-center justify-between border-b bg-muted/20">
                <div className="flex items-center gap-3">
                    <h3 className="font-semibold flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-primary" />
                        Analyst Triage
                    </h3>
                    <Badge variant="outline" className={cn("capitalize", statusColors[status])}>
                        {status.replace("_", " ")}
                    </Badge>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant={status === 'CLOSED' ? "secondary" : "default"}
                        size="sm"
                        onClick={() => handleStatusChange(status === 'CLOSED' ? 'OPEN' : 'CLOSED')}
                    >
                        {status === 'CLOSED' ? 'Reopen Case' : 'Close Case'}
                    </Button>
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* Classification Section */}
                <div className="bg-background/50 p-3 rounded-lg border space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Verification</label>
                    <div className="flex gap-2">
                        <Select
                            value={classification || ""}
                            onValueChange={handleClassificationChange}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select Verification..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TRUE_POSITIVE">
                                    <div className="flex items-center gap-2 text-rose-500">
                                        <AlertTriangle className="w-4 h-4" /> True Positive (Confirmed Threat)
                                    </div>
                                </SelectItem>
                                <SelectItem value="FALSE_POSITIVE">
                                    <div className="flex items-center gap-2 text-emerald-500">
                                        <CheckCircle2 className="w-4 h-4" /> False Positive (Safe)
                                    </div>
                                </SelectItem>
                                <SelectItem value="UNDETERMINED">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <AlertTriangle className="w-4 h-4" /> Undetermined
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Comments Section */}
                <div className="space-y-4">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Investigation Notes</label>

                    <div className="h-[200px] overflow-y-auto pr-4 border rounded-md p-2">
                        <div className="space-y-4">
                            {comments.length === 0 && (
                                <p className="text-sm text-muted-foreground italic text-center py-4">No notes added yet.</p>
                            )}
                            {comments.map((comment) => (
                                <div key={comment.id} className="flex gap-3 text-sm">
                                    <Avatar className="w-8 h-8">
                                        <AvatarImage src={comment.user.image || ""} />
                                        <AvatarFallback>{comment.user.name?.charAt(0) || "U"}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold">{comment.user.name || "Unknown"}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(comment.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-muted-foreground leading-relaxed">{comment.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Add Comment Input */}
                    <div className="flex gap-2">
                        <Textarea
                            placeholder="Add a note..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="min-h-[60px] resize-none"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddComment();
                                }
                            }}
                        />
                        <Button
                            size="icon"
                            className="h-[60px] w-[60px]"
                            disabled={!newComment.trim() || isSubmitting}
                            onClick={handleAddComment}
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
