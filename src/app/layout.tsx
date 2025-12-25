import type { Metadata } from "next";
import { Outfit, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import NextTopLoader from 'nextjs-toploader';
import { ThemeProvider } from "@/components/theme-provider"
import { Navbar } from "@/components/layout/Navbar";
import { auth } from "@/auth";

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

export const metadata: Metadata = {
  title: "MXLens - Secure Email Analysis",
  description: "Enterprise-grade client-side email forensics and phishing analysis.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
