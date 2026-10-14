import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ServerCrash } from "lucide-react";

export default function Error500() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
            <div className="h-32 w-32 bg-red-900/20 rounded-full flex items-center justify-center text-destructive mb-8">
                <ServerCrash className="h-16 w-16" />
            </div>
            <h1 className="text-6xl font-extrabold text-foreground mb-4">500</h1>
            <h2 className="text-2xl font-bold mb-4">Server Error</h2>
            <p className="text-muted-foreground max-w-md mb-8">
                Something went wrong on our end. We're tracking the issue.
                Check our status page for updates.
            </p>
            <div className="flex gap-4">
                <Link href="/">
                    <Button variant="outline" className="h-12 px-8">Home</Button>
                </Link>
                <Link href="/status">
                    <Button className="h-12 px-8">Check Status</Button>
                </Link>
            </div>
        </div>
    );
}
