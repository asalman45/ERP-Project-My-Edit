import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  DollarSign, Clock, Calendar, AlertTriangle, CheckCircle2,
  Search, Filter, TrendingDown, Shield, Landmark, Receipt,
  FileText, ExternalLink, ChevronDown, ChevronUp
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number | undefined | null) =>
  n !== undefined && n !== null
    ? "PKR " + Number(n).toLocaleString("en-PK", { minimumFractionDigits: 2 })
    : "PKR 0.00";

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString("en-PK") : "—");

const agingBucket = (days: number) => {
  if (days <= 0) return { label: "Current", color: "bg-green-100 text-green-700" };
  if (days <= 30) return { label: `${days}d`, color: "bg-yellow-100 text-yellow-700" };
  if (days <= 60) return { label: `${days}d`, color: "bg-orange-100 text-orange-700" };
  return { label: `${days}d overdue`, color: "bg-red-100 text-red-700" };
};

// ─── Types ───────────────────────────────────────────────────────────────────
interface Invoice {
  invoice_id: string;
  invoice_no: string;
  supplier_id: string;
  invoice_date: string;
  due_date?: string;
  total_amount: number;
  subtotal: number;
  base_amount?: number;
  tax_amount: number;
  tax_type?: string;
  tax_rate?: number;
  particulars?: string;
  status: string;
  supplier?: {
    name: string;
    ntn?: string;
    strn?: string;
    bank_name?: string;
    bank_account?: string;
    bank_iban?: string;
  };
  payments?: Payment[];
  balance?: number;
  days_overdue?: number;
  paid_amount?: number;
}

interface Payment {
  payment_id: string;
  invoice_id: string;
  amount: number;
  paid_date?: string;
  payment_status: string;
  reference?: string;
  payment_method?: string;
  wht_rate?: number;
  wht_amount?: number;
}

