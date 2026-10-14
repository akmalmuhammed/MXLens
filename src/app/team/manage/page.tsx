import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal } from "lucide-react";

export default function TeamManagePage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Team Members</h1>
                    <p className="text-muted-foreground">Manage access and roles for your workspace.</p>
                </div>
                <Button className="bg-cyan-600 hover:bg-cyan-500">Invite Member</Button>
            </div>

            <div className="border border-border rounded-lg bg-card">
                <div className="p-4 border-b border-border/50 font-medium grid grid-cols-[auto_1fr_1fr_auto] gap-4 text-sm text-muted-foreground">
                    <div className="w-8"></div>
                    <div>User</div>
                    <div>Role</div>
                    <div></div>
                </div>

                {/* User Row 1 */}
                <div className="p-4 grid grid-cols-[auto_1fr_1fr_auto] gap-4 items-center hover:bg-muted/5">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback>AK</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-medium">Akmal (You)</div>
                        <div className="text-xs text-muted-foreground">akmal@mxlens.com</div>
                    </div>
                    <div>
                        <Badge variant="outline" className="border-cyan-500/50 text-cyan-500">Admin</Badge>
                    </div>
                    <Button variant="ghost" size="sm" disabled><MoreHorizontal className="h-4 w-4" /></Button>
                </div>

                {/* User Row 2 */}
                <div className="p-4 grid grid-cols-[auto_1fr_1fr_auto] gap-4 items-center hover:bg-muted/5">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback>JS</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-medium">John Smith</div>
                        <div className="text-xs text-muted-foreground">john@mxlens.com</div>
                    </div>
                    <div>
                        <Badge variant="outline">Analyst</Badge>
                    </div>
                    <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                </div>

            </div>
        </div>
    );
}
