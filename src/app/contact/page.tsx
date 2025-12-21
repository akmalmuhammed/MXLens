import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone } from "lucide-react";

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-background text-slate-200 py-20">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6">Get in Touch</h1>
                    <p className="text-xl text-muted-foreground">
                        Have questions about enterprise deployment or need support? We're here to help.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                        <Card className="p-6 bg-slate-900/50 border-slate-800">
                            <h3 className="text-lg font-bold text-white mb-4">Contact Info</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Mail className="w-5 h-5 text-cyan-400" />
                                    <span>support@mxlens.com</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone className="w-5 h-5 text-cyan-400" />
                                    <span>+1 (800) 555-0123</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <MapPin className="w-5 h-5 text-cyan-400" />
                                    <span>San Francisco, CA</span>
                                </div>
                            </div>
                        </Card>

                        <div className="p-6 rounded-xl bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-500/20">
                            <h3 className="text-lg font-bold text-white mb-2">Technical Support</h3>
                            <p className="text-slate-400 mb-4">Existing customers can open a ticket for faster resolution.</p>
                            <Button variant="outline" className="w-full">Open Support Ticket</Button>
                        </div>
                    </div>

                    <Card className="p-8">
                        <form className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">First Name</label>
                                    <Input placeholder="Jane" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Last Name</label>
                                    <Input placeholder="Doe" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Work Email</label>
                                <Input type="email" placeholder="jane@company.com" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Message</label>
                                <Textarea className="min-h-[150px]" placeholder="How can we help?" />
                            </div>
                            <Button className="w-full h-12 text-lg">Send Message</Button>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
}
