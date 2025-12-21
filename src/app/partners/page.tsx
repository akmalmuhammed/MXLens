import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Handshake, Globe, Search } from "lucide-react";

export default function PartnersPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="py-20 text-center container mx-auto px-4">
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
                    Partner with <span className="text-cyan-400">MXLens</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                    Join our ecosystem of MSPs, VARs, and Technology Partners protecting the world's inbox.
                </p>
                <div className="flex justify-center gap-4">
                    <Button className="h-12 px-8">Become a Partner</Button>
                    <Button variant="outline" className="h-12 px-8">Partner Portal Login</Button>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16 grid md:grid-cols-3 gap-8">
                <Card className="p-6 text-center hover:border-cyan-500/50 transition-colors">
                    <div className="h-12 w-12 bg-cyan-900/20 rounded-full flex items-center justify-center text-cyan-400 mx-auto mb-4">
                        <Handshake className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">MSP Partner Program</h3>
                    <p className="text-slate-400 mb-6">Multi-tenant management, consolidated billing, and volume pricing for Managed Service Providers.</p>
                </Card>
                <Card className="p-6 text-center hover:border-cyan-500/50 transition-colors">
                    <div className="h-12 w-12 bg-purple-900/20 rounded-full flex items-center justify-center text-purple-400 mx-auto mb-4">
                        <Globe className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Technology Alliance</h3>
                    <p className="text-slate-400 mb-6">Integrate your security product with MXLens API to provide unified threat intelligence.</p>
                </Card>
                <Card className="p-6 text-center hover:border-cyan-500/50 transition-colors">
                    <div className="h-12 w-12 bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-400 mx-auto mb-4">
                        <Search className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Resellers & Distributors</h3>
                    <p className="text-slate-400 mb-6">Expand your cybersecurity portfolio with our high-margin, easy-to-sell toolset.</p>
                </Card>
            </div>
        </div>
    );
}
