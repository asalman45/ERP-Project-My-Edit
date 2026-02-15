import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, FileBarChart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";

const NREManagement: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState("");

    const columns = [
        { key: "nre_code", header: "NRE Code" },
        { key: "name", header: "Project Name" },
        { key: "product_name", header: "Associated Product" },
        { key: "estimated_cost", header: "Budget (INR)", render: (v: number) => `₹${v.toLocaleString()}` },
        { key: "actual_cost", header: "Actual (INR)", render: (v: number) => `₹${v.toLocaleString()}` },
        {
            key: "status",
            header: "Status",
            render: (status: string) => (
                <Badge variant={status === "ACTIVE" ? "default" : "secondary"}>
                    {status}
                </Badge>
            )
        },
        { key: "created_at", header: "Created" },
    ];

    // Dummy data for visual representation
    const data = [
        {
            nre_code: "NRE-TOOL-001",
            name: "Chassis Die Development",
            product_name: "Truck Chassis Frame",
            estimated_cost: 250000,
            actual_cost: 210000,
            status: "ACTIVE",
            created_at: "2024-01-15"
        },
        {
            nre_code: "NRE-ENG-002",
            name: "Brake System Prototyping",
            product_name: "Air Brake Hub",
            estimated_cost: 150000,
            actual_cost: 165000,
            status: "ACTIVE",
            created_at: "2024-02-01"
        }
    ];

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
                            <CardDescription>All project-specific tooling and engineering expenses</CardDescription>
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
                    <DataTable
                        data={data}
                        columns={columns}
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default NREManagement;
