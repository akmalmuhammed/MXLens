import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { Outfit, Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import NextTopLoader from 'nextjs-toploader';
import { ThemeProvider } from "@/components/theme-provider"
import { Navbar } from "@/components/layout/Navbar";
import { NavbarUtils } from "@/components/layout/NavbarUtils";
import { PostHogProvider } from "@/providers/PostHogProvider";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
});

export const metadata: Metadata = {
  title: "MXLens - Secure Email Analysis",
  description: "Enterprise-grade client-side email forensics and phishing analysis.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} ${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <ClerkProvider appearance={{ theme: shadcn }}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <PostHogProvider>
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
          <Analytics />
          </PostHogProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
