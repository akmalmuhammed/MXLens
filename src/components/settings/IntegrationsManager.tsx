"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveIntegration } from "@/actions/integrations";
import { Loader2, Plus, Trash2, CheckCircle2, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Integration {
    id: string;
    name: string;
    type: "SLACK" | "JIRA" | "MICROSOFT_TEAMS" | "SPLUNK" | "GENERIC_WEBHOOK";
    isActive: boolean;
    updatedAt: Date;
}

const PROVIDERS = [
    { value: "JIRA", label: "Jira Service Management", icon: "🟦" },
    { value: "MICROSOFT_TEAMS", label: "Microsoft 365 (Graph API)", icon: "🪟" },
    { value: "GENERIC_WEBHOOK", label: "ServiceNow / Generic Webhook", icon: "🔗" },
    { value: "SLACK", label: "Slack Alerts", icon: "📢" },
];

export function IntegrationsManager({ initialIntegrations }: { initialIntegrations: Integration[] }) {
    const [integrations, setIntegrations] = useState<Integration[]>(initialIntegrations);
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State
    const [newType, setNewType] = useState<string>("JIRA");
    const [newName, setNewName] = useState("");
    const [newConfig, setNewConfig] = useState<Record<string, string>>({});

    const handleSave = async () => {
        if (!newName) return;
        setLoading(true);

        // Basic Config mapping based on type
        // This acts as a simple builder. Real app would have dynamic forms per type.
        const configToSave = { ...newConfig };

        const res = await saveIntegration({
            name: newName,
            type: newType as any,
            config: configToSave
        });

        if (res.success) {
            // Ideally re-fetch or optimistically update. 
            // For MVP, just reload or basic append (missing real dates/ids)
            window.location.reload();
        } else {
            alert("Failed to save integration");
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {integrations.map((int) => (
                    <Card key={int.id} className="group hover:border-primary/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {int.name}
                            </CardTitle>
                            <Badge variant={int.isActive ? "default" : "secondary"}>
                                {int.isActive ? "Active" : "Paused"}
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold flex items-center gap-2">
                                {PROVIDERS.find(p => p.value === int.type)?.icon || "🔌"}
                                {int.type.replace("_", " ")}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Last updated: {new Date(int.updatedAt).toLocaleDateString()}
                            </p>
                        </CardContent>
                    </Card>
                ))}

                {/* Add New Button Card */}
                {!isAdding && (
                    <Button
                        variant="outline"
                        className="h-full min-h-[140px] border-dashed border-2 flex flex-col gap-2 hover:border-primary hover:bg-muted/50"
                        onClick={() => setIsAdding(true)}
                    >
                        <Plus className="w-8 h-8 text-muted-foreground" />
                        <span className="font-semibold text-muted-foreground">Connect New Integration</span>
                    </Button>
                )}
            </div>

            {isAdding && (
                <Card className="border-primary">
                    <CardHeader>
                        <CardTitle>Configure Integration</CardTitle>
                        <CardDescription>
                            All credentials are encrypted with AES-256-GCM before storage.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Provider</Label>
                            <Select value={newType} onValueChange={setNewType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PROVIDERS.map(p => (
                                        <SelectItem key={p.value} value={p.value}>
                                            <span className="mr-2">{p.icon}</span>{p.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label>Friendly Name</Label>
                            <Input
                                placeholder="e.g. My Prod Jira"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                            />
                        </div>

                        <Separator className="my-2" />

                        {/* Dynamic Config Fields based on Type */}
                        {newType === "JIRA" && (
                            <>
                                <div className="grid gap-2">
                                    <Label>Jira Domain URL</Label>
                                    <Input
                                        placeholder="https://acme.atlassian.net"
                                        onChange={(e) => setNewConfig({ ...newConfig, domain: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>API Key / Token</Label>
                                    <Input
                                        type="password"
                                        placeholder="Sk-..."
                                        onChange={(e) => setNewConfig({ ...newConfig, apiKey: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>User Email (for Auth)</Label>
                                    <Input
                                        placeholder="admin@acme.com"
                                        onChange={(e) => setNewConfig({ ...newConfig, email: e.target.value })}
                                    />
                                </div>
                            </>
                        )}

                        {newType === "MICROSOFT_TEAMS" && (
                            <div className="p-4 bg-muted rounded-md text-sm text-muted-foreground flex gap-2">
                                <Shield className="w-5 h-5" />
                                <span>For Microsoft 365, we use OAuth. Please click "Connect" to start the admin consent flow. (Coming Soon)</span>
                            </div>
                        )}

                        {newType === "GENERIC_WEBHOOK" && (
                            <div className="grid gap-2">
                                <Label>Select Webhook Secret (Optional)</Label>
                                <Input
                                    type="password"
                                    placeholder="Secret to validate signatures..."
                                    onChange={(e) => setNewConfig({ ...newConfig, secret: e.target.value })}
                                />
                            </div>
                        )}

                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                            Save Securely
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}
