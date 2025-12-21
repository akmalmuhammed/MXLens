import { PageHeader } from "@/components/marketing/PageHeader";
import { Footer } from "@/components/landing/Footer";
import { Github, Twitter, Linkedin } from "lucide-react";
import Image from "next/image";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-black text-foreground flex flex-col">
            <PageHeader
                title="Democratizing Cyber Defense"
                description="We believe every analyst deserves enterprise-grade forensics, regardless of their budget."
                badge="About Us"
            />

            <main className="flex-1">

                {/* Mission */}
                <section className="py-24 container mx-auto px-4 text-center max-w-4xl">
                    <h2 className="text-3xl font-bold mb-8">Our Mission</h2>
                    <p className="text-xl text-muted-foreground leading-relaxed">
                        Security Operations Centers (SOCs) are overwhelmed. Alert fatigue is real.
                        <br /><br />
                        We built MXLens to be the "Swiss Army Knife" for email investigations—fast, private, and precise.
                        Instead of opening 15 tabs to check SPF, Unfurl links, and scan attachments, we give you a single verdict in seconds.
                    </p>
                </section>

                {/* Team */}
                <section className="py-24 bg-muted/5 border-y border-border/20">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold mb-4">The Team</h2>
                            <p className="text-muted-foreground">Builders, Breakers, and Defenders.</p>
                        </div>

                        <div className="flex justify-center flex-wrap gap-12">
                            {/* Placeholder for Founder */}
                            <TeamMember
                                name="Akmal"
                                role="Founder & Lead Engineer"
                                bio="Security researcher and full-stack developer obsessed with clean code and cleaner inboxes."
                            />

                            {/* Placeholder for 'The AI' or Co-founder */}
                            <TeamMember
                                name="Antigravity"
                                role="AI Co-Pilot"
                                bio="Advanced agentic intelligence powering the core analysis engine."
                            />
                        </div>
                    </div>
                </section>

            </main>
            <Footer />
        </div>
    );
}

function TeamMember({ name, role, bio }: { name: string, role: string, bio: string }) {
    return (
        <div className="flex flex-col items-center text-center max-w-sm">
            <div className="h-32 w-32 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 mb-6 shadow-xl shadow-cyan-900/20 grayscale hover:grayscale-0 transition-all duration-500 ease-out flex items-center justify-center text-4xl font-bold text-white">
                {name[0]}
            </div>
            <h3 className="text-xl font-bold mb-1">{name}</h3>
            <p className="text-cyan-400 text-sm font-medium mb-4">{role}</p>
            <p className="text-muted-foreground leading-relaxed">
                {bio}
            </p>
            <div className="flex gap-4 mt-6">
                <Github className="h-5 w-5 text-muted-foreground hover:text-white cursor-pointer" />
                <Twitter className="h-5 w-5 text-muted-foreground hover:text-white cursor-pointer" />
                <Linkedin className="h-5 w-5 text-muted-foreground hover:text-white cursor-pointer" />
            </div>
        </div>
    )
}
