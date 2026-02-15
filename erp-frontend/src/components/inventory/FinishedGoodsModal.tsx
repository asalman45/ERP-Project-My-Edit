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
import { inventoryApi, productApi, locationApi, workOrderApi } from "@/services/api";
import { CheckCircle, Loader2, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FinishedGoodsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface Product {
  product_id: string;
  part_number: string;
  part_name: string;
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
  quantity_required?: number;
}

interface CurrentStock {
  quantity: number;
  location_name: string;
}

const FinishedGoodsModal: React.FC<FinishedGoodsModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [currentStock, setCurrentStock] = useState<CurrentStock[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState({
    product_id: "",
    quantity: "",
    location_id: "",
    wo_id: "",
    batch_no: "",
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
      
      // Load products, locations, and work orders in parallel
      const [productsResponse, locationsResponse, workOrdersResponse] = await Promise.all([
        productApi.getAll(),
        locationApi.getAll(),
        workOrderApi.getAll({ limit: 50 })
      ]);

      setProducts(productsResponse || []);
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

  const loadCurrentStock = async (productId: string) => {
    try {
      // Note: This would need to be adapted for products vs materials
      // For now, we'll use a placeholder
      setCurrentStock([]);
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

    // Load current stock when product is selected
    if (field === "product_id" && value) {
      const product = products.find(p => p.product_id === value);
      setSelectedProduct(product || null);
      if (value) {
        loadCurrentStock(value);
      }
    }

    // Auto-fill product when work order is selected
    if (field === "wo_id" && value) {
      const workOrder = workOrders.find(wo => wo.wo_id === value);
      if (workOrder && workOrder.product_name) {
        const product = products.find(p => p.part_name === workOrder.product_name);
        if (product) {
          setFormData(prev => ({
            ...prev,
            product_id: product.product_id
          }));
          setSelectedProduct(product);
        }
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.product_id) {
      newErrors.product_id = "Product is required";
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
      const finishedGoodsData = {
        product_id: formData.product_id,
        quantity: quantity,
        location_id: formData.location_id,
        wo_id: formData.wo_id || undefined,
        batch_no: formData.batch_no || undefined,
        reference: formData.reference || undefined,
        notes: formData.notes || undefined,
        created_by: "current_user", // This would come from auth context
      };

      const result = await inventoryApi.receiveFinishedGoods(finishedGoodsData);

      toast({
        title: "Success",
        description: `Finished goods received successfully. Quantity: ${quantity}`,
      });

      handleSuccess();

    } catch (error: any) {
      console.error("Error receiving finished goods:", error);
      toast({
        title: "Error",
        description: error?.response?.data?.error || error?.message || "Failed to receive finished goods",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: "",
      quantity: "",
      location_id: "",
      wo_id: "",
      batch_no: "",
      reference: "",
      notes: "",
    });
    setSelectedProduct(null);
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Receive Finished Goods
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
              {/* Product Selection */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Product Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="product_id">Product *</Label>
                    <Select
                      value={formData.product_id}
                      onValueChange={(value) => handleInputChange("product_id", value)}
                      disabled={loadingData}
                    >
                      <SelectTrigger className={errors.product_id ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.product_id} value={product.product_id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{product.part_name || product.product_code || 'Unknown Product'}</span>
                              <span className="text-xs text-gray-500">{product.category}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.product_id && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.product_id}
                      </p>
                    )}
                  </div>

                  {/* Product Details */}
                  {selectedProduct && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm space-y-1">
                        <p><span className="font-medium">Description:</span> {selectedProduct.description || 'N/A'}</p>
                        <p><span className="font-medium">Category:</span> <Badge variant="secondary">{selectedProduct.category}</Badge></p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quantity and Location */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Receipt Details</CardTitle>
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
                      placeholder="Enter quantity produced"
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

              {/* Work Order and Batch */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Production Information</CardTitle>
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
                    <Label htmlFor="batch_no">Batch Number</Label>
                    <Input
                      id="batch_no"
                      value={formData.batch_no}
                      onChange={(e) => handleInputChange("batch_no", e.target.value)}
                      placeholder="Enter batch number"
                    />
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
                      placeholder="Enter any additional notes about the finished goods..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Current Stock Info */}
            <div className="space-y-6">
              {/* Current Stock Information */}
              {selectedProduct && (
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
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No current stock found for this product</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Finished Goods Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Finished Goods Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="font-medium text-green-800">Production Complete:</p>
                      <ul className="mt-2 text-green-700 space-y-1">
                        <li>• Record completed production quantities</li>
                        <li>• Finished goods move to inventory</li>
                        <li>• Update work order status</li>
                        <li>• Track batch numbers for traceability</li>
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
              className="min-w-[160px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Receiving Goods...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Receive Finished Goods
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export { FinishedGoodsModal };
