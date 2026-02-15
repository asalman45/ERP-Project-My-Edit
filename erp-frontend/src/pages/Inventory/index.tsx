import React, { useState, useEffect } from "react";
import { Package, TrendingUp, AlertTriangle, Plus, RefreshCw, Eye, BarChart3, PieChart, TrendingDown, Warehouse, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatsCard } from "@/components/ui/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MaterialIssueModal } from "@/components/modals/MaterialIssueModal";
import { MaterialReceiveModal } from "@/components/modals/MaterialReceiveModal";
import { InventoryItem as LegacyInventoryItem } from "@/types";
import GenericExportModal from "@/components/common/GenericExportModal";
import { useToast } from "@/hooks/use-toast";
import { inventoryApi, materialApi, locationApi } from "@/services/api";

interface InventoryItem {
  id: string;
  material_id: string;
  material_code: string;
  material_name: string;
  category: string;
  location_id: string;
  location_name: string;
  location_type: string;
  quantity: number;
  uom_code: string;
  min_stock?: number;
  max_stock?: number;
  unit_cost?: number;
  total_value?: number;
  status: 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'CRITICAL';
  last_updated: string;
}

interface InventoryStats {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  criticalStockItems: number;
  totalQuantity: number;
  locationCount: number;
  categoryCount: number;
}

interface LocationStats {
  location_id: string;
  location_name: string;
  location_type: string;
  total_items: number;
  total_quantity: number;
  total_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
}

interface CategoryStats {
  category: string;
  total_items: number;
  total_quantity: number;
  total_value: number;
  avg_unit_cost: number;
}

