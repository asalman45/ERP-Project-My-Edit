import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, TrendingUp, ArrowDownRight, ArrowUpRight, FileText } from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";
import { DataTable } from "@/components/ui/data-table";

const FinanceDashboard: React.FC = () => {
    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Financial Treasury</h1>
                    <p className="text-muted-foreground">General Ledger, Cash Flow, and NRE Management</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Total Liquidity"
                    value="₹45,20,000"
                    description="+12% from last month"
                    icon={Wallet}
                />
                <StatsCard
                    title="Accounts Receivable"
                    value="₹12,80,000"
                    description="Pending customer payments"
                    icon={ArrowDownRight}
                />
                <StatsCard
                    title="Accounts Payable"
                    value="₹8,40,000"
                    description="Due to suppliers"
                    icon={ArrowUpRight}
                />
                <StatsCard
                    title="NRE Investments"
                    value="₹5,60,000"
                    description="Non-recurring engineering costs"
                    icon={FileText}
                />
            </div>

            <Tabs defaultValue="ledger" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="ledger">General Ledger</TabsTrigger>
                    <TabsTrigger value="nre">NRE Ledgers</TabsTrigger>
                    <TabsTrigger value="cashflow">Cash Flow Statement</TabsTrigger>
                </TabsList>
                <TabsContent value="ledger" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Journal Entries</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                                Journal Entry History will appear here. No records found.
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="nre">
                    <Card>
                        <CardHeader>
                            <CardTitle>Active NRE Projects</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                                NRE (Non-Recurring Engineering) tracking module. Click "Create" to start a ledger.
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default FinanceDashboard;
