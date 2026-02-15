import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, PieChart, ArrowUpRight, ArrowDownRight, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DataTable } from "@/components/ui/data-table";

interface GSTSummary {
    output_gst: number;
    input_gst: number;
    net_gst_payable: number;
}

const TaxReports: React.FC = () => {
    const [summary, setSummary] = useState<GSTSummary | null>(null);
    const [salesReport, setSalesReport] = useState([]);
    const [purchaseReport, setPurchaseReport] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchSummary();
        fetchReports();
    }, []);

    const fetchSummary = async () => {
        try {
            const resp = await fetch("/api/finance/tax/gst-summary");
            const data = await resp.json();
            if (data.success) setSummary(data.data);
        } catch (error) {
            toast.error("Failed to fetch tax summary");
        }
    };

    const fetchReports = async () => {
        try {
            setLoading(true);
            const [salesResp, purchaseResp] = await Promise.all([
                fetch("/api/finance/tax/sales-gst"),
                fetch("/api/finance/tax/purchase-gst")
            ]);
            const salesData = await salesResp.json();
            const purchaseData = await purchaseResp.json();

            if (salesData.success) setSalesReport(salesData.data);
            if (purchaseData.success) setPurchaseReport(purchaseData.data);
        } catch (error) {
            toast.error("Failed to fetch GST reports");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Tax Compliance Hub</h1>
                    <p className="text-muted-foreground">GST filing support, tax collection tracking, and input credit optimization</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <FileDown className="w-4 h-4" /> Export GSTR-1
                    </Button>
                    <Button variant="outline" className="gap-2">
                        <FileDown className="w-4 h-4" /> Export GSTR-3B
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-blue-50 border-blue-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
                            <ArrowUpRight className="w-4 h-4" /> Total Output GST (Collected)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-900">₹{summary?.output_gst.toLocaleString() || "0"}</div>
                        <p className="text-xs text-blue-700 mt-1">From all taxable sales invoices</p>
                    </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
                            <ArrowDownRight className="w-4 h-4" /> Total Input Tax Credit (ITC)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-900">₹{summary?.input_gst.toLocaleString() || "0"}</div>
                        <p className="text-xs text-green-700 mt-1">Paid to vendors on purchases</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                            <Scale className="w-4 h-4" /> Net Tax Liability
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">₹{summary?.net_gst_payable.toLocaleString() || "0"}</div>
                        <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Current Month Exposure</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Inward Supplies Dashboard</CardTitle>
                        <CardDescription>Verify ITC from purchase invoices</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            data={purchaseReport}
                            columns={[
                                { key: "invoice_no", header: "Inv #" },
                                { key: "supplier_name", header: "Vendor" },
                                { key: "tax_amount", header: "GST Credit", render: (v: number) => `₹${v.toLocaleString()}` },
                                { key: "status", header: "Status", render: () => <Badge variant="outline">Verified</Badge> }
                            ]}
                            loading={loading}
                        />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Outward Supplies Dashboard</CardTitle>
                        <CardDescription>GST collected from customer billing</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            data={salesReport}
                            columns={[
                                { key: "invoice_no", header: "Inv #" },
                                { key: "customer_name", header: "Customer" },
                                { key: "tax_amount", header: "GST Liability", render: (v: number) => `₹${v.toLocaleString()}` },
                                { key: "status", header: "Status", render: () => <Badge variant="secondary">Collected</Badge> }
                            ]}
                            loading={loading}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default TaxReports;
