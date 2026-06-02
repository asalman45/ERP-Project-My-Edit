import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Receipt, User, Timer, CheckCircle2, XCircle, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ExpenseManagement: React.FC = () => {
    const [claims, setClaims] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isNewClaimOpen, setIsNewClaimOpen] = useState(false);
    const [isApproveOpen, setIsApproveOpen] = useState(false);
    const [selectedClaim, setSelectedClaim] = useState<any>(null);

    // Filters
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Approval Form
    const [approvalData, setApprovalData] = useState({
        payment_account_id: "365aefa9-c424-49ae-8241-d9eaae3e89b0", // Default Bank
        expense_account_id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d" // Default Travel
    });

    // Form State
    const [formData, setFormData] = useState({
        employee_name: "",
        description: "",
        amount: 0,
        category: "Travel"
    });

    useEffect(() => {
        fetchClaims();
        fetchAccounts();
    }, [startDate, endDate]);

    const fetchAccounts = async () => {
        const resp = await fetch("/api/finance/accounts");
        const data = await resp.json();
        if (data.success) setAccounts(data.data);
    };

    const fetchClaims = async () => {
        try {
            setLoading(true);
            const query = new URLSearchParams();
            if (startDate) query.append("start_date", startDate);
            if (endDate) query.append("end_date", endDate);
            
            const resp = await fetch(`/api/finance/expenses/claims?${query.toString()}`);
            const data = await resp.json();
            if (data.success) {
                setClaims(data.data);
            }
        } catch (error) {
            toast.error("Failed to fetch expense claims");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitClaim = async () => {
        try {
            const resp = await fetch("/api/finance/expenses/claims", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            if (resp.ok) {
                toast.success("Claim submitted successfully");
                setIsNewClaimOpen(false);
                fetchClaims();
            }
        } catch (error) {
            toast.error("Submission failed");
        }
    };

    const handleApprove = async () => {
        if (!selectedClaim) return;
        try {
            const resp = await fetch(`/api/finance/expenses/approve/${selectedClaim.claim_id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    approved_by: "Admin", 
                    payment_account_id: approvalData.payment_account_id,
                    expense_account_id: approvalData.expense_account_id
                })
            });
            if (resp.ok) {
                toast.info("Claim approved and posted to Ledger");
                setIsApproveOpen(false);
                fetchClaims();
            }
        } catch (error) {
            toast.error("Approval failed");
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Expense Management</h1>
                    <p className="text-muted-foreground">Employee reimbursements and minor business spend</p>
                </div>
                <Dialog open={isNewClaimOpen} onOpenChange={setIsNewClaimOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 bg-indigo-600">
                            <Plus className="w-4 h-4" /> New Expense Claim
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Submit Reimbursement Claim</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="emp">Employee Name</Label>
                                <Input id="emp" onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="desc">Description</Label>
                                <Input id="desc" onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="amt">Amount</Label>
                                    <Input id="amt" type="number" onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="cat">Category</Label>
                                    <select id="cat" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                                        <option>Travel</option>
                                        <option>Meals</option>
                                        <option>Office Supplies</option>
                                        <option>Training</option>
                                        <option>Hardware</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Receipt Attachment</Label>
                                <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-slate-50 border-slate-200">
                                    <Receipt className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                                    <p className="text-sm text-slate-500">Click to upload or drag receipt image</p>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsNewClaimOpen(false)}>Cancel</Button>
                            <Button className="bg-indigo-600" onClick={handleSubmitClaim}>Submit Claim</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg border border-slate-200">
                <div className="grid gap-2">
                    <Label htmlFor="start">Start Date</Label>
                    <Input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="end">End Date</Label>
                    <Input id="end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
                <div className="flex items-end">
                    <Button variant="outline" onClick={() => { setStartDate(""); setEndDate(""); }}>Clear Filters</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase text-slate-400 font-bold tracking-wider flex items-center gap-2">
                            <Timer className="w-4 h-4" /> Pending Approval
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Rs. {claims.filter(c => c.status === 'PENDING').reduce((s, c) => s + parseFloat(c.amount), 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">{claims.filter(c => c.status === 'PENDING').length} claims waiting</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase text-slate-400 font-bold tracking-wider flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> Processed This Month
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Rs. {claims.filter(c => c.status === 'PAID').reduce((s, c) => s + parseFloat(c.amount), 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">Successfully posted to ledger</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Internal Expense Registry</CardTitle>
                    <CardDescription>Track and approve employee claims and petty cash spend</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Employee</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {claims.map((claim) => (
                                <TableRow key={claim.claim_id}>
                                    <TableCell>{new Date(claim.claim_date).toLocaleDateString()}</TableCell>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-slate-400" /> {claim.employee_name}
                                        </div>
                                    </TableCell>
                                    <TableCell><Badge variant="outline">{claim.category}</Badge></TableCell>
                                    <TableCell className="max-w-[200px] truncate" title={claim.description}>{claim.description}</TableCell>
                                    <TableCell className="text-right font-bold">Rs. {parseFloat(claim.amount).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Badge className={claim.status === 'PAID' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-amber-100 text-amber-700 hover:bg-amber-100'}>
                                            {claim.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {claim.status === 'PENDING' ? (
                                            <Button size="sm" variant="outline" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => { setSelectedClaim(claim); setIsApproveOpen(true); }}>
                                                Approve & Pay
                                            </Button>
                                        ) : (
                                            <Badge variant="secondary">Posted</Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve & Post to Ledger</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="text-sm font-medium">Claim Details</p>
                            <p className="text-xs text-slate-500">{selectedClaim?.description}</p>
                            <p className="text-lg font-bold mt-2">Rs. {parseFloat(selectedClaim?.amount || 0).toLocaleString()}</p>
                        </div>
                        <div className="grid gap-2">
                            <Label>Expense Account (Debit)</Label>
                            <select 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={approvalData.expense_account_id}
                                onChange={(e) => setApprovalData({...approvalData, expense_account_id: e.target.value})}
                            >
                                {accounts.filter(a => a.type === 'EXPENSE').map(a => (
                                    <option key={a.account_id} value={a.account_id}>{a.code} - {a.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Payment Account (Credit)</Label>
                            <select 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={approvalData.payment_account_id}
                                onChange={(e) => setApprovalData({...approvalData, payment_account_id: e.target.value})}
                            >
                                {accounts.filter(a => a.category === 'BANK' || a.category === 'CASH').map(a => (
                                    <option key={a.account_id} value={a.account_id}>{a.code} - {a.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsApproveOpen(false)}>Cancel</Button>
                        <Button className="bg-indigo-600" onClick={handleApprove}>Confirm & Post</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ExpenseManagement;
