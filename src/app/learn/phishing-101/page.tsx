import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, MailWarning, Lock } from "lucide-react";

export default function Phishing101Page() {
    return (
        <div className="min-h-screen bg-background text-slate-200">
            <div className="bg-slate-900/50 py-20 border-b border-slate-800">
                <div className="container mx-auto px-4 max-w-4xl text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
                        Anatomy of a <span className="text-red-500">Phishing Attack</span>
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        Learn how to identify, analyze, and stop email threats before they breach your network.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16 max-w-4xl space-y-20">

                <Section
                    icon={MailWarning}
                    title="1. The Lure"
                    content="Phishing starts with a deceptive email designed to trigger an emotional response (fear, urgency, greed). Attackers often spoof legitimate brands or executives."
                />

                <Section
                    icon={AlertTriangle}
                    title="2. The Hook"
                    content="The email contains a malicious link or attachment. Links may lead to fake login pages (credential harvesting) or drive-by downloads. Attachments may contain macro-enabled malware."
                />

                <Section
                    icon={Lock}
                    title="3. The Catch"
                    content="If the user falls for the bait, the attacker gains access. This can lead to ransomware deployment, data exfiltration, or further lateral movement within the network."
                />

                <div className="bg-slate-900 rounded-2xl p-8 md:p-12 text-center">
                    <h2 className="text-3xl font-bold text-white mb-6">Ready to defend yourself?</h2>
                    <p className="text-lg text-slate-400 mb-8">
                        Use MXLens to analyze headers, check SPF/DKIM authentication, and safely inspect links.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link href="/">
                            <Button className="h-12 px-8 text-lg">Analyze an Email Now</Button>
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}

function Section({ icon: Icon, title, content }: { icon: any, title: string, content: string }) {
    return (
        <div className="flex gap-6 md:gap-10 items-start">
            <div className="bg-slate-800 p-4 rounded-xl shrink-0">
                <Icon className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-white mb-3">{title}</h2>
                <p className="text-lg text-slate-400 leading-relaxed">{content}</p>
            </div>
        </div>
    )
}
