import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export default function Error403() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
            <div className="h-32 w-32 bg-amber-900/20 rounded-full flex items-center justify-center text-amber-500 mb-8">
                <ShieldAlert className="h-16 w-16" />
            </div>
            <h1 className="text-6xl font-extrabold text-foreground mb-4">403</h1>
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p className="text-muted-foreground max-w-md mb-8">
                You don't have permission to view this page. This feature might be restricted to premium plans.
            </p>
            <div className="flex gap-4">
                <Link href="/pricing">
                    <Button variant="outline" className="h-12 px-8">Upgrade Plan</Button>
                </Link>
                <Link href="/">
                    <Button className="h-12 px-8">Return Home</Button>
                </Link>
            </div>
        </div>
    );
}
