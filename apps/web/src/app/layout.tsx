import type { Metadata } from "next";
import { Spline_Sans, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";
import { CommandPalette } from "@/components/CommandPalette";

const sans = Spline_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-sans", display: "swap" });
const mono = Spline_Sans_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
    title: "MXLens — email phishing analysis",
    description: "Drop an email, get an explained phishing verdict. Parsing and scoring run in your browser; message content is never uploaded.",
    applicationName: "MXLens",
    openGraph: { title: "MXLens", description: "Explainable, privacy-first email phishing analysis.", type: "website" },
    robots: { index: true, follow: true },
};

const THEME_INIT = `(function(){try{var t=localStorage.getItem("mxlens-theme");if(t)document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
                <style>{`:root{--sans:${sans.style.fontFamily},ui-sans-serif,system-ui,sans-serif;--mono:${mono.style.fontFamily},ui-monospace,monospace;}`}</style>
            </head>
            <body className={`${sans.variable} ${mono.variable}`}>
                {children}
                <CommandPalette />
            </body>
        </html>
    );
}
