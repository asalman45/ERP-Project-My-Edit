import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Search, Eye, Edit, Trash2, Building2, Phone, Mail, MapPin,
  Upload, Download, BookOpen, Shield, Landmark, CreditCard,
  ChevronDown, ChevronRight, TrendingUp, AlertTriangle, X,
  Printer, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatsCard } from "@/components/ui/stats-card";
import GlassCard from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingSpinner from "@/components/LoadingSpinner";
import { supplierApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import SupplierImportModal from "@/components/suppliers/SupplierImportModal";
import GenericExportModal from "@/components/common/GenericExportModal";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Supplier {
  supplier_id: string;
  code: string;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  lead_time_days?: number;
  ntn?: string;
  strn?: string;
  bank_name?: string;
  bank_branch?: string;
  bank_account?: string;
  bank_iban?: string;
  bank_account_title?: string;
  bank_account_type?: string;
  created_at: string;
  // AP summary fields returned by /finance/supplier-ledger
  invoice_count?: number;
  total_invoiced?: number;
  total_paid?: number;
  total_wht?: number;
  total_gst?: number;
  outstanding?: number;
}

interface LedgerLine {
  date: string;
  type: "INVOICE" | "PAYMENT";
  reference: string;
  particulars: string;
  base_amount?: number;
  tax_type?: string;
  tax_rate?: number;
  tax_amount?: number;
  discount_amount?: number;
  debit: number;
  credit: number;
  balance: number;
  wht_rate?: number;
  wht_amount?: number;
  amount_paid?: number;
  status?: string;
}

const fmt = (n?: number) =>
  n !== undefined && n !== null
    ? "PKR " + n.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "PKR 0.00";

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString("en-PK") : "-");

