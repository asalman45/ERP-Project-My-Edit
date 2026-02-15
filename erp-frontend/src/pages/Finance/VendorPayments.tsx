import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Clock, Calendar, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { DataTable } from "@/components/ui/data-table";

interface PendingPayment {
    invoice_id: string;
    invoice_no: string;
    supplier_name: string;
    due_date: string;
    total_amount: number;
    balance: number;
    days_overdue: number;
    status: string;
}

const VendorPayments: React.FC = () => {
    const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchPendingPayments();
    }, []);

    const fetchPendingPayments = async () => {
        try {
            setLoading(true);
            const resp = await fetch("/api/finance/vendor-payments/pending");
            const data = await resp.json();
            if (data.success) {
                setPendingPayments(data.data);
            }
        } catch (error) {
            toast.error("Failed to fetch pending payments");
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { key: "invoice_no", header: "Invoice #" },
        { key: "supplier_name", header: "Vendor Name" },
        {
            key: "due_date",
            header: "Due Date",
            render: (date: string) => new Date(date).toLocaleDateString()
        },
        {
            key: "balance",
            header: "Outstanding",
            render: (v: number) => `₹${v.toLocaleString()}`
        },
        {
            key: "days_overdue",
            header: "Aging",
            render: (days: number) => (
                <span className={days > 0 ? "text-red-600 font-bold" : "text-green-600"}>
                    {days > 0 ? `${days} days overdue` : "Due soon"}
                </span>
            )
        },
        {
            key: "status",
            header: "Status",
            render: (status: string) => (
                <Badge variant={status === 'APPROVED_FOR_PAYMENT' ? 'default' : 'secondary'}>
                    {status.replace(/_/g, ' ')}
                </Badge>
            )
        },
        {
            key: "actions",
            header: "Actions",
            render: (_: any, item: PendingPayment) => (
                <Button variant="outline" size="sm" className="gap-1">
                    <DollarSign className="w-3 h-3" /> Pay Now
                </Button>
            )
        }
    ];

    const totalOutstanding = pendingPayments.reduce((sum, p) => sum + p.balance, 0);
    const overdueCount = pendingPayments.filter(p => p.days_overdue > 0).length;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Vendor Payments</h1>
                    <p className="text-muted-foreground">Manage Accounts Payable and Vendor relationships</p>
                </div>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                    <Calendar className="w-4 h-4" /> Weekly Payment Run
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Total Accounts Payable</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">₹{totalOutstanding.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">Across {pendingPayments.length} pending invoices</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Critical Overdue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-bold ${overdueCount > 0 ? 'text-red-600' : 'text-green-600'}`}>{overdueCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">Invoices passed their due date</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Approved for Payment</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-600">
                            {pendingPayments.filter(p => p.status === 'APPROVED_FOR_PAYMENT').length}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Ready for transfer processing</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Accounts Payable Detail</CardTitle>
                    <CardDescription>Comprehensive list of all outstanding vendor obligations</CardDescription>
                </CardHeader>
                <CardContent>
                    <DataTable
                        data={pendingPayments}
                        columns={columns}
                        loading={loading}
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default VendorPayments;
