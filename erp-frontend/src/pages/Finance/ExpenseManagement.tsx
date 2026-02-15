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
    const [loading, setLoading] = useState(false);
    const [isNewClaimOpen, setIsNewClaimOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        employee_name: "",
        description: "",
        amount: 0,
        category: "Travel"
    });

    useEffect(() => {
        fetchClaims();
    }, []);

    const fetchClaims = async () => {
        try {
            setLoading(true);
            const resp = await fetch("/api/finance/expenses/claims");
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

    const handleApprove = async (claimId: string) => {
        try {
            const resp = await fetch(`/api/finance/expenses/approve/${claimId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ approved_by: "Admin", account_id: "MAIN_BANK_ACC_ID" })
            });
            if (resp.ok) {
                toast.info("Claim approved and posted to Ledger");
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase text-slate-400 font-bold tracking-wider flex items-center gap-2">
                            <Timer className="w-4 h-4" /> Pending Approval
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{claims.filter(c => c.status === 'PENDING').reduce((s, c) => s + parseFloat(c.amount), 0).toLocaleString()}</div>
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
                        <div className="text-2xl font-bold">₹{claims.filter(c => c.status === 'PAID').reduce((s, c) => s + parseFloat(c.amount), 0).toLocaleString()}</div>
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
                                    <TableCell className="text-right font-bold">₹{parseFloat(claim.amount).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Badge className={claim.status === 'PAID' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-amber-100 text-amber-700 hover:bg-amber-100'}>
                                            {claim.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {claim.status === 'PENDING' ? (
                                            <Button size="sm" variant="outline" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => handleApprove(claim.claim_id)}>
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
        </div>
    );
};

export default ExpenseManagement;
