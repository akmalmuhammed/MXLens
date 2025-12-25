import { Button } from "@/components/ui/button";
import { Download, FileText, CheckCircle2 } from "lucide-react";

const INVOICES = [
    { id: "inv_38192", date: "Dec 01, 2025", amount: "$29.00", status: "Paid", description: "Pro Analyst - Monthly" },
    { id: "inv_38191", date: "Nov 01, 2025", amount: "$29.00", status: "Paid", description: "Pro Analyst - Monthly" },
    { id: "inv_38190", date: "Oct 01, 2025", amount: "$29.00", status: "Paid", description: "Pro Analyst - Monthly" },
];

export default function InvoicesPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Invoices</h1>
                <p className="text-muted-foreground">View and download your payment history.</p>
            </div>

            <div className="border rounded-lg bg-card">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 border-b">
                        <tr>
                            <th className="px-6 py-4 font-medium text-muted-foreground">Invoice ID</th>
                            <th className="px-6 py-4 font-medium text-muted-foreground">Date</th>
                            <th className="px-6 py-4 font-medium text-muted-foreground">Description</th>
                            <th className="px-6 py-4 font-medium text-muted-foreground">Amount</th>
                            <th className="px-6 py-4 font-medium text-muted-foreground text-right">Status</th>
                            <th className="px-6 py-4 font-medium text-muted-foreground text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {INVOICES.map((inv) => (
                            <tr key={inv.id} className="hover:bg-muted/30">
                                <td className="px-6 py-4 font-mono font-medium">{inv.id}</td>
                                <td className="px-6 py-4">{inv.date}</td>
                                <td className="px-6 py-4">{inv.description}</td>
                                <td className="px-6 py-4 font-medium">{inv.amount}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-medium">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        {inv.status}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Button variant="ghost" size="sm">
                                        <Download className="w-4 h-4 mr-2" /> PDF
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
