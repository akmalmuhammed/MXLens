"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldCheck, User, LogOut } from "lucide-react";
// import { signOut } from "@/auth"; // Cannot use server action directly in client component like this easily for onClick?
// actually we can if we pass it, or use a client-side signOut from next-auth/react (but that requires SessionProvider)
// For simplicity in client component without SessionProvider, we can use a server action passed down OR just a simple form.

// Let's use a server action wrapper or just standard next-auth/react if installed.
// Since we are using "next-auth beta", client side `signOut` is available but needs provider.
// Let's stick to a Form action for SignOut for now to be robust without Context.

interface NavbarProps {
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
}

export function Navbar({ user }: NavbarProps) {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center mx-auto px-4">
                <div className="mr-4 hidden md:flex">
                    <Link href="/" className="mr-6 flex items-center space-x-2">
                        <ShieldCheck className="h-6 w-6" />
                        <span className="hidden font-bold sm:inline-block">MXLens</span>
                    </Link>
                    <nav className="flex items-center space-x-6 text-sm font-medium">
                        <Link href="/analyze" className="transition-colors hover:text-foreground/80 text-foreground/60">
                            Analyze
                        </Link>
                        {user && (
                            <Link href="/dashboard" className="transition-colors hover:text-foreground/80 text-foreground/60">
                                Dashboard
                            </Link>
                        )}
                        <Link href="/docs" className="transition-colors hover:text-foreground/80 text-foreground/60">
                            Documentation
                        </Link>
                    </nav>
                </div>

                <div className="flex flex-1 items-center justify-end space-x-2">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="h-4 w-4" />
                                <span className="hidden sm:inline-block">{user.name || user.email}</span>
                            </div>
                            <Link href="/api/auth/signout">
                                <Button variant="ghost" size="sm">
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Log out
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <nav className="flex items-center space-x-2">
                            <Link href="/auth/signin">
                                <Button variant="ghost" size="sm">
                                    Login
                                </Button>
                            </Link>
                            <Link href="/auth/register">
                                <Button size="sm">
                                    Sign Up
                                </Button>
                            </Link>
                        </nav>
                    )}
                </div>
            </div>
        </header>
    );
}
