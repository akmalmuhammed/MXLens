import { auth } from "@/auth";
import { getIncidents } from "@/actions/analysis";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShieldAlert, Clock, User as UserIcon, ArrowRight } from "lucide-react";
import { redirect } from "next/navigation";

export default async function IncidentsPage() {
    const session = await auth();
    if (!session?.user) redirect("/auth/signin");

    const incidents = await getIncidents();

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Incident Queue</h1>
                <p className="text-muted-foreground">
                    Manage and triage security incidents across your team.
                </p>
            </div>

            <div className="border rounded-lg bg-card shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[120px]">Case ID</TableHead>
                            <TableHead className="w-[100px]">Severity</TableHead>
                            <TableHead>Subject / Analysis</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Assignee</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {incidents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    No active incidents found. Good job!
                                </TableCell>
                            </TableRow>
                        ) : (
                            incidents.map((incident) => (
                                <TableRow key={incident.id} className="group hover:bg-muted/50 transition-colors">
                                    <TableCell className="font-mono font-medium">
                                        <Link href={`/analysis/${incident.id}`} className="hover:underline text-primary">
                                            {incident.incidentId || "REQ-" + incident.id.substring(0, 6)}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            incident.severity === "CRITICAL" ? "destructive" :
                                                incident.severity === "HIGH" ? "destructive" :
                                                    incident.severity === "MEDIUM" ? "default" : "secondary"
                                        } className="uppercase text-[10px]">
                                            {incident.severity}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {incident.verdict === "MALICIOUS" && <ShieldAlert className="w-4 h-4 text-red-500" />}
                                            <span className="font-medium">
                                                {/* Meta subject or generic */}
                                                {(incident.meta as { subject?: string })?.subject || "Suspicious Email Analysis"}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">
                                            {incident.triageStatus.replace("_", " ").toLowerCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {incident.assignee ? (
                                                <>
                                                    <Avatar className="w-6 h-6">
                                                        <AvatarImage src={incident.assignee.image || ""} />
                                                        <AvatarFallback>{incident.assignee.name?.[0] || "?"}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm truncate max-w-[120px]">
                                                        {incident.assignee.name}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-sm text-muted-foreground italic flex items-center gap-1">
                                                    <UserIcon className="w-3 h-3" /> Unassigned
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-xs">
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(incident.createdAt).toLocaleDateString()}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/analysis/${incident.id}`}>
                                                Open <ArrowRight className="ml-1 w-3 h-3" />
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
