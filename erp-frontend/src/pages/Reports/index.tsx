import React, { useState } from 'react';
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
  ClipboardList
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { reportsApi } from '@/services/api';
import { useNavigate } from 'react-router-dom';

interface ReportFilters {
  start_date?: string;
  end_date?: string;
  product_id?: string;
  material_id?: string;
  location_id?: string;
  status?: string;
  low_stock_only?: boolean;
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
  const [activeTab, setActiveTab] = useState('production');

  const reportConfigs: Record<string, ReportConfig> = {
    production: {
      name: 'Production Report',
      description: 'Comprehensive production analysis including work orders, efficiency metrics, and cost analysis',
      icon: Factory,
      color: 'blue',
      filters: ['start_date', 'end_date', 'product_id', 'status'],
      endpoint: '/production'
    },
    scrap: {
      name: 'Scrap Management Report',
      description: 'Detailed scrap tracking, utilization analysis, and cost impact assessment',
      icon: Package,
      color: 'orange',
      filters: ['start_date', 'end_date', 'material_id', 'location_id', 'status'],
      endpoint: '/scrap'
    },
    inventory: {
      name: 'Inventory Report',
      description: 'Complete inventory overview with stock levels, valuations, and reorder alerts',
      icon: BarChart3,
      color: 'green',
      filters: ['product_id', 'material_id', 'location_id', 'low_stock_only'],
      endpoint: '/inventory'
    },
    cost_analysis: {
      name: 'Cost Analysis Report',
      description: 'Financial analysis of inventory transactions, cost trends, and budget impact',
      icon: DollarSign,
      color: 'purple',
      filters: ['start_date', 'end_date', 'product_id', 'material_id'],
      endpoint: '/cost-analysis'
    },
    monthly_inventory_sales: {
      name: 'Monthly Inventory & Sales Report',
      description: 'Comprehensive monthly inventory and sales report with manual opening stock input and automatic calculations',
      icon: ClipboardList,
      color: 'indigo',
      filters: ['month', 'year', 'model_id'],
      endpoint: '/monthly-inventory-sales'
    }
  };

