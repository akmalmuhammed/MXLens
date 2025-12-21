import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { ModeToggle } from "@/components/ModeToggle";
import { UserNav } from "./UserNav";

interface NavbarProps {
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
}

export function Navbar({ user }: NavbarProps) {
    return (
        <nav className="flex items-center justify-between border-b bg-background px-4 py-3 md:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold text-lg md:text-xl shrink-0">
                <div className="relative h-8 w-8 bg-cyan-500 rounded-lg flex items-center justify-center text-white mr-1">
                    <span className="font-bold">MX</span>
                </div>
                <span className="hidden md:inline-block">MXLens</span>
            </Link>

            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground absolute left-1/2 -translate-x-1/2">
                <Link href="/features" className="hover:text-cyan-500 transition-colors">Features</Link>
                <Link href="/pricing" className="hover:text-cyan-500 transition-colors">Pricing</Link>
                <Link href="/use-cases" className="hover:text-cyan-500 transition-colors">Use Cases</Link>
                <Link href="/docs" className="hover:text-cyan-500 transition-colors">Docs</Link>
                <Link href="/blog" className="hover:text-cyan-500 transition-colors">Blog</Link>
            </div>

            <div className="flex items-center gap-4">
                <ModeToggle />

                {user ? (
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <Button variant="ghost" className="text-sm font-medium hidden md:flex">
                                Dashboard
                            </Button>
                        </Link>
                        <UserNav user={user} />
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <Link href="/auth/signin">
                            <Button variant="ghost">Sign In</Button>
                        </Link>
                        <Link href="/auth/signup">
                            <Button>Sign Up</Button>
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
}
