import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Landmark, PieChart, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

const FinancialStatements: React.FC = () => {
    const [pnLData, setPnLData] = useState<any>(null);
    const [balanceSheet, setBalanceSheet] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const [pnlResp, bsResp] = await Promise.all([
                fetch("/api/finance/reporting/p-and-l"),
                fetch("/api/finance/reporting/balance-sheet")
            ]);
            const pnlData = await pnlResp.json();
            const bsData = await bsResp.json();

            if (pnlData.success) setPnLData(pnlData.data);
            if (bsData.success) setBalanceSheet(bsData.data);
        } catch (error) {
            toast.error("Failed to load financial statements");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Financial Statements</h1>
                    <p className="text-muted-foreground mt-1">Certified Profit & Loss and Balance Sheet auditing</p>
                </div>
                <Landmark className="w-10 h-10 text-indigo-600 opacity-20" />
            </div>

            <Tabs defaultValue="pnl" className="w-full">
                <TabsList className="grid w-[400px] grid-cols-2">
                    <TabsTrigger value="pnl" className="gap-2">
                        <PieChart className="w-4 h-4" /> Profit & Loss
                    </TabsTrigger>
                    <TabsTrigger value="balance-sheet" className="gap-2">
                        <FileSpreadsheet className="w-4 h-4" /> Balance Sheet
                    </TabsTrigger>
                </TabsList>

                {/* Profit & Loss Content */}
                <TabsContent value="pnl" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">Gross Revenue</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">₹{pnLData?.totals?.revenue?.toLocaleString()}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">Total Operating Expense</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">₹{pnLData?.totals?.expense?.toLocaleString()}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-indigo-900 text-white">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">Net Profit</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">₹{pnLData?.totals?.net_profit?.toLocaleString()}</div>
                                <Badge variant="outline" className="mt-2 text-white border-white/20">
                                    {pnLData?.totals?.net_profit > 0 ? 'Profitable' : 'Loss'}
                                </Badge>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Operating Performance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Account</TableHead>
                                        <TableHead className="text-right">Actual (A)</TableHead>
                                        <TableHead className="text-right">Budget (B)</TableHead>
                                        <TableHead className="text-right">Variance (A-B)</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow className="bg-muted/50 font-bold"><TableCell colSpan={5}>REVENUE</TableCell></TableRow>
                                    {pnLData?.revenue?.map((row: any) => (
                                        <TableRow key={row.code}>
                                            <TableCell>{row.name}</TableCell>
                                            <TableCell className="text-right">₹{row.actual.toLocaleString()}</TableCell>
                                            <TableCell className="text-right">₹{row.budget.toLocaleString()}</TableCell>
                                            <TableCell className={`text-right ${row.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {row.variance >= 0 ? '+' : ''}₹{row.variance.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {row.variance >= 0 ? <TrendingUp className="w-4 h-4 inline text-green-600" /> : <TrendingDown className="w-4 h-4 inline text-red-600" />}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="bg-muted/50 font-bold"><TableCell colSpan={5}>EXPENSES</TableCell></TableRow>
                                    {pnLData?.expense?.map((row: any) => (
                                        <TableRow key={row.code}>
                                            <TableCell>{row.name}</TableCell>
                                            <TableCell className="text-right">₹{row.actual.toLocaleString()}</TableCell>
                                            <TableCell className="text-right">₹{row.budget.toLocaleString()}</TableCell>
                                            <TableCell className={`text-right ${row.variance <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {row.variance > 0 ? '+' : ''}₹{row.variance.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {row.variance <= 0 ? <TrendingUp className="w-4 h-4 inline text-green-600 transition-transform rotate-180" /> : <TrendingDown className="w-4 h-4 inline text-red-600 transition-transform rotate-180" />}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Balance Sheet Content */}
                <TabsContent value="balance-sheet" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Assets */}
                        <Card>
                            <CardHeader className="bg-green-50/50">
                                <CardTitle className="text-green-800">Assets</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableBody>
                                        {balanceSheet?.assets?.map((a: any) => (
                                            <TableRow key={a.code}>
                                                <TableCell>{a.name}</TableCell>
                                                <TableCell className="text-right font-medium">₹{a.balance.toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-green-100/50 font-bold">
                                            <TableCell>Total Assets</TableCell>
                                            <TableCell className="text-right">₹{balanceSheet?.totals?.assets?.toLocaleString()}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Liabilities & Equity */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader className="bg-red-50/50">
                                    <CardTitle className="text-red-800">Liabilities</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableBody>
                                            {balanceSheet?.liabilities?.map((l: any) => (
                                                <TableRow key={l.code}>
                                                    <TableCell>{l.name}</TableCell>
                                                    <TableCell className="text-right font-medium">₹{l.balance.toLocaleString()}</TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow className="bg-red-100/50 font-bold">
                                                <TableCell>Total Liabilities</TableCell>
                                                <TableCell className="text-right">₹{balanceSheet?.totals?.liabilities?.toLocaleString()}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="bg-blue-50/50">
                                    <CardTitle className="text-blue-800">Equity</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableBody>
                                            {balanceSheet?.equity?.map((e: any) => (
                                                <TableRow key={e.code}>
                                                    <TableCell>{e.name}</TableCell>
                                                    <TableCell className="text-right font-medium">₹{e.balance.toLocaleString()}</TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow className="bg-blue-100/50 font-bold">
                                                <TableCell>Total Equity</TableCell>
                                                <TableCell className="text-right">₹{balanceSheet?.totals?.equity?.toLocaleString()}</TableCell>
                                            </TableRow>
                                            <TableRow className="bg-slate-900 text-white font-bold text-lg">
                                                <TableCell>Total Liabilities & Equity</TableCell>
                                                <TableCell className="text-right">₹{(balanceSheet?.totals?.liabilities + balanceSheet?.totals?.equity).toLocaleString()}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default FinancialStatements;
