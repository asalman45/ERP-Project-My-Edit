import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2,
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Download
} from 'lucide-react';
import { salesOrderApi } from './api';
import type { SalesOrder, SalesOrderStatus, SalesOrderFilters } from './types';
import CreateSalesOrderModal from './components/CreateSalesOrderModal';
import SalesOrderDetailsModal from './components/SalesOrderDetailsModal';
import GenericExportModal from '@/components/common/GenericExportModal';

const statusConfig = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: Edit },
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  APPROVED: { label: 'Approved', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  IN_PRODUCTION: { label: 'In Production', color: 'bg-purple-100 text-purple-800', icon: Package },
  READY_FOR_DISPATCH: { label: 'Ready for Dispatch', color: 'bg-orange-100 text-orange-800', icon: Truck },
  DISPATCHED: { label: 'Dispatched', color: 'bg-indigo-100 text-indigo-800', icon: Truck },
  DELIVERED: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  COMPLETED: { label: 'Completed', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  ON_HOLD: { label: 'On Hold', color: 'bg-gray-100 text-gray-800', icon: AlertCircle },
};

export default function SalesOrderPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<SalesOrderFilters>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Fetch sales orders
  const { data: salesOrders = [], isLoading, error, refetch } = useQuery({
    queryKey: ['sales-orders', filters],
    queryFn: () => salesOrderApi.getAll(filters),
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ['sales-order-stats'],
    queryFn: () => salesOrderApi.getStats(),
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: SalesOrderStatus; reason?: string }) =>
      salesOrderApi.updateStatus(id, { status, updated_by: 'user', reason }),
    onSuccess: (data, variables) => {
      // Simple approach - just refetch everything
      queryClient.invalidateQueries();
      
      toast.success('Sales order status updated successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to update sales order status');
      console.error('Update status error:', error);
    },
  });

  // Convert to work orders mutation
  const convertToWorkOrdersMutation = useMutation({
    mutationFn: (id: string) => salesOrderApi.convertToWorkOrders(id, 'user'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['sales-order-stats'] });
      toast.success('Sales order converted to work orders successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to convert sales order to work orders');
      console.error('Convert to work orders error:', error);
    },
  });

  // Delete sales order mutation
  const deleteSalesOrderMutation = useMutation({
    mutationFn: (id: string) => salesOrderApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['sales-order-stats'] });
      toast.success('Sales order deleted successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to delete sales order');
      console.error('Delete sales order error:', error);
    },
  });

  const handleStatusChange = (orderId: string, newStatus: SalesOrderStatus) => {
    updateStatusMutation.mutate({ id: orderId, status: newStatus });
  };

  const handleConvertToWorkOrders = (orderId: string) => {
    convertToWorkOrdersMutation.mutate(orderId);
  };

  const handleDeleteSalesOrder = (orderId: string, orderNumber: string) => {
    if (window.confirm(`Are you sure you want to delete sales order ${orderNumber}? This action cannot be undone.`)) {
      deleteSalesOrderMutation.mutate(orderId);
    }
  };

  const handleViewDetails = (order: SalesOrder) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const getStatusIcon = (status: SalesOrderStatus) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    return <Icon className="h-4 w-4" />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PK');
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error Loading Sales Orders</CardTitle>
            <CardDescription className="text-red-600">
              Failed to load sales orders. Please check your connection and try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales Orders</h1>
          <p className="text-gray-600">Manage customer purchase orders and production planning</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowExportModal(true)} 
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Sales Order
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_orders}</div>
              <p className="text-xs text-muted-foreground">
                {stats.orders_last_30_days} in last 30 days
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.total_value)}</div>
              <p className="text-xs text-muted-foreground">
                Avg: {formatCurrency(stats.average_order_value)}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Production</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.in_production_count}</div>
              <p className="text-xs text-muted-foreground">
                {stats.ready_dispatch_count} ready for dispatch
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending_count}</div>
              <p className="text-xs text-muted-foreground">
                {stats.draft_count} drafts
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Search orders, customers, or reference numbers..."
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full"
              />
            </div>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? undefined : value as SalesOrderStatus })}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(statusConfig).map(([status, config]) => (
                  <SelectItem key={status} value={status}>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status as SalesOrderStatus)}
                      {config.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setFilters({})}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sales Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Orders</CardTitle>
          <CardDescription>
            {salesOrders.length} orders found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Required Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesOrders.map((order) => (
                  <TableRow key={order.sales_order_id}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>{order.customer_name}</TableCell>
                    <TableCell>{order.reference_number || '-'}</TableCell>
                    <TableCell>{formatDate(order.order_date)}</TableCell>
                    <TableCell>
                      {order.required_date ? formatDate(order.required_date) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig[order.status].color}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(order.status)}
                          {statusConfig[order.status].label}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(order.total_amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {order.status === 'APPROVED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConvertToWorkOrders(order.sales_order_id)}
                            disabled={convertToWorkOrdersMutation.isPending}
                          >
                            <Package className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSalesOrder(order.sales_order_id, order.order_number)}
                          disabled={deleteSalesOrderMutation.isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleStatusChange(order.sales_order_id, value as SalesOrderStatus)}
                          disabled={updateStatusMutation.isPending}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusConfig).map(([status, config]) => (
                              <SelectItem key={status} value={status}>
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(status as SalesOrderStatus)}
                                  {config.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateSalesOrderModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
          queryClient.invalidateQueries({ queryKey: ['sales-order-stats'] });
          toast.success('Sales order created successfully');
        }}
      />

      <SalesOrderDetailsModal
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        salesOrder={selectedOrder}
        onStatusChange={(orderId, status) => {
          handleStatusChange(orderId, status);
          setShowDetailsModal(false);
        }}
      />

      {showExportModal && (
        <GenericExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onSuccess={() => setShowExportModal(false)}
          title="Sales Orders"
          exportFunction={salesOrderApi.exportSalesOrders}
          filename="sales-orders"
          availableFormats={['pdf', 'csv']}
        />
      )}
    </div>
  );
}
