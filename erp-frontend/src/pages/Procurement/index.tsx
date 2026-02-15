import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import GlassCard from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatsCard } from "@/components/ui/stats-card";
import { useToast } from "@/hooks/use-toast";
import { procurementRequestApi } from "@/services/api";
import GenericExportModal from "@/components/common/GenericExportModal";
import { useAuth } from "@/context/AuthContext";
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Package,
  Search,
  Eye,
  Check,
  Loader2,
  AlertCircle,
  Download
} from "lucide-react";

interface ProcurementRequest {
  id: string;
  material_id: string;
  quantity: number;
  status: 'PENDING' | 'APPROVED' | 'RECEIVED' | 'REJECTED' | 'FULFILLED' | 'CANCELLED';
  requested_by: string;
  approved_by?: string;
  received_by?: string;
  notes?: string;
  reference_po?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  material: {
    material_id: string;
    material_code: string;
    name: string;
    description?: string;
    uom: {
      uom_id: string;
      code: string;
      name: string;
    };
  };
}

const ProcurementDashboard: React.FC = () => {
  const [filters, setFilters] = useState({
    status: "all",
    search: "",
  });
  const [selectedRequest, setSelectedRequest] = useState<ProcurementRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({
    status: "",
    notes: "",
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch procurement requests
  const { data: requests = [], isLoading, error: requestsError } = useQuery({
    queryKey: ["procurement-requests", filters],
    queryFn: async () => {
      try {
        console.log('Fetching procurement requests with filters:', filters);
        const data = await procurementRequestApi.getAll({
          status: filters.status === "all" ? undefined : filters.status,
          limit: 100,
        });
        console.log('Received procurement requests:', data);
        
        // Ensure we return an array
        if (Array.isArray(data)) {
          return data;
        } else if (data && typeof data === 'object' && Array.isArray(data.data)) {
          return data.data;
        } else {
          console.error('Unexpected data format:', data);
          return [];
        }
      } catch (error) {
        console.error('Error fetching procurement requests:', error);
        throw error;
      }
    },
    retry: 1,
  });

  // Fetch statistics
  const { data: stats, error: statsError, isLoading: statsLoading } = useQuery({
    queryKey: ["procurement-stats"],
    queryFn: async () => {
      try {
        console.log('Fetching procurement stats...');
        const data = await procurementRequestApi.getStats();
        console.log('Received procurement stats:', data);
        
        // Handle both { data: {...} } and direct object
        if (data && typeof data === 'object') {
          return data.data || data;
        }
        return data;
      } catch (error) {
        console.error('Error fetching procurement stats:', error);
        throw error;
      }
    },
    retry: 1,
  });

  console.log('Stats state:', { stats, statsError, statsLoading });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, updatedBy, rejectionReason }: { id: string; status: string; updatedBy: string; rejectionReason?: string }) =>
      procurementRequestApi.updateStatus(id, status, updatedBy, rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procurement-requests"] });
      queryClient.invalidateQueries({ queryKey: ["procurement-stats"] });
      setShowStatusModal(false);
      setSelectedRequest(null);
      toast({
        title: "Status Updated",
        description: "Procurement request status has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  // Filter requests based on search term
  const filteredRequests = requests.filter((request: ProcurementRequest) => {
    const searchLower = filters.search.toLowerCase();
    return (
      request.material.name.toLowerCase().includes(searchLower) ||
      request.material.material_code.toLowerCase().includes(searchLower) ||
      request.requested_by.toLowerCase().includes(searchLower) ||
      (request.reference_po && request.reference_po.toLowerCase().includes(searchLower))
    );
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { variant: "secondary" as const, label: "Pending", icon: Clock },
      APPROVED: { variant: "default" as const, label: "Approved", icon: CheckCircle },
      RECEIVED: { variant: "default" as const, label: "Received", icon: Package },
      REJECTED: { variant: "destructive" as const, label: "Rejected", icon: XCircle },
      FULFILLED: { variant: "default" as const, label: "Fulfilled", icon: CheckCircle },
      CANCELLED: { variant: "destructive" as const, label: "Cancelled", icon: XCircle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { 
      variant: "secondary" as const, 
      label: status, 
      icon: AlertCircle 
    };
    
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const handleStatusUpdate = (request: ProcurementRequest, newStatus?: string) => {
    setSelectedRequest(request);
    setStatusUpdate({
      status: newStatus || request.status,
      notes: "",
    });
    setShowStatusModal(true);
  };

  const handleStatusSubmit = () => {
    if (!selectedRequest || !statusUpdate.status) return;
    
    // Validate rejection reason is required for rejection
    if (statusUpdate.status === "REJECTED" && !statusUpdate.notes?.trim()) {
      toast({
        title: "Validation Error",
        description: "Rejection reason is required when rejecting a request",
        variant: "destructive",
      });
      return;
    }
    
    // Get actual username from auth context, fallback to "System" if not available
    const updatedBy = user?.username || user?.name || "System";
    
    updateStatusMutation.mutate({
      id: selectedRequest.id,
      status: statusUpdate.status,
      updatedBy: updatedBy,
      rejectionReason: statusUpdate.status === "REJECTED" ? statusUpdate.notes : undefined,
    });
  };

  const columns: Column<ProcurementRequest>[] = [
    {
      key: "material",
      header: "Material",
      render: (value, request) => (
        <div>
          <div className="font-medium">{request?.material?.name}</div>
          <div className="text-sm text-gray-500">{request?.material?.material_code}</div>
        </div>
      ),
    },
    {
      key: "quantity",
      header: "Quantity",
      render: (value, request) => (
        <div>
          <div className="font-medium">{request?.quantity}</div>
          <div className="text-sm text-gray-500">{request?.material?.uom?.name}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (value, request) => getStatusBadge(request?.status || ""),
    },
    {
      key: "requested_by",
      header: "Requested By",
      render: (value, request) => (
        <div className="text-sm">{request?.requested_by}</div>
      ),
    },
    {
      key: "created_at",
      header: "Requested Date",
      render: (value, request) => (
        <div className="text-sm">
          {request?.created_at ? new Date(request.created_at).toLocaleDateString() : "-"}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (value, request) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedRequest(request);
              setShowDetailsModal(true);
            }}
            className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all duration-200"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {request?.status === "PENDING" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusUpdate(request, "APPROVED")}
                className="text-green-600 hover:text-green-700 hover:bg-green-50 hover:border-green-200 transition-all duration-200"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusUpdate(request, "REJECTED")}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200 transition-all duration-200"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          )}
          {request?.status === "APPROVED" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusUpdate(request, "RECEIVED")}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200"
            >
              <Package className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  // Show error state
  if (requestsError || statsError) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-800">
            <ShoppingCart className="h-8 w-8" />
            Procurement Dashboard
          </h1>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-red-900 mb-1">
                    Error Loading Procurement Data
                  </h3>
                  <p className="text-red-700 mb-2">
                    {requestsError instanceof Error ? requestsError.message : 'Failed to load procurement requests'}
                  </p>
                  <p className="text-sm text-red-600 mb-3">
                    Please check:
                    • Backend server is running on port 4000
                    • Database connection is active
                    • Prisma client is generated
                  </p>
                  <Button 
                    onClick={() => window.location.reload()} 
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-100"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-800">
            <ShoppingCart className="h-8 w-8" />
            Procurement Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Manage procurement requests and track material orders
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => setShowExportModal(true)} 
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard
          title="Total Requests"
          value={stats?.total?.toString() || "0"}
          icon={ShoppingCart}
        />
        <StatsCard
          title="Pending"
          value={stats?.pending?.toString() || "0"}
          icon={Clock}
        />
        <StatsCard
          title="Approved"
          value={stats?.approved?.toString() || "0"}
          icon={CheckCircle}
        />
        <StatsCard
          title="Received"
          value={stats?.received?.toString() || "0"}
          icon={Package}
        />
        <StatsCard
          title="Rejected"
          value={stats?.rejected?.toString() || "0"}
          icon={XCircle}
        />
        <StatsCard
          title="Fulfilled"
          value={stats?.fulfilled?.toString() || "0"}
          icon={CheckCircle}
        />
      </div>
      
      {/* Filters */}
      <GlassCard>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search requests..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <Select 
              value={filters.status} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="RECEIVED">Received</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="FULFILLED">Fulfilled</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
      </GlassCard>

      {/* Data Table */}
      <GlassCard title="Procurement Requests">
        <DataTable
          data={filteredRequests}
          columns={columns}
          loading={isLoading}
        />
      </GlassCard>

      {/* Request Details Modal */}
      {showDetailsModal && selectedRequest && (
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Procurement Request Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Material</Label>
                  <p className="font-medium">{selectedRequest.material.name}</p>
                  <p className="text-sm text-gray-500">{selectedRequest.material.material_code}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Quantity</Label>
                  <p className="font-medium">{selectedRequest.quantity} {selectedRequest.material.uom.name}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Requested By</Label>
                  <p className="font-medium">{selectedRequest.requested_by}</p>
                </div>
              </div>

              {selectedRequest.reference_po && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Reference PO</Label>
                  <p className="font-medium">{selectedRequest.reference_po}</p>
                </div>
              )}

              {selectedRequest.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Notes</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded-md">{selectedRequest.notes}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Created</Label>
                  <p className="text-sm">{new Date(selectedRequest.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
                  <p className="text-sm">{new Date(selectedRequest.updated_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedRequest && (
        <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Request Status</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm font-medium text-blue-800">
                  {selectedRequest.material.name}
                </p>
                <p className="text-xs text-blue-600">
                  Quantity: {selectedRequest.quantity} {selectedRequest.material.uom.name}
                </p>
              </div>

              <div>
                <Label htmlFor="status">New Status</Label>
                <Select 
                  value={statusUpdate.status} 
                  onValueChange={(value) => setStatusUpdate(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="RECEIVED">Received</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="FULFILLED">Fulfilled</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">
                  {statusUpdate.status === "REJECTED" ? "Rejection Reason (Required)" : "Notes (Optional)"}
                </Label>
                <Textarea
                  id="notes"
                  value={statusUpdate.notes}
                  onChange={(e) => setStatusUpdate(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder={
                    statusUpdate.status === "REJECTED" 
                      ? "Please provide a reason for rejection" 
                      : "Add notes about this status change"
                  }
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStatusSubmit}
                  disabled={updateStatusMutation.isPending}
                  className="flex-1"
                >
                  {updateStatusMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Status'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showExportModal && (
        <GenericExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onSuccess={() => {
            setShowExportModal(false);
          }}
          title="Export Procurement"
          exportFunction={procurementRequestApi.exportProcurement}
          filename="procurement"
          availableFormats={['pdf', 'csv']}
          showDateRange={true}
        />
      )}
    </div>
  );
};

export default ProcurementDashboard;
