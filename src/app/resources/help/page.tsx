import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Book, MessageCircle, FileQuestion, LifeBuoy } from "lucide-react";

export default function HelpPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="bg-slate-900/50 py-16 border-b border-slate-800">
                <div className="container mx-auto px-4 max-w-3xl text-center">
                    <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-6">How can we help?</h1>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                        <Input
                            className="h-14 pl-12 text-lg bg-slate-950/80 border-slate-700"
                            placeholder="Data retention, API keys, SSO setup..."
                        />
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <HelpCard icon={Book} title="Documentation" desc="Guides and technical specs" link="/resources/docs" />
                <HelpCard icon={FileQuestion} title="FAQ" desc="Common questions answered" link="/resources/faq" />
                <HelpCard icon={MessageCircle} title="Community" desc="Ask other users" link="/learn/community" />
                <HelpCard icon={LifeBuoy} title="Support" desc="Contact our team" link="/contact" />
            </div>

            <div className="container mx-auto px-4 pb-16">
                <h2 className="text-2xl font-bold text-white mb-8">Popular Topics</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    <TopicCard title="Getting Started" items={["Account Setup", "First Analysis", "Inviting Team Members"]} />
                    <TopicCard title="Billing & Plans" items={["Invoices", "Changing Plans", "Cancellation"]} />
                    <TopicCard title="API Usage" items={["Authentication", "Rate Limits", "Webhooks"]} />
                </div>
            </div>
        </div>
    );
}

function HelpCard({ icon: Icon, title, desc, link }: { icon: any, title: string, desc: string, link: string }) {
    return (
        <Link href={link}>
            <Card className="p-6 h-full hover:bg-slate-900/50 transition-colors text-center group cursor-pointer">
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-cyan-900/20 group-hover:text-cyan-400 transition-colors">
                    <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white mb-1">{title}</h3>
                <p className="text-sm text-slate-400">{desc}</p>
            </Card>
        </Link>
    )
}

function TopicCard({ title, items }: { title: string, items: string[] }) {
    return (
        <Card className="p-6">
            <h3 className="font-bold text-white mb-4">{title}</h3>
            <ul className="space-y-3">
                {items.map(item => (
                    <li key={item}>
                        <Link href="#" className="text-slate-400 hover:text-cyan-400 text-sm flex items-center gap-2">
                            <FileQuestion className="w-4 h-4 opacity-50" />
                            {item}
                        </Link>
                    </li>
                ))}
            </ul>
        </Card>
    )
}