const Inventory: React.FC = () => {
  const { toast } = useToast();
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LegacyInventoryItem | null>(null);
  
  // State for inventory data
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    totalItems: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    criticalStockItems: 0,
    totalQuantity: 0,
    locationCount: 0,
    categoryCount: 0,
  });
  const [locationStats, setLocationStats] = useState<LocationStats[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load inventory data
  const loadInventoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load current stock data - ONLY RAW MATERIALS (not finished goods/products)
      const stockData = await inventoryApi.getAllCurrentStock({
        limit: 1000,
        offset: 0,
        item_type: 'material' // Filter to only show raw materials
      });
      
      // Filter out any product inventory that might have slipped through
      const materialOnlyData = stockData.filter((item: any) => 
        (item.material_id || item.material) && !(item.product_id || item.product)
      );
      
      // Transform the data to match our interface - ONLY MATERIALS
      const transformedItems: InventoryItem[] = materialOnlyData.map((item: any) => ({
        id: item.inventory_id || item.id,
        material_id: item.material_id,
        material_code: item.material?.material_code || item.material_code || 'N/A',
        material_name: item.material?.name || item.material_name || 'Unknown Material',
        category: item.material?.category || item.category || 'Unknown',
        location_id: item.location_id,
        location_name: item.location?.name || item.location_name || 'Unknown Location',
        location_type: item.location?.type || item.location_type || 'Unknown',
        quantity: item.quantity || 0,
        uom_code: item.uom?.code || item.uom_code || 'EA',
        min_stock: item.material?.min_stock || item.min_stock,
        max_stock: item.material?.max_stock || item.max_stock,
        unit_cost: item.unit_cost || 0,
        total_value: (item.quantity || 0) * (item.unit_cost || 0),
        status: calculateStatus(item.quantity || 0, item.material?.min_stock || item.min_stock),
        last_updated: item.updated_at || item.last_updated || new Date().toISOString(),
      }));

      setInventoryItems(transformedItems);
      
      // Calculate stats
      const totalItems = transformedItems.length;
      const totalValue = transformedItems.reduce((sum, item) => sum + (item.total_value || 0), 0);
      const lowStockItems = transformedItems.filter(item => item.status === 'LOW_STOCK').length;
      const outOfStockItems = transformedItems.filter(item => item.status === 'OUT_OF_STOCK').length;
      const criticalStockItems = transformedItems.filter(item => item.status === 'CRITICAL').length;
      const totalQuantity = transformedItems.reduce((sum, item) => sum + item.quantity, 0);
      
      // Get unique locations and categories
      const uniqueLocations = [...new Set(transformedItems.map(item => item.location_id))];
      const uniqueCategories = [...new Set(transformedItems.map(item => item.category))];
      
      setStats({
        totalItems,
        totalValue,
        lowStockItems,
        outOfStockItems,
        criticalStockItems,
        totalQuantity,
        locationCount: uniqueLocations.length,
        categoryCount: uniqueCategories.length,
      });

      // Calculate location stats
      const locationStatsMap = new Map<string, LocationStats>();
      transformedItems.forEach(item => {
        if (!locationStatsMap.has(item.location_id)) {
          locationStatsMap.set(item.location_id, {
            location_id: item.location_id,
            location_name: item.location_name,
            location_type: item.location_type,
            total_items: 0,
            total_quantity: 0,
            total_value: 0,
            low_stock_count: 0,
            out_of_stock_count: 0,
          });
        }
        
        const locationStat = locationStatsMap.get(item.location_id)!;
        locationStat.total_items += 1;
        locationStat.total_quantity += item.quantity;
        locationStat.total_value += item.total_value || 0;
        
        if (item.status === 'LOW_STOCK') locationStat.low_stock_count += 1;
        if (item.status === 'OUT_OF_STOCK') locationStat.out_of_stock_count += 1;
      });
      
      setLocationStats(Array.from(locationStatsMap.values()));

      // Calculate category stats
      const categoryStatsMap = new Map<string, CategoryStats>();
      transformedItems.forEach(item => {
        if (!categoryStatsMap.has(item.category)) {
          categoryStatsMap.set(item.category, {
            category: item.category,
            total_items: 0,
            total_quantity: 0,
            total_value: 0,
            avg_unit_cost: 0,
          });
        }
        
        const categoryStat = categoryStatsMap.get(item.category)!;
        categoryStat.total_items += 1;
        categoryStat.total_quantity += item.quantity;
        categoryStat.total_value += item.total_value || 0;
        categoryStat.avg_unit_cost = categoryStat.total_value / categoryStat.total_quantity || 0;
      });
      
      setCategoryStats(Array.from(categoryStatsMap.values()));

    } catch (error: any) {
      console.error("Error loading inventory data:", error);
      setError(error?.message || "Failed to load inventory data");
      
      toast({
        title: "Error",
        description: "Failed to load inventory data. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate inventory status
  const calculateStatus = (quantity: number, minStock?: number): 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'CRITICAL' => {
    if (quantity === 0) return 'OUT_OF_STOCK';
    if (quantity <= (minStock || 0) * 0.5) return 'CRITICAL';
    if (quantity <= (minStock || 0)) return 'LOW_STOCK';
    return 'AVAILABLE';
  };

  // Load data on component mount
  useEffect(() => {
    loadInventoryData();
  }, []);

  const columns: Column<InventoryItem>[] = [
    { 
      key: "material_code", 
      header: "Material Code", 
      sortable: true,
      render: (value: string, item: InventoryItem) => (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-gray-500" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    { 
      key: "material_name", 
      header: "Material Name", 
      sortable: true,
      render: (value: string, item: InventoryItem) => (
        <div>
          <p className="font-medium">{value}</p>
          <p className="text-sm text-gray-500">{item.category}</p>
        </div>
      )
    },
    { 
      key: "location_name", 
      header: "Location", 
      sortable: true,
      render: (value: string, item: InventoryItem) => (
        <div>
          <p className="font-medium">{value}</p>
          <Badge variant="outline" className="text-xs">{item.location_type}</Badge>
        </div>
      )
    },
    { 
      key: "quantity", 
      header: "Quantity", 
      sortable: true,
      render: (value: number, item: InventoryItem) => (
        <div className="text-right">
          <p className="font-medium">{value.toLocaleString()}</p>
          <p className="text-sm text-gray-500">{item.uom_code}</p>
        </div>
      )
    },
    { 
      key: "total_value", 
      header: "Value", 
      sortable: true,
      render: (value: number) => (
        <div className="text-right">
          <p className="font-medium">RS {value.toLocaleString()}</p>
        </div>
      )
    },
    {
      key: "status",
      header: "Status",
      render: (value: string) => (
        <Badge 
          variant={
            value === "AVAILABLE" ? "default" :
            value === "LOW_STOCK" ? "secondary" :
            value === "CRITICAL" ? "destructive" :
            "destructive"
          }
          className="capitalize"
        >
          {value.replace("_", " ")}
        </Badge>
      ),
    },
    {
      key: "last_updated",
      header: "Last Updated",
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-gray-500">
          {new Date(value).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const convertToLegacyItem = (item: InventoryItem): LegacyInventoryItem => ({
    id: item.id,
    productId: item.material_id,
    productName: item.material_name,
    productCode: item.material_code,
    batchNo: 'N/A', // Not available in current data
    location: item.location_name,
    quantityOnHand: item.quantity,
    reservedQuantity: 0, // Not available in current data
    availableQuantity: item.quantity,
    uomId: item.uom_code,
    uomCode: item.uom_code,
    status: item.status === 'CRITICAL' ? 'LOW_STOCK' : item.status as 'AVAILABLE' | 'RESERVED' | 'LOW_STOCK' | 'OUT_OF_STOCK',
    lastUpdated: item.last_updated,
  });

  const handleIssue = (item: InventoryItem) => {
    setSelectedItem(convertToLegacyItem(item));
    setShowIssueModal(true);
  };

  const handleReceive = (item: InventoryItem) => {
    setSelectedItem(convertToLegacyItem(item));
    setShowReceiveModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium">Loading inventory data...</p>
          <p className="text-sm text-gray-500">Please wait while we fetch the latest information</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-4"
              onClick={loadInventoryData}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Raw Material Inventory</h1>
          <p className="text-muted-foreground mt-2">
            Monitor raw material stock levels and manage material movements
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadInventoryData}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowExportModal(true)} 
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Items"
          value={stats.totalItems.toLocaleString()}
          icon={Package}
        />
        <StatsCard
          title="Total Value"
          value={`RS ${stats.totalValue.toLocaleString()}`}
          icon={TrendingUp}
        />
        <StatsCard
          title="Low Stock"
          value={stats.lowStockItems.toString()}
          icon={AlertTriangle}
          color="warning"
        />
        <StatsCard
          title="Out of Stock"
          value={stats.outOfStockItems.toString()}
          icon={TrendingDown}
          color="destructive"
        />
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <DataTable
            data={inventoryItems}
            columns={columns}
            searchPlaceholder="Search by material, location, or category..."
            onEdit={handleReceive}
            onDelete={handleIssue}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="locations" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locationStats.map((location) => (
              <Card key={location.location_id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Warehouse className="h-5 w-5" />
                    {location.location_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Items</p>
                      <p className="text-2xl font-bold">{location.total_items}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Quantity</p>
                      <p className="text-2xl font-bold">{location.total_quantity.toLocaleString()}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Value</p>
                    <p className="text-xl font-bold">RS {location.total_value.toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    {location.low_stock_count > 0 && (
                      <Badge variant="secondary">Low Stock: {location.low_stock_count}</Badge>
                    )}
                    {location.out_of_stock_count > 0 && (
                      <Badge variant="destructive">Out of Stock: {location.out_of_stock_count}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryStats.map((category) => (
              <Card key={category.category}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Items</p>
                      <p className="text-2xl font-bold">{category.total_items}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Quantity</p>
                      <p className="text-2xl font-bold">{category.total_quantity.toLocaleString()}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Value</p>
                    <p className="text-xl font-bold">RS {category.total_value.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Avg Unit Cost</p>
                    <p className="text-lg font-medium">RS {category.avg_unit_cost.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          {/* Low Stock Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Low Stock Items ({inventoryItems.filter(item => item.status === 'LOW_STOCK').length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {inventoryItems.filter(item => item.status === 'LOW_STOCK').length > 0 ? (
                <DataTable
                  data={inventoryItems.filter(item => item.status === 'LOW_STOCK')}
                  columns={columns}
                  searchPlaceholder="Search low stock items..."
                  loading={loading}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No low stock items</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Out of Stock Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Out of Stock Items ({inventoryItems.filter(item => item.status === 'OUT_OF_STOCK').length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {inventoryItems.filter(item => item.status === 'OUT_OF_STOCK').length > 0 ? (
                <DataTable
                  data={inventoryItems.filter(item => item.status === 'OUT_OF_STOCK')}
                  columns={columns}
                  searchPlaceholder="Search out of stock items..."
                  loading={loading}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No out of stock items</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showIssueModal && (
        <MaterialIssueModal
          isOpen={showIssueModal}
          onClose={() => {
            setShowIssueModal(false);
            setSelectedItem(null);
          }}
          selectedItem={selectedItem}
        />
      )}

      {showReceiveModal && (
        <MaterialReceiveModal
          isOpen={showReceiveModal}
          onClose={() => {
            setShowReceiveModal(false);
            setSelectedItem(null);
          }}
          selectedItem={selectedItem}
        />
      )}



      {showExportModal && (
        <GenericExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onSuccess={() => {
            setShowExportModal(false);
          }}
          title="Export Inventory"
          exportFunction={inventoryApi.exportInventory}
          filename="inventory"
          availableFormats={['pdf', 'csv', 'excel']}
        />
      )}
    </div>
  );
};

export default Inventory;