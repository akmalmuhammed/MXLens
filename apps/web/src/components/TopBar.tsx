"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";

const REPO = "https://github.com/akmalmuhammed/mxlens";

export function TopBar() {
    const [theme, setTheme] = useState<"dark" | "light">("dark");

    useEffect(() => {
        try {
            const stored = localStorage.getItem("mxlens-theme") as "dark" | "light" | null;
            if (stored) setTheme(stored);
        } catch { /* storage may be blocked */ }
    }, []);

    function toggle() {
        const next = theme === "dark" ? "light" : "dark";
        setTheme(next);
        document.documentElement.setAttribute("data-theme", next);
        try { localStorage.setItem("mxlens-theme", next); } catch { /* ignore */ }
    }

    return (
        <header className="topbar">
            <div className="wrap topbar-inner">
                <Link href="/" className="brand">
                    <Logo className="mark" />
                    MXLens <small>v1</small>
                </Link>
                <nav>
                    <Link href="/docs">Docs</Link>
                    <Link href="/about">About</Link>
                    <a href={REPO} target="_blank" rel="noopener noreferrer">GitHub</a>
                    <button className="iconbtn" onClick={toggle} aria-label="Toggle light and dark theme" title="Toggle theme">
                        {theme === "dark" ? "☾" : "☀"}
                    </button>
                </nav>
            </div>
        </header>
    );
}
