import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Send, CheckCircle2, XCircle, Clock, Download, Plus, Eye, Share2, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

const QuotationCenter: React.FC = () => {
    const [quotations, setQuotations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchQuotations();
    }, []);

    const fetchQuotations = async () => {
        try {
            setLoading(true);
            const resp = await fetch("/api/crm/quotations");
            const data = await resp.json();
            if (data.success) {
                setQuotations(data.data);
            }
        } catch (error) {
            toast.error("Failed to fetch quotations");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (quoteId: string, status: string) => {
        try {
            const resp = await fetch(`/api/crm/quotations/${quoteId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            });
            if (resp.ok) {
                toast.info(`Quotation marked as ${status}`);
                fetchQuotations();
            }
        } catch (error) {
            toast.error("Update failed");
        }
    };

    const handleConvertToSO = async (quoteId: string) => {
        try {
            const resp = await fetch(`/api/crm/quotations/convert/${quoteId}`, {
                method: "POST"
            });
            const data = await resp.json();
            if (data.success) {
                toast.success("Successfully converted to Sales Order!");
                fetchQuotations();
            } else {
                toast.error(data.error || "Conversion failed");
            }
        } catch (error) {
            toast.error("Network error during conversion");
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "ACCEPTED": return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100"><CheckCircle2 className="w-3 h-3 mr-1" /> Accepted</Badge>;
            case "SENT": return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100"><Send className="w-3 h-3 mr-1" /> Sent</Badge>;
            case "DRAFT": return <Badge variant="outline" className="bg-slate-50 border-slate-200">Draft</Badge>;
            case "REJECTED": return <Badge variant="destructive">Rejected</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Proposal & Bid Manager</h1>
                    <p className="text-muted-foreground">Generating and tracking customer quotations</p>
                </div>
                <Button className="bg-indigo-600 gap-2">
                    <Plus className="w-4 h-4" /> Prepare New Quote
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-blue-600 uppercase flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Total Open Bids
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{quotations.filter(q => q.status !== 'REJECTED' && q.status !== 'ACCEPTED').reduce((s, q) => s + parseFloat(q.total_amount), 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">Weighted by probability</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Quotation Registry</CardTitle>
                    <CardDescription>Full lifecycle management for customer proposals</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Quote #</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Valid Until</TableHead>
                                <TableHead className="text-right">Total Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {quotations.map((quote) => (
                                <TableRow key={quote.quote_id}>
                                    <TableCell className="font-bold text-indigo-700">{quote.quote_no}</TableCell>
                                    <TableCell>
                                        <div className="font-medium">{quote.customer?.name}</div>
                                        <div className="text-[10px] text-muted-foreground uppercase">{quote.opportunity?.title || "Direct Sale"}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                            <Calendar className="w-3 h-3 text-slate-400" /> {new Date(quote.valid_until).toLocaleDateString()}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-slate-900">
                                        ₹{parseFloat(quote.total_amount).toLocaleString()}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(quote.status)}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-indigo-600">
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                                            <Download className="w-4 h-4" />
                                        </Button>
                                        {quote.status === "SENT" && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 h-8"
                                                onClick={() => handleStatusUpdate(quote.quote_id, "ACCEPTED")}
                                            >
                                                Accept
                                            </Button>
                                        )}
                                        {quote.status === "ACCEPTED" && (
                                            <Button
                                                size="sm"
                                                className="bg-indigo-600 hover:bg-indigo-700 h-8 gap-1"
                                                onClick={() => handleConvertToSO(quote.quote_id)}
                                            >
                                                <FileText className="w-3 h-3" /> Convert to Order
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {quotations.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20 text-slate-300">
                                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-10" />
                                        <p className="font-medium">No quotations generated yet.</p>
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

export default QuotationCenter;