// ─── Expanded Invoice Row ─────────────────────────────────────────────────────
const InvoiceRow: React.FC<{
  inv: Invoice;
  onRecord: (inv: Invoice) => void;
  accounts: any[];
}> = ({ inv, onRecord, accounts }) => {
  const [expanded, setExpanded] = useState(false);
  const bucket = agingBucket(inv.days_overdue ?? 0);
  const isPaid = inv.status === "PAID";

  return (
    <>
      <tr className={`border-b border-slate-100 hover:bg-slate-50/80 transition-colors ${isPaid ? "opacity-60" : ""}`}>
        <td className="px-4 py-3">
          <button onClick={() => setExpanded(!expanded)} className="text-slate-500 hover:text-blue-600">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </td>
        <td className="px-4 py-3">
          <div className="font-mono text-xs text-slate-700 font-medium">{inv.invoice_no}</div>
          <div className="text-xs text-slate-400">{fmtDate(inv.invoice_date)}</div>
        </td>
        <td className="px-4 py-3">
          <div className="font-semibold text-sm text-slate-800">{inv.supplier?.name ?? "—"}</div>
          {inv.supplier?.ntn && <div className="text-xs text-slate-400">NTN: {inv.supplier.ntn}</div>}
        </td>
        <td className="px-4 py-3 text-sm text-slate-600">
          {inv.particulars ?? "Supplier Invoice"}
        </td>
        <td className="px-4 py-3 text-right">
          <div className="text-sm text-slate-700">{fmt(inv.base_amount ?? inv.subtotal)}</div>
        </td>
        <td className="px-4 py-3 text-right">
          {inv.tax_amount > 0 ? (
            <div>
              <div className="text-sm font-medium text-amber-600">{fmt(inv.tax_amount)}</div>
              {inv.tax_type && inv.tax_type !== "NONE" && (
                <div className="text-xs text-slate-400">{inv.tax_type} @ {inv.tax_rate}%</div>
              )}
            </div>
          ) : <span className="text-slate-300">—</span>}
        </td>
        <td className="px-4 py-3 text-right font-semibold text-slate-800">{fmt(inv.total_amount)}</td>
        <td className="px-4 py-3 text-right font-bold text-red-600">{fmt(inv.balance)}</td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-full ${bucket.color}`}>
            {bucket.label}
          </span>
        </td>
        <td className="px-4 py-3">
          <Badge variant={isPaid ? "secondary" : inv.status === "APPROVED_FOR_PAYMENT" ? "default" : "outline"} className="text-xs">
            {inv.status.replace(/_/g, " ")}
          </Badge>
        </td>
        <td className="px-4 py-3">
          {!isPaid && (
            <Button
              size="sm" variant="outline"
              className="gap-1 text-xs hover:bg-green-50 hover:border-green-300 hover:text-green-700"
              onClick={() => onRecord(inv)}
            >
              <DollarSign className="w-3 h-3" /> Pay
            </Button>
          )}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-blue-50/40 border-b border-blue-100">
          <td colSpan={11} className="px-6 py-4">
            <div className="grid grid-cols-3 gap-6">
              {/* Invoice breakdown */}
              <div>
                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Receipt className="w-3 h-3" /> Invoice Breakdown
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Base Amount</span>
                    <span className="font-medium">{fmt(inv.base_amount ?? inv.subtotal)}</span>
                  </div>
                  {inv.tax_amount > 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span>{inv.tax_type ?? "GST"} @ {inv.tax_rate ?? ""}%</span>
                      <span className="font-medium">{fmt(inv.tax_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-slate-800 border-t border-slate-200 pt-1 mt-1">
                    <span>Total</span>
                    <span>{fmt(inv.total_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Supplier bank info */}
              <div>
                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Landmark className="w-3 h-3" /> Supplier Bank
                </div>
                <div className="space-y-1 text-xs text-slate-600">
                  <div>{inv.supplier?.bank_name ?? "—"}</div>
                  {inv.supplier?.bank_account && <div className="font-mono">{inv.supplier.bank_account}</div>}
                  {inv.supplier?.bank_iban && <div className="font-mono text-xs text-slate-400">{inv.supplier.bank_iban}</div>}
                </div>
              </div>

              {/* Payment history */}
              <div>
                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Payment History
                </div>
                {inv.payments && inv.payments.length > 0 ? (
                  <div className="space-y-1">
                    {inv.payments.map((p) => (
                      <div key={p.payment_id} className="text-xs bg-white rounded px-2 py-1 border border-slate-200">
                        <div className="flex justify-between">
                          <span className="font-mono text-slate-600">{p.reference}</span>
                          <span className="font-medium text-green-600">{fmt(p.amount)}</span>
                        </div>
                        {p.wht_amount && p.wht_amount > 0 && (
                          <div className="flex justify-between text-orange-500 mt-0.5">
                            <span>WHT @ {p.wht_rate}%</span>
                            <span>{fmt(p.wht_amount)}</span>
                          </div>
                        )}
                        <div className="text-slate-400">{fmtDate(p.paid_date)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic">No payments recorded</div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const VendorPayments: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState("pending");

  // Payment Dialog
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentData, setPaymentData] = useState({
    bank_account_id: "365aefa9-c424-49ae-8241-d9eaae3e89b0",
    reference: "",
    paid_date: new Date().toISOString().split("T")[0],
    wht_rate: "",
    wht_amount: "",
  });

  useEffect(() => {
    fetchInvoices();
    fetchAccounts();
  }, [activeTab]);

  const fetchAccounts = async () => {
    try {
      const resp = await fetch("/api/finance/accounts");
      const data = await resp.json();
      if (data.success) setAccounts(data.data);
    } catch (_) {}
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const endpoint =
        activeTab === "pending"
          ? "/api/finance/vendor-payments/pending"
          : "/api/invoices?type=SUPPLIER";
      const resp = await fetch(endpoint);
      const data = await resp.json();
      if (data.success) {
        setInvoices(data.data);
      }
    } catch (_) {
      toast.error("Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedInvoice) return;
    try {
      const whtAmt = paymentData.wht_amount ? parseFloat(paymentData.wht_amount) : 0;
      const whtRate = paymentData.wht_rate ? parseFloat(paymentData.wht_rate) : 0;

      const resp = await fetch("/api/finance/vendor-payments/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_id: selectedInvoice.invoice_id,
          reference: paymentData.reference,
          paid_date: paymentData.paid_date,
          bank_account_id: paymentData.bank_account_id,
          wht_rate: whtRate || undefined,
          wht_amount: whtAmt || undefined,
        }),
      });
      if (resp.ok) {
        toast.success("Payment recorded and journal entry posted");
        setIsPaymentDialogOpen(false);
        fetchInvoices();
      } else {
        toast.error("Failed to record payment");
      }
    } catch (_) {
      toast.error("Failed to record payment");
    }
  };

  // Compute WHT auto-suggestion when invoice selected
  const openPaymentDialog = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPaymentData(p => ({
      ...p,
      reference: "",
      paid_date: new Date().toISOString().split("T")[0],
      wht_rate: "",
      wht_amount: "",
    }));
    setIsPaymentDialogOpen(true);
  };

  const autoCalcWHT = (rate: string) => {
    const r = parseFloat(rate);
    if (!isNaN(r) && selectedInvoice) {
      const wht = (selectedInvoice.balance ?? selectedInvoice.total_amount) * (r / 100);
      setPaymentData(p => ({ ...p, wht_rate: rate, wht_amount: wht.toFixed(2) }));
    }
  };

  // Filtered invoices
  const filtered = invoices.filter(inv => {
    const matchSearch =
      inv.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.supplier?.name ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.particulars ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "ALL" || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Summaries
  const totalOutstanding = filtered.reduce((s, i) => s + (i.balance ?? 0), 0);
  const overdueCount = filtered.filter(i => (i.days_overdue ?? 0) > 0).length;
  const totalGST = filtered.reduce((s, i) => s + (i.tax_amount ?? 0), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Vendor Payments</h1>
          <p className="text-slate-500 text-sm mt-1">Accounts Payable — invoices, tax, WHT, and payment management</p>
        </div>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Calendar className="w-4 h-4" /> Weekly Payment Run
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-red-200 bg-red-50/30">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs text-red-500 uppercase tracking-wide font-medium mb-1">Total Outstanding AP</div>
            <div className="text-2xl font-bold text-red-700">{fmt(totalOutstanding)}</div>
            <div className="text-xs text-slate-400 mt-0.5">{filtered.length} invoices</div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50/30">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs text-orange-500 uppercase tracking-wide font-medium mb-1">Overdue Invoices</div>
            <div className="text-2xl font-bold text-orange-700">{overdueCount}</div>
            <div className="text-xs text-slate-400 mt-0.5">past due date</div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/30">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs text-amber-600 uppercase tracking-wide font-medium mb-1">Input GST</div>
            <div className="text-2xl font-bold text-amber-700">{fmt(totalGST)}</div>
            <div className="text-xs text-slate-400 mt-0.5">tax on purchases</div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/30">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs text-green-600 uppercase tracking-wide font-medium mb-1">Ready to Pay</div>
            <div className="text-2xl font-bold text-green-700">
              {filtered.filter(i => i.status === "APPROVED_FOR_PAYMENT").length}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">approved invoices</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-end bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex-1">
          <Label className="text-xs text-slate-500">Search</Label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Invoice #, supplier name, particulars…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div>
          <Label className="text-xs text-slate-500">Status</Label>
          <select
            className="mt-1 flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="RECEIVED">Received</option>
            <option value="APPROVED_FOR_PAYMENT">Approved for Payment</option>
            <option value="PAID">Paid</option>
          </select>
        </div>
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSearchTerm(""); }}>
          <TabsList>
            <TabsTrigger value="pending">Pending AP</TabsTrigger>
            <TabsTrigger value="all">All Invoices</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Invoice Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {activeTab === "pending" ? "Pending Accounts Payable" : "All Supplier Invoices"}
          </CardTitle>
          <CardDescription>
            Click the expand arrow to see tax breakdown, bank details, and payment history
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16 text-slate-400">
              <div className="text-center">
                <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
                Loading invoices…
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 w-8" />
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Invoice #</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Supplier</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Particulars</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Base Amt</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-amber-600">Tax (GST)</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Total</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-red-600">Balance</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Aging</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="text-center py-16 text-slate-400">
                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        No invoices found
                      </td>
                    </tr>
                  ) : (
                    filtered.map(inv => (
                      <InvoiceRow
                        key={inv.invoice_id}
                        inv={inv}
                        onRecord={openPaymentDialog}
                        accounts={accounts}
                      />
                    ))
                  )}
                </tbody>
                {filtered.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-700 text-white">
                      <td colSpan={4} className="px-4 py-3 text-sm font-semibold">TOTALS</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold">
                        {fmt(filtered.reduce((s, i) => s + (i.base_amount ?? i.subtotal ?? 0), 0))}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-amber-300">
                        {fmt(filtered.reduce((s, i) => s + (i.tax_amount ?? 0), 0))}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold">
                        {fmt(filtered.reduce((s, i) => s + i.total_amount, 0))}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-red-300">
                        {fmt(totalOutstanding)}
                      </td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Vendor Payment</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              {/* Invoice summary */}
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Supplier</span>
                  <span className="font-semibold">{selectedInvoice.supplier?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Invoice #</span>
                  <span className="font-mono">{selectedInvoice.invoice_no}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Base Amount</span>
                  <span>{fmt(selectedInvoice.base_amount ?? selectedInvoice.subtotal)}</span>
                </div>
                {selectedInvoice.tax_amount > 0 && (
                  <div className="flex justify-between text-sm text-amber-600">
                    <span>{selectedInvoice.tax_type ?? "GST"} @ {selectedInvoice.tax_rate}%</span>
                    <span>{fmt(selectedInvoice.tax_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base border-t pt-2 mt-1">
                  <span>Outstanding Balance</span>
                  <span className="text-red-600">{fmt(selectedInvoice.balance ?? selectedInvoice.total_amount)}</span>
                </div>
              </div>

              {/* Payment fields */}
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Paid Date</Label><Input type="date" value={paymentData.paid_date} onChange={e => setPaymentData(p => ({ ...p, paid_date: e.target.value }))} /></div>
                <div>
                  <Label>Payment Method</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-0" onChange={e => setPaymentData(p => ({ ...p, payment_method: e.target.value } as any))}>
                    <option value="ONLINE">Online Transfer</option>
                    <option value="IBFT">IBFT</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>Reference / Transaction #</Label>
                <Input placeholder="e.g. CMS/123-012026 or CHQ-12345" value={paymentData.reference} onChange={e => setPaymentData(p => ({ ...p, reference: e.target.value }))} />
              </div>

              {/* WHT Section */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-orange-700">
                  <Shield className="w-4 h-4" /> Withholding Tax (WHT)
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-orange-700">WHT Rate (%)</Label>
                    <Input
                      type="number" step="0.1" placeholder="e.g. 5"
                      value={paymentData.wht_rate}
                      onChange={e => autoCalcWHT(e.target.value)}
                      className="border-orange-200"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-orange-700">WHT Amount (PKR)</Label>
                    <Input
                      type="number" step="1" placeholder="0.00"
                      value={paymentData.wht_amount}
                      onChange={e => setPaymentData(p => ({ ...p, wht_amount: e.target.value }))}
                      className="border-orange-200"
                    />
                  </div>
                </div>
                <div className="text-xs text-slate-500">WHT will be deducted from payment and credited to WHT Payable account</div>
              </div>

              {/* Bank Account */}
              <div>
                <Label>Pay From Bank Account</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={paymentData.bank_account_id}
                  onChange={e => setPaymentData(p => ({ ...p, bank_account_id: e.target.value }))}
                >
                  {accounts.filter(a => a.category === "BANK" || a.category === "CASH").map(a => (
                    <option key={a.account_id} value={a.account_id}>{a.code} — {a.name}</option>
                  ))}
                </select>
              </div>

              {/* Net payable summary */}
              {paymentData.wht_amount && parseFloat(paymentData.wht_amount) > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Invoice Balance</span>
                    <span>{fmt(selectedInvoice.balance ?? selectedInvoice.total_amount)}</span>
                  </div>
                  <div className="flex justify-between text-orange-600">
                    <span>WHT Deduction</span>
                    <span>− {fmt(parseFloat(paymentData.wht_amount))}</span>
                  </div>
                  <div className="flex justify-between font-bold text-green-700 border-t pt-1 mt-1">
                    <span>Net Amount to Transfer</span>
                    <span>{fmt((selectedInvoice.balance ?? selectedInvoice.total_amount) - parseFloat(paymentData.wht_amount))}</span>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700 font-bold gap-2" onClick={handleRecordPayment}>
              <CheckCircle2 className="w-4 h-4" /> Post Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorPayments;
