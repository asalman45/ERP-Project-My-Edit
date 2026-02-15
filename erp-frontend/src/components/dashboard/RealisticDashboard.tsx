import React, { useState, useEffect } from 'react';
import {
  Package,
  Box,
  Building2,
  Car,
  ClipboardList,
  Warehouse,
  AlertTriangle,
  TrendingUp,
  Activity,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  Gem,
  Briefcase
} from 'lucide-react';
import StatsCard from './StatsCard';
import { dashboardService, DashboardStats, InventorySummary, WorkOrderStatus, RecentActivity } from '../../services/dashboard.service';

const RealisticDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [inventorySummary, setInventorySummary] = useState<InventorySummary | null>(null);
  const [workOrderStatus, setWorkOrderStatus] = useState<WorkOrderStatus | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Add a small delay to ensure backend is ready
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('Starting dashboard data fetch...');
        const [statsData, inventoryData, workOrderData, activitiesData] = await Promise.all([
          dashboardService.getDashboardStats(),
          dashboardService.getInventorySummary(),
          dashboardService.getWorkOrderStatus(),
          dashboardService.getRecentActivities()
        ]);

        console.log('Dashboard data fetched successfully:', { statsData, inventoryData, workOrderData, activitiesData });
        setStats(statsData);
        setInventorySummary(inventoryData);
        setWorkOrderStatus(workOrderData);
        setRecentActivities(activitiesData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'stock_in':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'stock_out':
        return <TrendingUp className="w-4 h-4 text-red-600" />;
      case 'work_order':
        return <ClipboardList className="w-4 h-4 text-blue-600" />;
      case 'purchase_order':
        return <Package className="w-4 h-4 text-purple-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-700">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 rounded-2xl blur-3xl"></div>
        <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-3">
            ERP Dashboard
          </h1>
          <p className="text-gray-600 text-lg">Real-time overview of your business operations and key metrics</p>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="animate-in slide-in-from-bottom-4 duration-700 delay-100">
          <StatsCard
            title="Total Products"
            value={stats?.totalProducts || 0}
            icon={Package}
            color="blue"
            subtitle="Active products in catalog"
            loading={loading}
            trend={{ value: 12, isPositive: true, label: 'vs last month' }}
          />
        </div>
        <div className="animate-in slide-in-from-bottom-4 duration-700 delay-200">
          <StatsCard
            title="Total Materials"
            value={stats?.totalMaterials || 0}
            icon={Box}
            color="green"
            subtitle="Raw materials available"
            loading={loading}
            trend={{ value: 8, isPositive: true, label: 'vs last month' }}
          />
        </div>
        <div className="animate-in slide-in-from-bottom-4 duration-700 delay-300">
          <StatsCard
            title="Work Orders"
            value={stats?.totalWorkOrders || 0}
            icon={ClipboardList}
            color="purple"
            subtitle="Active production orders"
            loading={loading}
            trend={{ value: -3, isPositive: false, label: 'vs last month' }}
          />
        </div>
        <div className="animate-in slide-in-from-bottom-4 duration-700 delay-400">
          <StatsCard
            title="Revenue"
            value={`₹${stats?.financials?.totalRevenue.toLocaleString() || 0}`}
            icon={ArrowUpCircle}
            color="green"
            subtitle="Total recognized revenue"
            loading={loading}
          />
        </div>
      </div>

      {/* Financial Snapshot Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="animate-in slide-in-from-bottom-4 duration-700 delay-500">
          <StatsCard
            title="Accounts Receivable"
            value={`₹${stats?.financials?.accountsReceivable.toLocaleString() || 0}`}
            icon={DollarSign}
            color="blue"
            subtitle="Customer balance due"
            loading={loading}
          />
        </div>
        <div className="animate-in slide-in-from-bottom-4 duration-700 delay-600">
          <StatsCard
            title="Accounts Payable"
            value={`₹${stats?.financials?.accountsPayable.toLocaleString() || 0}`}
            icon={Briefcase}
            color="orange"
            subtitle="Outstanding vendor bills"
            loading={loading}
          />
        </div>
        <div className="animate-in slide-in-from-bottom-4 duration-700 delay-700">
          <StatsCard
            title="Operating Expense"
            value={`₹${stats?.financials?.totalExpense.toLocaleString() || 0}`}
            icon={ArrowDownCircle}
            color="red"
            subtitle="Total business spend"
            loading={loading}
          />
        </div>
        <div className="animate-in slide-in-from-bottom-4 duration-700 delay-800">
          <StatsCard
            title="Net Business Profit"
            value={`₹${stats?.financials?.netProfit.toLocaleString() || 0}`}
            icon={Gem}
            color="indigo"
            subtitle="Earnings after expenses"
            loading={loading}
          />
        </div>
      </div>


      {/* Charts and Activities Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Work Order Status */}
        <div className="animate-in slide-in-from-left-4 duration-700 delay-900">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-500">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Work Order Status</h3>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-100 rounded-lg animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-6 bg-gray-200 rounded w-12"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-gray-800">Completed</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">{workOrderStatus?.completed || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-800">In Progress</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{workOrderStatus?.in_progress || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium text-gray-800">Pending</span>
                  </div>
                  <span className="text-2xl font-bold text-yellow-600">{workOrderStatus?.pending || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-3">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-gray-800">Cancelled</span>
                  </div>
                  <span className="text-2xl font-bold text-red-600">{workOrderStatus?.cancelled || 0}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="animate-in slide-in-from-right-4 duration-700 delay-1000">
          <div className="bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 rounded-2xl p-6 text-white shadow-2xl border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Recent Activities</h3>
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg animate-pulse">
                    <div className="w-4 h-4 bg-white/20 rounded"></div>
                    <div className="flex-1">
                      <div className="h-3 bg-white/20 rounded w-3/4 mb-1"></div>
                      <div className="h-2 bg-white/10 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors duration-300">
                    <div className="mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white/90 truncate">
                        {activity.description}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <User className="w-3 h-3 text-white/60" />
                        <span className="text-xs text-white/60">{activity.user}</span>
                        <span className="text-xs text-white/40">•</span>
                        <span className="text-xs text-white/60">{formatTimeAgo(activity.timestamp)}</span>
                        <div className="ml-auto">
                          {getStatusIcon(activity.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inventory Summary */}
      {inventorySummary && (
        <div className="animate-in slide-in-from-bottom-4 duration-700 delay-1100">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-500">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Inventory Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  ${inventorySummary.totalValue ? inventorySummary.totalValue.toLocaleString() : '0'}
                </div>
                <div className="text-sm text-gray-600">Total Inventory Value</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200/50">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {inventorySummary.totalItems || 0}
                </div>
                <div className="text-sm text-gray-600">Total Items</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200/50">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {(inventorySummary.lowStockCount || 0) + (inventorySummary.zeroStockCount || 0)}
                </div>
                <div className="text-sm text-gray-600">Items Need Attention</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealisticDashboard;
