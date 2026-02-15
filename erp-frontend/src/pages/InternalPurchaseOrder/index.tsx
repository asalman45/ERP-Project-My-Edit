import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatsCard } from "@/components/ui/stats-card";
import { useToast } from "@/hooks/use-toast";
import { ipoApi } from "./api";
import { InternalPurchaseOrder, IPOStats } from "./types";
import CreateIPOModal from "./components/CreateIPOModal";
import IPODetailsModal from "./components/IPODetailsModal";
import SendEmailModal from "./components/SendEmailModal";
import { 
  Plus, 
  Search, 
  Eye, 
  FileText, 
  Mail, 
  Send,
  CheckCircle, 
  Clock, 
  XCircle,
  AlertCircle,
  Loader2,
  Download,
  Settings
} from "lucide-react";

const InternalPurchaseOrderPage: React.FC = () => {
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    limit: 50,
    offset: 0
  });
  
  const [selectedIPO, setSelectedIPO] = useState<InternalPurchaseOrder | null>(null);
  const [detailsLoadingId, setDetailsLoadingId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch Internal Purchase Orders
  const { data: ipos = [], isLoading, error } = useQuery({
    queryKey: ["internal-purchase-orders", filters],
    queryFn: async () => {
      try {
        const result = await ipoApi.getAll({
          ...filters,
          status: filters.status === 'all' ? '' : filters.status
        });
        // Ensure we always return an array
        const dataArray = Array.isArray(result) ? result : [];
        console.log('Fetched IPOs:', dataArray);
        return dataArray;
      } catch (err) {
        console.error('Error fetching IPOs:', err);
        return [];
      }
    },
  });

  // Fetch statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["ipo-stats"],
    queryFn: ipoApi.getStats,
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, updatedBy }: { id: string; status: string; updatedBy: string }) =>
      ipoApi.updateStatus(id, { status: status as any, updated_by: updatedBy }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["internal-purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["ipo-stats"] });
    },
  });

  // Generate PDF mutation
  const generatePDFMutation = useMutation({
    mutationFn: (id: string) => ipoApi.generatePDF(id),
    onSuccess: () => {
      // Success toast is already shown in the API function
    },
    onError: (error: any) => {
      // Error toast is already shown in the API function
    },
  });

  // Generate and send email mutation
  const generateAndSendMutation = useMutation({
    mutationFn: ({ id, email }: { id: string; email: string }) =>
      ipoApi.generateAndSend(id, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["internal-purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["ipo-stats"] });
      setShowEmailModal(false);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => ipoApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["internal-purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["ipo-stats"] });
    },
  });

  const handleStatusChange = (ipo: InternalPurchaseOrder, newStatus: string) => {
    updateStatusMutation.mutate({
      id: ipo.ipo_id,
      status: newStatus,
      updatedBy: 'current-user' // You can replace this with actual user ID
    });
  };

  const handleViewDetails = async (ipo: InternalPurchaseOrder) => {
    setDetailsLoadingId(ipo.ipo_id);
    try {
      const details = await ipoApi.getById(ipo.ipo_id);
      const mergedIPO: InternalPurchaseOrder = {
        ...ipo,
        ...details,
        items: details.items ?? ipo.items ?? [],
      };
      setSelectedIPO(mergedIPO);
      setShowDetailsModal(true);
    } catch (error: any) {
      console.error('Failed to fetch IPO details:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to load purchase order details',
        variant: 'destructive',
      });
    } finally {
      setDetailsLoadingId(null);
    }
  };

  const handleGeneratePDF = (ipo: InternalPurchaseOrder) => {
    generatePDFMutation.mutate(ipo.ipo_id);
  };

  const handleSendEmail = (ipo: InternalPurchaseOrder) => {
    setSelectedIPO(ipo);
    setShowEmailModal(true);
  };

  const handleGenerateAndSend = (ipo: InternalPurchaseOrder, email: string) => {
    generateAndSendMutation.mutate({
      id: ipo.ipo_id,
      email: email
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'APPROVED': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'SENT': return <Send className="h-4 w-4 text-purple-500" />;
      case 'RECEIVED': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'CANCELLED': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      SENT: 'bg-purple-100 text-purple-800',
      RECEIVED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  const columns: Column<InternalPurchaseOrder>[] = [
    {
      key: 'po_number',
      header: 'PO Number',
      render: (value, ipo) => (
        <div className="font-medium">
          {ipo?.po_number || '-'}
        </div>
      ),
    },
    {
      key: 'supplier_name',
      header: 'Supplier',
      render: (value, ipo) => (
        <div>
          <div className="font-medium">{ipo?.supplier_name || '-'}</div>
          {ipo?.contact_person && (
            <div className="text-sm text-gray-500">{ipo.contact_person}</div>
          )}
        </div>
      ),
    },
    {
      key: 'order_date',
      header: 'Order Date',
      render: (value, ipo) => {
        if (!ipo || !ipo.order_date) return <div>-</div>;
        try {
          const date = new Date(ipo.order_date);
          if (isNaN(date.getTime())) return <div>-</div>;
          return <div>{date.toLocaleDateString('en-GB')}</div>;
        } catch {
          return <div>-</div>;
        }
      },
    },
    {
      key: 'expected_date',
      header: 'Expected Date',
      render: (value, ipo) => {
        if (!ipo || !ipo.expected_date) return <div>Not set</div>;
        try {
          const date = new Date(ipo.expected_date);
          if (isNaN(date.getTime())) return <div>Not set</div>;
          return <div>{date.toLocaleDateString('en-GB')}</div>;
        } catch {
          return <div>Not set</div>;
        }
      },
    },
    {
      key: 'items_count',
      header: 'Items',
      render: (value, ipo) => {
        const count = ipo?.items_count ? parseInt(ipo.items_count) : (ipo?.items?.length || 0);
        return (
          <div className="text-center">
            {count}
          </div>
        );
      },
    },
    {
      key: 'total_amount',
      header: 'Total Amount',
      render: (value, ipo) => {
        const amount = ipo?.total_amount ? parseFloat(ipo.total_amount) : 0;
        return (
          <div className="text-right font-medium">
            PKR {amount.toLocaleString()}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (value, ipo) => {
        if (!ipo || !ipo.status) return <div>-</div>;
        return (
          <div className="flex items-center gap-2">
            {getStatusIcon(ipo.status)}
            {getStatusBadge(ipo.status)}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (value, ipo) => {
        if (!ipo) return null;
        
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewDetails(ipo)}
              disabled={detailsLoadingId === ipo.ipo_id}
            >
              {detailsLoadingId === ipo.ipo_id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            
            {ipo.status === 'PENDING' && (
            <Select
              onValueChange={(value) => handleStatusChange(ipo, value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Update status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="APPROVED">Approve</SelectItem>
                <SelectItem value="CANCELLED">Cancel</SelectItem>
              </SelectContent>
            </Select>
          )}

          {ipo.status === 'APPROVED' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleGeneratePDF(ipo)}
              disabled={generatePDFMutation.isPending}
            >
              {generatePDFMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
            </Button>
          )}

          {ipo.status === 'APPROVED' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSendEmail(ipo)}
            >
              <Mail className="h-4 w-4" />
            </Button>
          )}

          {ipo.status === 'SENT' && (
            <Select
              onValueChange={(value) => handleStatusChange(ipo, value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Update status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RECEIVED">Mark Received</SelectItem>
                <SelectItem value="CANCELLED">Cancel</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        );
      },
    },
  ];

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span>Error loading Internal Purchase Orders: {error.message}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Internal Purchase Orders</h1>
          <p className="text-gray-600">Manage internal purchase orders and generate PDFs</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create IPO
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard
            title="Total Orders"
            value={stats.total_orders.toString()}
            icon={FileText}
          />
          <StatsCard
            title="Total Value"
            value={`PKR ${stats.total_value.toLocaleString()}`}
            icon={Download}
          />
          <StatsCard
            title="Pending Orders"
            value={stats.by_status?.PENDING?.count?.toString() || '0'}
            icon={Clock}
          />
          <StatsCard
            title="Sent Orders"
            value={stats.by_status?.SENT?.count?.toString() || '0'}
            icon={Send}
          />
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by PO number, supplier, or contact person..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full"
              />
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="RECEIVED">Received</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setFilters({ status: '', search: '', limit: 50, offset: 0 })}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* IPO Table */}
      <Card>
        <CardHeader>
          <CardTitle>Internal Purchase Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={ipos}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No Internal Purchase Orders found"
          />
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateIPOModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["internal-purchase-orders"] });
          queryClient.invalidateQueries({ queryKey: ["ipo-stats"] });
        }}
      />

      <IPODetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedIPO(null);
        }}
        ipo={selectedIPO}
      />

      <SendEmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        ipo={selectedIPO}
        onSend={handleGenerateAndSend}
        isLoading={generateAndSendMutation.isPending}
      />
    </div>
  );
};

export default InternalPurchaseOrderPage;
