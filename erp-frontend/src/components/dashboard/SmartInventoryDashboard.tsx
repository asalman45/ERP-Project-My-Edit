import React, { useEffect, useState } from 'react';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  Loader2,
  Bell,
  Calendar,
  BarChart3,
  Shield,
  Activity,
  RefreshCw,
  Settings,
  Zap
} from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import ChartCard from '@/components/dashboard/ChartCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';

interface LowStockAlert {
  inventory_id: string;
  item_name: string;
  item_code: string;
  current_quantity: number;
  min_stock: number;
  status: string;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  suggested_reorder: number;
}

interface ReorderSuggestion {
  inventory_id: string;
  item_name: string;
  item_code: string;
  current_quantity: number;
  min_stock: number;
  suggested_reorder: number;
  estimated_cost: number;
  days_until_stockout: number;
  priority_score: number;
  urgency: string;
}

interface ExpiryWarning {
  batch_id: string;
  batch_no: string;
  item_name: string;
  item_code: string;
  quantity: number;
  expiry_date: string;
  days_to_expiry: number;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

interface AuditSummary {
  total_logs: number;
  action_breakdown: Array<{ action: string; _count: { action: number } }>;
  recent_activity: Array<{
    id: string;
    user_id: string;
    action: string;
    entity_type: string;
    timestamp: string;
  }>;
}

const SmartInventoryDashboard: React.FC = () => {
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);
  const [reorderSuggestions, setReorderSuggestions] = useState<ReorderSuggestion[]>([]);
  const [expiryWarnings, setExpiryWarnings] = useState<ExpiryWarning[]>([]);
  const [auditSummary, setAuditSummary] = useState<AuditSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadSmartData = async () => {
    try {
      setLoading(true);
      
      const [
        alertsResponse,
        suggestionsResponse,
        expiryResponse,
        auditResponse
      ] = await Promise.all([
        api.get('/stock-levels/alerts'),
        api.get('/stock-levels/reorder-suggestions'),
        api.get('/batch-tracking/expiry-warnings'),
        api.get('/audit-trail/summary')
      ]);

      setLowStockAlerts(alertsResponse.data.alerts || []);
      setReorderSuggestions(suggestionsResponse.data.suggestions || []);
      setExpiryWarnings(expiryResponse.data.warnings || []);
      setAuditSummary(auditResponse.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load smart data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSmartData();
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadSmartData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in-50 duration-700">
        <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <StatsCard key={i} title="Loading..." value="" icon={Loader2} loading={true} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-700">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 rounded-2xl blur-3xl"></div>
        <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-3 flex items-center gap-3">
                <Zap className="w-10 h-10 text-blue-600" />
                Smart Inventory Dashboard
              </h1>
              <p className="text-gray-600 text-lg">
                Intelligent inventory management with AI-powered insights and automated alerts
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={loadSmartData}
                className="bg-white/50 hover:bg-white/70 border-white/30 transition-all duration-300 hover:scale-105"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <div className="text-right">
                <p className="text-sm text-gray-500">Last updated</p>
                <p className="text-sm font-medium text-gray-700">
                  {lastUpdated.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="animate-in slide-in-from-bottom-4 duration-700 delay-100">
          <StatsCard
            title="Low Stock Alerts"
            value={lowStockAlerts.length}
            icon={AlertTriangle}
            color="red"
            subtitle={`${lowStockAlerts.filter(a => a.urgency === 'CRITICAL').length} critical`}
            trend={{
              value: lowStockAlerts.length > 0 ? -15 : 0,
              isPositive: false,
              label: 'vs last week'
            }}
          />
        </div>
        <div className="animate-in slide-in-from-bottom-4 duration-700 delay-200">
          <StatsCard
            title="Reorder Suggestions"
            value={reorderSuggestions.length}
            icon={Package}
            color="blue"
            subtitle={`$${reorderSuggestions.reduce((sum, s) => sum + s.estimated_cost, 0).toLocaleString()} estimated cost`}
          />
        </div>
        <div className="animate-in slide-in-from-bottom-4 duration-700 delay-300">
          <StatsCard
            title="Expiry Warnings"
            value={expiryWarnings.length}
            icon={Clock}
            color="orange"
            subtitle={`${expiryWarnings.filter(w => w.urgency === 'CRITICAL').length} expiring soon`}
          />
        </div>
        <div className="animate-in slide-in-from-bottom-4 duration-700 delay-400">
          <StatsCard
            title="System Activities"
            value={auditSummary?.total_logs || 0}
            icon={Activity}
            color="purple"
            subtitle="Audit trail entries"
          />
        </div>
      </div>

      {/* Smart Analytics Tabs */}
      <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl border border-white/30 shadow-lg overflow-hidden">
        <Tabs defaultValue="alerts" className="w-full">
          <div className="p-6 border-b border-white/20 bg-gradient-to-r from-white/40 to-white/20">
            <TabsList className="grid w-full grid-cols-4 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl p-1">
              <TabsTrigger 
                value="alerts" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-red-700 transition-all duration-300 hover:scale-105"
              >
                <AlertTriangle className="w-4 h-4" />
                Stock Alerts
              </TabsTrigger>
              <TabsTrigger 
                value="reorder"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-700 transition-all duration-300 hover:scale-105"
              >
                <Package className="w-4 h-4" />
                Reorder
              </TabsTrigger>
              <TabsTrigger 
                value="expiry"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-orange-700 transition-all duration-300 hover:scale-105"
              >
                <Clock className="w-4 h-4" />
                Expiry
              </TabsTrigger>
              <TabsTrigger 
                value="audit"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-purple-700 transition-all duration-300 hover:scale-105"
              >
                <Shield className="w-4 h-4" />
                Audit
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Stock Alerts Tab */}
          <TabsContent value="alerts" className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  Low Stock Alerts
                </h3>
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  {lowStockAlerts.length} Items Need Attention
                </Badge>
              </div>
              
              {lowStockAlerts.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">All Stock Levels Healthy</h4>
                  <p className="text-gray-500">No low stock alerts at this time</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lowStockAlerts.map((alert, index) => (
                    <div 
                      key={alert.inventory_id}
                      className={cn(
                        "p-4 rounded-xl border transition-all duration-300 hover:shadow-md",
                        getUrgencyColor(alert.urgency)
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{alert.item_name}</h4>
                          <p className="text-sm opacity-80">Code: {alert.item_code}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm">
                              Current: <strong>{alert.current_quantity}</strong>
                            </span>
                            <span className="text-sm">
                              Min: <strong>{alert.min_stock}</strong>
                            </span>
                            <span className="text-sm">
                              Suggested Reorder: <strong>{alert.suggested_reorder}</strong>
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={cn(
                            "mb-2",
                            alert.urgency === 'CRITICAL' ? 'bg-red-500' :
                            alert.urgency === 'HIGH' ? 'bg-orange-500' : 'bg-yellow-500'
                          )}>
                            {alert.urgency}
                          </Badge>
                          <Button size="sm" variant="outline">
                            Reorder Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Reorder Suggestions Tab */}
          <TabsContent value="reorder" className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                  <Package className="w-6 h-6 text-blue-600" />
                  Intelligent Reorder Suggestions
                </h3>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total Estimated Cost</p>
                  <p className="text-lg font-bold text-blue-600">
                    ${reorderSuggestions.reduce((sum, s) => sum + s.estimated_cost, 0).toLocaleString()}
                  </p>
                </div>
              </div>
              
              {reorderSuggestions.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">No Reorder Suggestions</h4>
                  <p className="text-gray-500">All inventory levels are optimal</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reorderSuggestions.slice(0, 10).map((suggestion, index) => (
                    <div 
                      key={suggestion.inventory_id}
                      className="p-4 bg-white/50 rounded-xl border border-white/30 hover:bg-white/70 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{suggestion.item_name}</h4>
                          <p className="text-sm text-gray-600">Code: {suggestion.item_code}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm">
                              Current: <strong>{suggestion.current_quantity}</strong>
                            </span>
                            <span className="text-sm">
                              Suggested: <strong>{suggestion.suggested_reorder}</strong>
                            </span>
                            <span className="text-sm">
                              Days Until Stockout: <strong>{suggestion.days_until_stockout}</strong>
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600">
                            ${suggestion.estimated_cost.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Priority: {suggestion.priority_score}
                          </p>
                          <Button size="sm" className="mt-2">
                            Create PO
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Expiry Warnings Tab */}
          <TabsContent value="expiry" className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                  <Clock className="w-6 h-6 text-orange-600" />
                  Batch Expiry Warnings
                </h3>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  {expiryWarnings.length} Batches Expiring
                </Badge>
              </div>
              
              {expiryWarnings.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">No Expiry Warnings</h4>
                  <p className="text-gray-500">All batches are within safe expiry range</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expiryWarnings.map((warning, index) => (
                    <div 
                      key={warning.batch_id}
                      className={cn(
                        "p-4 rounded-xl border transition-all duration-300 hover:shadow-md",
                        getUrgencyColor(warning.urgency)
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{warning.item_name}</h4>
                          <p className="text-sm opacity-80">Batch: {warning.batch_no} | Code: {warning.item_code}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm">
                              Quantity: <strong>{warning.quantity}</strong>
                            </span>
                            <span className="text-sm">
                              Expires: <strong>{new Date(warning.expiry_date).toLocaleDateString()}</strong>
                            </span>
                            <span className="text-sm">
                              Days Left: <strong>{warning.days_to_expiry}</strong>
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={cn(
                            "mb-2",
                            warning.urgency === 'CRITICAL' ? 'bg-red-500' :
                            warning.urgency === 'HIGH' ? 'bg-orange-500' : 'bg-yellow-500'
                          )}>
                            {warning.urgency}
                          </Badge>
                          <Button size="sm" variant="outline">
                            Use First
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Audit Trail Tab */}
          <TabsContent value="audit" className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                  <Shield className="w-6 h-6 text-purple-600" />
                  System Audit Trail
                </h3>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total Activities</p>
                  <p className="text-lg font-bold text-purple-600">
                    {auditSummary?.total_logs || 0}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Action Breakdown */}
                <ChartCard title="Activity Breakdown" description="Recent system activities by type">
                  <div className="space-y-3">
                    {auditSummary?.action_breakdown.map((action, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                        <span className="font-medium capitalize">{action.action.replace('_', ' ')}</span>
                        <Badge variant="outline">{action._count.action}</Badge>
                      </div>
                    ))}
                  </div>
                </ChartCard>

                {/* Recent Activity */}
                <ChartCard title="Recent Activity" description="Latest system activities">
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {auditSummary?.recent_activity.slice(0, 10).map((activity, index) => (
                      <div key={activity.id} className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <Activity className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.action}</p>
                          <p className="text-xs text-gray-500">
                            {activity.entity_type} • {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ChartCard>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SmartInventoryDashboard;
