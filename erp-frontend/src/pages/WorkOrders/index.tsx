// src/pages/WorkOrders/index.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  Play, 
  Pause, 
  CheckCircle, 
  AlertCircle,
  Factory,
  Package,
  Users,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { api } from '@/services/api';
import websocketService from '@/services/websocket.service';

interface WorkOrder {
  wo_id: string;
  wo_no: string;
  product_id: string;
  quantity: number;
  uom_id: string;
  priority: number;
  scheduled_start: string | null;
  scheduled_end: string | null;
  status: string;
  created_by: string;
  created_at: string;
  part_description?: string;
  model?: string;
  uom_code?: string;
  uom_name?: string;
}

interface Product {
  product_id: string;
  product_code: string;
  part_name: string;
  model_name: string;
  oem_name: string;
}

interface UOM {
  uom_id: string;
  code: string;
  name: string;
}

const WorkOrders: React.FC = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [uoms, setUoms] = useState<UOM[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newWorkOrder, setNewWorkOrder] = useState({
    product_id: '',
    quantity: 1,
    uom_id: '',
    priority: 1,
    scheduled_start: '',
    scheduled_end: ''
  });

  useEffect(() => {
    // Connect to WebSocket
    websocketService.connect();

    // Subscribe to real-time updates
    const unsubscribeWorkOrder = websocketService.subscribe('work-order-status-changed', (data: any) => {
      console.log('Work order status changed:', data);
      // Update specific work order status
      setWorkOrders(prev => prev.map(wo => 
        wo.wo_id === data.workOrderId 
          ? { ...wo, status: data.newStatus }
          : wo
      ));
    });

    const unsubscribeNewWorkOrder = websocketService.subscribe('new-work-order', (data: any) => {
      console.log('New work order created:', data);
      // Add new work order to the list
      setWorkOrders(prev => [data.workOrder, ...prev]);
    });

    // Initial data fetch
    fetchWorkOrders();
    fetchProducts();
    fetchUOMs();

    // Cleanup
    return () => {
      unsubscribeWorkOrder();
      unsubscribeNewWorkOrder();
    };
  }, []);

  const fetchWorkOrders = async () => {
    try {
      const response = await api.get('/work-orders');
      setWorkOrders(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch work orders:', error);
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchUOMs = async () => {
    try {
      const response = await api.get('/uom');
      setUOMs(response.data);
    } catch (error) {
      console.error('Failed to fetch UOMs:', error);
    }
  };

  const createWorkOrder = async () => {
    try {
      const response = await api.post('/work-orders', newWorkOrder);
      console.log('Work order created:', response.data);
      setIsCreateDialogOpen(false);
      setNewWorkOrder({
        product_id: '',
        quantity: 1,
        uom_id: '',
        priority: 1,
        scheduled_start: '',
        scheduled_end: ''
      });
      fetchWorkOrders();
    } catch (error) {
      console.error('Failed to create work order:', error);
    }
  };

  const updateWorkOrderStatus = async (woId: string, newStatus: string) => {
    try {
      const response = await api.put(`/work-orders/${woId}/status`, { 
        status: newStatus,
        oldStatus: workOrders.find(wo => wo.wo_id === woId)?.status
      });
      console.log('Work order status updated:', response.data);
      // The WebSocket will handle the real-time update
    } catch (error) {
      console.error('Failed to update work order status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'planned':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'planned':
        return <Clock className="h-4 w-4" />;
      case 'in_progress':
        return <Play className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Factory className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'bg-red-100 text-red-800';
    if (priority >= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const filteredWorkOrders = workOrders.filter(wo => {
    const matchesSearch = wo.wo_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         wo.part_description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || wo.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Work Orders</h1>
          <p className="text-gray-600 mt-2">Manage and track production work orders</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${websocketService.isConnected() ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {websocketService.isConnected() ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Factory className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workOrders.length}</div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Play className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workOrders.filter(wo => wo.status.toLowerCase() === 'in_progress').length}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workOrders.filter(wo => wo.status.toLowerCase() === 'completed').length}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planned</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workOrders.filter(wo => wo.status.toLowerCase() === 'planned').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search work orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Work Order
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Work Order</DialogTitle>
                  <DialogDescription>
                    Create a new production work order
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="product">Product</Label>
                    <Select value={newWorkOrder.product_id} onValueChange={(value) => setNewWorkOrder(prev => ({ ...prev, product_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(product => (
                          <SelectItem key={product.product_id} value={product.product_id}>
                            {product.part_name} - {product.model_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={newWorkOrder.quantity}
                      onChange={(e) => setNewWorkOrder(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="uom">Unit of Measure</Label>
                    <Select value={newWorkOrder.uom_id} onValueChange={(value) => setNewWorkOrder(prev => ({ ...prev, uom_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select UOM" />
                      </SelectTrigger>
                      <SelectContent>
                        {uoms.map(uom => (
                          <SelectItem key={uom.uom_id} value={uom.uom_id}>
                            {uom.code} - {uom.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={newWorkOrder.priority.toString()} onValueChange={(value) => setNewWorkOrder(prev => ({ ...prev, priority: parseInt(value) }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Low (1)</SelectItem>
                        <SelectItem value="2">Medium (2)</SelectItem>
                        <SelectItem value="3">High (3)</SelectItem>
                        <SelectItem value="4">Critical (4)</SelectItem>
                        <SelectItem value="5">Emergency (5)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createWorkOrder}>
                    Create Work Order
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Work Orders List */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Work Orders ({filteredWorkOrders.length})</CardTitle>
          <CardDescription>Manage production work orders and track their progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredWorkOrders.map((workOrder) => (
              <div
                key={workOrder.wo_id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(workOrder.status)}
                    <Badge className={getStatusColor(workOrder.status)}>
                      {workOrder.status}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold">{workOrder.wo_no}</h3>
                    <p className="text-sm text-gray-600">{workOrder.part_description}</p>
                    <p className="text-xs text-gray-500">Model: {workOrder.model}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{workOrder.quantity} {workOrder.uom_code}</p>
                    <Badge className={getPriorityColor(workOrder.priority)} variant="outline">
                      Priority {workOrder.priority}
                    </Badge>
                  </div>
                  <div className="flex space-x-2">
                    {workOrder.status.toLowerCase() === 'planned' && (
                      <Button
                        size="sm"
                        onClick={() => updateWorkOrderStatus(workOrder.wo_id, 'IN_PROGRESS')}
                      >
                        Start
                      </Button>
                    )}
                    {workOrder.status.toLowerCase() === 'in_progress' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateWorkOrderStatus(workOrder.wo_id, 'COMPLETED')}
                      >
                        Complete
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkOrders;