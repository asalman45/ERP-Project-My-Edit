import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Loader2, Filter, Download, Building2, TrendingUp, Wallet, ArrowUpRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

const DepartmentalOverheads: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchOverheads();
    }, []);

    const fetchOverheads = async () => {
        try {
            setLoading(true);
            const resp = await fetch("/api/reports/advanced/overheads");
            const result = await resp.json();
            if (result.success) {
                setData(result.data);
            }
        } catch (error) {
            toast.error("Failed to fetch departmental overheads");
        } finally {
            setLoading(false);
        }
    };

    const totalOverheads = data.reduce((sum, d) => sum + d.total, 0);

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-serif">Departmental Overheads</h1>
                    <p className="text-muted-foreground mt-1">Granular analysis of indirect costs by business unit</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-xl px-6 border-slate-200">
                        <Filter className="w-4 h-4 mr-2 text-slate-500" /> Fiscal Filter
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-6 shadow-lg shadow-indigo-100">
                        <Download className="w-4 h-4 mr-2" /> Download Breakdown
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-md bg-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-indigo-50 rounded-lg"><Wallet className="w-5 h-5 text-indigo-600" /></div>
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Overheads</div>
                                <div className="text-2xl font-bold text-slate-900">₹{totalOverheads.toLocaleString()}</div>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">Aggregate indirect expenditure for current period</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-50 rounded-lg"><TrendingUp className="w-5 h-5 text-emerald-600" /></div>
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Efficient Unit</div>
                                <div className="text-2xl font-bold text-slate-900">{data[0]?.name || "N/A"}</div>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">Department with lowest proportional variance</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-slate-900 text-white">
                    <CardContent className="pt-6">
                        <div className="text-xs font-bold opacity-70 uppercase tracking-widest mb-1">Overhead Absorption</div>
                        <div className="text-2xl font-bold mb-3">88% Capacity</div>
                        <Progress value={88} className="h-1 bg-white/20" />
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.map((dept) => (
                    <Card key={dept.name} className="border-none shadow-xl hover:scale-[1.02] transition-transform duration-300 group overflow-hidden bg-white">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg font-serif">{dept.name}</CardTitle>
                                    <CardDescription className="group-hover:text-white/70">Expenditure Breakdown</CardDescription>
                                </div>
                                <div className="p-2 rounded-xl bg-white/10 group-hover:bg-white/20">
                                    <Building2 className="w-5 h-5" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="flex justify-between items-end">
                                <div className="text-3xl font-black text-slate-800">₹{dept.total.toLocaleString()}</div>
                                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">{((dept.total / totalOverheads) * 100).toFixed(1)}% of total</div>
                            </div>

                            <div className="space-y-3">
                                {dept.accounts.slice(0, 3).map((acc: any) => (
                                    <div key={acc.name} className="space-y-1">
                                        <div className="flex justify-between text-xs font-medium text-slate-600">
                                            <span>{acc.name}</span>
                                            <span className="font-bold text-slate-900">₹{acc.amount.toLocaleString()}</span>
                                        </div>
                                        <Progress value={(acc.amount / dept.total) * 100} className="h-1 bg-slate-100" />
                                    </div>
                                ))}
                                {dept.accounts.length > 3 && (
                                    <Button variant="link" className="text-[10px] h-auto p-0 text-indigo-600 font-bold uppercase tracking-wider">
                                        + View {dept.accounts.length - 3} more items
                                    </Button>
                                )}
                            </div>

                            <div className="pt-4 border-t border-slate-50 flex justify-between items-center text-[10px] font-bold text-indigo-600">
                                <span className="flex items-center gap-1 uppercase tracking-widest"><PieChart className="w-3 h-3" /> Cost Analysis</span>
                                <Button variant="ghost" size="sm" className="h-6 px-2 rounded-lg hover:bg-indigo-50">
                                    Drill Down <ArrowUpRight className="w-3 h-3 ml-1" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {data.length === 0 && (
                <div className="flex flex-col items-center justify-center py-32 text-slate-300">
                    <Building2 className="w-16 h-16 mb-4 opacity-5" />
                    <p className="font-medium font-serif text-lg">No departmental cost centers linked to expenses</p>
                </div>
            )}
        </div>
    );
};

export default DepartmentalOverheads;
