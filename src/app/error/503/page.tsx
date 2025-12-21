import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wrench } from "lucide-react";

export default function Error503() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
            <div className="h-32 w-32 bg-blue-900/20 rounded-full flex items-center justify-center text-blue-500 mb-8 animate-spin-slow">
                <Wrench className="h-16 w-16" />
            </div>
            <h1 className="text-6xl font-extrabold text-foreground mb-4">503</h1>
            <h2 className="text-2xl font-bold mb-4">Under Maintenance</h2>
            <p className="text-muted-foreground max-w-md mb-8">
                We're performing scheduled upgrades to improve security and performance.
                We'll be back shortly.
            </p>
            <Link href="/status">
                <Button variant="outline" className="h-12 px-8">Check Status</Button>
            </Link>
        </div>
    );
}
