"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Github, Twitter, Linkedin, Shield, Users, Globe } from "lucide-react";

export function AnimatedAboutClient() {
    const { scrollYProgress } = useScroll();
    const gridY = useTransform(scrollYProgress, [0, 1], [0, -30]);

    return (
        <div className="relative overflow-hidden flex-1">
            {/* Cyberpunk Grid Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-black" />
                <motion.div
                    style={{ y: gridY }}
                    className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] opacity-20"
                />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-[100px] opacity-50" />
            </div>

            <main className="relative z-10">
                {/* Mission Section */}
                <section className="py-24 container mx-auto px-4 text-center max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.7 }}
                        viewport={{ once: true }}
                    >
                        <div className="inline-flex items-center justify-center p-3 mb-8 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                            <Shield className="w-8 h-8" />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-br from-white via-slate-200 to-slate-500">
                            Our Mission
                        </h2>
                        <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                            Security Operations Centers (SOCs) are overwhelmed. Alert fatigue is real.
                            <br /><br />
                            We built MXLens to be the <span className="text-cyan-400 font-semibold">"Swiss Army Knife"</span> for email investigations—fast, private, and precise.
                            Instead of opening 15 tabs to check SPF, Unfurl links, and scan attachments, we give you a single verdict in seconds.
                        </p>
                    </motion.div>
                </section>

                {/* Team Section */}
                <section className="py-32 bg-slate-950/50 border-y border-white/5 backdrop-blur-sm">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-20">
                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                viewport={{ once: true }}
                                className="text-3xl font-bold mb-4"
                            >
                                The Team
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                viewport={{ once: true }}
                                className="text-muted-foreground text-lg"
                            >
                                Builders, Breakers, and Defenders.
                            </motion.p>
                        </div>

                        <div className="flex justify-center flex-wrap gap-12 lg:gap-24">
                            <TeamMember
                                name="Akmal"
                                role="Founder & Lead Engineer"
                                bio="Security researcher and full-stack developer obsessed with clean code and cleaner inboxes."
                                delay={0.2}
                                icon="A"
                                gradient="from-cyan-500 to-blue-600"
                            />

                            <TeamMember
                                name="Antigravity"
                                role="AI Co-Pilot"
                                bio="Advanced agentic intelligence powering the core analysis engine."
                                delay={0.4}
                                icon="AI"
                                gradient="from-purple-500 to-pink-600"
                            />
                        </div>
                    </div>
                </section>

                {/* Stats / Impact (Optional filler for motion) */}
                <section className="py-24 container mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-8 text-center">
                        <StatBox label="Analyses Run" value="10k+" delay={0.5} />
                        <StatBox label="Data Leaked" value="0B" delay={0.6} active />
                        <StatBox label="Uptime" value="99.9%" delay={0.7} />
                    </div>
                </section>
            </main>
        </div>
    );
}

function TeamMember({ name, role, bio, delay, icon, gradient }: { name: string, role: string, bio: string, delay: number, icon: string, gradient: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            viewport={{ once: true }}
            whileHover={{ y: -10 }}
            className="flex flex-col items-center text-center max-w-sm group"
        >
            <div className={`h-32 w-32 rounded-full bg-gradient-to-br ${gradient} mb-6 shadow-2xl grayscale group-hover:grayscale-0 transition-all duration-500 ease-out flex items-center justify-center text-4xl font-bold text-white relative overflow-hidden`}>
                <div className="absolute inset-0 bg-white/20 scale-0 group-hover:scale-100 transition-transform duration-500 rounded-full" />
                <span className="relative z-10">{icon}</span>
            </div>
            <h3 className="text-2xl font-bold mb-1 group-hover:text-white transition-colors">{name}</h3>
            <p className="text-cyan-400 text-sm font-medium mb-4 uppercase tracking-wider">{role}</p>
            <p className="text-muted-foreground leading-relaxed group-hover:text-slate-300 transition-colors">
                {bio}
            </p>
            <div className="flex gap-4 mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                <Github className="h-5 w-5 text-slate-400 hover:text-white cursor-pointer hover:scale-110 transition-transform" />
                <Twitter className="h-5 w-5 text-slate-400 hover:text-white cursor-pointer hover:scale-110 transition-transform" />
                <Linkedin className="h-5 w-5 text-slate-400 hover:text-white cursor-pointer hover:scale-110 transition-transform" />
            </div>
        </motion.div>
    )
}

function StatBox({ label, value, delay, active }: { label: string, value: string, delay: number, active?: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay, type: "spring" }}
            viewport={{ once: true }}
            className={`p-6 rounded-xl border ${active ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-white/5 bg-white/5'}`}
        >
            <div className={`text-3xl font-mono font-bold mb-2 ${active ? 'text-emerald-400' : 'text-white'}`}>{value}</div>
            <div className="text-slate-500 text-sm uppercase tracking-widest">{label}</div>
        </motion.div>
    )
}
