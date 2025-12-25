import { auth } from "@/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/layout/UserNav";
import { ModeToggle } from "@/components/ModeToggle";

export async function Navbar() {
    const session = await auth();
    const user = session?.user;

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/50 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
                    <span className="text-cyan-400">MX</span>Lens
                </Link>

                <div className="flex items-center gap-4">
                    <Link href="/features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden md:block">
                        Features
                    </Link>
                    <Link href="/pricing" className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden md:block">
                        Pricing
                    </Link>
                    <Link href="/trust-center" className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden lg:block">
                        Trust
                    </Link>

                    <ModeToggle />

                    {user ? (
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard">
                                <Button variant="outline" className="border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-400">
                                    Dashboard
                                </Button>
                            </Link>
                            <UserNav user={user} />
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link href="/auth/signin" className="text-sm font-medium text-slate-400 hover:text-white transition-colors mr-2">
                                Login
                            </Link>
                            <Link href="/auth/signup">
                                <Button className="bg-cyan-500 text-black hover:bg-cyan-400 font-semibold shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all">
                                    Sign Up
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
