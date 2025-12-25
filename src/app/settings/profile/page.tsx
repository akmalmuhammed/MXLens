import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { auth } from "@/auth";
import { updateProfile } from "@/actions/settings";
import { SubmitButton } from "@/components/auth/SubmitButton";

export default async function ProfilePage() {
    const session = await auth();
    const user = session?.user;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Profile Settings</h1>
                <p className="text-muted-foreground">Manage your personal information and preferences.</p>
            </div>

            <form action={updateProfile} className="grid gap-6 max-w-xl">
                <div className="grid gap-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input id="name" name="name" defaultValue={user?.name || ""} placeholder="Your Name" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" defaultValue={user?.email || ""} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">Contact support to change your email.</p>
                </div>

                <div className="flex justify-end pt-4">
                    <SubmitButton>Save Changes</SubmitButton>
                </div>
            </form>

            <div className="pt-8 border-t border-border/50">
                <h2 className="text-lg font-semibold mb-4 text-cyan-500">Privacy & Security</h2>

                <div className="flex items-center justify-between py-4">
                    <div className="space-y-0.5">
                        <Label>Default to Zero Retention</Label>
                        <p className="text-sm text-muted-foreground">Automatically delete analysis history after 24 hours.</p>
                    </div>
                    <Switch disabled />
                </div>

                <div className="flex items-center justify-between py-4 border-t border-border/50">
                    <div className="space-y-0.5">
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive weekly security summaries.</p>
                    </div>
                    <Switch defaultChecked disabled />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Privacy settings coming in next update.</p>
            </div>
        </div>
    );
}

