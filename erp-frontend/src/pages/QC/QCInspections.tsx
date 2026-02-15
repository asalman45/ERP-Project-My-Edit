import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertTriangle, ClipboardCheck, Search, Filter, Microscope, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

const QCInspections: React.FC = () => {
    const [inspections, setInspections] = useState<any[]>([]);
    const [analytics, setAnalytics] = useState<any>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [insResp, anaResp] = await Promise.all([
                fetch("/api/qc/inspections"),
                fetch("/api/qc/analytics")
            ]);
            const insData = await insResp.json();
            const anaData = await anaResp.json();

            if (insData.success) setInspections(insData.data);
            if (anaData.success) setAnalytics(anaData.data);
        } catch (error) {
            toast.error("Failed to fetch quality data");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Quality Governance</h1>
                    <p className="text-muted-foreground">Monitoring product compliance and manufacturing precision</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2">
                        <History className="w-4 h-4" /> Inspection Logs
                    </Button>
                    <Button className="bg-rose-600 hover:bg-rose-700 gap-2 shadow-lg shadow-rose-100">
                        <ClipboardCheck className="w-4 h-4" /> New Inspection
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-emerald-50 border-emerald-100">
                    <CardContent className="pt-6">
                        <div className="text-xs font-bold text-emerald-600 uppercase mb-1">Yield Rate</div>
                        <div className="text-3xl font-bold text-emerald-900">{Math.round(analytics.yieldRate || 0)}%</div>
                        <div className="flex items-center gap-1 text-[10px] text-emerald-600 mt-1 uppercase font-bold">
                            <CheckCircle2 className="w-3 h-3" /> Compliance Standard
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-rose-50 border-rose-100">
                    <CardContent className="pt-6">
                        <div className="text-xs font-bold text-rose-600 uppercase mb-1">Total Rejections</div>
                        <div className="text-3xl font-bold text-rose-900">{analytics.failed || 0}</div>
                        <div className="text-[10px] text-rose-600 mt-1 uppercase font-bold">Units out of spec</div>
                    </CardContent>
                </Card>
                <Card className="bg-indigo-50 border-indigo-100">
                    <CardContent className="pt-6">
                        <div className="text-xs font-bold text-indigo-600 uppercase mb-1">Net Inspections</div>
                        <div className="text-3xl font-bold text-indigo-900">{analytics.total || 0}</div>
                        <div className="text-[10px] text-indigo-600 mt-1 uppercase font-bold">30-day window</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-xl">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Inspection Queue</CardTitle>
                            <CardDescription>Real-time quality checks for production batches and incoming material</CardDescription>
                        </div>
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input className="pl-10 h-10 rounded-xl" placeholder="Search batch or product..." />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead>Product / Part</TableHead>
                                <TableHead>Standard Type</TableHead>
                                <TableHead>Measured</TableHead>
                                <TableHead>Result</TableHead>
                                <TableHead>Reference</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {inspections.map((ins) => (
                                <TableRow key={ins.inspection_id}>
                                    <TableCell>
                                        <div className="font-bold text-slate-900">{ins.standard?.product?.name}</div>
                                        <div className="text-xs text-muted-foreground">{ins.standard?.product?.sku}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm font-medium text-slate-700">{ins.standard?.name}</div>
                                        <div className="text-[10px] text-slate-400 uppercase tracking-tighter">Tolerance: {ins.standard?.min_value} - {ins.standard?.max_value} {ins.standard?.unit}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-mono text-sm">
                                            {ins.measured_value} {ins.standard?.unit}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {ins.result === 'PASSED' ? (
                                            <Badge className="bg-emerald-100 text-emerald-700 border-none hover:bg-emerald-100 flex items-center gap-1 w-fit">
                                                <CheckCircle2 className="w-3 h-3" /> PASS
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-rose-100 text-rose-700 border-none hover:bg-rose-100 flex items-center gap-1 w-fit">
                                                <XCircle className="w-3 h-3" /> FAIL
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-xs font-bold text-indigo-600 truncate max-w-[120px]">
                                            {ins.reference_id}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" className="text-indigo-600 hover:bg-indigo-50">
                                            Details
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {inspections.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20 text-slate-300">
                                        <Microscope className="w-12 h-12 mx-auto mb-3 opacity-10" />
                                        <p className="font-medium">No quality inspections recorded yet.</p>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-l-4 border-l-rose-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Critical Defects (Last 24h)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {inspections.filter(i => i.result === 'FAILED').slice(0, 3).map(i => (
                                <div key={i.inspection_id} className="flex justify-between items-center p-3 bg-rose-50 rounded-lg border border-rose-100">
                                    <div>
                                        <div className="text-xs font-bold text-rose-900">{i.standard?.product?.name}</div>
                                        <div className="text-[10px] text-rose-700">Ref: {i.reference_id}</div>
                                    </div>
                                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                                </div>
                            ))}
                            {inspections.filter(i => i.result === 'FAILED').length === 0 && (
                                <div className="py-6 text-center text-slate-400 text-xs">No critical defects detected</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default QCInspections;