// ─── Supplier Ledger Modal ────────────────────────────────────────────────────
const SupplierLedgerModal: React.FC<{ supplier: Supplier; onClose: () => void }> = ({
  supplier,
  onClose,
}) => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const qParams = new URLSearchParams();
  if (from) qParams.append("from", from);
  if (to) qParams.append("to", to);

  const { data, isLoading } = useQuery({
    queryKey: ["supplier-ledger", supplier.supplier_id, from, to],
    queryFn: async () => {
      const r = await fetch(
        `/api/finance/supplier-ledger/${supplier.supplier_id}?${qParams.toString()}`
      );
      const d = await r.json();
      return d.data;
    },
  });

  const ledger = data?.lines ?? [];
  const summary = data?.summary;

  const handlePrint = () => window.print();

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-slate-800">
                Supplier Ledger Statement
              </DialogTitle>
              <p className="text-sm text-slate-500 mt-1">
                As per accounting books – {supplier.name}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1 print:hidden">
              <Printer className="w-4 h-4" /> Print
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 print-area">
          {/* Supplier Info Header */}
          <div className="grid grid-cols-2 gap-6">
            {/* Left: Supplier master */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Supplier Details</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Name</span>
                  <span className="font-semibold text-slate-800">{supplier.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">NTN</span>
                  <span className="font-mono font-medium text-slate-800">{supplier.ntn ?? "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">STRN / GST</span>
                  <span className="font-mono font-medium text-slate-800">{supplier.strn ?? "N/A"}</span>
                </div>
                {supplier.address && (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500 shrink-0">Address</span>
                    <span className="text-slate-700 text-right">{supplier.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Bank details */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <Landmark className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Banking Details</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Bank</span>
                  <span className="font-medium text-slate-800">{supplier.bank_name ?? "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Branch</span>
                  <span className="font-medium text-slate-800">{supplier.bank_branch ?? "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Account Title</span>
                  <span className="font-medium text-slate-800">{supplier.bank_account_title ?? supplier.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Account #</span>
                  <span className="font-mono text-slate-800">{supplier.bank_account ?? "N/A"}</span>
                </div>
                {supplier.bank_iban && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">IBAN</span>
                    <span className="font-mono text-xs text-slate-800">{supplier.bank_iban}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Date Filter */}
          <div className="flex gap-4 items-end print:hidden">
            <div>
              <Label className="text-xs text-slate-500">From Date</Label>
              <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-40" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">To Date</Label>
              <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-40" />
            </div>
            {(from || to) && (
              <Button variant="outline" size="sm" onClick={() => { setFrom(""); setTo(""); }}>
                <X className="w-3 h-3 mr-1" /> Clear
              </Button>
            )}
          </div>

          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-5 gap-3">
              {[
                { label: "Total Invoiced", value: summary.total_invoiced, color: "text-slate-800" },
                { label: "Total GST Input", value: summary.total_gst, color: "text-amber-600" },
                { label: "Total Paid", value: summary.total_paid, color: "text-green-600" },
                { label: "Total WHT", value: summary.total_wht, color: "text-orange-600" },
                { label: "Closing Balance", value: summary.closing_balance, color: summary.closing_balance > 0 ? "text-red-600" : "text-green-600" },
              ].map((item) => (
                <div key={item.label} className="bg-white border border-slate-200 rounded-lg p-3 text-center shadow-sm">
                  <div className="text-xs text-slate-500 mb-1">{item.label}</div>
                  <div className={`text-sm font-bold ${item.color}`}>
                    {fmt(item.value)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Ledger Table */}
          {isLoading ? (
            <div className="flex justify-center py-12"><LoadingSpinner text="Loading ledger..." /></div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-700 text-white">
                    <th className="px-3 py-3 text-left text-xs font-semibold">Date</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold">Ref / Invoice #</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold">Particulars</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold">Base Amt</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold">Tax</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold">WHT</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-red-300">Debit (Dr)</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-green-300">Credit (Cr)</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-slate-400">
                        No transactions found for this period
                      </td>
                    </tr>
                  ) : (
                    ledger.map((line: LedgerLine, i: number) => (
                      <tr
                        key={i}
                        className={`border-b border-slate-100 hover:bg-slate-50 transition-colors
                          ${line.type === "INVOICE" ? "bg-amber-50/40" : "bg-green-50/40"}`}
                      >
                        <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{fmtDate(line.date)}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${line.type === "INVOICE" ? "bg-amber-400" : "bg-green-500"}`} />
                            <span className="font-mono text-xs text-slate-700">{line.reference}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="text-slate-700">{line.particulars}</div>
                          {line.type === "INVOICE" && line.tax_type && line.tax_type !== "NONE" && (
                            <div className="text-xs text-slate-400">
                              {line.tax_type} @ {line.tax_rate}%
                              {line.discount_amount ? ` | Disc: ${fmt(line.discount_amount)}` : ""}
                            </div>
                          )}
                          {line.type === "PAYMENT" && line.wht_rate && (
                            <div className="text-xs text-orange-500">WHT @ {line.wht_rate}%</div>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right text-slate-600">
                          {line.base_amount ? fmt(line.base_amount) : "-"}
                        </td>
                        <td className="px-3 py-2.5 text-right text-amber-600">
                          {line.tax_amount && line.tax_amount > 0 ? fmt(line.tax_amount) : "-"}
                        </td>
                        <td className="px-3 py-2.5 text-right text-orange-600">
                          {line.wht_amount && line.wht_amount > 0 ? fmt(line.wht_amount) : "-"}
                        </td>
                        <td className="px-3 py-2.5 text-right font-medium text-red-600">
                          {line.debit > 0 ? fmt(line.debit) : "-"}
                        </td>
                        <td className="px-3 py-2.5 text-right font-medium text-green-700">
                          {line.credit > 0 ? fmt(line.credit) : "-"}
                        </td>
                        <td className={`px-3 py-2.5 text-right font-bold ${line.balance > 0 ? "text-red-600" : line.balance < 0 ? "text-green-600" : "text-slate-500"}`}>
                          {fmt(Math.abs(line.balance))}
                          <span className="text-xs ml-1">{line.balance > 0 ? "Cr" : line.balance < 0 ? "Dr" : ""}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {ledger.length > 0 && summary && (
                  <tfoot>
                    <tr className="bg-slate-700 text-white font-semibold">
                      <td colSpan={6} className="px-3 py-3 text-sm">CLOSING BALANCE</td>
                      <td className="px-3 py-3 text-right text-red-300">{fmt(summary.total_paid + summary.total_wht)}</td>
                      <td className="px-3 py-3 text-right text-green-300">{fmt(summary.total_invoiced)}</td>
                      <td className={`px-3 py-3 text-right ${summary.closing_balance > 0 ? "text-yellow-300" : "text-green-300"}`}>
                        {fmt(Math.abs(summary.closing_balance))}
                        <span className="text-xs ml-1">{summary.closing_balance > 0 ? "Cr" : "Dr"}</span>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── Main Suppliers Page ──────────────────────────────────────────────────────
const SuppliersPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedLedgerSupplier, setSelectedLedgerSupplier] = useState<Supplier | null>(null);
  const [activeTab, setActiveTab] = useState("suppliers");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch supplier summaries (with AP totals via finance API)
  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ["supplier-summaries"],
    queryFn: async () => {
      const r = await fetch("/api/finance/supplier-ledger");
      const d = await r.json();
      return d.success ? d.data : [];
    },
    retry: 2,
  });

  // WHT Summary
  const { data: whtData } = useQuery({
    queryKey: ["wht-summary"],
    queryFn: async () => {
      const r = await fetch("/api/finance/supplier-ledger/wht-summary");
      const d = await r.json();
      return d.data;
    },
    enabled: activeTab === "wht",
  });

  const createSupplierMutation = useMutation({
    mutationFn: supplierApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-summaries"] });
      setShowCreateModal(false);
      toast({ title: "Supplier created successfully" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateSupplierMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => supplierApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-summaries"] });
      setShowCreateModal(false);
      setEditingSupplier(null);
      toast({ title: "Supplier updated successfully" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: supplierApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-summaries"] });
      toast({ title: "Supplier deleted" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.ntn && s.ntn.includes(searchTerm)) ||
    (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalOutstanding = suppliers.reduce((sum, s) => sum + (s.outstanding ?? 0), 0);
  const totalWHT = suppliers.reduce((sum, s) => sum + (s.total_wht ?? 0), 0);
  const totalGST = suppliers.reduce((sum, s) => sum + (s.total_gst ?? 0), 0);

  const columns: Column<Supplier>[] = [
    {
      key: "code",
      header: "Code",
      render: (_, row) => (
        <div className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700">{row?.code}</div>
      ),
    },
    {
      key: "name",
      header: "Supplier Name",
      render: (_, row) => (
        <div>
          <div className="font-semibold text-slate-800">{row?.name}</div>
          {row?.ntn && <div className="text-xs text-slate-500">NTN: {row.ntn}</div>}
        </div>
      ),
    },
    {
      key: "ntn",
      header: "Tax Info",
      render: (_, row) => (
        <div className="text-xs">
          {row?.strn && <div className="text-slate-600"><span className="text-slate-400">STRN:</span> {row.strn}</div>}
          {row?.bank_name && (
            <div className="flex items-center gap-1 text-slate-500 mt-0.5">
              <Landmark className="w-3 h-3" /> {row.bank_name}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "email",
      header: "Contact",
      render: (_, row) => (
        <div className="text-xs space-y-0.5">
          {row?.email && <div className="flex items-center gap-1 text-slate-600"><Mail className="w-3 h-3" /> {row.email}</div>}
          {row?.phone && <div className="flex items-center gap-1 text-slate-600"><Phone className="w-3 h-3" /> {row.phone}</div>}
        </div>
      ),
    },
    {
      key: "total_invoiced",
      header: "Total Invoiced",
      render: (_, row) => (
        <div className="text-right">
          <div className="font-semibold text-slate-700">{fmt(row?.total_invoiced)}</div>
          <div className="text-xs text-slate-400">{row?.invoice_count ?? 0} invoices</div>
        </div>
      ),
    },
    {
      key: "outstanding",
      header: "Outstanding",
      render: (_, row) => {
        const bal = row?.outstanding ?? 0;
        return (
          <div className="text-right">
            <span className={`font-bold text-sm ${bal > 0 ? "text-red-600" : "text-green-600"}`}>
              {fmt(bal)}
            </span>
            {bal > 0 && <AlertTriangle className="w-3 h-3 inline ml-1 text-red-500" />}
          </div>
        );
      },
    },
    {
      key: "total_wht",
      header: "WHT",
      render: (_, row) => (
        <div className="text-right text-xs font-medium text-orange-600">
          {row?.total_wht ? fmt(row.total_wht) : "-"}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="outline" size="sm"
            className="gap-1 text-xs hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
            onClick={() => row && setSelectedLedgerSupplier(row)}
          >
            <BookOpen className="w-3 h-3" /> Ledger
          </Button>
          <Button
            variant="outline" size="sm"
            className="gap-1 text-xs hover:bg-amber-50 hover:border-amber-300 hover:text-amber-600"
            onClick={() => {
              if (row) {
                setEditingSupplier(row);
                setShowCreateModal(true);
              }
            }}
          >
            <Edit className="w-3 h-3" /> Edit
          </Button>
          <Button
            variant="outline" size="sm"
            className="hover:bg-red-50 hover:border-red-300 hover:text-red-600"
            onClick={() => row?.supplier_id && deleteSupplierMutation.mutate(row.supplier_id)}
            disabled={deleteSupplierMutation.isPending}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) return <LoadingSpinner size="lg" text="Loading suppliers..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Suppliers & AP</h1>
          <p className="text-muted-foreground mt-1">Supplier master data, ledgers, WHT, and accounts payable</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImportModal(true)} className="gap-1.5">
            <Upload className="h-4 w-4" /> Import
          </Button>
          <Button variant="outline" onClick={() => setShowExportModal(true)} className="gap-1.5">
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button onClick={() => setShowCreateModal(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Supplier
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Suppliers</div>
          <div className="text-2xl font-bold text-slate-800">{suppliers.length}</div>
          <div className="text-xs text-slate-400 mt-0.5">with NTN / bank details</div>
        </div>
        <div className="bg-white rounded-xl border border-red-200 p-4 shadow-sm">
          <div className="text-xs text-red-500 uppercase tracking-wide mb-1">Total Outstanding AP</div>
          <div className="text-2xl font-bold text-red-600">{fmt(totalOutstanding)}</div>
          <div className="text-xs text-slate-400 mt-0.5">across all suppliers</div>
        </div>
        <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm">
          <div className="text-xs text-amber-600 uppercase tracking-wide mb-1">GST Input Tax</div>
          <div className="text-2xl font-bold text-amber-600">{fmt(totalGST)}</div>
          <div className="text-xs text-slate-400 mt-0.5">claimable input tax</div>
        </div>
        <div className="bg-white rounded-xl border border-orange-200 p-4 shadow-sm">
          <div className="text-xs text-orange-500 uppercase tracking-wide mb-1">Total WHT Deducted</div>
          <div className="text-2xl font-bold text-orange-600">{fmt(totalWHT)}</div>
          <div className="text-xs text-slate-400 mt-0.5">withheld from payments</div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="suppliers">Supplier Directory</TabsTrigger>
          <TabsTrigger value="wht">WHT Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers">
          {/* Search */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search by name, code, NTN, or email…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <GlassCard title={`Suppliers (${filteredSuppliers.length})`}>
            <DataTable data={filteredSuppliers} columns={columns} loading={isLoading} />
          </GlassCard>
        </TabsContent>

        <TabsContent value="wht">
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
              <Shield className="w-6 h-6 text-orange-600 shrink-0" />
              <div>
                <div className="font-semibold text-orange-800">Withholding Tax (WHT) Summary</div>
                <div className="text-sm text-orange-700">
                  Total WHT deducted: <strong>{fmt(whtData?.grand_total_wht)}</strong> across {whtData?.payment_count ?? 0} payments
                </div>
              </div>
            </div>

            {whtData?.by_supplier?.map((sup: any) => (
              <div key={sup.supplier_id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="flex justify-between items-center px-5 py-3 bg-slate-50 border-b border-slate-200">
                  <div>
                    <span className="font-semibold text-slate-800">{sup.supplier_name}</span>
                    <span className="text-xs text-slate-500 ml-3">NTN: {sup.ntn}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Total WHT Deducted</div>
                    <div className="font-bold text-orange-600">{fmt(sup.total_wht)}</div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-4 py-2 text-left text-xs text-slate-500 font-medium">Date</th>
                        <th className="px-4 py-2 text-left text-xs text-slate-500 font-medium">Invoice #</th>
                        <th className="px-4 py-2 text-left text-xs text-slate-500 font-medium">Reference</th>
                        <th className="px-4 py-2 text-right text-xs text-slate-500 font-medium">Gross Paid</th>
                        <th className="px-4 py-2 text-right text-xs text-slate-500 font-medium">WHT %</th>
                        <th className="px-4 py-2 text-right text-xs text-slate-500 font-medium text-orange-600">WHT Deducted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sup.payments.map((p: any, i: number) => (
                        <tr key={i} className="border-b border-slate-50 hover:bg-orange-50/30">
                          <td className="px-4 py-2 text-slate-600">{fmtDate(p.date)}</td>
                          <td className="px-4 py-2 font-mono text-xs text-slate-600">{p.invoice_no}</td>
                          <td className="px-4 py-2 font-mono text-xs text-slate-600">{p.reference}</td>
                          <td className="px-4 py-2 text-right text-slate-700">{fmt(p.amount)}</td>
                          <td className="px-4 py-2 text-right text-slate-600">{p.wht_rate}%</td>
                          <td className="px-4 py-2 text-right font-semibold text-orange-600">{fmt(p.wht_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Supplier Ledger Modal */}
      {selectedLedgerSupplier && (
        <SupplierLedgerModal
          supplier={selectedLedgerSupplier}
          onClose={() => setSelectedLedgerSupplier(null)}
        />
      )}

      {/* Modals */}
      <CreateSupplierModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingSupplier(null);
        }}
        onSubmit={(data) => {
          if (editingSupplier) {
            updateSupplierMutation.mutate({ id: editingSupplier.supplier_id, data });
          } else {
            createSupplierMutation.mutate(data);
          }
        }}
        isLoading={createSupplierMutation.isPending || updateSupplierMutation.isPending}
        supplier={editingSupplier}
      />
      {showImportModal && (
        <SupplierImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false);
            queryClient.invalidateQueries({ queryKey: ["supplier-summaries"] });
          }}
        />
      )}
      {showExportModal && (
        <GenericExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onSuccess={() => setShowExportModal(false)}
          title="Export Suppliers"
          exportFunction={supplierApi.exportSuppliers}
          filename="suppliers"
          availableFormats={["pdf", "csv"]}
        />
      )}
    </div>
  );
};

// ─── Create Supplier Modal ────────────────────────────────────────────────────
interface CreateSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
  supplier?: Supplier | null;
}

const CreateSupplierModal: React.FC<CreateSupplierModalProps> = ({ isOpen, onClose, onSubmit, isLoading, supplier }) => {
  const [form, setForm] = useState({
    code: "", name: "", contact: "", phone: "", email: "", address: "",
    lead_time_days: "", ntn: "", strn: "", bank_name: "", bank_branch: "",
    bank_account: "", bank_iban: "", bank_account_title: "", bank_account_type: "",
  });

  useEffect(() => {
    if (isOpen) {
      if (supplier) {
        setForm({
          code: supplier.code || "",
          name: supplier.name || "",
          contact: supplier.contact || "",
          phone: supplier.phone || "",
          email: supplier.email || "",
          address: supplier.address || "",
          lead_time_days: supplier.lead_time_days?.toString() || "",
          ntn: supplier.ntn || "",
          strn: supplier.strn || "",
          bank_name: supplier.bank_name || "",
          bank_branch: supplier.bank_branch || "",
          bank_account: supplier.bank_account || "",
          bank_iban: supplier.bank_iban || "",
          bank_account_title: supplier.bank_account_title || "",
          bank_account_type: supplier.bank_account_type || "",
        });
      } else {
        setForm({
          code: "", name: "", contact: "", phone: "", email: "", address: "",
          lead_time_days: "", ntn: "", strn: "", bank_name: "", bank_branch: "",
          bank_account: "", bank_iban: "", bank_account_title: "", bank_account_type: "",
        });
      }
    }
  }, [isOpen, supplier]);

  const upd = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim()) return;
    onSubmit({
      ...form,
      lead_time_days: form.lead_time_days ? parseInt(form.lead_time_days) : undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{supplier ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Info */}
          <div>
            <h3 className="font-semibold text-sm text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Code *</Label><Input value={form.code} onChange={e => upd("code", e.target.value)} required placeholder="SUP-001" disabled={!!supplier} /></div>
              <div><Label>Name *</Label><Input value={form.name} onChange={e => upd("name", e.target.value)} required placeholder="Company Name" /></div>
              <div><Label>Contact Person</Label><Input value={form.contact} onChange={e => upd("contact", e.target.value)} placeholder="Full Name" /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => upd("phone", e.target.value)} placeholder="+92 21 ..." /></div>
              <div className="col-span-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e => upd("email", e.target.value)} /></div>
              <div className="col-span-2"><Label>Address</Label><Textarea value={form.address} onChange={e => upd("address", e.target.value)} rows={2} /></div>
              <div><Label>Lead Time (Days)</Label><Input type="number" value={form.lead_time_days} onChange={e => upd("lead_time_days", e.target.value)} /></div>
            </div>
          </div>

          {/* Tax Info */}
          <div>
            <h3 className="font-semibold text-sm text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Tax Registration
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>NTN</Label><Input value={form.ntn} onChange={e => upd("ntn", e.target.value)} placeholder="0000000-0" /></div>
              <div><Label>STRN / GST</Label><Input value={form.strn} onChange={e => upd("strn", e.target.value)} placeholder="00-00-0000-000-00" /></div>
            </div>
          </div>

          {/* Bank Info */}
          <div>
            <h3 className="font-semibold text-sm text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Landmark className="w-4 h-4" /> Bank Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Bank Name</Label><Input value={form.bank_name} onChange={e => upd("bank_name", e.target.value)} /></div>
              <div><Label>Branch</Label><Input value={form.bank_branch} onChange={e => upd("bank_branch", e.target.value)} /></div>
              <div><Label>Account Title</Label><Input value={form.bank_account_title} onChange={e => upd("bank_account_title", e.target.value)} /></div>
              <div><Label>Account Number</Label><Input value={form.bank_account} onChange={e => upd("bank_account", e.target.value)} /></div>
              <div className="col-span-2"><Label>IBAN</Label><Input value={form.bank_iban} onChange={e => upd("bank_iban", e.target.value)} placeholder="PK00 XXXX 0000 0000 0000 0000" /></div>
              <div>
                <Label>Account Type</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.bank_account_type} onChange={e => upd("bank_account_type", e.target.value)}>
                  <option value="">Select…</option>
                  <option value="Current">Current</option>
                  <option value="Saving">Saving</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? "Saving…" : (supplier ? "Save Changes" : "Add Supplier")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SuppliersPage;
