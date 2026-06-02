import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Printer, Download, User, Calendar, ArrowUpRight, ArrowDownLeft, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { detailedReportsApi } from "@/services/api";

const CustomerLedger: React.FC = () => {
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState("");
    const [ledgerData, setLedgerData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Filters
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    useEffect(() => {
        fetchCustomers();
    }, []);

    useEffect(() => {
        if (selectedCustomerId) {
            fetchLedger();
        }
    }, [selectedCustomerId, startDate, endDate]);

    const fetchCustomers = async () => {
        try {
            const resp = await fetch("/api/sales-orders/customers/list");
            const data = await resp.json();
            if (data.success) setCustomers(data.data);
        } catch (error) {
            toast.error("Failed to load customers");
        }
    };

    const fetchLedger = async () => {
        try {
            setLoading(true);
            const query = new URLSearchParams();
            if (startDate) query.append("start_date", startDate);
            if (endDate) query.append("end_date", endDate);

            const resp = await fetch(`/api/finance/customer-ledger/${selectedCustomerId}?${query.toString()}`);
            const data = await resp.json();
            if (data.success) {
                setLedgerData(data.data);
            }
        } catch (error) {
            toast.error("Failed to fetch customer ledger");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: number) => `Rs. ${val.toLocaleString()}`;

    const handleExportPDF = async () => {
        if (!selectedCustomerId) {
            toast.error("Please select a customer first to generate the PDF.");
            return;
        }
        try {
            setLoading(true);
            const blob = await detailedReportsApi.downloadCustomerLedgerReport('pdf', {
                customer_id: selectedCustomerId,
                start_date: startDate || undefined,
                end_date: endDate || undefined
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Customer_Ledger_Statement_${new Date().getTime()}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success("PDF generated successfully!");
        } catch (error: any) {
            toast.error("Failed to export PDF: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Customer Ledger</h1>
                    <p className="text-muted-foreground">Comprehensive statement of account for customers</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <Printer className="w-4 h-4" /> Print Statement
                    </Button>
                    <Button variant="outline" className="gap-2 text-red-600 border-red-200 hover:bg-red-50" onClick={handleExportPDF} disabled={loading || !selectedCustomerId}>
                        <FileText className="w-4 h-4" /> Export PDF
                    </Button>
                    <Button className="gap-2 bg-indigo-600">
                        <Download className="w-4 h-4" /> Export Excel
                    </Button>
                </div>
            </div>

            <Card className="bg-slate-50 border-slate-200">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                        <div className="grid gap-2">
                            <Label htmlFor="customer">Select Customer</Label>
                            <select
                                id="customer"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={selectedCustomerId}
                                onChange={(e) => setSelectedCustomerId(e.target.value)}
                            >
                                <option value="">-- Select Customer --</option>
                                {customers.map(c => (
                                    <option key={c.customer_id} value={c.customer_id}>{c.company_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="start">From Date</Label>
                            <Input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="end">To Date</Label>
                            <Input id="end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="secondary" onClick={() => { setStartDate(""); setEndDate(""); }}>Reset</Button>
                            <Button className="bg-slate-800" onClick={fetchLedger}>
                                <Search className="w-4 h-4 mr-2" /> Filter
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {ledgerData && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="border-l-4 border-l-blue-500">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-slate-500 uppercase">Total Billed</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600">{formatCurrency(ledgerData.total_debit)}</div>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-green-500">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-slate-500 uppercase">Total Received</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{formatCurrency(ledgerData.total_credit)}</div>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-amber-500">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-slate-500 uppercase">Outstanding Balance</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-amber-600">{formatCurrency(ledgerData.closing_balance)}</div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Transaction History</CardTitle>
                            <CardDescription>Detailed list of invoices and payments for {customers.find(c => c.customer_id === selectedCustomerId)?.company_name}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Reference</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Debit (+)</TableHead>
                                        <TableHead className="text-right">Credit (-)</TableHead>
                                        <TableHead className="text-right">Balance</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {ledgerData.ledger.map((entry: any, idx: number) => (
                                        <TableRow key={idx}>
                                            <TableCell className="text-sm">{new Date(entry.date).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={entry.type === 'INVOICE' ? 'text-blue-600 border-blue-200' : 'text-green-600 border-green-200'}>
                                                    {entry.type === 'INVOICE' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownLeft className="w-3 h-3 mr-1" />}
                                                    {entry.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-medium">{entry.reference}</TableCell>
                                            <TableCell className="text-slate-500 text-sm">{entry.description}</TableCell>
                                            <TableCell className="text-right font-medium">{entry.debit > 0 ? formatCurrency(entry.debit) : "-"}</TableCell>
                                            <TableCell className="text-right font-medium">{entry.credit > 0 ? formatCurrency(entry.credit) : "-"}</TableCell>
                                            <TableCell className="text-right font-bold">{formatCurrency(entry.balance)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </>
            )}

            {!selectedCustomerId && (
                <div className="flex flex-col items-center justify-center p-20 text-center border-2 border-dashed rounded-xl bg-slate-50">
                    <User className="w-12 h-12 text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium">No Customer Selected</h3>
                    <p className="text-slate-500 max-w-sm">Please select a customer from the dropdown above to view their financial statement and transaction history.</p>
                </div>
            )}
        </div>
    );
};

export default CustomerLedger;
