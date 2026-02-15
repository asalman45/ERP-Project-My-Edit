import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, Calendar, Download, Printer, Filter, ArrowUpRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { DateRangePicker } from "@/components/ui/date-range-picker"; // Assuming this exists or using a simple range
import { Progress } from "@/components/ui/progress";

const PandLStatement: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        try {
            setLoading(true);
            const resp = await fetch("/api/reports/advanced/p-and-l");
            const result = await resp.json();
            if (result.success) {
                setData(result.data);
            }
        } catch (error) {
            toast.error("Failed to generate P&L Statement");
        } finally {
            setLoading(false);
        }
    };

    if (!data) return <div className="p-10 text-center">Loading Statement...</div>;

    const { summary, revenue, costOfGoodsSold, operatingExpenses, otherIncome, otherExpenses } = data;

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-serif">Consolidated Profit & Loss</h1>
                    <p className="text-muted-foreground mt-1">Formal income statement for the current fiscal period</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-xl px-6 border-slate-200">
                        <Printer className="w-4 h-4 mr-2 text-slate-500" /> Print
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-6 shadow-lg shadow-indigo-100">
                        <Download className="w-4 h-4 mr-2" /> Export PDF
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-none shadow-md bg-gradient-to-br from-indigo-50 to-white">
                    <CardContent className="pt-6">
                        <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Total Revenue</div>
                        <div className="text-3xl font-bold text-slate-900 font-serif">₹{summary.totalRevenue.toLocaleString()}</div>
                        <div className="flex items-center gap-1 text-[10px] text-emerald-600 mt-2 font-bold">
                            <ArrowUpRight className="w-3 h-3" /> 12% vs last month
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md bg-gradient-to-br from-emerald-50 to-white">
                    <CardContent className="pt-6">
                        <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Gross Profit</div>
                        <div className="text-3xl font-bold text-slate-900 font-serif">₹{summary.grossProfit.toLocaleString()}</div>
                        <div className="text-[10px] text-emerald-600 mt-2 font-bold">
                            Margin: {Math.round((summary.grossProfit / summary.totalRevenue) * 100)}%
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md bg-gradient-to-br from-rose-50 to-white">
                    <CardContent className="pt-6">
                        <div className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-1">Net Income</div>
                        <div className="text-3xl font-bold text-rose-900 font-serif">₹{summary.netIncome.toLocaleString()}</div>
                        <div className="text-[10px] text-rose-600 mt-2 font-bold">
                            Target: 15% Net Margin
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md bg-slate-900 text-white">
                    <CardContent className="pt-6">
                        <div className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1">Operating Ratio</div>
                        <div className="text-3xl font-bold font-serif">
                            {Math.round(((summary.totalCOGS + summary.totalOperatingExpenses) / summary.totalRevenue) * 100)}%
                        </div>
                        <Progress value={Math.round(((summary.totalCOGS + summary.totalOperatingExpenses) / summary.totalRevenue) * 100)} className="h-1 bg-white/20 mt-3" />
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">A. Revenue Channels</h3>
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                        </div>
                        <Table>
                            <TableBody>
                                {revenue.map((item: any) => (
                                    <TableRow key={item.name} className="hover:bg-indigo-50/30 transition-colors">
                                        <TableCell className="font-medium text-slate-700">{item.name}</TableCell>
                                        <TableCell className="text-right font-bold text-slate-900">₹{item.amount.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="bg-emerald-50/50">
                                    <TableCell className="font-bold text-emerald-800">Total Operating Revenue</TableCell>
                                    <TableCell className="text-right font-black text-emerald-900 underline decoration-double">₹{summary.totalRevenue.toLocaleString()}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </section>

                    <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">B. Cost of Goods Sold</h3>
                            <TrendingDown className="w-4 h-4 text-rose-500" />
                        </div>
                        <Table>
                            <TableBody>
                                {costOfGoodsSold.map((item: any) => (
                                    <TableRow key={item.name}>
                                        <TableCell className="text-slate-600">{item.name}</TableCell>
                                        <TableCell className="text-right font-medium">₹{item.amount.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="bg-slate-50">
                                    <TableCell className="font-bold text-slate-800">Total Cost of Goods Sold</TableCell>
                                    <TableCell className="text-right font-bold">₹{summary.totalCOGS.toLocaleString()}</TableCell>
                                </TableRow>
                                <TableRow className="bg-indigo-600 text-white">
                                    <TableCell className="font-bold">GROSS PROFIT</TableCell>
                                    <TableCell className="text-right font-black text-lg">₹{summary.grossProfit.toLocaleString()}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </section>

                    <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">C. Operating Expenses</h3>
                            <Filter className="w-4 h-4 text-indigo-500" />
                        </div>
                        <Table>
                            <TableBody>
                                {operatingExpenses.map((item: any) => (
                                    <TableRow key={item.name}>
                                        <TableCell className="text-slate-600">{item.name}</TableCell>
                                        <TableCell className="text-right font-medium">₹{item.amount.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="bg-slate-50">
                                    <TableCell className="font-bold text-slate-800">Total Operating Expenses</TableCell>
                                    <TableCell className="text-right font-bold">₹{summary.totalOperatingExpenses.toLocaleString()}</TableCell>
                                </TableRow>
                                <TableRow className="bg-emerald-500 text-white mt-1 border-t-4 border-white">
                                    <TableCell className="font-bold">OPERATING INCOME (EBIT)</TableCell>
                                    <TableCell className="text-right font-black text-lg">₹{summary.operatingIncome.toLocaleString()}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </section>
                </div>

                <div className="space-y-6">
                    <Card className="border-none shadow-xl bg-indigo-900 text-white sticky top-6">
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-widest opacity-80">Margin Insights</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <div className="flex justify-between text-xs mb-2">
                                    <span>Gross Margin</span>
                                    <span className="font-bold">{Math.round((summary.grossProfit / summary.totalRevenue) * 100)}%</span>
                                </div>
                                <Progress value={(summary.grossProfit / summary.totalRevenue) * 100} className="h-1 bg-white/20" />
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-2">
                                    <span>Net Margin</span>
                                    <span className="font-bold">{Math.round((summary.netIncome / summary.totalRevenue) * 100)}%</span>
                                </div>
                                <Progress value={(summary.netIncome / summary.totalRevenue) * 100} className="h-1 bg-white/20" />
                            </div>

                            <div className="pt-6 border-t border-white/10 mt-6">
                                <div className="text-4xl font-black text-center font-serif">₹{summary.netIncome.toLocaleString()}</div>
                                <div className="text-center text-[10px] uppercase tracking-tighter opacity-60 mt-2">Bottom Line Net Profit</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default PandLStatement;
