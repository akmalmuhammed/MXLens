import type { Metadata } from "next";
// Fonts are bundled from npm so builds and self-hosted instances never call Google Fonts.
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"
import { Navbar } from "@/components/layout/Navbar";
import { NavbarUtils } from "@/components/layout/NavbarUtils";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "MXLens - Open-source email phishing analyzer",
  description: "Free, open-source phishing analysis for .eml files. Runs in your browser or on your own server.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {/* Skip Link for Keyboard Users */}
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <NavbarUtils>
            <Navbar />
          </NavbarUtils>
          <main id="main-content" className="min-h-screen" role="main">
            {children}
          </main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
