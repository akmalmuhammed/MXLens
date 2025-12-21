import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Award, BookOpen } from "lucide-react";

export default function AcademyPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="py-20 text-center container mx-auto px-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-900/30 text-cyan-400 text-sm font-medium mb-6">
                    <GraduationCap className="w-4 h-4" />
                    MXLens Academy
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6">
                    Master Email <span className="text-cyan-400">Security</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                    Free courses designed to take you from novice to SOC analyst. Earn certificates and advance your career.
                </p>
            </div>

            <div className="container mx-auto px-4 pb-20">
                <h2 className="text-2xl font-bold text-white mb-8">Featured Courses</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    <CourseCard
                        title="Email Header Forensics"
                        level="Beginner"
                        duration="2 hours"
                        description="Learn to read headers like a pro. Understand X-Originating-IP, Return-Path, and more."
                    />
                    <CourseCard
                        title="DMARC Implementation Masterclass"
                        level="Intermediate"
                        duration="4 hours"
                        description="A step-by-step guide to moving from p=none to p=reject without breaking flow."
                    />
                    <CourseCard
                        title="Advanced Threat Hunting"
                        level="Advanced"
                        duration="6 hours"
                        description="Using MXLens and Python to automate threat detection and response."
                    />
                </div>

                <div className="mt-20 p-8 md:p-12 bg-gradient-to-r from-cyan-900/20 to-emerald-900/20 rounded-3xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-3">Get Certified</h2>
                        <p className="text-slate-300">
                            Prove your skills with the **Certified MXLens Analyst** exam.
                        </p>
                    </div>
                    <Button size="lg" className="bg-white text-black hover:bg-slate-200">
                        <Award className="w-5 h-5 mr-2" />
                        View Certification Path
                    </Button>
                </div>
            </div>
        </div>
    );
}

function CourseCard({ title, level, duration, description }: { title: string, level: string, duration: string, description: string }) {
    return (
        <Card className="p-6 flex flex-col h-full hover:border-cyan-500/50 transition-colors group cursor-pointer">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-900 rounded-lg group-hover:bg-cyan-900/30 transition-colors">
                    <BookOpen className="w-6 h-6 text-slate-400 group-hover:text-cyan-400" />
                </div>
                <Badge variant="outline">{level}</Badge>
            </div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">{title}</h3>
            <p className="text-slate-400 text-sm mb-6 flex-grow">{description}</p>
            <div className="flex items-center text-slate-500 text-sm pt-4 border-t border-slate-800">
                <span>{duration}</span>
                <span className="mx-2">•</span>
                <span>Free</span>
            </div>
        </Card>
    )
}
