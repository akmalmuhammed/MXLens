"use client";

import { useMemo, useState, useTransition } from "react";
import { createApiKey, revokeApiKey, type ApiKeyListItem } from "@/actions/api-keys";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Check, Copy, Key, Plus, Trash2 } from "lucide-react";

interface ApiKeysClientProps {
    initialKeys: ApiKeyListItem[];
}

export function ApiKeysClient({ initialKeys }: ApiKeysClientProps) {
    const [keys, setKeys] = useState(initialKeys);
    const [showNewKeyForm, setShowNewKeyForm] = useState(false);
    const [newKeyName, setNewKeyName] = useState("");
    const [scopes, setScopes] = useState({ read: true, write: true });
    const [createdSecret, setCreatedSecret] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const activeKeys = useMemo(() => keys.filter(key => key.isActive), [keys]);

    const handleCreateKey = () => {
        setError(null);
        setCreatedSecret(null);

        startTransition(async () => {
            try {
                const selectedScopes = [
                    scopes.read ? "analyze:read" as const : null,
                    scopes.write ? "analyze:write" as const : null
                ].filter(Boolean) as ("analyze:read" | "analyze:write")[];

                const result = await createApiKey({
                    name: newKeyName,
                    scopes: selectedScopes
                });

                if ("error" in result && result.error) {
                    setError(result.error);
                    return;
                }

                if ("apiKey" in result && result.apiKey && "key" in result) {
                    setKeys(prev => [result.apiKey, ...prev]);
                    setCreatedSecret(result.key);
                    setShowNewKeyForm(false);
                    setNewKeyName("");
                    setScopes({ read: true, write: true });
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to create API key");
            }
        });
    };

    const handleRevokeKey = (keyId: string) => {
        const confirmed = window.confirm("Revoke this API key?");
        if (!confirmed) return;

        setError(null);
        startTransition(async () => {
            try {
                const result = await revokeApiKey(keyId);
                if (result?.error) {
                    setError(result.error);
                    return;
                }

                setKeys(prev => prev.map(key => key.id === keyId ? { ...key, isActive: false } : key));
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to revoke API key");
            }
        });
    };

    const copySecret = async () => {
        if (!createdSecret) return;

        await navigator.clipboard.writeText(createdSecret);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-heading flex items-center gap-3">
                        <Key className="w-8 h-8 text-primary" />
                        API Keys
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage agent and automation access for this organization.
                    </p>
                </div>
                <Button onClick={() => setShowNewKeyForm(true)} className="gap-2 self-start sm:self-auto">
                    <Plus className="w-4 h-4" />
                    Create Key
                </Button>
            </div>

            {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                    {error}
                </div>
            )}

            {createdSecret && (
                <Card className="border-emerald-500/40 bg-emerald-500/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-emerald-500">
                            <Check className="h-5 w-5" />
                            Key Created
                        </CardTitle>
                        <CardDescription>
                            Copy this key now. MXLens stores only its hash and will not show it again.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3 sm:flex-row">
                        <Input value={createdSecret} readOnly className="font-mono text-xs" />
                        <Button type="button" onClick={copySecret} className="gap-2 sm:w-36">
                            <Copy className="h-4 w-4" />
                            {copied ? "Copied" : "Copy"}
                        </Button>
                    </CardContent>
                </Card>
            )}

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                    <p className="font-medium text-amber-500">Plan Requirement</p>
                    <p className="text-sm text-muted-foreground">
                        API and MCP access is available on PRO and ENTERPRISE plans.
                    </p>
                </div>
            </div>

            {showNewKeyForm && (
                <Card className="border-primary/50">
                    <CardHeader>
                        <CardTitle>Create API Key</CardTitle>
                        <CardDescription>
                            Use a distinct key per automation, IDE, or integration.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="keyName">Name</Label>
                            <Input
                                id="keyName"
                                placeholder="Claude Code, Codex, n8n, SIEM connector"
                                value={newKeyName}
                                onChange={(event) => setNewKeyName(event.target.value)}
                                maxLength={80}
                            />
                        </div>
                        <div className="space-y-3">
                            <Label>Scopes</Label>
                            <label className="flex items-center gap-3 text-sm">
                                <input
                                    type="checkbox"
                                    checked={scopes.write}
                                    onChange={(event) => setScopes(prev => ({ ...prev, write: event.target.checked }))}
                                />
                                Submit analyses and batches
                            </label>
                            <label className="flex items-center gap-3 text-sm">
                                <input
                                    type="checkbox"
                                    checked={scopes.read}
                                    onChange={(event) => setScopes(prev => ({ ...prev, read: event.target.checked }))}
                                />
                                Read analysis and batch results
                            </label>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleCreateKey} disabled={!newKeyName.trim() || (!scopes.read && !scopes.write) || isPending}>
                                Generate
                            </Button>
                            <Button variant="outline" onClick={() => setShowNewKeyForm(false)} disabled={isPending}>
                                Cancel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Active Keys</CardTitle>
                    <CardDescription>
                        {activeKeys.length} active API {activeKeys.length === 1 ? "key" : "keys"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {keys.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Key className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No API keys created yet.</p>
                            <Button variant="outline" className="mt-4" onClick={() => setShowNewKeyForm(true)}>
                                Create First Key
                            </Button>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {keys.map((key) => (
                                <div key={key.id} className="py-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-medium">{key.name}</span>
                                            {!key.isActive && <Badge variant="secondary">Revoked</Badge>}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                            <code className="bg-muted px-2 py-0.5 rounded text-xs">
                                                {key.keyPrefix}...
                                            </code>
                                            <span>Created {formatDate(key.createdAt)}</span>
                                            {key.lastUsedAt && <span>Last used {formatDate(key.lastUsedAt)}</span>}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {key.scopes.map(scope => (
                                                <Badge key={scope} variant="outline">{scope}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="gap-2 text-red-500 hover:text-red-600 hover:bg-red-500/10 self-start lg:self-auto"
                                        onClick={() => handleRevokeKey(key.id)}
                                        disabled={!key.isActive || isPending}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Revoke
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
    }).format(new Date(value));
}
