import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";

export default function SecuritySettingsPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Security</h1>
                <p className="text-muted-foreground">Protect your account and sessions.</p>
            </div>

            <div className="border border-amber-500/20 bg-amber-500/5 rounded-lg p-6 flex items-start gap-4">
                <Shield className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
                <div>
                    <h3 className="font-bold text-amber-500 mb-1">2-Factor Authentication Recommended</h3>
                    <p className="text-sm text-muted-foreground mb-4">Add an extra layer of security to your account by enabling 2FA.</p>
                    <Button variant="outline" size="sm" className="border-amber-500/50 hover:bg-amber-500/10 text-amber-500">Enable 2FA</Button>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold mb-4">Change Password</h3>
                    <div className="grid gap-4 max-w-sm">
                        <div className="space-y-2">
                            <Label>Current Password</Label>
                            <Input type="password" />
                        </div>
                        <div className="space-y-2">
                            <Label>New Password</Label>
                            <Input type="password" />
                        </div>
                        <div className="space-y-2">
                            <Label>Confirm New Password</Label>
                            <Input type="password" />
                        </div>
                        <Button className="w-full">Update Password</Button>
                    </div>
                </div>

                <div className="pt-8 border-t">
                    <h3 className="text-lg font-semibold mb-4">Active Sessions</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <p className="font-medium">Windows 10 • Chrome</p>
                                <p className="text-xs text-muted-foreground">San Francisco, US • Current Session</p>
                            </div>
                            <div className="text-sm text-emerald-500 font-medium">Active</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
