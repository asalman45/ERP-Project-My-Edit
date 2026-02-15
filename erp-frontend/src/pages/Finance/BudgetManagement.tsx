import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, AlertTriangle, CheckCircle2, RefreshCcw, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

const BudgetManagement: React.FC = () => {
    const [budgets, setBudgets] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Simplified: Fetch P&L data which contains budget/actuals
            const resp = await fetch("/api/finance/reporting/p-and-l?fiscalYear=2023-24");
            const data = await resp.json();
            if (data.success) {
                // Flatten revenue and expense for budget editing
                setBudgets([...data.data.revenue, ...data.data.expense]);
            }
        } catch (error) {
            toast.error("Failed to fetch budget data");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateBudget = async (accountId: string, amount: number) => {
        try {
            const resp = await fetch("/api/finance/budgets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ account_id: accountId, fiscal_year: "2023-24", amount })
            });
            if (resp.ok) {
                toast.success("Budget updated");
                fetchData();
            }
        } catch (error) {
            toast.error("Update failed");
        }
    };

    const runVarianceCheck = async () => {
        try {
            const resp = await fetch("/api/finance/budgets/check-variances", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fiscal_year: "2023-24" })
            });
            const data = await resp.json();
            if (data.success) {
                toast(`Variance check complete. ${data.alerts_created} alerts generated.`);
            }
        } catch (error) {
            toast.error("Variance check failed");
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Budgetary Control</h1>
                    <p className="text-muted-foreground">Setting fiscal targets and monitoring variance alerts</p>
                </div>
                <Button onClick={runVarianceCheck} variant="outline" className="gap-2 text-amber-600 border-amber-200 hover:bg-amber-50">
                    <AlertTriangle className="w-4 h-4" /> Run Variance Audit
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase opacity-70 font-bold tracking-wider flex items-center gap-2">
                            <Target className="w-4 h-4" /> Global Fiscal Goal
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{budgets.reduce((s, b) => s + parseFloat(b.budget), 0).toLocaleString()}</div>
                        <p className="text-xs opacity-80 mt-1">Total approved budget for FY 2023-24</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Departmental Spend Targets</CardTitle>
                    <CardDescription>Edit budget allocations for revenue and expense accounts</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Account</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Actual YTD</TableHead>
                                <TableHead className="text-right">Fiscal Budget</TableHead>
                                <TableHead className="text-center">Utilization</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {budgets.map((b, idx) => {
                                const utilization = b.budget > 0 ? (b.actual / b.budget) * 100 : 0;
                                return (
                                    <TableRow key={idx}>
                                        <TableCell>
                                            <div className="font-medium">{b.name}</div>
                                            <div className="text-xs text-muted-foreground">{b.code}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{utilization > 100 ? "OVER-BUDGET" : "ACTIVE"}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-bold">₹{b.actual.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Input
                                                type="number"
                                                className="w-32 text-right ml-auto"
                                                defaultValue={b.budget}
                                                onBlur={(e) => handleUpdateBudget(b.id || b.code, parseFloat(e.target.value))}
                                            />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="w-full bg-slate-100 rounded-full h-2 max-w-[100px] mx-auto overflow-hidden">
                                                <div
                                                    className={`h-full ${utilization > 90 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${Math.min(utilization, 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase mt-1 block">{utilization.toFixed(1)}%</span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" variant="ghost"><Save className="w-3 h-3" /></Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default BudgetManagement;
