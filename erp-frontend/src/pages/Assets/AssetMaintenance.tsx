import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Calendar, AlertCircle, CheckCircle2, History, Plus, Settings, Gauge } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

const AssetMaintenance: React.FC = () => {
    const [assets, setAssets] = useState<any[]>([]);
    const [upcoming, setUpcoming] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [assetResp, upResp] = await Promise.all([
                fetch("/api/assets"),
                fetch("/api/assets/maintenance/upcoming")
            ]);
            const assetData = await assetResp.json();
            const upData = await upResp.json();

            if (assetData.success) setAssets(assetData.data);
            if (upData.success) setUpcoming(upData.data);
        } catch (error) {
            toast.error("Failed to fetch asset data");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Equipment Lifecycle</h1>
                    <p className="text-muted-foreground">Monitoring machinery health and preventive maintenance cycles</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2">
                        <History className="w-4 h-4" /> Service Logs
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2 shadow-lg shadow-indigo-100">
                        <Plus className="w-4 h-4" /> Onboard New Asset
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-l-4 border-l-rose-500 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-rose-600 mb-2">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Overdue Service</span>
                        </div>
                        <div className="text-3xl font-bold text-slate-900">{upcoming.filter(u => new Date(u.next_due_at) < new Date()).length}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Maintenance tasks requiring immediate action</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-indigo-600 mb-2">
                            <Gauge className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Operational Assets</span>
                        </div>
                        <div className="text-3xl font-bold text-slate-900">{assets.filter(a => a.status === 'ACTIVE').length}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Machinery currently on shop floor</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border-none shadow-xl">
                    <CardHeader>
                        <CardTitle>Asset Inventory</CardTitle>
                        <CardDescription>Master list of capital equipment and operational machinery</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow>
                                    <TableHead>Asset Code</TableHead>
                                    <TableHead>Name & Category</TableHead>
                                    <TableHead>Health Score</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assets.map((asset) => (
                                    <TableRow key={asset.asset_id}>
                                        <TableCell className="font-mono text-xs font-bold text-indigo-700">{asset.asset_code}</TableCell>
                                        <TableCell>
                                            <div className="font-bold text-slate-900">{asset.name}</div>
                                            <div className="text-[10px] text-slate-500 uppercase">{asset.category}</div>
                                        </TableCell>
                                        <TableCell className="min-w-[120px]">
                                            <div className="flex justify-between text-[10px] mb-1 font-bold">
                                                <span>Reliability</span>
                                                <span>85%</span>
                                            </div>
                                            <Progress value={85} className="h-1 bg-slate-100" />
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={asset.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-none' : 'bg-slate-50 text-slate-600 border-none'}>
                                                {asset.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button size="icon" variant="ghost" className="text-slate-400 hover:text-indigo-600">
                                                <Settings className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-slate-50/50">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Wrench className="w-4 h-4 text-indigo-600" />
                            <CardTitle className="text-sm uppercase tracking-widest">Maintenance Alerts</CardTitle>
                        </div>
                        <CardDescription>Scheduled tasks for the next 7 days</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {upcoming.map((task) => (
                            <div key={task.schedule_id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-[10px] font-bold text-indigo-600 uppercase mb-1">{task.asset?.name}</div>
                                        <div className="text-sm font-bold text-slate-900">{task.task_name}</div>
                                    </div>
                                    <Badge className={`text-[10px] border-none ${task.priority === 'HIGH' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {task.priority}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                    <Calendar className="w-3 h-3" /> Due: {new Date(task.next_due_at).toLocaleDateString()}
                                </div>
                                <Button className="w-full text-xs h-8 bg-slate-900 border-none hover:bg-slate-800" size="sm">
                                    Execute & Log
                                </Button>
                            </div>
                        ))}
                        {upcoming.length === 0 && (
                            <div className="text-center py-12 text-slate-400">
                                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-10" />
                                <p className="text-xs">No pending maintenance tasks</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AssetMaintenance;
