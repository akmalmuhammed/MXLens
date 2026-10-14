import type { Metadata } from "next";
import "./globals.css";
import { CommandPalette } from "@/components/CommandPalette";

export const metadata: Metadata = {
    title: "MXLens — email phishing analysis",
    description: "Drop an email, get an explained phishing verdict. Parsing and scoring run in your browser; message content is never uploaded.",
    applicationName: "MXLens",
    openGraph: { title: "MXLens", description: "Explainable, privacy-first email phishing analysis.", type: "website" },
    robots: { index: true, follow: true },
};

// Honor a saved theme before paint; default is light.
const THEME_INIT = `(function(){try{var t=localStorage.getItem("mxlens-theme");if(t)document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
            </head>
            <body>
                {children}
                <CommandPalette />
            </body>
        </html>
    );
}
