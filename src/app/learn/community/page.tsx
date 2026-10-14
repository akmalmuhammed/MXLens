import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageSquare, Share2, Users } from "lucide-react";

export default function CommunityPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="py-20 text-center container mx-auto px-4">
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
                    Community & <span className="text-cyan-400">Discussion</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                    Connect with over 10,000 security professionals sharing real-time threat intelligence.
                </p>
                <Button className="h-12 px-8">Join the Discord</Button>
            </div>

            <div className="container mx-auto px-4 grid md:grid-cols-3 gap-8 pb-20">
                <Card className="p-6 hover:bg-slate-900/50 transition-colors">
                    <div className="mb-4">
                        <MessageSquare className="w-8 h-8 text-cyan-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Forums</h3>
                    <p className="text-slate-400 mb-4">Discuss the latest vulnerabilities, ask for analysis help, and share tips.</p>
                    <Link href="#" className="text-cyan-400 hover:underline">Browse Topics →</Link>
                </Card>

                <Card className="p-6 hover:bg-slate-900/50 transition-colors">
                    <div className="mb-4">
                        <Share2 className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Threat Sharing</h3>
                    <p className="text-slate-400 mb-4">Submit and vote on IOCs (Indicators of Compromise) observed in the wild.</p>
                    <Link href="#" className="text-emerald-400 hover:underline">View Feed →</Link>
                </Card>

                <Card className="p-6 hover:bg-slate-900/50 transition-colors">
                    <div className="mb-4">
                        <Users className="w-8 h-8 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">User Groups</h3>
                    <p className="text-slate-400 mb-4">Find local meetups or virtual groups focused on specific industries.</p>
                    <Link href="#" className="text-purple-400 hover:underline">Find a Group →</Link>
                </Card>
            </div>
        </div>
    );
}
