import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, RefreshCw, TrendingUp, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

const CurrencySettings: React.FC = () => {
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCurrencies();
    }, []);

    const fetchCurrencies = async () => {
        try {
            setLoading(true);
            const resp = await fetch("/api/finance/currencies");
            const data = await resp.json();
            if (data.success) {
                setCurrencies(data.data);
            }
        } catch (error) {
            toast.error("Failed to load currencies");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRate = async (code: string, rate: number) => {
        try {
            const resp = await fetch("/api/finance/currencies/update-rate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, exchange_rate: rate })
            });
            if (resp.ok) {
                toast.success(`Exchange rate updated for ${code}`);
                fetchCurrencies();
            }
        } catch (error) {
            toast.error("Update failed");
        }
    };

    const initBase = async () => {
        try {
            await fetch("/api/finance/currencies/init", { method: "POST" });
            toast.info("Standard currency set initialized");
            fetchCurrencies();
        } catch (e) { }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Multi-Currency & FX</h1>
                    <p className="text-muted-foreground">Managing exchange rates and international trade settings</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={initBase} className="gap-2">
                        <RefreshCw className="w-4 h-4" /> Reset to Defaults
                    </Button>
                    <Button className="bg-blue-600 gap-2">
                        <RefreshCw className="w-4 h-4" /> Sync via API (Live Forex)
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {currencies.filter(c => !c.is_base).map((curr) => (
                    <Card key={curr.code} className="hover:border-blue-200 transition-colors">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50">{curr.code}</Badge>
                                <TrendingUp className="w-4 h-4 text-slate-300" />
                            </div>
                            <CardTitle className="text-lg mt-2">{curr.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground mb-4">1 {curr.code} =</div>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold font-mono">₹</span>
                                <Input
                                    type="number"
                                    defaultValue={curr.exchange_rate}
                                    className="text-2xl font-bold h-10 font-mono"
                                    onBlur={(e) => handleUpdateRate(curr.code, parseFloat(e.target.value))}
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>FX Exposure Registry</CardTitle>
                    <CardDescription>Full listing of active currencies and base parity</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ISO Code</TableHead>
                                <TableHead>Currency Name</TableHead>
                                <TableHead>Symbol</TableHead>
                                <TableHead className="text-right">Rate (vs INR)</TableHead>
                                <TableHead className="text-right">Last Updated</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currencies.map((curr) => (
                                <TableRow key={curr.code}>
                                    <TableCell className="font-bold">{curr.code}</TableCell>
                                    <TableCell>{curr.name}</TableCell>
                                    <TableCell className="text-lg font-bold">{curr.symbol}</TableCell>
                                    <TableCell className="text-right font-mono font-bold">
                                        {curr.is_base ? "1.000000" : parseFloat(curr.exchange_rate).toFixed(6)}
                                    </TableCell>
                                    <TableCell className="text-right text-xs text-muted-foreground">
                                        {new Date(curr.updated_at).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={curr.is_base ? 'secondary' : 'outline'} className={curr.is_base ? 'bg-indigo-50 text-indigo-700' : ''}>
                                            {curr.is_base ? 'System Base' : 'Active FX'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="mt-6 bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 items-start">
                        <Info className="text-blue-600 w-5 h-5 mt-0.5" />
                        <div className="text-sm text-blue-800 leading-relaxed">
                            EmpclERP uses <b>INR</b> as the functional reporting currency. All multi-currency transactions are automatically translated to INR in the General Ledger for cross-border consolidation.
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default CurrencySettings;
