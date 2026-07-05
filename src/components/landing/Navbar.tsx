"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#trust", label: "Trust" },
];

export const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Only show full navbar on home page, simplified on others if needed
    const isHome = pathname === "/";

    return (
        <motion.header
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "py-2" : "py-4"
                }`}
        >
            {/* Promo Banner - Optional, visible only at top */}
            {!scrolled && isHome && (
                <div className="absolute top-0 left-0 right-0 -z-10 h-full bg-transparent" />
            )}

            {/* Main Nav */}
            <nav
                className={`mx-auto container rounded-full px-6 transition-all duration-300 ${scrolled
                    ? "bg-background/90 backdrop-blur-md border border-border shadow-lg h-16 flex items-center"
                    : "bg-transparent h-20 flex items-center"
                    }`}
            >
                <div className="flex items-center justify-between w-full">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="relative">
                            <Shield className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
                            <div className="absolute inset-0 bg-primary/30 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">
                            <span className="text-primary">MX</span>
                            <span className="text-foreground">Lens</span>
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
                            >
                                {link.label}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                            </Link>
                        ))}
                    </div>

                    {/* CTA Buttons */}
                    <div className="hidden md:flex items-center gap-4">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/resources/api-docs">API Docs</Link>
                        </Button>
                        <Button size="sm" className="shadow-glow" asChild>
                            <Link href="/analyze">Analyze Free</Link>
                        </Button>
                        <Show when="signed-out">
                            <SignInButton mode="modal">
                                <Button variant="ghost" size="sm">Sign In</Button>
                            </SignInButton>
                            <SignUpButton mode="modal">
                                <Button variant="outline" size="sm">Sign Up</Button>
                            </SignUpButton>
                        </Show>
                        <Show when="signed-in">
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/dashboard">Dashboard</Link>
                            </Button>
                            <UserButton />
                        </Show>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2"
                        onClick={() => setIsOpen(!isOpen)}
                        aria-label="Toggle menu"
                    >
                        {isOpen ? (
                            <X className="h-6 w-6 text-foreground" />
                        ) : (
                            <Menu className="h-6 w-6 text-foreground" />
                        )}
                    </button>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            className="absolute top-full left-0 right-0 mx-4 rounded-xl border border-border bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden md:hidden"
                        >
                            <div className="p-4 flex flex-col gap-4">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className="text-foreground py-2 hover:text-primary transition-colors font-medium"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                                <div className="flex flex-col gap-2 pt-4 border-t border-border">
                                    <Button variant="ghost" className="w-full" asChild>
                                        <Link href="/resources/api-docs">API Docs</Link>
                                    </Button>
                                    <Button className="w-full shadow-glow" asChild>
                                        <Link href="/analyze">Analyze Free</Link>
                                    </Button>
                                    <Show when="signed-out">
                                        <SignInButton mode="modal">
                                            <Button variant="ghost" className="w-full">Sign In</Button>
                                        </SignInButton>
                                        <SignUpButton mode="modal">
                                            <Button variant="outline" className="w-full">Sign Up</Button>
                                        </SignUpButton>
                                    </Show>
                                    <Show when="signed-in">
                                        <Button variant="outline" className="w-full" asChild>
                                            <Link href="/dashboard">Dashboard</Link>
                                        </Button>
                                        <div className="flex justify-center py-2">
                                            <UserButton />
                                        </div>
                                    </Show>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>
        </motion.header>
    );
};
