"use client";

import { Settings, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Settings className="h-6 w-6 text-primary" />
                    Settings
                </h1>
                <p className="text-muted-foreground font-mono text-sm">
                    Platform configuration and preferences
                </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 space-y-4">
                <h2 className="text-lg font-semibold">General Settings</h2>
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label>Platform Name</Label>
                        <Input defaultValue="MXLens" />
                    </div>
                    <div className="grid gap-2">
                        <Label>Support Email</Label>
                        <Input defaultValue="support@mxlens.com" type="email" />
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <Button className="gap-2">
                    <Save className="h-4 w-4" />
                    Save Changes
                </Button>
            </div>
        </div>
    );
}