  const handleFilterChange = (key: string, value: string | boolean) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
  };

  const downloadReport = async (reportType: string, format: 'pdf' | 'excel') => {
    try {
      setLoading(`${reportType}-${format}`);
      
      const config = reportConfigs[reportType];
      if (!config) {
        throw new Error('Invalid report type');
      }

      // Special handling for monthly inventory sales report
      if (reportType === 'monthly_inventory_sales') {
        navigate('/reports/monthly-inventory-sales');
        return;
      }

      // Build query parameters
      const params: any = {
        format: format
      };
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params[key] = value.toString();
        }
      });

      let blob: Blob;
      
      // Use the appropriate API function based on report type
      switch (reportType) {
        case 'production':
          blob = await reportsApi.generateProductionReport(params);
          break;
        case 'scrap':
          blob = await reportsApi.generateScrapReport(params);
          break;
        case 'inventory':
          blob = await reportsApi.generateInventoryReport(params);
          break;
        case 'cost-analysis':
          blob = await reportsApi.generateCostAnalysisReport(params);
          break;
        default:
          throw new Error(`Unknown report type: ${reportType}`);
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      toast({
        title: 'Report Downloaded',
        description: `${config.name} has been downloaded successfully as ${format.toUpperCase()}`,
      });

    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to download the report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const renderFilterInput = (filterKey: string) => {
    switch (filterKey) {
      case 'start_date':
      case 'end_date':
        return (
          <Input
            type="date"
            value={String(filters[filterKey as keyof ReportFilters] || '')}
            onChange={(e) => handleFilterChange(filterKey, e.target.value)}
            className="w-full"
          />
        );
      
      case 'status':
        const statusOptions = activeTab === 'production' 
          ? ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
          : ['AVAILABLE', 'CONSUMED', 'PROCESSED'];
        
        return (
          <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statusOptions.map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'low_stock_only':
        return (
          <Select 
            value={filters.low_stock_only ? 'true' : 'false'} 
            onValueChange={(value) => handleFilterChange('low_stock_only', value === 'true')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="false">All Items</SelectItem>
              <SelectItem value="true">Low Stock Only</SelectItem>
            </SelectContent>
          </Select>
        );
      
      default:
        return (
          <Input
            type="text"
            placeholder={`Enter ${filterKey.replace('_', ' ')}`}
            value={String(filters[filterKey as keyof ReportFilters] || '')}
            onChange={(e) => handleFilterChange(filterKey, e.target.value)}
            className="w-full"
          />
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-700">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 rounded-2xl blur-3xl"></div>
        <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-3">
                Business Reports
              </h1>
              <p className="text-gray-600 text-lg">
                Generate comprehensive reports for production, inventory, scrap management, and cost analysis
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl border border-white/30 shadow-lg overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="p-6 border-b border-white/20 bg-gradient-to-r from-white/40 to-white/20">
            <TabsList className="grid w-full grid-cols-5 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl p-1">
              {Object.entries(reportConfigs).map(([key, config]) => (
                <TabsTrigger 
                  key={key}
                  value={key}
                  className={cn(
                    "flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300 hover:scale-105",
                    config.color === "blue" && "data-[state=active]:text-blue-700",
                    config.color === "orange" && "data-[state=active]:text-orange-700",
                    config.color === "green" && "data-[state=active]:text-green-700",
                    config.color === "purple" && "data-[state=active]:text-purple-700",
                    config.color === "indigo" && "data-[state=active]:text-indigo-700"
                  )}
                >
                  <config.icon className="w-4 h-4" />
                  {config.name.split(' ')[0]}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {Object.entries(reportConfigs).map(([key, config]) => (
            <TabsContent key={key} value={key} className="p-6 space-y-6">
              {/* Report Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3 mb-2">
                    <div className={cn(
                      "w-10 h-10 bg-gradient-to-br rounded-xl flex items-center justify-center",
                      config.color === "blue" && "from-blue-500/20 to-blue-600/20",
                      config.color === "orange" && "from-orange-500/20 to-orange-600/20",
                      config.color === "green" && "from-green-500/20 to-green-600/20",
                      config.color === "purple" && "from-purple-500/20 to-purple-600/20",
                      config.color === "indigo" && "from-indigo-500/20 to-indigo-600/20"
                    )}>
                      <config.icon className={cn(
                        "w-6 h-6",
                        config.color === "blue" && "text-blue-600",
                        config.color === "orange" && "text-orange-600",
                        config.color === "green" && "text-green-600",
                        config.color === "purple" && "text-purple-600",
                        config.color === "indigo" && "text-indigo-600"
                      )} />
                    </div>
                    {config.name}
                  </h2>
                  <p className="text-gray-600">{config.description}</p>
                </div>
              </div>

              {/* Filters */}
              <Card className="bg-white/50 backdrop-blur-sm border-white/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Report Filters
                  </CardTitle>
                  <CardDescription>
                    Configure the data range and filters for your report
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {config.filters.map(filterKey => (
                      <div key={filterKey} className="space-y-2">
                        <Label htmlFor={filterKey} className="text-sm font-medium">
                          {filterKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Label>
                        {renderFilterInput(filterKey)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Download Options */}
              <Card className="bg-white/50 backdrop-blur-sm border-white/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    {key === 'monthly_inventory_sales' ? 'Access Report' : 'Download Report'}
                  </CardTitle>
                  <CardDescription>
                    {key === 'monthly_inventory_sales' 
                      ? 'Access the interactive monthly inventory and sales report with manual opening stock input'
                      : 'Choose your preferred format for the report'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {key === 'monthly_inventory_sales' ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-indigo-600 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-indigo-800 mb-1">Interactive Report Features</h4>
                            <ul className="text-sm text-indigo-700 space-y-1">
                              <li>• Manual opening stock input with real-time calculations</li>
                              <li>• Automatic total inventory and closing stock calculations</li>
                              <li>• PDF and Excel export with exact formatting</li>
                              <li>• Filter by month, year, and model</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => downloadReport(key, 'pdf')}
                        className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                      >
                        <ClipboardList className="w-4 h-4" />
                        Open Monthly Report
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-4">
                      <Button
                        onClick={() => downloadReport(key, 'pdf')}
                        disabled={loading === `${key}-pdf`}
                        className={cn(
                          "flex items-center gap-2 bg-gradient-to-r text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105",
                          config.color === "blue" && "from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
                          config.color === "orange" && "from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700",
                          config.color === "green" && "from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
                          config.color === "purple" && "from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
                          config.color === "indigo" && "from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700"
                        )}
                      >
                        {loading === `${key}-pdf` ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                        Download PDF
                      </Button>
                      
                      <Button
                        onClick={() => downloadReport(key, 'excel')}
                        disabled={loading === `${key}-excel`}
                        variant="outline"
                        className="flex items-center gap-2 bg-white/50 hover:bg-white/70 border-white/30 transition-all duration-300 hover:scale-105"
                      >
                        {loading === `${key}-excel` ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <TrendingUp className="w-4 h-4" />
                        )}
                        Download Excel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Report Preview Info */}
              <Card className="bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">Report Information</h3>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Reports include comprehensive data analysis and summaries</li>
                        <li>• PDF reports are formatted for printing and sharing</li>
                        <li>• Excel reports allow for further data manipulation</li>
                        <li>• All reports include timestamps and filter information</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default Reports;