import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Edit,
  Calendar,
  User,
  Building,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { salesOrderApi } from '../api';
import type { SalesOrder, SalesOrderStatus } from '../types';

interface SalesOrderDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesOrder: SalesOrder | null;
  onStatusChange: (orderId: string, status: SalesOrderStatus) => void;
}

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

export default function SalesOrderDetailsModal({ 
  open, 
  onOpenChange, 
  salesOrder, 
  onStatusChange 
}: SalesOrderDetailsModalProps) {
  const queryClient = useQueryClient();
  const [newStatus, setNewStatus] = useState<SalesOrderStatus>('DRAFT');
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<SalesOrder | null>(null);

  useEffect(() => {
    let ignore = false;

    const loadDetails = async () => {
      if (!open || !salesOrder) {
        setCurrentOrder(null);
        return;
      }

      setDetailsLoading(true);
      try {
        const detailed = await salesOrderApi.getById(salesOrder.sales_order_id);
        if (!ignore) {
          setCurrentOrder(detailed);
        }
      } catch (error) {
        console.error('Failed to load sales order details:', error);
        if (!ignore) {
          setCurrentOrder(salesOrder);
        }
        toast.error('Unable to load full sales order details');
      } finally {
        if (!ignore) {
          setDetailsLoading(false);
        }
      }
    };

    loadDetails();

    return () => {
      ignore = true;
    };
  }, [open, salesOrder]);

  useEffect(() => {
    if (open) {
      const status = currentOrder?.status || salesOrder?.status;
      if (status) {
        setNewStatus(status);
      }
    }
  }, [open, currentOrder, salesOrder]);

  // Convert to work orders mutation
  const convertToWorkOrdersMutation = useMutation({
    mutationFn: (id: string) => salesOrderApi.convertToWorkOrders(id, 'user'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      toast.success('Sales order converted to work orders successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to convert sales order to work orders');
      console.error('Convert to work orders error:', error);
    },
  });

  const handleStatusChange = () => {
    if (currentOrder) {
      onStatusChange(currentOrder.sales_order_id, newStatus);
    }
  };

  const handleConvertToWorkOrders = () => {
    if (currentOrder) {
      convertToWorkOrdersMutation.mutate(currentOrder.sales_order_id);
    }
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
    return new Date(dateString).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!salesOrder) return null;
  const order = currentOrder || salesOrder;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Sales Order: {order.order_number}
            <Badge className={statusConfig[order.status].color}>
              <div className="flex items-center gap-1">
                {getStatusIcon(order.status)}
                {statusConfig[order.status].label}
              </div>
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Complete details for this sales order
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Order Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Order Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Order Number:</span>
                    <span>{order.order_number}</span>
                  </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Order Date:</span>
                      <span>{formatDate(order.order_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Required Date:</span>
                      <span>{order.required_date ? formatDate(order.required_date) : '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Delivery Date:</span>
                      <span>{order.delivery_date ? formatDate(order.delivery_date) : '-'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Priority:</span>
                      <span className="capitalize">{order.priority?.toLowerCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Order Type:</span>
                      <span className="capitalize">{order.order_type?.toLowerCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Reference Number:</span>
                      <span>{order.reference_number || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Shipping Method:</span>
                      <span>{order.shipping_method || '-'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-lg">{order.customer_name}</h4>
                    <p className="text-gray-600">Customer ID: {order.customer_id}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Contact Person:</span>
                      </div>
                      <p className="ml-6">{order.customer_contact || '-'}</p>
                      
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Phone:</span>
                      </div>
                      <p className="ml-6">{order.customer_phone || '-'}</p>
                      
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Email:</span>
                      </div>
                      <p className="ml-6">{order.customer_email || '-'}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Billing Address:</span>
                      </div>
                      <p className="ml-6 text-sm">{order.customer_billing_address || '-'}</p>
                      
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Tax ID:</span>
                      </div>
                      <p className="ml-6">{order.customer_tax_id || '-'}</p>
                      
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Payment Terms:</span>
                      </div>
                      <p className="ml-6">{order.customer_payment_terms || '-'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({order.tax_rate}%):</span>
                    <span>{formatCurrency(order.tax_amount)}</span>
                  </div>
                  {order.discount_amount && order.discount_amount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Discount:</span>
                      <span>-{formatCurrency(order.discount_amount)}</span>
                    </div>
                  )}
                  {order.shipping_cost && order.shipping_cost > 0 && (
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>{formatCurrency(order.shipping_cost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total Amount:</span>
                    <span>{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="items" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Order Items ({order.items?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                {detailsLoading && (
                  <div className="text-sm text-muted-foreground mb-4">Loading items…</div>
                )}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Code</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Production</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items?.map((item) => (
                      <TableRow key={item.item_id}>
                        <TableCell>{item.item_code || '-'}</TableCell>
                        <TableCell className="font-medium">{item.item_name}</TableCell>
                        <TableCell>{item.description || '-'}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.unit_of_measure}</TableCell>
                        <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(item.quantity * item.unit_price)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.production_required ? "default" : "secondary"}>
                            {item.production_required ? 'Required' : 'Not Required'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Order Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status Change */}
                <div className="space-y-2">
                  <h4 className="font-medium">Change Status</h4>
                  <div className="flex items-center gap-2">
                    <Select value={newStatus} onValueChange={(value) => setNewStatus(value as SalesOrderStatus)}>
                      <SelectTrigger className="w-48">
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
                    <Button onClick={handleStatusChange} size="sm">
                      Update Status
                    </Button>
                  </div>
                </div>

                {/* Convert to Work Orders */}
                {order.status === 'APPROVED' && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Production Planning</h4>
                    <Button 
                      onClick={handleConvertToWorkOrders}
                      disabled={convertToWorkOrdersMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <Package className="h-4 w-4" />
                      {convertToWorkOrdersMutation.isPending ? 'Converting...' : 'Convert to Work Orders'}
                    </Button>
                    <p className="text-sm text-gray-600">
                      Convert this sales order to production work orders for manufacturing
                    </p>
                  </div>
                )}

                {/* Special Instructions */}
                {salesOrder.special_instructions && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Special Instructions</h4>
                    <p className="text-sm bg-gray-50 p-3 rounded-md">
                      {salesOrder.special_instructions}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
