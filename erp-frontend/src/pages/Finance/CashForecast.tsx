import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Landmark, TrendingUp, ArrowDownCircle, ArrowUpCircle, Wallet } from "lucide-react";
import { toast } from "sonner";

const CashForecast: React.FC = () => {
    const [forecastData, setForecastData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchForecast();
    }, []);

    const fetchForecast = async () => {
        try {
            setLoading(true);
            const resp = await fetch("/api/finance/reporting/cash-forecast");
            const data = await resp.json();
            if (data.success) {
                setForecastData(data.data);
            }
        } catch (error) {
            toast.error("Failed to load cash forecast");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Cash Flow Runway</h1>
                    <p className="text-muted-foreground">12-week predictive liquidity analysis</p>
                </div>
                <div className="flex gap-4">
                    <Card className="bg-slate-900 text-white min-w-[200px]">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 text-slate-400 text-xs uppercase font-bold mb-1">
                                <Landmark className="w-3 h-3" /> Current Liquidity
                            </div>
                            <div className="text-2xl font-bold">₹{forecastData?.current_liquidity?.toLocaleString() || "0"}</div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Cash Position Forecast</CardTitle>
                        <CardDescription>Projected bank balances based on AP/AR maturity</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={forecastData?.forecast}>
                                <defs>
                                    <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Area
                                    type="monotone"
                                    dataKey="projected_balance"
                                    stroke="#4f46e5"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorPv)"
                                    name="Projected Balance"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Pipeline Dynamics</CardTitle>
                        <CardDescription>Weekly Inflows vs Outflows</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {forecastData?.forecast?.slice(0, 4).map((week: any, idx: number) => (
                            <div key={idx} className="p-4 border rounded-xl space-y-3">
                                <div className="text-sm font-bold text-slate-600">Week of {new Date(week.week).toLocaleDateString()}</div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="flex items-center gap-2 text-green-600"><ArrowUpCircle className="w-4 h-4" /> Inflow</span>
                                    <span className="font-bold">₹{week.inflow.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="flex items-center gap-2 text-red-600"><ArrowDownCircle className="w-4 h-4" /> Outflow</span>
                                    <span className="font-bold">₹{week.outflow.toLocaleString()}</span>
                                </div>
                                <div className="pt-2 border-t flex justify-between items-center font-bold">
                                    <span className="text-xs uppercase text-muted-foreground tracking-wider">Net delta</span>
                                    <span className={week.inflow - week.outflow >= 0 ? "text-green-600" : "text-red-600"}>
                                        {week.inflow - week.outflow >= 0 ? "+" : ""}
                                        ₹{(week.inflow - week.outflow).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-start gap-3">
                            <TrendingUp className="text-indigo-600 w-5 h-5 mt-0.5" />
                            <p className="text-xs text-indigo-700 leading-relaxed">
                                Forecast includes all <b>Approved</b> vendor invoices and <b>Active</b> customer billing milestones.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default CashForecast;
