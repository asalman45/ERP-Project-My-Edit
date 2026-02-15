import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Download, Calendar, Filter, TrendingUp, AlertTriangle, Package, Factory } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatsCard } from "@/components/ui/stats-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { reportsApi, materialApi, locationApi, productApi } from "@/services/api";
import { WastageReport, ScrapReport, InventoryReport, ProductionReport, CostAnalysisReport } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useEnhancedReportsApi } from "./api";

const EnhancedReports: React.FC = () => {
  const [activeReport, setActiveReport] = useState("wastage");
  const [filters, setFilters] = useState({
    start_date: "",
    end_date: "",
    material_id: "all",
    location_id: "all",
    product_id: "all",
    status: "all",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // Use the enhanced reports API hook
  const { 
    materials, 
    locations, 
    products,
    exportReport 
  } = useEnhancedReportsApi();

  // Fetch wastage report
  const { data: wastageReport, isLoading: wastageLoading, error: wastageError } = useQuery({
    queryKey: ["wastage-report", filters],
    queryFn: () => reportsApi.getWastageReport(filters),
    enabled: activeReport === "wastage",
  });

  // Fetch scrap report
  const { data: scrapReport, isLoading: scrapLoading, error: scrapError } = useQuery({
    queryKey: ["scrap-report", filters],
    queryFn: () => reportsApi.getScrapReport(filters),
    enabled: activeReport === "scrap",
  });

  // Fetch inventory report
  const { data: inventoryReport, isLoading: inventoryLoading, error: inventoryError } = useQuery({
    queryKey: ["inventory-report", filters],
    queryFn: () => reportsApi.getInventoryReport(filters),
    enabled: activeReport === "inventory",
  });

  // Fetch production report
  const { data: productionReport, isLoading: productionLoading, error: productionError } = useQuery({
    queryKey: ["production-report", filters],
    queryFn: () => reportsApi.getProductionReport(filters),
    enabled: activeReport === "production",
  });

  // Fetch cost analysis report
  const { data: costAnalysisReport, isLoading: costAnalysisLoading, error: costAnalysisError } = useQuery({
    queryKey: ["cost-analysis-report", filters],
    queryFn: () => reportsApi.getCostAnalysisReport(filters),
    enabled: activeReport === "cost-analysis",
  });

  const handleExport = (reportType: string) => {
    exportReport(reportType, getCurrentReport());
  };

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    setFilters(prev => ({ ...prev, start_date: startDate, end_date: endDate }));
  };

  const getCurrentReport = () => {
    switch (activeReport) {
      case "wastage": return wastageReport;
      case "scrap": return scrapReport;
      case "inventory": return inventoryReport;
      case "production": return productionReport;
      case "cost-analysis": return costAnalysisReport;
      default: return null;
    }
  };

  const getCurrentLoading = () => {
    switch (activeReport) {
      case "wastage": return wastageLoading;
      case "scrap": return scrapLoading;
      case "inventory": return inventoryLoading;
      case "production": return productionLoading;
      case "cost-analysis": return costAnalysisLoading;
      default: return false;
    }
  };

  const getCurrentError = () => {
    switch (activeReport) {
      case "wastage": return wastageError;
      case "scrap": return scrapError;
      case "inventory": return inventoryError;
      case "production": return productionError;
      case "cost-analysis": return costAnalysisError;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Enhanced Reports</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive reports for wastage, scrap, inventory, and production analysis
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => handleExport(activeReport)}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Report Filters
          </CardTitle>
          <CardDescription>
            Select date range and filters for your report
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleDateRangeChange(e.target.value, filters.end_date)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleDateRangeChange(filters.start_date, e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Material</label>
              <Select value={filters.material_id} onValueChange={(value) => setFilters(prev => ({ ...prev, material_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Materials</SelectItem>
                {materials.map((material: any) => (
                  <SelectItem key={material.material_id} value={material.material_id}>
                    {material.name} ({material.material_code})
                  </SelectItem>
                ))}
              </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Location</label>
              <Select value={filters.location_id} onValueChange={(value) => setFilters(prev => ({ ...prev, location_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((location: any) => (
                  <SelectItem key={location.location_id} value={location.location_id}>
                    {location.name} ({location.code})
                  </SelectItem>
                ))}
              </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Tabs */}
      <Tabs value={activeReport} onValueChange={setActiveReport} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="wastage">Wastage Report</TabsTrigger>
          <TabsTrigger value="scrap">Scrap Report</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Report</TabsTrigger>
          <TabsTrigger value="production">Production Report</TabsTrigger>
          <TabsTrigger value="cost-analysis">Cost Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="wastage">
          <WastageReportContent 
            report={wastageReport} 
            isLoading={wastageLoading} 
            error={wastageError}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </TabsContent>

        <TabsContent value="scrap">
          <ScrapReportContent 
            report={scrapReport} 
            isLoading={scrapLoading} 
            error={scrapError}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </TabsContent>

        <TabsContent value="inventory">
          <InventoryReportContent 
            report={inventoryReport} 
            isLoading={inventoryLoading} 
            error={inventoryError}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </TabsContent>

        <TabsContent value="production">
          <ProductionReportContent 
            report={productionReport} 
            isLoading={productionLoading} 
            error={productionError}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </TabsContent>

        <TabsContent value="cost-analysis">
          <CostAnalysisReportContent 
            report={costAnalysisReport} 
            isLoading={costAnalysisLoading} 
            error={costAnalysisError}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Wastage Report Content Component
interface WastageReportContentProps {
  report: WastageReport | undefined;
  isLoading: boolean;
  error: any;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const WastageReportContent: React.FC<WastageReportContentProps> = ({
  report,
  isLoading,
  error,
  searchTerm,
  onSearchChange,
}) => {
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Failed to load wastage report</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p>Loading wastage report...</p>
      </div>
    );
  }

  if (!report) return null;

  const filteredDetails = report.details.filter(item =>
    item.material_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.work_order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column<any>[] = [
    { key: "material_name", header: "Material", sortable: true },
    { key: "quantity", header: "Quantity", sortable: true, render: (value: number) => value.toFixed(2) },
    { key: "uom_code", header: "UOM", sortable: true },
    { key: "work_order_number", header: "Work Order", sortable: true },
    { key: "reason", header: "Reason", sortable: true },
    { key: "created_at", header: "Date", sortable: true, render: (value: string) => new Date(value).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Total Records"
          value={report.total_records.toString()}
          icon={AlertTriangle}
        />
        <StatsCard
          title="Materials Affected"
          value={report.summary.length.toString()}
          icon={Package}
        />
        <StatsCard
          title="Total Wastage"
          value={report.summary.reduce((sum, item) => sum + item.total_wastage, 0).toFixed(2)}
          icon={TrendingUp}
        />
      </div>

      {/* Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Wastage Summary by Material</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {report.summary.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">{item.material_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.work_order_count} work orders affected
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">{item.total_wastage.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">
                    Avg: {item.avg_wastage_per_incident.toFixed(2)} per incident
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Wastage Details</CardTitle>
          <Input
            placeholder="Search wastage details..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredDetails}
            columns={columns}
            searchPlaceholder="Search wastage details..."
          />
        </CardContent>
      </Card>
    </div>
  );
};

// Scrap Report Content Component
interface ScrapReportContentProps {
  report: ScrapReport | undefined;
  isLoading: boolean;
  error: any;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const ScrapReportContent: React.FC<ScrapReportContentProps> = ({
  report,
  isLoading,
  error,
  searchTerm,
  onSearchChange,
}) => {
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Failed to load scrap report</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p>Loading scrap report...</p>
      </div>
    );
  }

  if (!report) return null;

  const filteredDetails = report.details.filter(item =>
    item.material_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column<any>[] = [
    { key: "material_name", header: "Material", sortable: true },
    { key: "weight_kg", header: "Weight (kg)", sortable: true, render: (value: number) => value.toFixed(2) },
    { key: "location_name", header: "Location", sortable: true },
    { key: "reference", header: "Reference", sortable: true },
    { 
      key: "status", 
      header: "Status", 
      render: (value: string) => (
        <Badge variant={
          value === "AVAILABLE" ? "default" :
          value === "CONSUMED" ? "secondary" :
          value === "SOLD" ? "outline" : "destructive"
        }>
          {value}
        </Badge>
      )
    },
    { key: "created_at", header: "Created", sortable: true, render: (value: string) => new Date(value).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Total Items"
          value={report.total_records.toString()}
          icon={Package}
        />
        <StatsCard
          title="Total Weight"
          value={report.summary.reduce((sum, item) => sum + item.total_weight, 0).toFixed(2) + " kg"}
          icon={Package}
        />
        <StatsCard
          title="Available Weight"
          value={report.summary.find(s => s.status === "AVAILABLE")?.total_weight.toFixed(2) + " kg" || "0.00 kg"}
          icon={Package}
        />
        <StatsCard
          title="Consumed Weight"
          value={report.summary.find(s => s.status === "CONSUMED")?.total_weight.toFixed(2) + " kg" || "0.00 kg"}
          icon={Package}
        />
      </div>

      {/* Summary by Status */}
      <Card>
        <CardHeader>
          <CardTitle>Scrap Summary by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {report.summary.map((item, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{item.status}</p>
                    <p className="text-sm text-muted-foreground">{item.count} items</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{item.total_weight.toFixed(2)} kg</p>
                    <p className="text-sm text-muted-foreground">
                      Avg: {item.avg_weight.toFixed(2)} kg
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Scrap Details</CardTitle>
          <Input
            placeholder="Search scrap details..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredDetails}
            columns={columns}
            searchPlaceholder="Search scrap details..."
          />
        </CardContent>
      </Card>
    </div>
  );
};

// Inventory Report Content Component
interface InventoryReportContentProps {
  report: InventoryReport | undefined;
  isLoading: boolean;
  error: any;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const InventoryReportContent: React.FC<InventoryReportContentProps> = ({
  report,
  isLoading,
  error,
  searchTerm,
  onSearchChange,
}) => {
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Failed to load inventory report</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p>Loading inventory report...</p>
      </div>
    );
  }

  if (!report) return null;

  const filteredDetails = report.details.filter(item =>
    item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.material_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column<any>[] = [
    { key: "product_name", header: "Item", sortable: true, render: (value: string, item: any) => value || item.material_name || "Unknown" },
    { key: "quantity", header: "Quantity", sortable: true, render: (value: number) => value.toFixed(2) },
    { key: "uom_code", header: "UOM", sortable: true },
    { key: "location_name", header: "Location", sortable: true },
    { 
      key: "is_low_stock", 
      header: "Status", 
      render: (value: boolean) => (
        <Badge variant={value ? "destructive" : "default"}>
          {value ? "Low Stock" : "Normal"}
        </Badge>
      )
    },
    { key: "reorder_level", header: "Reorder Level", sortable: true, render: (value: number) => value?.toFixed(2) || "N/A" },
    { key: "last_updated", header: "Last Updated", sortable: true, render: (value: string) => new Date(value).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Total Items"
          value={report.summary.total_items.toString()}
          icon={Package}
        />
        <StatsCard
          title="Low Stock Items"
          value={report.summary.low_stock_items.toString()}
          icon={AlertTriangle}
        />
        <StatsCard
          title="Low Stock %"
          value={report.summary.low_stock_percentage.toFixed(1) + "%"}
          icon={AlertTriangle}
        />
        <StatsCard
          title="Total Value"
          value={`₹${report.summary.estimated_total_value.toLocaleString()}`}
          icon={TrendingUp}
        />
      </div>

      {/* Low Stock Alert */}
      {report.summary.low_stock_items > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Low Stock Alert</CardTitle>
            <CardDescription className="text-red-600">
              {report.summary.low_stock_items} items are below reorder level
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Details</CardTitle>
          <Input
            placeholder="Search inventory details..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredDetails}
            columns={columns}
            searchPlaceholder="Search inventory details..."
          />
        </CardContent>
      </Card>
    </div>
  );
};

// Production Report Content Component
interface ProductionReportContentProps {
  report: ProductionReport | undefined;
  isLoading: boolean;
  error: any;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const ProductionReportContent: React.FC<ProductionReportContentProps> = ({
  report,
  isLoading,
  error,
  searchTerm,
  onSearchChange,
}) => {
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Failed to load production report</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p>Loading production report...</p>
      </div>
    );
  }

  if (!report) return null;

  const filteredDetails = report.details.filter(item =>
    item.po_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column<any>[] = [
    { key: "po_no", header: "Order No", sortable: true },
    { key: "product_name", header: "Product", sortable: true },
    { key: "qty_ordered", header: "Ordered", sortable: true },
    { key: "qty_completed", header: "Completed", sortable: true },
    { 
      key: "status", 
      header: "Status", 
      render: (value: string) => (
        <Badge variant={
          value === "COMPLETED" ? "default" :
          value === "IN_PROGRESS" ? "secondary" :
          value === "PLANNED" ? "outline" : "destructive"
        }>
          {value.replace("_", " ")}
        </Badge>
      )
    },
    { key: "created_at", header: "Created", sortable: true, render: (value: string) => new Date(value).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Total Orders"
          value={report.total_records.toString()}
          icon={Factory}
        />
        <StatsCard
          title="Completed Orders"
          value={report.summary.find(s => s.status === "COMPLETED")?.count.toString() || "0"}
          icon={Factory}
        />
        <StatsCard
          title="In Progress Orders"
          value={report.summary.find(s => s.status === "IN_PROGRESS")?.count.toString() || "0"}
          icon={Factory}
        />
        <StatsCard
          title="Overall Completion"
          value={report.summary.reduce((sum, item) => sum + item.completion_rate, 0) / report.summary.length + "%"}
          icon={TrendingUp}
        />
      </div>

      {/* Summary by Status */}
      <Card>
        <CardHeader>
          <CardTitle>Production Summary by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {report.summary.map((item, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{item.status}</p>
                    <p className="text-sm text-muted-foreground">{item.count} orders</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{item.completion_rate.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">
                      {item.total_completed}/{item.total_ordered}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Production Details</CardTitle>
          <Input
            placeholder="Search production details..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredDetails}
            columns={columns}
            searchPlaceholder="Search production details..."
          />
        </CardContent>
      </Card>
    </div>
  );
};

// Cost Analysis Report Content Component
interface CostAnalysisReportContentProps {
  report: CostAnalysisReport | undefined;
  isLoading: boolean;
  error: any;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const CostAnalysisReportContent: React.FC<CostAnalysisReportContentProps> = ({
  report,
  isLoading,
  error,
  searchTerm,
  onSearchChange,
}) => {
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Failed to load cost analysis report</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p>Loading cost analysis report...</p>
      </div>
    );
  }

  if (!report) return null;

  const filteredSummary = report.summary.filter(item =>
    item.material_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Total Material Cost"
          value={`₹${report.total_material_cost.toLocaleString()}`}
          icon={TrendingUp}
        />
        <StatsCard
          title="Total Wastage Cost"
          value={`₹${report.total_wastage_cost.toLocaleString()}`}
          icon={AlertTriangle}
        />
        <StatsCard
          title="Overall Efficiency"
          value={report.overall_efficiency.toFixed(1) + "%"}
          icon={TrendingUp}
        />
        <StatsCard
          title="Materials Analyzed"
          value={report.summary.length.toString()}
          icon={Package}
        />
      </div>

      {/* Cost Analysis Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Analysis by Material</CardTitle>
          <Input
            placeholder="Search materials..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredSummary.map((item, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{item.material_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.reuse_count} reuse instances
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Weight Reused</p>
                        <p className="font-semibold">{item.total_weight_reused.toFixed(2)} kg</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Cost Savings</p>
                        <p className="font-semibold">₹{item.estimated_cost_savings.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Efficiency</p>
                        <p className="font-semibold">{item.efficiency_percentage.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Wastage %</p>
                        <p className="font-semibold">{item.wastage_percentage.toFixed(1)}%</p>
                      </div>
                    </div>
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

export default EnhancedReports;
