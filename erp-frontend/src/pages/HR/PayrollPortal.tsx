import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign, Printer, CheckCircle2, AlertCircle,
  RefreshCw, Send, FileCheck, TrendingUp, Users, CreditCard
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const PayrollPortal: React.FC = () => {
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  useEffect(() => { fetchPayrolls(); }, [currentMonth, currentYear]);
  useEffect(() => { setSelectedIds([]); }, [payrolls]);

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const resp = await fetch(`/api/hr/payroll?month=${currentMonth}&year=${currentYear}`);
      const data = await resp.json();
      if (data.success) setPayrolls(data.data);
    } catch { toast.error("Failed to fetch payroll data"); }
    finally { setLoading(false); }
  };

  const processMonthlyPayroll = async () => {
    try {
      setProcessing(true);
      const resp = await fetch("/api/hr/payroll/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: currentMonth, year: currentYear })
      });
      const data = await resp.json();
      if (data.success) {
        toast.success(`Payroll generated for ${MONTHS[currentMonth - 1]} ${currentYear} — ${data.data.length} employees`);
        fetchPayrolls();
      } else {
        toast.error(data.error || "Payroll processing failed");
      }
    } catch { toast.error("Network error during payroll processing"); }
    finally { setProcessing(false); }
  };

  const handleBulkPay = async () => {
    const pending = selectedIds.length > 0
      ? selectedIds
      : payrolls.filter(p => p.status === "PROCESSED").map(p => p.payroll_id);

    if (pending.length === 0) {
      toast.warning("No processed payrolls to disburse. Run the payroll cycle first.");
      return;
    }
    try {
      setPaying(true);
      const resp = await fetch("/api/hr/payroll/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payrollIds: pending })
      });
      const data = await resp.json();
      if (data.success) {
        toast.success(`✅ ${data.paid_count} salaries disbursed and posted to General Ledger!`);
        setSelectedIds([]);
        fetchPayrolls();
      } else {
        toast.error(data.error || "Salary disbursement failed");
      }
    } catch { toast.error("Network error during salary payment"); }
    finally { setPaying(false); }
  };

  const handleBulkApprove = async () => {
    const pending = selectedIds.length > 0
      ? selectedIds
      : payrolls.filter(p => p.status === "PENDING_APPROVAL").map(p => p.payroll_id);

    if (pending.length === 0) {
      toast.warning("No payrolls waiting for approval.");
      return;
    }
    try {
      setProcessing(true);
      const resp = await fetch("/api/hr/payroll/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payrollIds: pending })
      });
      const data = await resp.json();
      if (data.success) {
        toast.success(`✅ ${data.approved_count} payrolls approved!`);
        setSelectedIds([]);
        fetchPayrolls();
      } else {
        toast.error(data.error || "Approval failed");
      }
    } catch { toast.error("Network error during approval"); }
    finally { setProcessing(false); }
  };



  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const totalGross = payrolls.reduce((s, p) => s + parseFloat(p.gross_salary || 0), 0);
  const totalNet = payrolls.reduce((s, p) => s + parseFloat(p.net_salary || 0), 0);
  const totalDeductions = payrolls.reduce((s, p) => s + parseFloat(p.deductions || 0), 0);
  const paidCount = payrolls.filter(p => p.status === "PAID").length;
  const processedCount = payrolls.filter(p => p.status === "PROCESSED").length;

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Payroll & Disbursements</h1>
          <p className="text-muted-foreground">Automated salary calculation with General Ledger integration</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Month/Year Picker */}
          <div className="flex gap-2">
            <select
              value={currentMonth}
              onChange={e => setCurrentMonth(Number(e.target.value))}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <select
              value={currentYear}
              onChange={e => setCurrentYear(Number(e.target.value))}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <Button
            variant="outline"
            className="gap-2 border-indigo-200 text-indigo-700"
            onClick={processMonthlyPayroll}
            disabled={processing}
          >
            <RefreshCw className={`w-4 h-4 ${processing ? "animate-spin" : ""}`} />
            {processing ? "Processing..." : "Run Payroll Cycle"}
          </Button>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 gap-2"
            onClick={handleBulkPay}
            disabled={paying || processedCount === 0}
          >
            <Send className={`w-4 h-4 ${paying ? "animate-pulse" : ""}`} />
            {paying ? "Disbursing..." : `Bulk Payout${processedCount > 0 ? ` (${processedCount})` : ""}`}
          </Button>
          {(isAdmin) && (
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 gap-2"
              onClick={handleBulkApprove}
              disabled={processing || payrolls.filter(p => p.status === "PENDING_APPROVAL").length === 0}
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve High-Risk
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-lg border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase opacity-80 font-bold tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Total Net Liability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. {totalNet.toLocaleString()}</div>
            <p className="text-xs opacity-70 mt-1">Net salaries for {MONTHS[currentMonth - 1]} {currentYear}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Gross Payroll</span>
            </div>
            <div className="text-2xl font-bold">Rs. {totalGross.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Before deductions</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Paid</span>
            </div>
            <div className="text-2xl font-bold">{paidCount} / {payrolls.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Salaries disbursed this cycle</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-400">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-500 mb-2">
              <CreditCard className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Deductions</span>
            </div>
            <div className="text-2xl font-bold">Rs. {totalDeductions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Total PF, ESI & other cuts</p>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Registry — {MONTHS[currentMonth - 1]} {currentYear}</CardTitle>
          <CardDescription>Individual salary breakdown. Disbursement posts DR Salary Expense / CR Bank Account to the General Ledger.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    onChange={e => setSelectedIds(
                      e.target.checked ? payrolls.filter(p => p.status === "PROCESSED").map(p => p.payroll_id) : []
                    )}
                    checked={selectedIds.length > 0 && selectedIds.length === processedCount}
                    className="rounded"
                  />
                </TableHead>
                <TableHead>Employee</TableHead>
                <TableHead className="text-right">Gross Salary</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right font-bold">Net Payable</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Ledger</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrolls.map((p) => (
                <TableRow key={p.payroll_id} className={selectedIds.includes(p.payroll_id) ? "bg-indigo-50" : "hover:bg-slate-50/50"}>
                  <TableCell>
                    {p.status === "PROCESSED" && (
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.payroll_id)}
                        onChange={() => toggleSelect(p.payroll_id)}
                        className="rounded"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-sm border border-indigo-100">
                        {p.employee?.first_name?.[0]}{p.employee?.last_name?.[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{p.employee?.first_name} {p.employee?.last_name}</div>
                        <div className="text-xs text-muted-foreground">{p.employee?.emp_code} · {p.employee?.department}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">Rs. {parseFloat(p.gross_salary).toLocaleString()}</TableCell>
                  <TableCell className="text-right text-red-500">
                    {parseFloat(p.deductions) > 0 ? `-Rs. ${parseFloat(p.deductions).toLocaleString()}` : "—"}
                  </TableCell>
                  <TableCell className="text-right font-bold text-indigo-700">Rs. {parseFloat(p.net_salary).toLocaleString()}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={
                      p.status === "PAID"
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none"
                        : "bg-blue-100 text-blue-700 hover:bg-blue-100 border-none"
                    }>
                      {p.status === "PAID" ? "✓ PAID" : p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {p.journal_id ? (
                      <span className="text-xs text-emerald-600 font-mono font-semibold">GL Posted</span>
                    ) : (
                      <span className="text-xs text-slate-400">Pending</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-indigo-600">
                      <Printer className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {payrolls.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-20 text-slate-300">
                    <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-10" />
                    <p className="font-medium text-slate-400">No payroll data for this cycle.</p>
                    <Button variant="link" className="text-indigo-600 mt-1" onClick={processMonthlyPayroll} disabled={processing}>
                      {processing ? "Processing..." : "Run Payroll Cycle Now →"}
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Finance Info Banner */}
          <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex gap-3 items-start">
            <AlertCircle className="text-indigo-500 w-5 h-5 mt-0.5 shrink-0" />
            <div className="text-sm text-indigo-800">
              <p className="font-semibold mb-1">Automatic General Ledger Integration</p>
              <p className="text-xs leading-relaxed">
                When you click <strong>Bulk Salary Payout</strong>, the system automatically posts journal entries to the Finance module:
              </p>
              <div className="mt-2 font-mono text-xs bg-white/70 p-2 rounded-lg border border-indigo-100">
                DR. Salary Expense A/c &nbsp;|&nbsp; CR. Bank / Cash A/c
              </div>
              <p className="text-xs mt-2 opacity-70">Each payroll entry will be linked to the corresponding journal entry ID, visible in Finance → General Ledger.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayrollPortal;
