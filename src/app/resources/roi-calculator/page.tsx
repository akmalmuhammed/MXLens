"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, DollarSign, Clock } from "lucide-react";

export default function ROICalculatorPage() {
    const [employees, setEmployees] = useState(100);
    const [hourlyRate, setHourlyRate] = useState(50);
    const [incidentsPerMonth, setIncidentsPerMonth] = useState(5);

    // Rough estimates
    const timeSavedPerIncident = 2; // hours
    const totalTimeSaved = incidentsPerMonth * timeSavedPerIncident;
    const moneySaved = totalTimeSaved * hourlyRate;
    const annualSavings = moneySaved * 12;

    return (
        <div className="min-h-screen bg-background py-20">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-extrabold text-white mb-4">ROI Calculator</h1>
                    <p className="text-xl text-muted-foreground">
                        Calculate how much time and money MXLens can save your SOC team.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <Card className="p-8">
                        <div className="space-y-6">
                            <div>
                                <Label className="text-base text-slate-200">Number of Employees</Label>
                                <Input
                                    type="number"
                                    value={employees}
                                    onChange={(e) => setEmployees(Number(e.target.value))}
                                    className="mt-2 text-lg"
                                />
                            </div>
                            <div>
                                <Label className="text-base text-slate-200">Avg. Analyst Hourly Rate ($)</Label>
                                <Input
                                    type="number"
                                    value={hourlyRate}
                                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                                    className="mt-2 text-lg"
                                />
                            </div>
                            <div>
                                <Label className="text-base text-slate-200">Incidents per Month</Label>
                                <Input
                                    type="number"
                                    value={incidentsPerMonth}
                                    onChange={(e) => setIncidentsPerMonth(Number(e.target.value))}
                                    className="mt-2 text-lg"
                                />
                            </div>
                        </div>
                    </Card>

                    <div className="space-y-6">
                        <Card className="p-6 bg-emerald-900/10 border-emerald-500/50">
                            <h3 className="text-emerald-500 font-semibold mb-2 flex items-center gap-2">
                                <DollarSign className="w-5 h-5" />
                                Annual Savings
                            </h3>
                            <div className="text-4xl font-bold text-white">
                                ${annualSavings.toLocaleString()}
                            </div>
                        </Card>

                        <Card className="p-6 bg-cyan-900/10 border-cyan-500/50">
                            <h3 className="text-cyan-500 font-semibold mb-2 flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                Hours Saved / Year
                            </h3>
                            <div className="text-4xl font-bold text-white">
                                {(totalTimeSaved * 12).toLocaleString()} hrs
                            </div>
                        </Card>

                        <div className="p-4 bg-slate-900/50 rounded-lg text-slate-400 text-sm">
                            <p>Based on average manual analysis time of 2.5 hours vs MXLens instant analysis.</p>
                        </div>

                        <Button className="w-full h-12 text-lg">Start Free Trial</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
