import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { inventoryApi, materialApi, locationApi, purchaseOrderApi } from "@/services/api";
import { Package, Loader2, AlertCircle, CheckCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface StockInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface Material {
  material_id: string;
  material_code: string;
  name: string;
  description?: string;
  category: string;
  uom_id: string;
  uom_code?: string;
  min_stock?: number;
  max_stock?: number;
}

interface Location {
  location_id: string;
  code: string;
  name: string;
  type: string;
  description?: string;
}

interface PurchaseOrder {
  po_id: string;
  po_no: string;
  supplier_name: string;
  status: string;
  total_amount?: number;
  created_at: string;
}

interface CurrentStock {
  quantity: number;
  location_name: string;
}

const StockInModal: React.FC<StockInModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [currentStock, setCurrentStock] = useState<CurrentStock[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState({
    material_id: "",
    quantity: "",
    location_id: "",
    po_id: "",
    batch_no: "",
    unit_cost: "",
    reference: "",
    notes: "",
  });

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      
      // Load materials, locations, and purchase orders in parallel
      const [materialsResponse, locationsResponse, purchaseOrdersResponse] = await Promise.all([
        materialApi.getAll(),
        locationApi.getAll(),
        purchaseOrderApi.getAll({ status: 'APPROVED', limit: 50 })
      ]);

      setMaterials(materialsResponse || []);
      setLocations(locationsResponse || []);
      setPurchaseOrders(purchaseOrdersResponse || []);
      
    } catch (error) {
      console.error("Error loading initial data:", error);
      toast({
        title: "Error",
        description: "Failed to load form data. Please refresh and try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const loadCurrentStock = async (materialId: string) => {
    try {
      const stockData = await inventoryApi.getCurrentStock(materialId);
      // Handle both direct array response and wrapped response
      const stockItems = Array.isArray(stockData) ? stockData : (stockData?.data || []);
      setCurrentStock(stockItems);
    } catch (error: any) {
      console.error("Error loading current stock:", error);
      // Don't show toast for 404 errors in modal as it might be normal for new materials
      setCurrentStock([]);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }

    // Load current stock when material is selected
    if (field === "material_id" && value) {
      const material = materials.find(m => m.material_id === value);
      setSelectedMaterial(material || null);
      if (value) {
        loadCurrentStock(value);
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.material_id) {
      newErrors.material_id = "Material is required";
    }

    if (!formData.quantity) {
      newErrors.quantity = "Quantity is required";
    } else {
      const quantity = parseFloat(formData.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        newErrors.quantity = "Quantity must be a positive number";
      }
    }

    if (!formData.location_id) {
      newErrors.location_id = "Location is required";
    }

    if (formData.unit_cost) {
      const unitCost = parseFloat(formData.unit_cost);
      if (isNaN(unitCost) || unitCost < 0) {
        newErrors.unit_cost = "Unit cost must be a positive number";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const quantity = parseFloat(formData.quantity);
      const stockInData = {
        material_id: formData.material_id,
        quantity: quantity,
        location_id: formData.location_id,
        po_id: formData.po_id || undefined,
        batch_no: formData.batch_no || undefined,
        unit_cost: formData.unit_cost ? parseFloat(formData.unit_cost) : undefined,
        reference: formData.reference || undefined,
        created_by: "current_user", // This would come from auth context
      };

      const result = await inventoryApi.stockIn(stockInData);

      toast({
        title: "Success",
        description: `Stock added successfully. New quantity: ${result.data?.new_quantity || 'N/A'}`,
      });

      handleSuccess();

    } catch (error: any) {
      console.error("Error adding stock:", error);
      toast({
        title: "Error",
        description: error?.response?.data?.error || error?.message || "Failed to add stock",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      material_id: "",
      quantity: "",
      location_id: "",
      po_id: "",
      batch_no: "",
      unit_cost: "",
      reference: "",
      notes: "",
    });
    setSelectedMaterial(null);
    setCurrentStock([]);
    setErrors({});
  };

  const handleClose = () => {
    if (!loading && !loadingData) {
      resetForm();
      onClose();
    }
  };

  const handleSuccess = () => {
    resetForm();
    onSuccess?.();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Stock In - Add Raw Material Inventory
          </DialogTitle>
        </DialogHeader>

        {loadingData && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading form data...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Main Form */}
            <div className="space-y-6">
              {/* Material Selection */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Material Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="material_id">Material *</Label>
                    <Select
                      value={formData.material_id}
                      onValueChange={(value) => handleInputChange("material_id", value)}
                      disabled={loadingData}
                    >
                      <SelectTrigger className={errors.material_id ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map((material) => (
                          <SelectItem key={material.material_id} value={material.material_id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{material.material_code} - {material.name}</span>
                              <span className="text-xs text-gray-500">{material.category}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.material_id && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.material_id}
                      </p>
                    )}
                  </div>

                  {/* Material Details */}
                  {selectedMaterial && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm space-y-1">
                        <p><span className="font-medium">Description:</span> {selectedMaterial.description || 'N/A'}</p>
                        <p><span className="font-medium">Category:</span> <Badge variant="secondary">{selectedMaterial.category}</Badge></p>
                        {selectedMaterial.min_stock && (
                          <p><span className="font-medium">Min Stock:</span> {selectedMaterial.min_stock}</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quantity and Location */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Stock Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange("quantity", e.target.value)}
                      placeholder="Enter quantity"
                      className={errors.quantity ? "border-red-500" : ""}
                    />
                    {errors.quantity && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.quantity}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location_id">Location *</Label>
                    <Select
                      value={formData.location_id}
                      onValueChange={(value) => handleInputChange("location_id", value)}
                      disabled={loadingData}
                    >
                      <SelectTrigger className={errors.location_id ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location.location_id} value={location.location_id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{location.code} - {location.name}</span>
                              <span className="text-xs text-gray-500">{location.type}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.location_id && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.location_id}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Purchase Order */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Purchase Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="po_id">Purchase Order</Label>
                    <Select
                      value={formData.po_id}
                      onValueChange={(value) => handleInputChange("po_id", value)}
                      disabled={loadingData}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select purchase order (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {purchaseOrders.map((po) => (
                          <SelectItem key={po.po_id} value={po.po_id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{po.po_no}</span>
                              <span className="text-xs text-gray-500">{po.supplier_name} - {po.status}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="batch_no">Batch Number</Label>
                      <Input
                        id="batch_no"
                        value={formData.batch_no}
                        onChange={(e) => handleInputChange("batch_no", e.target.value)}
                        placeholder="Enter batch number"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="unit_cost">Unit Cost</Label>
                      <Input
                        id="unit_cost"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.unit_cost}
                        onChange={(e) => handleInputChange("unit_cost", e.target.value)}
                        placeholder="Enter unit cost"
                        className={errors.unit_cost ? "border-red-500" : ""}
                      />
                      {errors.unit_cost && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.unit_cost}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reference">Reference</Label>
                    <Input
                      id="reference"
                      value={formData.reference}
                      onChange={(e) => handleInputChange("reference", e.target.value)}
                      placeholder="Enter reference number"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Current Stock Info */}
            <div className="space-y-6">
              {/* Current Stock Information */}
              {selectedMaterial && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Current Stock Levels
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentStock.length > 0 ? (
                      <div className="space-y-3">
                        {currentStock.map((stock, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{stock.location_name}</p>
                              <p className="text-sm text-gray-500">Current Stock</p>
                            </div>
                            <Badge variant={stock.quantity > 0 ? "default" : "destructive"}>
                              {stock.quantity}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No current stock found for this material</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Additional Notes */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Additional Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      placeholder="Enter any additional notes about this stock in transaction..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Form Validation Summary */}
              {Object.keys(errors).length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please fix the following errors before submitting:
                    <ul className="mt-2 list-disc list-inside">
                      {Object.values(errors).map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading || loadingData}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || loadingData || Object.keys(errors).length > 0}
              className="min-w-[120px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Stock...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Add Stock
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export { StockInModal };
