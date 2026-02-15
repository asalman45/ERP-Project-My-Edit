import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Printer, CheckCircle2, AlertCircle, RefreshCw, Send, FileCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

const PayrollPortal: React.FC = () => {
    const [payrolls, setPayrolls] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    useEffect(() => {
        // We would ideally fetch by month/year here
        fetchPayrolls();
    }, []);

    const fetchPayrolls = async () => {
        // Mock for now or use a generic list endpoint if developed
        setLoading(true);
        // ... logic for fetching payrolls
        setLoading(false);
    };

    const processMonthlyPayroll = async () => {
        try {
            setLoading(true);
            const resp = await fetch("/api/hr/payroll/process", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ month: currentMonth, year: currentYear })
            });
            const data = await resp.json();
            if (data.success) {
                toast.success(`Payroll processed for ${currentMonth}/${currentYear}`);
                setPayrolls(data.data);
            }
        } catch (error) {
            toast.error("Payroll processing failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Payroll & Disbursements</h1>
                    <p className="text-muted-foreground">Automated salary calculation and ledger integration</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2 border-indigo-200 text-indigo-700" onClick={processMonthlyPayroll}>
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Run Payroll Cycle
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                        <Send className="w-4 h-4" /> Bulk Salary Payout
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-lg border-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase opacity-80 font-bold tracking-wider flex items-center gap-2">
                            <DollarSign className="w-4 h-4" /> Total Monthly Liability
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{payrolls.reduce((sum, p) => sum + parseFloat(p.net_salary), 0).toLocaleString()}</div>
                        <p className="text-xs opacity-70 mt-1">Net salary to be paid for current cycle</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Payroll Registry: {new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</CardTitle>
                    <CardDescription>Individual summary of earnings and deductions</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead className="text-right">Gross Salary</TableHead>
                                <TableHead className="text-right">Adjustments</TableHead>
                                <TableHead className="text-right font-bold">Net Payable</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payrolls.map((p) => (
                                <TableRow key={p.payroll_id}>
                                    <TableCell>
                                        <div className="font-bold text-slate-900">{p.employee?.first_name} {p.employee?.last_name}</div>
                                        <div className="text-xs text-muted-foreground">{p.employee?.emp_code}</div>
                                    </TableCell>
                                    <TableCell className="text-right">₹{parseFloat(p.gross_salary).toLocaleString()}</TableCell>
                                    <TableCell className="text-right text-red-500">-₹{parseFloat(p.deductions).toLocaleString()}</TableCell>
                                    <TableCell className="text-right font-bold text-indigo-700">₹{parseFloat(p.net_salary).toLocaleString()}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge className={p.status === 'PAID' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none' : 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-none'}>
                                            {p.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-indigo-600">
                                            <Printer className="w-4 h-4" />
                                        </Button>
                                        {p.status === 'PROCESSED' && (
                                            <Button size="sm" variant="outline" className="h-8 text-indigo-600 border-indigo-200">
                                                Mark Paid
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {payrolls.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20 text-slate-300">
                                        <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-10" />
                                        <p className="font-medium">No payroll data found for this cycle. Run the process to generate.</p>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <div className="mt-8 p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3 items-start">
                        <AlertCircle className="text-amber-600 w-5 h-5 mt-0.5" />
                        <p className="text-sm text-amber-800 leading-relaxed">
                            Confirming salary payment will trigger **General Ledger** journal entries: <br />
                            <span className="font-mono text-[10px] mt-1 block">DR. Salary Expense A/c | CR. Main Bank A/c</span>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default PayrollPortal;
