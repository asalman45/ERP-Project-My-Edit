import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, CheckCircle2, AlertCircle, RefreshCw, Upload, ArrowRightLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Account {
    account_id: string;
    name: string;
    code: string;
}

interface BankTransaction {
    txn_id: string;
    transaction_date: string;
    description: string;
    amount: number;
    recon_status: string;
    journalLine?: any;
}

const BankReconciliation: React.FC = () => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<string>("");
    const [transactions, setTransactions] = useState<BankTransaction[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchAccounts();
    }, []);

    useEffect(() => {
        if (selectedAccount) {
            fetchTransactions(selectedAccount);
        }
    }, [selectedAccount]);

    const fetchAccounts = async () => {
        try {
            const resp = await fetch("/api/finance/accounts");
            const data = await resp.json();
            if (data.success) {
                // Filter for Bank accounts
                const bankAccounts = data.data.filter((a: any) => a.category === "BANK");
                setAccounts(bankAccounts);
                if (bankAccounts.length > 0) setSelectedAccount(bankAccounts[0].account_id);
            }
        } catch (error) {
            toast.error("Failed to fetch accounts");
        }
    };

    const fetchTransactions = async (accountId: string) => {
        try {
            setLoading(true);
            const resp = await fetch(`/api/finance/bank/transactions/${accountId}`);
            const data = await resp.json();
            if (data.success) {
                setTransactions(data.data);
            }
        } catch (error) {
            toast.error("Failed to fetch transactions");
        } finally {
            setLoading(false);
        }
    };

    const handleAutoMatch = async () => {
        if (!selectedAccount) return;
        try {
            const resp = await fetch("/api/finance/bank/auto-match", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ account_id: selectedAccount })
            });
            const data = await resp.json();
            if (data.success && data.data.length > 0) {
                toast.success(`Found ${data.data.length} potential matches. Processing...`);
                // In a real app, we'd loop and call reconcile or do it in bulk on backend
                // For demo, we'll just refresh
                setTimeout(() => fetchTransactions(selectedAccount), 1000);
            } else {
                toast.info("No automatic matches found.");
            }
        } catch (error) {
            toast.error("Auto-match failed");
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Bank Reconciliation</h1>
                    <p className="text-muted-foreground">Match bank transactions with your internal ledger</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <Upload className="w-4 h-4" /> Import Statement
                    </Button>
                    <Button onClick={handleAutoMatch} className="gap-2 bg-green-600 hover:bg-green-700">
                        <RefreshCw className="w-4 h-4" /> Auto Match
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-sm">Bank Account</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select account" />
                            </SelectTrigger>
                            <SelectContent>
                                {accounts.map(acc => (
                                    <SelectItem key={acc.account_id} value={acc.account_id}>
                                        {acc.name} ({acc.code})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                <Card className="md:col-span-3">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm">Reconciliation Progress</CardTitle>
                        </div>
                        <div className="flex gap-4 text-sm font-medium">
                            <span className="text-green-600 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> Reconciled: {transactions.filter(t => t.recon_status === 'RECONCILED').length}
                            </span>
                            <span className="text-yellow-600 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" /> Unmatched: {transactions.filter(t => t.recon_status === 'UNRECONCILED').length}
                            </span>
                        </div>
                    </CardHeader>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bank Side */}
                <Card>
                    <CardHeader>
                        <CardTitle>Bank Statement Transactions</CardTitle>
                        <CardDescription>Transactions imported from your bank</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {transactions.map(txn => (
                                <div key={txn.txn_id} className={`p-4 border rounded-lg flex items-center justify-between ${txn.recon_status === 'RECONCILED' ? 'bg-green-50 border-green-100' : 'bg-white'}`}>
                                    <div>
                                        <p className="font-medium">{txn.description}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(txn.transaction_date).toLocaleDateString()} • Ref: {txn.txn_id.slice(0, 8)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold ${txn.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            ₹{Math.abs(txn.amount).toLocaleString()}
                                        </p>
                                        <Badge variant={txn.recon_status === 'RECONCILED' ? 'default' : 'outline'}>
                                            {txn.recon_status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                            {transactions.length === 0 && (
                                <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                                    No transactions found for this account.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Ledger Side */}
                <Card>
                    <CardHeader>
                        <CardTitle>Internal Ledger Entries</CardTitle>
                        <CardDescription>Recent journal entries for this account</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* This would normally show unreconciled journal entries */}
                            <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-lg flex flex-col items-center">
                                <ArrowRightLeft className="w-8 h-8 mb-2 opacity-20" />
                                <p>Select a bank transaction to find matches in the ledger.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default BankReconciliation;
