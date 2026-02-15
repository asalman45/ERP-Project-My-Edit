import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, History, AlertCircle, CheckCircle2, Send, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

interface OverdueInvoice {
    invoice_id: string;
    invoice_no: string;
    customer_name: string;
    total_amount: number;
    due_date: string;
    effort_count: number;
    last_contact_date?: string;
    payment_status: string;
}

const ArCollection: React.FC = () => {
    const [overdueInvoices, setOverdueInvoices] = useState<OverdueInvoice[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchOverdue();
    }, []);

    const fetchOverdue = async () => {
        try {
            setLoading(true);
            const resp = await fetch("/api/finance/collections/overdue");
            const data = await resp.json();
            if (data.success) {
                setOverdueInvoices(data.data);
            }
        } catch (error) {
            toast.error("Failed to fetch overdue invoices");
        } finally {
            setLoading(false);
        }
    };

    const handleSendReminder = async (invoiceId: string) => {
        try {
            const resp = await fetch("/api/finance/collections/send-reminder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ invoice_id: invoiceId })
            });
            const data = await resp.json();
            if (data.success) {
                toast.success(data.message);
                fetchOverdue();
            }
        } catch (error) {
            toast.error("Failed to send reminder");
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">AR Collection Center</h1>
                    <p className="text-muted-foreground">Automated reminders and delinquency management</p>
                </div>
                <div className="flex items-center gap-4 bg-amber-50 border border-amber-100 p-3 rounded-lg">
                    <AlertCircle className="text-amber-600 w-5 h-5" />
                    <div>
                        <p className="text-xs text-amber-800 uppercase font-bold">Risk Exposure</p>
                        <p className="text-xl font-bold text-amber-900">
                            ₹{overdueInvoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount as any), 0).toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Delinquent Accounts</CardTitle>
                    <CardDescription>Invoices requiring immediate collection efforts</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice #</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Overdue Since</TableHead>
                                <TableHead className="text-right">Balance Due</TableHead>
                                <TableHead className="text-center">Effort Level</TableHead>
                                <TableHead>Last Contact</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {overdueInvoices.map((inv) => (
                                <TableRow key={inv.invoice_id}>
                                    <TableCell className="font-medium">{inv.invoice_no}</TableCell>
                                    <TableCell>{inv.customer_name}</TableCell>
                                    <TableCell className="text-red-600 font-medium">
                                        {new Date(inv.due_date).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right font-bold">₹{inv.total_amount.toLocaleString()}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={inv.effort_count > 2 ? 'destructive' : 'outline'}>
                                            {inv.effort_count} Reminders Sent
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {inv.last_contact_date ? new Date(inv.last_contact_date).toLocaleString() : 'Never'}
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleSendReminder(inv.invoice_id)}
                                            className="text-blue-600 hover:bg-blue-50"
                                        >
                                            <Send className="w-3 h-3 mr-1" /> Remind
                                        </Button>
                                        <Button size="sm" variant="ghost">
                                            <History className="w-3 h-3" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {overdueInvoices.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500 opacity-20" />
                                        Excellent! No overdue invoices found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Automation Logic</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="bg-blue-100 p-2 rounded text-blue-700">1</div>
                            <p className="text-sm text-muted-foreground">System identifies invoices <b>Past Due</b> by 1 day and sends Level 1 "Soft Reminder" automatically.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="bg-amber-100 p-2 rounded text-amber-700">2</div>
                            <p className="text-sm text-muted-foreground">At <b>15 days Overdue</b>, Level 2 reminder is sent and CC'd to the Sales Head.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="bg-red-100 p-2 rounded text-red-700">3</div>
                            <p className="text-sm text-muted-foreground">At <b>30 days Overdue</b>, the account is flagged for manual legal/management intervention.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ArCollection;
