import { Footer } from "@/components/landing/Footer";

export default function CookiePolicyPage() {
    return (
        <div className="min-h-screen bg-black text-foreground flex flex-col">
            <div className="container mx-auto px-4 py-24 prose prose-invert max-w-3xl flex-1">
                <h1>Cookie Policy</h1>
                <p>MXLens uses minimal cookies ensuring the tool functions correctly.</p>

                <h3>Essential Cookies</h3>
                <ul>
                    <li><strong>session-token</strong> (Auth): Used to keep you logged in.</li>
                    <li><strong>theme</strong>: Used to remember your Light/Dark mode preference.</li>
                </ul>

                <h3>Analytics</h3>
                <p>
                    We use privacy-first analytics that do not set tracking cookies across sites.
                </p>
            </div>
            <Footer />
        </div>
    )
}
