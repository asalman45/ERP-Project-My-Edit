import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Download,
  Calendar,
  BarChart3,
  Package,
  Factory,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2,
  ClipboardList,
  ShoppingCart,
  Receipt,
  Landmark,
  Truck,
  CreditCard,
  Settings,
  Activity,
  GitMerge,
  Archive,
  Layers,
  Warehouse
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { reportsApi, detailedReportsApi } from '@/services/api';
import { salesOrderApi } from '@/pages/SalesOrder/api';
import { useNavigate } from 'react-router-dom';

interface ReportFilters {
  start_date?: string;
  end_date?: string;
  product_id?: string;
  material_id?: string;
  location_id?: string;
  status?: string;
  low_stock_only?: boolean;
  customer_id?: string;
}

interface ReportConfig {
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  filters: string[];
  endpoint: string;
}

const Reports: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [filters, setFilters] = useState<ReportFilters>({});
  const [activeReport, setActiveReport] = useState('production');
  const [activeCategory, setActiveCategory] = useState<'all' | 'sales' | 'production' | 'inventory' | 'finance'>('all');
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    salesOrderApi.getCustomers().then(res => setCustomers(res || [])).catch(err => console.error('Failed to load customers:', err));
  }, []);

  const reportConfigs: Record<string, ReportConfig & { category: string }> = {
    production: {
      name: 'Production Report',
      description: 'Comprehensive production analysis including work orders, efficiency metrics, and cost analysis',
      icon: Factory,
      color: 'blue',
      filters: ['start_date', 'end_date', 'product_id', 'status'],
      endpoint: '/production',
      category: 'production'
    },
    scrap: {
      name: 'Scrap Management Report',
      description: 'Detailed scrap tracking, utilization analysis, and cost impact assessment',
      icon: Package,
      color: 'orange',
      filters: ['start_date', 'end_date', 'material_id', 'location_id', 'status'],
      endpoint: '/scrap',
      category: 'production'
    },
    inventory: {
      name: 'Inventory Report',
      description: 'Complete inventory overview with stock levels, valuations, and reorder alerts',
      icon: BarChart3,
      color: 'green',
      filters: ['product_id', 'material_id', 'location_id', 'low_stock_only'],
      endpoint: '/inventory',
      category: 'inventory'
    },
    cost_analysis: {
      name: 'Cost Analysis Report',
      description: 'Financial analysis of inventory transactions, cost trends, and budget impact',
      icon: DollarSign,
      color: 'purple',
      filters: ['start_date', 'end_date', 'product_id', 'material_id'],
      endpoint: '/cost-analysis',
      category: 'finance'
    },
    monthly_inventory_sales: {
      name: 'Monthly Inventory & Sales Report',
      description: 'Comprehensive monthly inventory and sales report with manual opening stock input and automatic calculations. Opens in a dedicated tool.',
      icon: ClipboardList,
      color: 'indigo',
      filters: [],
      endpoint: '/monthly-inventory-sales',
      category: 'inventory'
    },
    sales_order: {
      name: 'Sales Order Report',
      description: 'Detailed analysis of sales orders, shipping status, and customer performance',
      icon: ShoppingCart,
      color: 'blue',
      filters: ['start_date', 'end_date'],
      endpoint: '/detailed/sales-orders',
      category: 'sales'
    },
    expense: {
      name: 'Expense Report',
      description: 'Breakdown of employee expense claims, categories, and approval statuses',
      icon: Receipt,
      color: 'orange',
      filters: ['start_date', 'end_date', 'status'],
      endpoint: '/detailed/expenses',
      category: 'finance'
    },
    income: {
      name: 'Income Report',
      description: 'Revenue tracking across all posted financial transactions',
      icon: TrendingUp,
      color: 'green',
      filters: ['start_date', 'end_date'],
      endpoint: '/detailed/income',
      category: 'finance'
    },
    sales_tax: {
      name: 'Sales Tax Report',
      description: 'Summary of tax liabilities, GST collected, and GST paid',
      icon: Landmark,
      color: 'purple',
      filters: ['start_date', 'end_date'],
      endpoint: '/detailed/sales-tax',
      category: 'finance'
    },
    dispatch: {
      name: 'Dispatch Report',
      description: 'Analysis of product dispatches and logistics',
      icon: Truck,
      color: 'blue',
      filters: ['start_date', 'end_date', 'status'],
      endpoint: '/detailed/dispatch',
      category: 'sales'
    },
    invoicing: {
      name: 'Invoicing Report',
      description: 'Comprehensive view of all customer and supplier invoices',
      icon: FileText,
      color: 'orange',
      filters: ['start_date', 'end_date', 'status'],
      endpoint: '/detailed/invoicing',
      category: 'sales'
    },
    payment: {
      name: 'Payment Report',
      description: 'Detailed cash flow and payment transaction history',
      icon: CreditCard,
      color: 'green',
      filters: ['start_date', 'end_date'],
      endpoint: '/detailed/payment',
      category: 'finance'
    },
    detailed_production: {
      name: 'Detailed Production Report',
      description: 'In-depth analysis of planned vs actual yields and waste',
      icon: Settings,
      color: 'purple',
      filters: ['start_date', 'end_date'],
      endpoint: '/detailed/production',
      category: 'production'
    },
    tracking: {
      name: 'Production Tracking Report',
      description: 'Audit log of all production stages and status changes',
      icon: Activity,
      color: 'indigo',
      filters: ['start_date', 'end_date'],
      endpoint: '/detailed/tracking',
      category: 'production'
    },
    work_order: {
      name: 'Work Order Report',
      description: 'Status and timelines of all manufacturing work orders',
      icon: ClipboardList,
      color: 'red',
      filters: ['start_date', 'end_date', 'status'],
      endpoint: '/detailed/work-order',
      category: 'production'
    },
    process_flow: {
      name: 'Process Flow Report',
      description: 'Configuration of manufacturing stages and sequences',
      icon: GitMerge,
      color: 'blue',
      filters: [],
      endpoint: '/detailed/process-flow',
      category: 'production'
    },
    finished_goods: {
      name: 'Finished Goods Report',
      description: 'Inventory specifically allocated as ready-to-sell finished goods',
      icon: Archive,
      color: 'orange',
      filters: [],
      endpoint: '/detailed/finished-goods',
      category: 'inventory'
    },
    bom: {
      name: 'Bill of Materials Report',
      description: 'Hierarchical breakdown of recipes and required materials',
      icon: Layers,
      color: 'green',
      filters: [],
      endpoint: '/detailed/bom',
      category: 'production'
    },
    receipt_sales: {
      name: 'Recording of Receipt Sales',
      description: 'Historical detail of receipt sales including totals, taxes, and net amount.',
      icon: Receipt,
      color: 'blue',
      filters: ['start_date', 'end_date'],
      endpoint: '/detailed/receipt-sales',
      category: 'sales'
    },
    customer_ledger: {
      name: 'Customer Sales Ledger',
      description: 'Customer transactions ledger showing invoices, payments, WH Tax, and running balance.',
      icon: FileText,
      color: 'green',
      filters: ['start_date', 'end_date', 'customer_id'],
      endpoint: '/detailed/customer-ledger',
      category: 'finance'
    }
  };

  const categories = [
    { id: 'all', name: 'All Modules', icon: Layers },
    { id: 'sales', name: 'CRM & Sales', icon: ShoppingCart },
    { id: 'production', name: 'Production', icon: Factory },
    { id: 'inventory', name: 'Inventory', icon: Warehouse },
    { id: 'finance', name: 'Finance', icon: Landmark },
  ];

  const filteredReports = activeCategory === 'all'
    ? reportConfigs
    : Object.fromEntries(Object.entries(reportConfigs).filter(([_, c]) => c.category === activeCategory));

  const config = reportConfigs[activeReport];

  const handleFilterChange = (key: string, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value === '' ? undefined : value }));
  };

  const downloadReport = async (reportType: string, format: 'pdf' | 'excel') => {
    try {
      setLoading(`${reportType}-${format}`);
      const cfg = reportConfigs[reportType];
      if (!cfg) throw new Error('Invalid report type');

      if (reportType === 'monthly_inventory_sales') {
        navigate('/reports/monthly-inventory-sales');
        return;
      }

      const params: any = { format };
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') params[key] = value.toString();
      });

      let blob: Blob;
      switch (reportType) {
        case 'production': blob = await reportsApi.generateProductionReport(params); break;
        case 'scrap': blob = await reportsApi.generateScrapReport(params); break;
        case 'inventory': blob = await reportsApi.generateInventoryReport(params); break;
        case 'cost-analysis': blob = await reportsApi.generateCostAnalysisReport(params); break;
        case 'sales_order': blob = await detailedReportsApi.downloadSalesOrderReport(format, params); break;
        case 'expense': blob = await detailedReportsApi.downloadExpenseReport(format, params); break;
        case 'income': blob = await detailedReportsApi.downloadIncomeReport(format, params); break;
        case 'sales_tax': blob = await detailedReportsApi.downloadSalesTaxReport(format, params); break;
        case 'dispatch': blob = await detailedReportsApi.downloadDispatchReport(format, params); break;
        case 'invoicing': blob = await detailedReportsApi.downloadInvoicingReport(format, params); break;
        case 'payment': blob = await detailedReportsApi.downloadPaymentReport(format, params); break;
        case 'detailed_production': blob = await detailedReportsApi.downloadProductionReport(format, params); break;
        case 'tracking': blob = await detailedReportsApi.downloadTrackingReport(format, params); break;
        case 'work_order': blob = await detailedReportsApi.downloadWorkOrderReport(format, params); break;
        case 'process_flow': blob = await detailedReportsApi.downloadProcessFlowReport(format, params); break;
        case 'finished_goods': blob = await detailedReportsApi.downloadFinishedGoodsReport(format, params); break;
        case 'bom': blob = await detailedReportsApi.downloadBOMReport(format, params); break;
        case 'receipt_sales': blob = await detailedReportsApi.downloadReceiptSalesReport(format, params); break;
        case 'customer_ledger': blob = await detailedReportsApi.downloadCustomerLedgerReport(format, params); break;
        default: throw new Error(`Unknown report type: ${reportType}`);
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      toast({ title: 'Success', description: `${cfg.name} downloaded.` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to download report.', variant: 'destructive' });
    } finally {
      setLoading(null);
    }
  };

  const renderFilterInput = (filterKey: string) => {
    if (filterKey === 'start_date' || filterKey === 'end_date') {
      return <Input type="date" value={String(filters[filterKey as keyof ReportFilters] || '')} onChange={(e) => handleFilterChange(filterKey, e.target.value)} />;
    }
    if (filterKey === 'status') {
      const opts = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
      return (
        <Select value={filters.status || 'all'} onValueChange={(v) => handleFilterChange('status', v === 'all' ? undefined : v)}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All</SelectItem>{opts.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
        </Select>
      );
    }
    if (filterKey === 'customer_id') {
      return (
        <Select value={String(filters.customer_id || 'all')} onValueChange={(v) => handleFilterChange('customer_id', v === 'all' ? undefined : v)}>
          <SelectTrigger><SelectValue placeholder="Select Customer" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Select Customer...</SelectItem>
            {customers.map(c => (
              <SelectItem key={c.customer_id} value={c.customer_id}>
                {c.oem_name || c.company_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    return <Input type="text" placeholder={filterKey} value={String(filters[filterKey as keyof ReportFilters] || '')} onChange={(e) => handleFilterChange(filterKey, e.target.value)} />;
  };

  return (
    <div className="flex bg-gray-50/50 min-h-screen -m-6 animate-in fade-in duration-500">
      {/* Side Navigation */}
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-6 border-b border-gray-100 bg-white">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Reports</h1>
          <p className="text-sm text-gray-500">Business Intelligence Portal</p>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto">
          {/* Categories */}
          <div className="space-y-1">
            <p className="px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Categories</p>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id as any); setActiveReport(Object.keys(reportConfigs).find(k => cat.id === 'all' || reportConfigs[k].category === cat.id) || 'production'); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  activeCategory === cat.id ? "bg-blue-600 text-white shadow-blue-200 shadow-lg scale-[1.02]" : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <cat.icon className="w-4 h-4" />
                {cat.name}
              </button>
            ))}
          </div>

          {/* Report List */}
          <div className="space-y-1">
            <p className="px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Detailed Reports</p>
            {Object.entries(filteredReports).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setActiveReport(key)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 text-left",
                  activeReport === key ? "bg-gray-900 text-white shadow-lg" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <cfg.icon className={cn("w-4 h-4", activeReport === key ? "text-white" : "text-gray-400")} />
                <span className="truncate flex-1">{cfg.name}</span>
                {activeReport === key && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        {config && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* Report Title Card */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative bg-white p-8 rounded-3xl border border-gray-100 shadow-xl">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div className={cn(
                      "inline-flex p-3 rounded-2xl shadow-inner",
                      config.color === 'blue' ? "bg-blue-50 text-blue-600" :
                        config.color === 'orange' ? "bg-orange-50 text-orange-600" :
                          config.color === 'green' ? "bg-green-50 text-green-600" :
                            config.color === 'purple' ? "bg-purple-50 text-purple-600" :
                              "bg-indigo-50 text-indigo-600"
                    )}>
                      <config.icon className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{config.name}</h2>
                      <p className="text-gray-500 mt-1 max-w-xl leading-relaxed">{config.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-md space-y-6">
                  <div className="flex items-center gap-2 border-b border-gray-50 pb-4">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-gray-900">Custom Parameters</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {config.filters.map(f => (
                      <div key={f} className="space-y-2">
                        <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{f.replace(/_/g, ' ')}</Label>
                        {renderFilterInput(f)}
                      </div>
                    ))}
                    {config.filters.length === 0 && (
                      <p className="text-sm text-gray-400 italic py-4 col-span-2">
                        {activeReport === 'monthly_inventory_sales'
                          ? 'This report has a dedicated interactive tool. Click "Open Report Tool" below to access it.'
                          : 'This report has no required parameters.'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Sidebar */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-md space-y-4">
                  <div className="flex items-center gap-2 border-b border-gray-50 pb-4">
                    <Download className="w-5 h-5 text-green-600" />
                    <h3 className="font-bold text-gray-900">Export Options</h3>
                  </div>
                  <Button
                    variant="default"
                    className="w-full h-12 bg-gray-900 hover:bg-black text-white rounded-xl shadow-lg transition-all"
                    onClick={() => downloadReport(activeReport, 'pdf')}
                    disabled={!!loading}
                  >
                    {loading === `${activeReport}-pdf` ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
                    {activeReport === 'monthly_inventory_sales' ? 'Open Dedicated Report Tool' : 'Generate Professional PDF'}
                  </Button>
                  {activeReport !== 'monthly_inventory_sales' && (
                    <Button
                      variant="outline"
                      className="w-full h-12 border-2 border-gray-100 hover:bg-gray-50 rounded-xl transition-all"
                      onClick={() => downloadReport(activeReport, 'excel')}
                      disabled={!!loading}
                    >
                      {loading === `${activeReport}-excel` ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <TrendingUp className="w-4 h-4 mr-2" />}
                      Download Data Sheet
                    </Button>
                  )}
                </div>

                <div className="bg-blue-600 p-6 rounded-3xl shadow-xl shadow-blue-200 text-white space-y-3">
                  <AlertCircle className="w-8 h-8 opacity-50" />
                  <h4 className="font-bold">System Note</h4>
                  <p className="text-xs text-blue-100 leading-normal">
                    This report is generated directly from the live production database. All currency values are in PKR unless otherwise stated.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Reports;