import { TopBar } from "@/components/TopBar";
import { SiteFooter } from "@/components/SiteFooter";
import { Dashboard } from "@/components/Dashboard";

export const metadata = {
    title: "Dashboard — MXLens",
    description: "Your session threat feed, aggregated indicators and ATT&CK coverage — built from what you've analyzed on this device.",
};

export default function DashboardPage() {
    return (
        <>
            <TopBar />
            <main>
                <Dashboard />
            </main>
            <SiteFooter />
        </>
    );
}
