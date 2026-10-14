import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Globe, Rocket, Zap } from "lucide-react";

export default function CareersPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="relative overflow-hidden py-24 text-center">
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/10 to-background pointer-events-none" />
                <div className="container mx-auto px-4 relative z-10">
                    <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6">
                        Build the <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Future</span> of Security
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
                        We're on a mission to stop email threats before they start. Join our team of engineers, researchers, and defenders.
                    </p>
                    <Button size="lg" className="h-14 px-10 text-lg rounded-full">View Open Roles</Button>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16 grid md:grid-cols-3 gap-8 text-center max-w-6xl">
                <div className="p-6">
                    <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-cyan-400">
                        <Rocket className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">High Impact</h3>
                    <p className="text-slate-400">Work on systems that protect millions of emails daily from sophisticated attacks.</p>
                </div>
                <div className="p-6">
                    <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-purple-400">
                        <Globe className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Remote First</h3>
                    <p className="text-slate-400">We hire the best talent regardless of location. Work from anywhere in the world.</p>
                </div>
                <div className="p-6">
                    <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-400">
                        <Zap className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Fast Paced</h3>
                    <p className="text-slate-400">Ship code daily. Iterate fast. No bureaucracy, just pure engineering.</p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16 max-w-4xl">
                <h2 className="text-3xl font-bold text-white mb-8">Open Positions</h2>
                <div className="space-y-4">
                    <JobCard role="Senior Backend Engineer (Go/Rust)" team="Engineering" location="Remote" />
                    <JobCard role="Threat Intelligence Researcher" team="Security" location="Remote / NY" />
                    <JobCard role="Frontend Engineer (React/Next.js)" team="Engineering" location="Remote" />
                    <JobCard role="Product Marketing Manager" team="Growth" location="London / Remote" />
                </div>
            </div>
        </div>
    );
}

function JobCard({ role, team, location }: { role: string, team: string, location: string }) {
    return (
        <Card className="p-6 flex items-center justify-between hover:border-cyan-500/50 transition-all cursor-pointer group">
            <div>
                <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">{role}</h3>
                <div className="flex gap-4 text-sm text-slate-400 mt-1">
                    <span>{team}</span>
                    <span>•</span>
                    <span>{location}</span>
                </div>
            </div>
            <Button variant="ghost" className="hidden md:flex">Apply Now</Button>
        </Card>
    )
}
