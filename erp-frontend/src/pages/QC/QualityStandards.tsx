import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Ruler, Target, Settings, Search, Box, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const QualityStandards: React.FC = () => {
    const [standards, setStandards] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchStandards();
    }, []);

    const fetchStandards = async () => {
        try {
            setLoading(true);
            const resp = await fetch("/api/qc/standards");
            const data = await resp.json();
            if (data.success) setStandards(data.data);
        } catch (error) {
            toast.error("Failed to load quality standards");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Compliance Config</h1>
                    <p className="text-muted-foreground">Defining inspection benchmarks and product tolerances</p>
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2 shadow-lg shadow-indigo-100">
                    <Plus className="w-4 h-4" /> Define New Standard
                </Button>
            </div>

            <Card className="border-none shadow-xl">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Master Quality Checks</CardTitle>
                            <CardDescription>Library of pass/fail criteria for manufacturing units</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead>Standard Name</TableHead>
                                <TableHead>Target Product</TableHead>
                                <TableHead>Parameters</TableHead>
                                <TableHead>Target Value</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {standards.map((std) => (
                                <TableRow key={std.standard_id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                <Settings className="w-4 h-4" />
                                            </div>
                                            <div className="font-bold text-slate-900">{std.name}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                            <Box className="w-3.5 h-3.5 text-slate-400" /> {std.product?.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Badge variant="outline" className="bg-slate-50/50 text-slate-600 border-slate-200">
                                                Min: {std.min_value} {std.unit}
                                            </Badge>
                                            <Badge variant="outline" className="bg-slate-50/50 text-slate-600 border-slate-200">
                                                Max: {std.max_value} {std.unit}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 font-bold text-indigo-700">
                                            <Target className="w-3.5 h-3.5" /> {std.target_value} {std.unit}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right space-x-1">
                                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600">
                                            <Settings className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-rose-600">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {standards.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20 text-slate-300">
                                        <Ruler className="w-12 h-12 mx-auto mb-3 opacity-10" />
                                        <p className="font-medium">No quality standards defined yet.</p>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default QualityStandards;
