"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Plus, Copy, Trash2, Eye, EyeOff, AlertTriangle } from "lucide-react";

// Mock data for now - in production this would come from the server
const mockApiKeys = [
    {
        id: "1",
        name: "CI Pipeline",
        prefix: "mx_live_abc...",
        createdAt: new Date("2024-12-01"),
        lastUsed: new Date("2024-12-24"),
    },
    {
        id: "2",
        name: "Splunk Integration",
        prefix: "mx_live_def...",
        createdAt: new Date("2024-11-15"),
        lastUsed: null,
    }
];

export default function ApiKeysPage() {
    const [keys] = useState(mockApiKeys);
    const [showNewKeyForm, setShowNewKeyForm] = useState(false);
    const [newKeyName, setNewKeyName] = useState("");

    const handleCreateKey = async () => {
        // In production: call server action to create key
        alert("API key creation will be implemented with backend integration.");
        setShowNewKeyForm(false);
        setNewKeyName("");
    };

    const handleRevokeKey = async (keyId: string) => {
        if (confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) {
            // In production: call server action to revoke key
            alert(`Key ${keyId} would be revoked.`);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-heading flex items-center gap-3">
                        <Key className="w-8 h-8 text-primary" />
                        API Keys
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage API keys for programmatic access to MXLens.
                    </p>
                </div>
                <Button onClick={() => setShowNewKeyForm(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create New Key
                </Button>
            </div>

            {/* Enterprise Notice */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                    <p className="font-medium text-amber-500">Enterprise Feature</p>
                    <p className="text-sm text-muted-foreground">
                        API access is available on Team and Enterprise plans.
                        <a href="/pricing" className="text-primary hover:underline ml-1">Upgrade your plan</a> to enable API integrations.
                    </p>
                </div>
            </div>

            {/* New Key Form */}
            {showNewKeyForm && (
                <Card className="border-primary/50">
                    <CardHeader>
                        <CardTitle>Create New API Key</CardTitle>
                        <CardDescription>
                            API keys allow external systems to authenticate with MXLens.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="keyName">Key Name</Label>
                            <Input
                                id="keyName"
                                placeholder="e.g., CI Pipeline, SIEM Integration"
                                value={newKeyName}
                                onChange={(e) => setNewKeyName(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Choose a descriptive name to identify this key's purpose.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleCreateKey} disabled={!newKeyName}>
                                Generate Key
                            </Button>
                            <Button variant="outline" onClick={() => setShowNewKeyForm(false)}>
                                Cancel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Existing Keys */}
            <Card>
                <CardHeader>
                    <CardTitle>Active Keys</CardTitle>
                    <CardDescription>
                        {keys.length} active API {keys.length === 1 ? 'key' : 'keys'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {keys.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Key className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No API keys created yet.</p>
                            <Button variant="outline" className="mt-4" onClick={() => setShowNewKeyForm(true)}>
                                Create your first key
                            </Button>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {keys.map((key) => (
                                <div key={key.id} className="py-4 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <div className="font-medium">{key.name}</div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <code className="bg-muted px-2 py-0.5 rounded text-xs">
                                                {key.prefix}
                                            </code>
                                            <span>Created {key.createdAt.toLocaleDateString()}</span>
                                            {key.lastUsed && (
                                                <span className="text-green-500">
                                                    Last used {key.lastUsed.toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => navigator.clipboard.writeText(key.prefix)}
                                            title="Copy key prefix"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                            onClick={() => handleRevokeKey(key.id)}
                                            title="Revoke key"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* API Documentation Link */}
            <Card className="bg-muted/20">
                <CardContent className="py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold">API Documentation</h3>
                            <p className="text-sm text-muted-foreground">
                                Learn how to integrate MXLens into your security workflows.
                            </p>
                        </div>
                        <Button variant="outline" disabled>
                            Coming Soon
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
