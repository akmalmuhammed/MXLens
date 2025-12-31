"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MoreHorizontal, ShieldAlert, Ban, CheckCircle, Eye } from "lucide-react";
import { suspendUser, unsuspendUser } from "@/actions/admin/emergency";
import { toast } from "sonner"; // Assuming sonner or use-toast is used
import Link from "next/link";

interface UserActionsMenuProps {
    userId: string;
    userName: string;
    status: string; // "active" | "suspended" | "inactive"
}

export function UserActionsMenu({ userId, userName, status }: UserActionsMenuProps) {
    const [openDialog, setOpenDialog] = useState(false);
    const [reason, setReason] = useState("");
    const [isPending, startTransition] = useTransition();

    const isSuspended = status === "suspended";

    const handleSuspend = async () => {
        if (!reason && !isSuspended) return; // Require reason for suspension

        startTransition(async () => {
            try {
                if (isSuspended) {
                    await unsuspendUser(userId);
                    toast.success("User unsuspended successfully");
                } else {
                    await suspendUser(userId, reason);
                    toast.success("User suspended and sessions revoked");
                }
                setOpenDialog(false);
                setReason("");
            } catch (error) {
                toast.error("Action failed: " + (error as Error).message);
            }
        });
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                        <Link href={`/admin/users/${userId}`} className="flex items-center cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" /> View Details
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {isSuspended ? (
                        <DropdownMenuItem
                            onClick={() => setOpenDialog(true)}
                            className="text-green-600 focus:text-green-600 focus:bg-green-50"
                        >
                            <CheckCircle className="mr-2 h-4 w-4" /> Unsuspend Account
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem
                            onClick={() => setOpenDialog(true)}
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                        >
                            <Ban className="mr-2 h-4 w-4" /> Suspend Account
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {isSuspended ? (
                                <>
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    Unsuspend User?
                                </>
                            ) : (
                                <>
                                    <ShieldAlert className="w-5 h-5 text-destructive" />
                                    Suspend User?
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {isSuspended
                                ? `Are you sure you want to restore access for ${userName}? They will be able to log in again.`
                                : `This will immediately revoke all sessions for ${userName} and prevent them from logging in.`
                            }
                        </DialogDescription>
                    </DialogHeader>

                    {!isSuspended && (
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <label htmlFor="reason" className="text-sm font-medium">
                                    Suspension Reason (Required)
                                </label>
                                <Textarea
                                    id="reason"
                                    placeholder="Violation of terms of service..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className={!reason ? "border-destructive/50" : ""}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenDialog(false)} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button
                            variant={isSuspended ? "default" : "destructive"}
                            onClick={handleSuspend}
                            disabled={isPending || (!isSuspended && !reason)}
                        >
                            {isPending ? "Processing..." : (isSuspended ? "Unsuspend User" : "Suspend Account")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
