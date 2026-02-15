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
import { inventoryApi, materialApi, locationApi, workOrderApi } from "@/services/api";
import { AlertTriangle, Loader2, AlertCircle, CheckCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WastageModalProps {
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
}

interface Location {
  location_id: string;
  code: string;
  name: string;
  type: string;
}

interface WorkOrder {
  wo_id: string;
  wo_no: string;
  status: string;
  product_name?: string;
}

interface CurrentStock {
  quantity: number;
  location_name: string;
}

const WASTAGE_REASONS = [
  "DEFECTIVE_MATERIAL",
  "DAMAGED_IN_TRANSIT",
  "EXPIRED",
  "CONTAMINATED",
  "WRONG_SPECIFICATION",
  "PRODUCTION_WASTE",
  "TESTING_SAMPLE",
  "OTHER"
];

const WastageModal: React.FC<WastageModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [currentStock, setCurrentStock] = useState<CurrentStock[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState({
    material_id: "",
    quantity: "",
    location_id: "",
    wo_id: "",
    reason: "",
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
      
      // Load materials, locations, and work orders in parallel
      const [materialsResponse, locationsResponse, workOrdersResponse] = await Promise.all([
        materialApi.getAll(),
        locationApi.getAll(),
        workOrderApi.getAll({ limit: 50 })
      ]);

      setMaterials(materialsResponse || []);
      setLocations(locationsResponse || []);
      setWorkOrders(workOrdersResponse || []);
      
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
      setCurrentStock(stockData.data || []);
    } catch (error) {
      console.error("Error loading current stock:", error);
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

    if (!formData.reason) {
      newErrors.reason = "Wastage reason is required";
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
      const wastageData = {
        material_id: formData.material_id,
        quantity: quantity,
        location_id: formData.location_id,
        wo_id: formData.wo_id || undefined,
        reason: formData.reason,
        reference: formData.reference || undefined,
        notes: formData.notes || undefined,
        created_by: "current_user", // This would come from auth context
      };

      const result = await inventoryApi.recordWastage(wastageData);

      toast({
        title: "Success",
        description: `Wastage recorded successfully. ${quantity} units marked as waste.`,
      });

      handleSuccess();

    } catch (error: any) {
      console.error("Error recording wastage:", error);
      toast({
        title: "Error",
        description: error?.response?.data?.error || error?.message || "Failed to record wastage",
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
      wo_id: "",
      reason: "",
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

  const getReasonLabel = (reason: string) => {
    return reason.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Record Material Wastage
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
                    <AlertTriangle className="h-4 w-4" />
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
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quantity and Location */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Wastage Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Wasted Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange("quantity", e.target.value)}
                      placeholder="Enter wasted quantity"
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

                  <div className="space-y-2">
                    <Label htmlFor="reason">Wastage Reason *</Label>
                    <Select
                      value={formData.reason}
                      onValueChange={(value) => handleInputChange("reason", value)}
                      disabled={loadingData}
                    >
                      <SelectTrigger className={errors.reason ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select wastage reason" />
                      </SelectTrigger>
                      <SelectContent>
                        {WASTAGE_REASONS.map((reason) => (
                          <SelectItem key={reason} value={reason}>
                            {getReasonLabel(reason)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.reason && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.reason}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Work Order and Reference */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Additional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="wo_id">Work Order</Label>
                    <Select
                      value={formData.wo_id}
                      onValueChange={(value) => handleInputChange("wo_id", value)}
                      disabled={loadingData}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select work order (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {workOrders.map((wo) => (
                          <SelectItem key={wo.wo_id} value={wo.wo_id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{wo.wo_no}</span>
                              <span className="text-xs text-gray-500">{wo.product_name || 'Product Not Found'} - {wo.status}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      placeholder="Enter details about the wastage..."
                      rows={3}
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
                              <p className="text-sm text-gray-500">Available Stock</p>
                            </div>
                            <Badge variant={stock.quantity > 0 ? "default" : "destructive"}>
                              {stock.quantity}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No current stock found for this material</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Wastage Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Wastage Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="font-medium text-yellow-800">Important Notes:</p>
                      <ul className="mt-2 text-yellow-700 space-y-1">
                        <li>• Wastage reduces available inventory</li>
                        <li>• Record accurate quantities</li>
                        <li>• Provide detailed reason for tracking</li>
                        <li>• Wasted materials can be re-entered later if suitable</li>
                      </ul>
                    </div>
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
              className="min-w-[140px]"
              variant="destructive"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording Wastage...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Record Wastage
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export { WastageModal };
