import React, { useState } from "react";
import { Calendar, Filter, Download, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, Column } from "@/components/ui/data-table";
import { InventoryTransaction } from "@/types";
import { useInventoryTransactionsApi } from "./api";

const InventoryTransactions: React.FC = () => {
  const [filters, setFilters] = useState({
    type: "all",
    dateFrom: "",
    dateTo: "",
  });

  // Use the inventory transactions API hook
  const { 
    transactions, 
    loading, 
    filteredTransactions, 
    applyFilters,
    exportTransactions 
  } = useInventoryTransactionsApi(filters);

  const columns: Column<InventoryTransaction>[] = [
    { 
      key: "id", 
      header: "Transaction ID", 
      sortable: true,
      render: (value: string) => (
        <span className="font-mono text-sm">{value}</span>
      )
    },
    { 
      key: "date", 
      header: "Date", 
      sortable: true,
      render: (value: string) => (
        <span>{new Date(value).toLocaleDateString()}</span>
      )
    },
    {
      key: "type",
      header: "Type",
      render: (value: string) => (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value === "RECEIVE" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
        }`}>
          {value === "RECEIVE" ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
          {value}
        </span>
      ),
    },
    { key: "productCode", header: "Product Code", sortable: true },
    { key: "productName", header: "Product Name", sortable: true },
    { 
      key: "quantity", 
      header: "Quantity", 
      sortable: true,
      render: (value: number, row: InventoryTransaction) => (
        <span className={value > 0 ? "text-emerald-600" : "text-red-600"}>
          {row.type === "ISSUE" ? "-" : "+"}{Math.abs(value)}
        </span>
      )
    },
    { key: "location", header: "Location", sortable: true },
    { key: "workOrderNumber", header: "Work Order", sortable: true },
    { 
      key: "step", 
      header: "Step",
      render: (value: string) => value ? (
        <span className="text-xs bg-muted px-2 py-1 rounded">
          {value.replace("_", " ")}
        </span>
      ) : "-"
    },
    { key: "userName", header: "User", sortable: true },
  ];

  const handleExport = () => {
    exportTransactions();
  };

  // Apply filters when they change
  React.useEffect(() => {
    applyFilters(filters);
  }, [filters, applyFilters]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory Transactions</h1>
          <p className="text-muted-foreground mt-2">
            Track all material issues and receipts with complete audit trail
          </p>
        </div>
        <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
          <Download size={16} />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="card-enterprise p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Transaction Type</label>
            <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="ISSUE">Issue</SelectItem>
                <SelectItem value="RECEIVE">Receive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Date From</label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Date To</label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              min={filters.dateFrom}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium invisible">Actions</label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setFilters({ type: "", dateFrom: "", dateTo: "" })}
                className="flex-1"
              >
                <Filter size={16} className="mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredTransactions.length} of {transactions.length} transactions
        </div>
      </div>

      <DataTable
        data={filteredTransactions}
        columns={columns}
        searchPlaceholder="Search by product, work order, or user..."
        searchable={true}
        loading={loading}
      />
    </div>
  );
};

export default InventoryTransactions;
