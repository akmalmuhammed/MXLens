"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface VerdictData {
    [key: string]: string | number;
    name: string;
    value: number;
    color: string;
}

export function VerdictPieChart() {
    const [data, setData] = useState<VerdictData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch("/api/admin/dashboard/trends");
                if (!res.ok) throw new Error("Failed to fetch trends");
                const json = await res.json();
                setData(json.verdictDistribution || []);
            } catch (error) {
                console.error("Failed to fetch verdict data:", error);
                setData([]);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const total = data.reduce((sum, item) => sum + item.value, 0);

    if (loading) {
        return (
            <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="font-semibold mb-4">Verdict Distribution</h3>
                <div className="h-40 flex items-center justify-center text-muted-foreground">
                    Loading...
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold mb-4">Verdict Distribution</h3>

            {data.length === 0 || total === 0 ? (
                <div className="h-40 flex items-center justify-center text-muted-foreground">
                    No data available
                </div>
            ) : (
                <div className="flex items-center gap-6">
                    {/* Chart */}
                    <div className="relative h-40 w-40">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={45}
                                    outerRadius={70}
                                    paddingAngle={2}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "hsl(240, 10%, 6%)",
                                        border: "1px solid hsl(220, 15%, 18%)",
                                        borderRadius: "8px",
                                        fontSize: "12px",
                                    }}
                                    itemStyle={{ color: "hsl(180, 100%, 97%)" }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold font-mono">{total.toLocaleString()}</span>
                            <span className="text-xs text-muted-foreground">Total</span>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex-1 grid gap-2">
                        {data.map((item) => (
                            <div key={item.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span
                                        className="h-3 w-3 rounded-sm"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className="text-sm">{item.name}</span>
                                </div>
                                <div className="text-right">
                                    <span className="font-mono text-sm font-medium">
                                        {item.value.toLocaleString()}
                                    </span>
                                    <span className="text-xs text-muted-foreground ml-2">
                                        ({total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%)
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
