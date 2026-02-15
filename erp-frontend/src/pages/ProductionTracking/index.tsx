// src/pages/ProductionTracking/index.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Factory, 
  Package, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  Users,
  Settings
} from 'lucide-react';
import { api } from '@/services/api';
import websocketService from '@/services/websocket.service';

interface ProductionOrder {
  wo_id: string;
  wo_no: string;
  part_description: string;
  model: string;
  quantity: number;
  status: string;
  created_at: string;
  uom_code: string;
  uom_name: string;
  total_operations?: number;
  completed_operations?: number;
  overall_progress?: number;
}

interface ProductionStats {
  total_orders: number;
  planned_orders: number;
  in_progress_orders: number;
  completed_orders: number;
  cancelled_orders: number;
}

interface RecentOrder {
  wo_no: string;
  status: string;
  created_at: string;
  part_name: string;
  model_name: string;
}

interface DashboardData {
  stats: ProductionStats;
  recentOrders: RecentOrder[];
}

const ProductionTracking: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);

  useEffect(() => {
    // Connect to WebSocket
    websocketService.connect();

    // Subscribe to real-time updates
    const unsubscribeWorkOrder = websocketService.subscribe('work-order-status-changed', (data: any) => {
      console.log('Work order status changed:', data);
      // Refresh production orders when status changes
      fetchProductionOrders();
      fetchDashboardData();
    });

    const unsubscribeNewWorkOrder = websocketService.subscribe('new-work-order', (data: any) => {
      console.log('New work order created:', data);
      // Refresh data when new work order is created
      fetchProductionOrders();
      fetchDashboardData();
    });

    const unsubscribeProductionUpdate = websocketService.subscribe('production-progress-updated', (data: any) => {
      console.log('Production progress updated:', data);
      // Refresh production orders when progress updates
      fetchProductionOrders();
    });

    // Initial data fetch
    fetchDashboardData();
    fetchProductionOrders();

    // Cleanup
    return () => {
      unsubscribeWorkOrder();
      unsubscribeNewWorkOrder();
      unsubscribeProductionUpdate();
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/production-tracking/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const fetchProductionOrders = async () => {
    try {
      const response = await api.get('/production-tracking/orders');
      setProductionOrders(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch production orders:', error);
      setLoading(false);
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
        return <Settings className="h-4 w-4" />;
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Production Tracking</h1>
          <p className="text-gray-600 mt-2">Real-time manufacturing operations monitoring</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${websocketService.isConnected() ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {websocketService.isConnected() ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Dashboard Stats */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Factory className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.stats.total_orders}</div>
              <p className="text-xs text-gray-600">Last 30 days</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Planned</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.stats.planned_orders}</div>
              <p className="text-xs text-gray-600">Ready to start</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Play className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.stats.in_progress_orders}</div>
              <p className="text-xs text-gray-600">Currently running</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.stats.completed_orders}</div>
              <p className="text-xs text-gray-600">Finished</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.stats.cancelled_orders}</div>
              <p className="text-xs text-gray-600">Stopped</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList className="glass-card">
          <TabsTrigger value="orders">Production Orders</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Active Production Orders</CardTitle>
              <CardDescription>Real-time status of all work orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {productionOrders.map((order) => (
                  <div
                    key={order.wo_id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(order.status)}
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                      <div>
                        <h3 className="font-semibold">{order.wo_no}</h3>
                        <p className="text-sm text-gray-600">{order.part_description}</p>
                        <p className="text-xs text-gray-500">Model: {order.model}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{order.quantity} {order.uom_code}</p>
                        {order.overall_progress !== undefined && (
                          <div className="w-32">
                            <Progress value={order.overall_progress} className="mt-1" />
                            <p className="text-xs text-gray-500 mt-1">
                              {order.completed_operations}/{order.total_operations} operations
                            </p>
                          </div>
                        )}
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest production updates and changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData?.recentOrders.map((order, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(order.status)}
                      <Badge className={getStatusColor(order.status)} variant="outline">
                        {order.status}
                      </Badge>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{order.wo_no}</p>
                      <p className="text-xs text-gray-600">{order.part_name} - {order.model_name}</p>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Order Details Modal would go here */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 glass-card">
            <CardHeader>
              <CardTitle>Order Details: {selectedOrder.wo_no}</CardTitle>
              <CardDescription>Detailed information about this production order</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Part Description</label>
                    <p className="text-lg">{selectedOrder.part_description}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Model</label>
                    <p className="text-lg">{selectedOrder.model}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Quantity</label>
                    <p className="text-lg">{selectedOrder.quantity} {selectedOrder.uom_code}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <Badge className={getStatusColor(selectedOrder.status)}>
                      {selectedOrder.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                    Close
                  </Button>
                  <Button>Update Status</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProductionTracking;