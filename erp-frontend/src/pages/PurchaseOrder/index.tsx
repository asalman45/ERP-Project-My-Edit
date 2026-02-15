import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Eye, Edit, Trash2, Package, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatsCard } from "@/components/ui/stats-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import LoadingSpinner from "@/components/LoadingSpinner";
import { purchaseOrderApi } from "./api";
import { PurchaseOrder, CreatePurchaseOrderRequest, PurchaseOrderFilters } from "./types";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { GRNReceiveModal } from "@/components/modals/GRNReceiveModal";

// Import supplier API from global services for now (we'll refactor this later)
import { supplierApi } from "@/services/api";

const PurchaseOrderPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedPOForReceive, setSelectedPOForReceive] = useState<PurchaseOrder | null>(null);
  const [filters, setFilters] = useState<PurchaseOrderFilters>({
    status: "all",
    supplier_id: "all",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch purchase orders with error handling
  const { data: purchaseOrders = [], isLoading, error } = useQuery({
    queryKey: ["purchase-orders", filters],
    queryFn: async () => {
      try {
        const data = await purchaseOrderApi.getAll({
          status: filters.status === "all" ? undefined : filters.status,
          supplier_id: filters.supplier_id === "all" ? undefined : filters.supplier_id,
          limit: 100,
        });
        // Data loaded successfully
        return data || [];
      } catch (err) {
        console.error("Error fetching purchase orders:", err);
        throw err;
      }
    },
    retry: 2,
    retryDelay: 1000,
  });

  // Fetch suppliers with error handling
  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => supplierApi.getAll(),
    retry: 2,
  });

  // Create purchase order mutation
  const createPOMutation = useMutation({
    mutationFn: purchaseOrderApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      setShowCreateModal(false);
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      purchaseOrderApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    },
  });

  // Delete purchase order mutation
  const deletePOMutation = useMutation({
    mutationFn: purchaseOrderApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast({
        title: "Success",
        description: "Purchase order deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete purchase order",
        variant: "destructive",
      });
    },
  });


  // Calculate statistics with proper null checks
  const totalPOs = purchaseOrders.length;
  const openPOs = purchaseOrders.filter((po: PurchaseOrder) => po && po.status === "OPEN").length;
  const receivedPOs = purchaseOrders.filter((po: PurchaseOrder) => po && po.status === "RECEIVED").length;
  const totalValue = purchaseOrders.reduce((sum: number, po: PurchaseOrder) => {
    if (!po) return sum;
    const amount = typeof po.total_amount === 'string' ? parseFloat(po.total_amount) : (po.total_amount || 0);
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      OPEN: { variant: "default" as const, label: "Open" },
      PARTIALLY_RECEIVED: { variant: "secondary" as const, label: "Partially Received" },
      RECEIVED: { variant: "success" as const, label: "Received" },
      CLOSED: { variant: "destructive" as const, label: "Closed" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { variant: "default" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const columns: Column<PurchaseOrder>[] = [
    {
      key: "po_no",
      header: "PO Number",
      render: (value, row) => (
        <div className="font-medium">{value || row?.po_no || "N/A"}</div>
      ),
    },
    {
      key: "supplier_name",
      header: "Supplier",
      render: (value, row) => (
        <div>{value || row?.supplier_name || "N/A"}</div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (value, row) => getStatusBadge(value || row?.status || "UNKNOWN"),
    },
    {
      key: "order_date",
      header: "Order Date",
      render: (value, row) => {
        const dateValue = value || row?.order_date;
        return (
          <div>{dateValue ? new Date(dateValue).toLocaleDateString() : "N/A"}</div>
        );
      },
    },
    {
      key: "expected_date",
      header: "Expected Delivery",
      render: (value, row) => {
        const dateValue = value || row?.expected_date;
        return (
          <div>{dateValue ? new Date(dateValue).toLocaleDateString() : "-"}</div>
        );
      },
    },
    {
      key: "total_amount",
      header: "Total Amount",
      render: (value, row) => {
        const amountValue = value || row?.total_amount;
        if (!amountValue || amountValue === null || amountValue === undefined) {
          return <div className="font-medium">TBD</div>;
        }
        
        const amount = typeof amountValue === 'string' ? parseFloat(amountValue) : amountValue;
        if (isNaN(amount)) {
          return <div className="font-medium">TBD</div>;
        }
        
        return (
          <div className="font-medium">
            ${amount.toFixed(2)}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (value, row) => (
        <div className="flex items-center gap-2 relative z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              toast({
                title: "Info",
                description: `Viewing details for ${row?.po_no || "N/A"}`,
              });
            }}
            disabled={!row?.po_id}
            className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all duration-200 relative z-10"
            style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {row?.status === "OPEN" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedPOForReceive(row);
                setShowReceiveModal(true);
              }}
              disabled={!row?.po_id}
              className="hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600 transition-all duration-200 relative z-10"
              style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
              title="Receive Materials"
            >
              <PackageCheck className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (!row?.po_id) return;
              const newStatus = row.status === "OPEN" ? "RECEIVED" : "OPEN";
              updateStatusMutation.mutate({ id: row.po_id, status: newStatus });
            }}
            disabled={updateStatusMutation.isPending || !row?.po_id}
            className="hover:bg-green-50 hover:border-green-200 hover:text-green-600 transition-all duration-200 relative z-10"
            style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
          >
            {row?.status === "OPEN" ? "Mark Received" : "Reopen"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => row?.po_id && deletePOMutation.mutate(row.po_id)}
            disabled={deletePOMutation.isPending || !row?.po_id}
            className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-200 relative z-10"
            style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Loading purchase orders..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Purchase Orders</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage purchase orders with suppliers
          </p>
        </div>
        <div className="card-enterprise p-8 text-center">
          <h2 className="text-xl font-semibold mb-2 text-destructive">Error Loading Data</h2>
          <p className="text-muted-foreground mb-4">
            There was an error loading the purchase orders. Please check your connection and try again.
          </p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Purchase Orders</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage purchase orders with suppliers
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Purchase Order
        </Button>
      </div>

      {/* Statistics Cards */}
      {!isLoading && purchaseOrders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard
            title="Total Purchase Orders"
            value={totalPOs.toString()}
            icon={Package}
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Open Orders"
            value={openPOs.toString()}
            icon={Package}
            trend={{ value: 5, isPositive: false }}
          />
          <StatsCard
            title="Received Orders"
            value={receivedPOs.toString()}
            icon={Package}
            trend={{ value: 8, isPositive: true }}
          />
          <StatsCard
            title="Total Value"
            value={`$${totalValue.toFixed(2)}`}
            icon={Package}
            trend={{ value: 15, isPositive: true }}
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
        <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="PARTIALLY_RECEIVED">Partially Received</SelectItem>
            <SelectItem value="RECEIVED">Received</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.supplier_id} onValueChange={(value) => setFilters(prev => ({ ...prev, supplier_id: value }))}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by supplier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Suppliers</SelectItem>
            {suppliers.map((supplier: any) => (
              <SelectItem key={supplier.supplier_id} value={supplier.supplier_id}>
                {supplier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        </div>
      </div>

      {/* Data Table */}
      {!isLoading && purchaseOrders.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Purchase Orders</h2>
          <DataTable
            data={purchaseOrders}
            columns={columns}
            loading={isLoading}
          />
        </div>
      ) : !isLoading && purchaseOrders.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">No Purchase Orders Found</h3>
          <p className="text-muted-foreground mb-4">
            No purchase orders match your current filters. Try adjusting your search criteria or create a new purchase order.
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Purchase Order
          </Button>
        </div>
      ) : null}

      {/* Create Purchase Order Modal */}
      <CreatePOModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={createPOMutation.mutate}
        isLoading={createPOMutation.isPending}
        suppliers={suppliers}
      />

      {/* GRN Receive Modal */}
      {selectedPOForReceive && (
        <GRNReceiveModal
          isOpen={showReceiveModal}
          onClose={() => {
            setShowReceiveModal(false);
            setSelectedPOForReceive(null);
          }}
          purchaseOrder={selectedPOForReceive}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
            queryClient.invalidateQueries({ queryKey: ["stock-in"] });
            queryClient.invalidateQueries({ queryKey: ["inventory"] });
          }}
        />
      )}
    </div>
  );
};

// Create Purchase Order Modal Component
interface CreatePOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePurchaseOrderRequest) => void;
  isLoading: boolean;
  suppliers: any[];
}

