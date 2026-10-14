import { TopBar } from "@/components/TopBar";
import { Analyzer } from "@/components/Analyzer";
import { SiteFooter } from "@/components/SiteFooter";

export default function Home() {
    return (
        <>
            <TopBar />
            <main>
                <Analyzer />
            </main>
            <SiteFooter />
        </>
    );
}
