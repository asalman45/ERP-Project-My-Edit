import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, FileBarChart, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";

const NREManagement: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/finance/nre-ledgers")
            .then(r => r.json())
            .then(res => setData(res.data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const columns = [
        { key: "nre_code", header: "NRE Code" },
        { key: "name", header: "Project Name" },
        { key: "product_name", header: "Associated Product" },
        { key: "estimated_cost", header: "Budget", render: (v: number) => `Rs. ${(v || 0).toLocaleString()}` },
        { key: "actual_cost", header: "Actual", render: (v: number) => `Rs. ${(v || 0).toLocaleString()}` },
        {
            key: "status",
            header: "Status",
            render: (status: string) => (
                <Badge variant={status === "ACTIVE" ? "default" : "secondary"}>
                    {status || "N/A"}
                </Badge>
            )
        },
        { key: "created_at", header: "Created", render: (v: string) => v ? new Date(v).toLocaleDateString() : "—" },
    ];

    const filtered = data.filter(item =>
        (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.nre_code || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading NRE data...</span>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">NRE Ledgers</h1>
                    <p className="text-muted-foreground">Manage Non-Recurring Engineering and Tooling costs</p>
                </div>
                <Button className="gap-2">
                    <Plus className="w-4 h-4" /> Create NRE Ledger
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Project Tracking</CardTitle>
                            <CardDescription>
                                {data.length > 0
                                    ? `${data.length} NRE project${data.length > 1 ? "s" : ""} tracked`
                                    : "No NRE projects yet — click Create to start"}
                            </CardDescription>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search projects..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {data.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                            <FileBarChart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="font-medium">No NRE Projects Found</p>
                            <p className="text-sm mt-1">Create your first NRE ledger to track tooling and engineering costs</p>
                        </div>
                    ) : (
                        <DataTable
                            data={filtered}
                            columns={columns}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default NREManagement;
