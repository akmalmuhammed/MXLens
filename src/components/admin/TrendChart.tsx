"use client";

import { useEffect, useState } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface TrendData {
    date: string;
    analyses: number;
    threats: number;
}

interface TrendChartProps {
    title?: string;
    showThreats?: boolean;
}

export function TrendChart({ title = "Analysis Trend", showThreats = true }: TrendChartProps) {
    const [data, setData] = useState<TrendData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTrends() {
            try {
                const res = await fetch("/api/admin/dashboard/trends");
                if (!res.ok) throw new Error("Failed to fetch trends");
                const json = await res.json();
                setData(json.trendData || []);
            } catch (error) {
                console.error("Failed to fetch trend data:", error);
                // Use fallback empty data
                setData([]);
            } finally {
                setLoading(false);
            }
        }
        fetchTrends();
    }, []);

    if (loading) {
        return (
            <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="font-semibold mb-4">{title}</h3>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Loading...
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{title}</h3>
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-8 rounded-full bg-primary" />
                        <span className="text-muted-foreground">Analyses</span>
                    </div>
                    {showThreats && (
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-8 rounded-full bg-destructive" />
                            <span className="text-muted-foreground">Threats</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="h-64">
                {data.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                        No data available
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="analysesGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(177, 100%, 50%)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(177, 100%, 50%)" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="threatsGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(0, 85%, 55%)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(0, 85%, 55%)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="hsl(220, 15%, 18%)"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 11 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 11 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "hsl(240, 10%, 6%)",
                                    border: "1px solid hsl(220, 15%, 18%)",
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                }}
                                itemStyle={{ color: "hsl(180, 100%, 97%)" }}
                                labelStyle={{ color: "hsl(220, 10%, 55%)", marginBottom: "4px" }}
                            />
                            <Area
                                type="monotone"
                                dataKey="analyses"
                                stroke="hsl(177, 100%, 50%)"
                                strokeWidth={2}
                                fill="url(#analysesGradient)"
                            />
                            {showThreats && (
                                <Area
                                    type="monotone"
                                    dataKey="threats"
                                    stroke="hsl(0, 85%, 55%)"
                                    strokeWidth={2}
                                    fill="url(#threatsGradient)"
                                />
                            )}
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
