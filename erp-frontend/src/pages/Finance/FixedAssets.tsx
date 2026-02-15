import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, History, Calculator, Factory, ShieldCheck, PenTool } from "lucide-react";
import { badgeVariants } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

const FixedAssets: React.FC = () => {
    const [assets, setAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        try {
            // In a real app we'd fetch from /api/finance/fixed-assets
            // For demo, we'll show the structure
            setAssets([
                { id: 1, code: 'MACH-001', name: 'Injection Molding Machine X1', category: 'Machinery', cost: 2500000, current: 2100000, life: 10, status: 'ACTIVE' },
                { id: 2, code: 'VEH-004', name: 'Delivery Truck (Eicher 10.5)', category: 'Vehicles', cost: 1200000, current: 850000, life: 8, status: 'ACTIVE' },
                { id: 3, code: 'IT-SRV-01', name: 'Data Center Main Server', category: 'IT Infrastructure', cost: 500000, current: 320000, life: 5, status: 'ACTIVE' }
            ]);
        } catch (error) {
            toast.error("Failed to load assets");
        }
    };

    const handleRunDepreciation = async () => {
        try {
            const resp = await fetch("/api/finance/fixed-assets/depreciate", { method: 'POST' });
            const data = await resp.json();
            if (data.success) {
                toast.success(`Successfully ran depreciation for ${data.processed} assets.`);
                fetchAssets();
            }
        } catch (error) {
            toast.error("Failed to run depreciation");
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Fixed Asset Management</h1>
                    <p className="text-muted-foreground">Track machinery, tools, and industrial equipment lifecycle</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleRunDepreciation} variant="outline" className="gap-2 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100">
                        <Calculator className="w-4 h-4" /> Run Depreciation
                    </Button>
                    <Button className="gap-2 bg-indigo-600">
                        <Plus className="w-4 h-4" /> Register New Asset
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase text-muted-foreground">Total Asset Value (Cost)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹42,00,000</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase text-muted-foreground">Accumulated Depreciation</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">₹9,30,000</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase text-muted-foreground">Net Book Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">₹32,70,000</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase text-muted-foreground">Active Industrial Units</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Asset Registry</CardTitle>
                    <CardDescription>Managed list of capitalized assets and industrial equipment</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Asset Code</TableHead>
                                <TableHead>Asset Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-right">Purchase Cost</TableHead>
                                <TableHead className="text-right">Net Book Value</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assets.map(asset => (
                                <TableRow key={asset.code}>
                                    <TableCell className="font-mono text-xs">{asset.code}</TableCell>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            {asset.category === 'Machinery' ? <Factory className="w-4 h-4 text-slate-400" /> : <PenTool className="w-4 h-4 text-slate-400" />}
                                            {asset.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>{asset.category}</TableCell>
                                    <TableCell className="text-right">₹{asset.cost.toLocaleString()}</TableCell>
                                    <TableCell className="text-right font-bold text-indigo-600">₹{asset.current.toLocaleString()}</TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                                            <ShieldCheck className="mr-1 h-3 w-3" /> {asset.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" className="gap-1">
                                            <History className="w-3 h-3" /> History
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default FixedAssets;
