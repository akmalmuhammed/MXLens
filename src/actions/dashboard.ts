"use server";

import { auth } from "@/auth";

export async function getDashboardStats() {
    const session = await auth();

    // Mock Data
    return {
        totalAnalyses: 142,
        safeCount: 118,
        threatCount: 24,
        recentActivity: [
            { id: 1, name: "Invoice_Urgent_1.pdf", time: "2 mins ago", status: "High Risk" },
            { id: 2, name: "Meeting_Notes.docx", time: "1 hour ago", status: "Safe" },
            { id: 3, name: "Shipping_Label.pdf", time: "3 hours ago", status: "Safe" },
            { id: 4, name: "Account_Verify.html", time: "Yesterday", status: "High Risk" },
            { id: 5, name: "Resume_J_Doe.pdf", time: "Yesterday", status: "Safe" },
        ]
    };
}
