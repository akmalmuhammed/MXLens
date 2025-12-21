import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function ProfilePage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Profile Settings</h1>
                <p className="text-muted-foreground">Manage your personal information and preferences.</p>
            </div>

            <div className="grid gap-6 max-w-xl">
                <div className="grid gap-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input id="name" defaultValue="Akmal" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" defaultValue="user@example.com" disabled />
                    <p className="text-xs text-muted-foreground">Contact support to change your email.</p>
                </div>
            </div>

            <div className="pt-8 border-t border-border/50">
                <h2 className="text-lg font-semibold mb-4 text-cyan-500">Privacy & Security</h2>

                <div className="flex items-center justify-between py-4">
                    <div className="space-y-0.5">
                        <Label>Default to Zero Retention</Label>
                        <p className="text-sm text-muted-foreground">Automatically delete analysis history after 24 hours.</p>
                    </div>
                    <Switch />
                </div>

                <div className="flex items-center justify-between py-4 border-t border-border/50">
                    <div className="space-y-0.5">
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive weekly security summaries.</p>
                    </div>
                    <Switch defaultChecked />
                </div>
            </div>

            <div className="flex justify-end">
                <Button>Save Changes</Button>
            </div>
        </div>
    );
}
