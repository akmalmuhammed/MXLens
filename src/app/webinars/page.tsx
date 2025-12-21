import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, PlayCircle } from "lucide-react";

export default function WebinarsPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="bg-slate-900/50 py-20 border-b border-slate-800">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl font-extrabold text-white mb-6">Expert Sessions & Live Demos</h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Learn precise email forensics techniques from our security engineers.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16">
                <h2 className="text-2xl font-bold text-white mb-8">Upcoming Events</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                    <Card className="p-6 border-cyan-500/50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-cyan-500 text-black text-xs font-bold px-3 py-1">LIVE</div>
                        <div className="text-sm text-cyan-400 font-semibold mb-2">Dec 28, 2024 • 2:00 PM EST</div>
                        <h3 className="text-xl font-bold text-white mb-3">Advanced Header Analysis Workshop</h3>
                        <p className="text-slate-400 text-sm mb-6">Deep dive into X-Originating-IP and DKIM signature verification.</p>
                        <Button className="w-full">Register Now</Button>
                    </Card>
                </div>

                <h2 className="text-2xl font-bold text-white mb-8">On-Demand Library</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    <Card className="group cursor-pointer">
                        <div className="relative aspect-video bg-slate-800 rounded-t-lg flex items-center justify-center border-b border-slate-700">
                            <PlayCircle className="w-12 h-12 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-white mb-2">Phishing Trends 2024</h3>
                            <p className="text-sm text-slate-400">45 min • Recorded Nov 15</p>
                        </div>
                    </Card>
                    <Card className="group cursor-pointer">
                        <div className="relative aspect-video bg-slate-800 rounded-t-lg flex items-center justify-center border-b border-slate-700">
                            <PlayCircle className="w-12 h-12 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-white mb-2">MXLens Product Tour</h3>
                            <p className="text-sm text-slate-400">15 min • Updated Dec 1</p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