const CreatePOModal: React.FC<CreatePOModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  suppliers,
}) => {
  const [formData, setFormData] = useState({
    po_no: "",
    supplier_id: "",
    pr_id: "",
    status: "OPEN",
    order_date: new Date().toISOString().split('T')[0],
    expected_date: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only send fields that the backend validation allows
    const submitData: CreatePurchaseOrderRequest = {
      po_no: formData.po_no,
      supplier_id: formData.supplier_id,
      order_date: formData.order_date,
      expected_date: formData.expected_date || undefined,
      status: formData.status,
      // Note: total_amount and notes are not allowed by backend validation
      // total_amount is calculated from PO items, notes can be added later
    };
    onSubmit(submitData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="po_no">PO Number *</Label>
              <Input
                id="po_no"
                value={formData.po_no}
                onChange={(e) => setFormData(prev => ({ ...prev, po_no: e.target.value }))}
                required
                placeholder="e.g., PO-2023-001"
              />
            </div>
            <div>
              <Label htmlFor="supplier_id">Supplier *</Label>
              <Select value={formData.supplier_id} onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier: any) => (
                    <SelectItem key={supplier.supplier_id} value={supplier.supplier_id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="order_date">Order Date *</Label>
              <Input
                id="order_date"
                type="date"
                value={formData.order_date}
                onChange={(e) => setFormData(prev => ({ ...prev, order_date: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="expected_date">Expected Delivery</Label>
              <Input
                id="expected_date"
                type="date"
                value={formData.expected_date}
                onChange={(e) => setFormData(prev => ({ ...prev, expected_date: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="pr_id">Purchase Requisition ID (Optional)</Label>
            <Input
              id="pr_id"
              value={formData.pr_id}
              onChange={(e) => setFormData(prev => ({ ...prev, pr_id: e.target.value }))}
              placeholder="Optional - Link to purchase requisition"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Purchase Order"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseOrderPage;
