"use client";

import { EmailAnalyzer } from "@/components/email/EmailAnalyzer";

export default function AnalyzePage() {
    return (
        <div className="container mx-auto py-8 min-h-screen">
            <h1 className="text-3xl font-bold mb-6">Email Analysis Studio</h1>
            <div className="bg-card border rounded-xl shadow-sm h-[calc(100vh-150px)] overflow-hidden">
                <EmailAnalyzer />
            </div>
        </div>
    );
}
