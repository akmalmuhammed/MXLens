import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Hourglass } from "lucide-react";

export default function Error429() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
            <div className="h-32 w-32 bg-slate-800/50 rounded-full flex items-center justify-center text-primary mb-8 animate-pulse">
                <Hourglass className="h-16 w-16" />
            </div>
            <h1 className="text-6xl font-extrabold text-foreground mb-4">429</h1>
            <h2 className="text-2xl font-bold mb-4">Too Many Requests</h2>
            <p className="text-muted-foreground max-w-md mb-8">
                This request was rate limited temporarily. Email analysis remains free.
            </p>
            <div className="flex gap-4">
                <Link href="/analyze">
                    <Button className="h-12 px-8 bg-gradient-to-r from-primary to-cyan-400 text-black hover:opacity-90 transition-opacity">
                        Analyze Free
                    </Button>
                </Link>
                <Link href="/">
                    <Button variant="ghost" className="h-12 px-8">Return Home</Button>
                </Link>
            </div>
        </div>
    );
}
