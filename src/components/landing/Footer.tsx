"use client";

import { Shield, Github, Twitter, Linkedin } from "lucide-react";
import Link from "next/link";

const footerLinks = {
    Product: [
        { label: "Features", href: "#features" },
        { label: "Pricing", href: "#pricing" },
        { label: "Changelog", href: "#" },
        { label: "Documentation", href: "#" },
    ],
    Company: [
        { label: "About", href: "#" },
        { label: "Blog", href: "#" },
        { label: "Careers", href: "#" },
        { label: "Contact", href: "#" },
    ],
    Legal: [
        { label: "Privacy", href: "#" },
        { label: "Terms", href: "#" },
        { label: "Security", href: "#" },
    ],
};

const socialLinks = [
    { icon: Github, href: "#", label: "GitHub" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
];

export const Footer = () => {
    return (
        <footer className="border-t border-border bg-card/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                    {/* Logo column */}
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <Shield className="h-7 w-7 text-primary" />
                            <span className="font-bold text-lg">
                                <span className="text-primary">MX</span>
                                <span className="text-foreground">Lens</span>
                            </span>
                        </Link>
                        <p className="text-sm text-muted-foreground mb-6">
                            Secure email analysis.
                            <br />
                            Zero data exfiltration.
                        </p>
                        <div className="flex items-center gap-4">
                            {socialLinks.map((social, i) => (
                                <a
                                    key={i}
                                    href={social.href}
                                    aria-label={social.label}
                                    className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                >
                                    <social.icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Link columns */}
                    {Object.entries(footerLinks).map(([title, links]) => (
                        <div key={title}>
                            <h4 className="font-semibold text-foreground mb-4">{title}</h4>
                            <ul className="space-y-3">
                                {links.map((link, i) => (
                                    <li key={i}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom bar */}
                <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} MXLens. All rights reserved.
                    </p>
                    <p className="text-xs font-mono text-muted-foreground/70">
                        Built with 🔒 for security teams worldwide
                    </p>
                </div>
            </div>
        </footer>
    );
};
