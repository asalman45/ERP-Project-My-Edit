import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Eye, Edit, Trash2, TrendingUp, AlertTriangle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatsCard } from "@/components/ui/stats-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import LoadingSpinner from "@/components/LoadingSpinner";
import { stockAdjustmentApi } from "./api";
import { StockAdjustment, StockLevel, CreateStockAdjustmentRequest, StockAdjustmentFilters } from "./types";
import { useToast } from "@/hooks/use-toast";

// Import product, material, and location APIs from global services for now (we'll refactor this later)
import { productApi, materialApi, locationApi } from "@/services/api";

const StockAdjustmentPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLevelsModal, setShowLevelsModal] = useState(false);
  const [filters, setFilters] = useState<StockAdjustmentFilters>({
    product_id: "all",
    material_id: "all",
    location_id: "all",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch adjustment history with error handling
  const { data: adjustments = [], isLoading, error } = useQuery({
    queryKey: ["stock-adjustments", filters],
    queryFn: () => stockAdjustmentApi.getHistory({
      product_id: filters.product_id === "all" ? undefined : filters.product_id,
      material_id: filters.material_id === "all" ? undefined : filters.material_id,
      location_id: filters.location_id === "all" ? undefined : filters.location_id,
      limit: 100,
    }),
    retry: 2,
  });

  // Fetch stock levels with error handling
  const { data: stockLevels = [] } = useQuery({
    queryKey: ["stock-levels"],
    queryFn: () => stockAdjustmentApi.getLevels(),
    retry: 2,
  });

  // Fetch products with error handling
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => productApi.getAll(),
    retry: 2,
  });

  // Fetch materials with error handling
  const { data: materials = [] } = useQuery({
    queryKey: ["materials"],
    queryFn: () => materialApi.getAll(),
    retry: 2,
  });

  // Fetch locations with error handling
  const { data: locations = [] } = useQuery({
    queryKey: ["locations"],
    queryFn: () => locationApi.getAll(),
    retry: 2,
  });

  // Form data state for the create modal
  // Note: The actual form state is managed inside CreateAdjustmentModal component
  // This state is not used here, but kept for potential future use

  // Create adjustment mutation
  const createAdjustmentMutation = useMutation({
    mutationFn: stockAdjustmentApi.adjust,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-adjustments"] });
      queryClient.invalidateQueries({ queryKey: ["stock-levels"] });
      setShowCreateModal(false);
    },
  });

  // Filter adjustments based on search term
  const filteredAdjustments = adjustments.filter((adjustment: StockAdjustment) =>
    (adjustment.product_name || adjustment.material_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (adjustment.location_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    adjustment.adjustment_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (adjustment.reason || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate statistics
  const totalAdjustments = adjustments.length;
  const totalItemsAdjusted = new Set(adjustments.map(a => a.product_id || a.material_id)).size;
  const increaseAdjustments = adjustments.filter(a => a.adjustment_type === "INCREASE");
  const decreaseAdjustments = adjustments.filter(a => a.adjustment_type === "DECREASE");
  const totalIncreaseValue = increaseAdjustments.reduce((sum, adj) => sum + adj.quantity, 0);
  const totalDecreaseValue = decreaseAdjustments.reduce((sum, adj) => sum + adj.quantity, 0);

  const getAdjustmentTypeBadge = (type: string) => {
    const typeConfig = {
      INCREASE: { variant: "success" as const, label: "Increase" },
      DECREASE: { variant: "destructive" as const, label: "Decrease" },
      SET: { variant: "secondary" as const, label: "Set" },
    };
    
    const config = typeConfig[type as keyof typeof typeConfig] || { variant: "default" as const, label: type };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const columns: Column<StockAdjustment>[] = [
    {
      key: "item_name",
      header: "Item",
      render: (adjustment) => (
        <div className="font-medium">{adjustment.product_name || adjustment.material_name || "Unknown Item"}</div>
      ),
    },
    {
      key: "quantity",
      header: "Quantity",
      render: (adjustment) => (
        <div className="font-medium">{adjustment.quantity}</div>
      ),
    },
    {
      key: "adjustment_type",
      header: "Type",
      render: (adjustment) => getAdjustmentTypeBadge(adjustment.adjustment_type),
    },
    {
      key: "location_name",
      header: "Location",
      render: (adjustment) => (
        <div>{adjustment.location_name || "Unknown Location"}</div>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      render: (adjustment) => (
        <div className="text-sm text-muted-foreground max-w-xs truncate">
          {adjustment.reason}
        </div>
      ),
    },
    {
      key: "reference",
      header: "Reference",
      render: (adjustment) => (
        <div className="text-sm text-muted-foreground">
          {adjustment.reference || "-"}
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Date",
      render: (adjustment) => (
        <div className="text-sm text-muted-foreground">
          {new Date(adjustment.created_at).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (adjustment) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              toast({
                title: "Info",
                description: `Viewing details for adjustment ${adjustment.id}`,
              });
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const stockLevelColumns: Column<StockLevel>[] = [
    {
      key: "item_name",
      header: "Item",
      render: (level) => (
        <div className="font-medium">{level.product_name || level.material_name || "Unknown Item"}</div>
      ),
    },
    {
      key: "quantity",
      header: "Quantity",
      render: (level) => (
        <div className="font-medium">{level.quantity}</div>
      ),
    },
    {
      key: "uom_code",
      header: "UOM",
      render: (level) => (
        <div className="text-sm text-muted-foreground">{level.uom_code || "-"}</div>
      ),
    },
    {
      key: "location_name",
      header: "Location",
      render: (level) => (
        <div>{level.location_name || "Unknown Location"}</div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (level) => (
        <Badge variant={level.is_low_stock ? "destructive" : "success"}>
          {level.is_low_stock ? "Low Stock" : "Normal"}
        </Badge>
      ),
    },
    {
      key: "last_updated",
      header: "Last Updated",
      render: (level) => (
        <div className="text-sm text-muted-foreground">
          {new Date(level.last_updated).toLocaleDateString()}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Loading stock adjustments..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Stock Adjustment</h1>
          <p className="text-muted-foreground mt-2">
            Adjust stock levels and track inventory movements
          </p>
        </div>
        <div className="card-enterprise p-8 text-center">
          <h2 className="text-xl font-semibold mb-2 text-destructive">Error Loading Data</h2>
          <p className="text-muted-foreground mb-4">
            There was an error loading the stock adjustments. Please check your connection and try again.
          </p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Stock Adjustment</h1>
          <p className="text-muted-foreground mt-2">
            Adjust stock levels and track inventory movements
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowLevelsModal(true)}>
            <Package className="h-4 w-4 mr-2" />
            View Stock Levels
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adjust Stock
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Adjustments"
          value={totalAdjustments.toString()}
          icon={TrendingUp}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Items Adjusted"
          value={totalItemsAdjusted.toString()}
          icon={Package}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Total Increases"
          value={totalIncreaseValue.toString()}
          icon={TrendingUp}
          trend={{ value: 15, isPositive: true }}
        />
        <StatsCard
          title="Total Decreases"
          value={totalDecreaseValue.toString()}
          icon={AlertTriangle}
          trend={{ value: 5, isPositive: false }}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search adjustments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filters.product_id} onValueChange={(value) => setFilters(prev => ({ ...prev, product_id: value }))}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by product" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {products.map((product: any) => (
              <SelectItem key={product.product_id} value={product.product_id}>
                {product.part_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.material_id} onValueChange={(value) => setFilters(prev => ({ ...prev, material_id: value }))}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by material" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Materials</SelectItem>
            {materials.map((material: any) => (
              <SelectItem key={material.material_id} value={material.material_id}>
                {material.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.location_id} onValueChange={(value) => setFilters(prev => ({ ...prev, location_id: value }))}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map((location: any) => (
              <SelectItem key={location.location_id} value={location.location_id}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredAdjustments}
        columns={columns}
        isLoading={isLoading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* Create Adjustment Modal */}
      <CreateAdjustmentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={createAdjustmentMutation.mutate}
        isLoading={createAdjustmentMutation.isPending}
        products={products}
        materials={materials}
        locations={locations}
      />

      {/* Stock Levels Modal */}
      <StockLevelsModal
        isOpen={showLevelsModal}
        onClose={() => setShowLevelsModal(false)}
        stockLevels={stockLevels}
        columns={stockLevelColumns}
      />
    </div>
  );
};

// Create Adjustment Modal Component
interface CreateAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateStockAdjustmentRequest) => void;
  isLoading: boolean;
  products: any[];
  materials: any[];
  locations: any[];
}

const CreateAdjustmentModal: React.FC<CreateAdjustmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  products,
  materials,
  locations,
}) => {
  const [formData, setFormData] = useState({
    item_type: "material" as "product" | "material",
    product_id: "",
    material_id: "",
    quantity: "",
    adjustment_type: "INCREASE" as "INCREASE" | "DECREASE",
    reason: "",
    location_id: "main-store-001", // Default to MAIN_STORE
    reference: "",
  });

  // Auto-set location to MAIN_STORE when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        location_id: 'main-store-001' // Fixed location
      }));
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: CreateStockAdjustmentRequest = {
      quantity: parseFloat(formData.quantity),
      adjustment_type: formData.adjustment_type as any,
      reason: formData.reason,
      product_id: formData.item_type === "product" ? formData.product_id : undefined,
      material_id: formData.item_type === "material" ? formData.material_id : undefined,
      location_id: formData.location_id || undefined,
      reference: formData.reference || undefined,
    };
    onSubmit(submitData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="item_type">Item Type</Label>
            <Select value={formData.item_type} onValueChange={(value) => setFormData(prev => ({ ...prev, item_type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select item type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="material">Material</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="item_select">
              {formData.item_type === "product" ? "Product" : "Material"} *
            </Label>
            <Select 
              value={formData.item_type === "product" ? formData.product_id : formData.material_id} 
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                [formData.item_type === "product" ? "product_id" : "material_id"]: value 
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${formData.item_type}`} />
              </SelectTrigger>
              <SelectContent>
                {formData.item_type === "product" 
                  ? products.map((product: any) => (
                      <SelectItem key={product.product_id} value={product.product_id}>
                        {product.part_name}
                      </SelectItem>
                    ))
                  : materials.map((material: any) => (
                      <SelectItem key={material.material_id} value={material.material_id}>
                        {material.name}
                      </SelectItem>
                    ))
                }
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                required
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="adjustment_type">Adjustment Type *</Label>
              <Select value={formData.adjustment_type} onValueChange={(value) => setFormData(prev => ({ ...prev, adjustment_type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCREASE">Increase</SelectItem>
                  <SelectItem value="DECREASE">Decrease</SelectItem>
                  <SelectItem value="SET">Set</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Location is fixed to MAIN_STORE - no selection needed */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center gap-2 text-blue-700">
              <Package className="h-4 w-4" />
              <span className="text-sm font-medium">Location: Main Store (Fixed)</span>
            </div>
            <p className="text-xs text-blue-600 mt-1">All adjustments will be applied to the main store location</p>
          </div>
          <div>
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              required
              placeholder="Explain the reason for this adjustment..."
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="reference">Reference</Label>
            <Input
              id="reference"
              value={formData.reference}
              onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
              placeholder="Optional reference"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adjusting..." : "Adjust Stock"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Stock Levels Modal Component
interface StockLevelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockLevels: StockLevel[];
  columns: Column<StockLevel>[];
}

const StockLevelsModal: React.FC<StockLevelsModalProps> = ({
  isOpen,
  onClose,
  stockLevels,
  columns,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>Current Stock Levels</DialogTitle>
        </DialogHeader>
        <div className="max-h-96 overflow-auto">
          <DataTable
            data={stockLevels}
            columns={columns}
            isLoading={false}
          />
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StockAdjustmentPage;
