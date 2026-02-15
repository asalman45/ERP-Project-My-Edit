import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { inventoryApi, materialApi, locationApi, purchaseOrderApi, procurementRequestApi } from "@/services/api";
import { 
  Package, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  Plus,
  ArrowLeft,
  RefreshCw,
  Search,
  Filter,
  Trash2,
  X,
  Eye,
  EyeOff
} from "lucide-react";

interface Material {
  material_id: string;
  material_code: string;
  name: string;
  description?: string;
  category: string;
  uom_id: string;
  uom_code?: string;
  uom_name?: string;
  min_stock?: number;
  max_stock?: number;
}

// Location interface removed - using fixed MAIN_STORE location

interface PurchaseOrder {
  po_id: string;
  po_no: string;
  supplier_name: string;
  status: string;
  total_amount?: number;
  created_at?: string;
}

interface CurrentStock {
  inventory_id: string;
  material_id: string;
  location_id: string;
  quantity: number;
  location_name: string;
  material_name: string;
}

interface StockInItem {
  id: string;
  material_id: string;
  material_name: string;
  material_code: string;
  quantity: string;
  location_id: string;
  location_name: string;
  batch_no: string;
  unit_cost: string;
  reference: string;
  notes: string;
}

const StockInPage: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [currentStock, setCurrentStock] = useState<CurrentStock[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showCurrentStock, setShowCurrentStock] = useState(false);
  const [stockInItems, setStockInItems] = useState<StockInItem[]>([]);
  const [nextItemId, setNextItemId] = useState(1);

  // Form state for bulk operations
  const [bulkFormData, setBulkFormData] = useState({
    location_id: "",
    po_id: "",
    reference: "",
    notes: "",
  });

  // Procurement request state
  const [showProcurementModal, setShowProcurementModal] = useState(false);
  const [selectedMaterialForProcurement, setSelectedMaterialForProcurement] = useState<Material | null>(null);
  const [procurementFormData, setProcurementFormData] = useState({
    quantity: "",
    notes: "",
    reference_po: "",
  });
  const [receivedProcurementRequests, setReceivedProcurementRequests] = useState<any[]>([]);
  const [showStockInFromProcurementModal, setShowStockInFromProcurementModal] = useState(false);
  const [selectedProcurementRequest, setSelectedProcurementRequest] = useState<any>(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
    loadReceivedProcurementRequests();
  }, []);

  // Load received procurement requests
  const loadReceivedProcurementRequests = async () => {
    try {
      const requests = await procurementRequestApi.getByStatus("RECEIVED");
      setReceivedProcurementRequests(requests || []);
    } catch (error) {
      console.error('Error loading received procurement requests:', error);
    }
  };

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      
      // Load materials, locations, and purchase orders in parallel
      const [materialsResponse, purchaseOrdersResponse] = await Promise.all([
        materialApi.getAll(),
        purchaseOrderApi.getAll({ limit: 50 })
      ]);

      setMaterials(materialsResponse || []);
      setPurchaseOrders(purchaseOrdersResponse || []);
      
      // Location is fixed to MAIN_STORE - no need to load locations
      
    } catch (error: any) {
      console.error("Error loading initial data:", error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to load form data. Please refresh and try again.";
      
      if (error?.message?.includes("NetworkError") || error?.message?.includes("fetch")) {
        errorMessage = "Cannot connect to the server. Please make sure the backend server is running on port 4000.";
      } else if (error?.status === 500) {
        errorMessage = "Server error. Please check the backend logs.";
      } else if (error?.status === 404) {
        errorMessage = "API endpoint not found. Please check the backend configuration.";
      }
      
      toast({
        title: "Connection Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Set empty arrays as fallback
      setMaterials([]);
      setPurchaseOrders([]);
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
      // Show user-friendly error message
      if (error?.status === 404) {
        toast({
          title: "Stock Information",
          description: "No stock information found for this material. This is normal for new materials.",
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to load current stock information. Please try again.",
          variant: "destructive",
        });
      }
      setCurrentStock([]);
    }
  };

  const handleMaterialSelection = (materialId: string, checked: boolean) => {
    const newSelectedMaterials = new Set(selectedMaterials);
    if (checked) {
      newSelectedMaterials.add(materialId);
      // Add to stock in items if not already present
      const material = materials.find(m => m.material_id === materialId);
      console.log('Selected material:', material);
      if (material && !stockInItems.find(item => item.material_id === material.material_id)) {
        const newItem: StockInItem = {
          id: `item_${nextItemId}`,
          material_id: material.material_id,
          material_name: material.name,
          material_code: material.material_code,
          quantity: "",
          location_id: "main-store-001", // Fixed location
          location_name: "Main Store", // Fixed location name
          batch_no: "",
          unit_cost: "",
          reference: bulkFormData.reference || "",
          notes: bulkFormData.notes || "",
        };
        console.log('Adding new stock in item:', newItem);
        setStockInItems(prev => [...prev, newItem]);
        setNextItemId(prev => prev + 1);
      }
    } else {
      newSelectedMaterials.delete(materialId);
      // Remove from stock in items
      setStockInItems(prev => prev.filter(item => item.material_id !== materialId));
    }
    setSelectedMaterials(newSelectedMaterials);
  };

  const handleItemChange = (itemId: string, field: keyof StockInItem, value: string) => {
    console.log('Updating item field:', { itemId, field, value });
    setStockInItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        console.log('Updated item:', updatedItem);
        return updatedItem;
      }
      return item;
    }));
  };

  const removeStockInItem = (itemId: string) => {
    const item = stockInItems.find(i => i.id === itemId);
    if (item) {
      // Update selectedMaterials to remove the material_id
      const newSelectedMaterials = new Set(selectedMaterials);
      newSelectedMaterials.delete(item.material_id);
      setSelectedMaterials(newSelectedMaterials);
    }
    setStockInItems(prev => prev.filter(item => item.id !== itemId));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    console.log('Validating form with:', { stockInItems, bulkFormData });

    if (stockInItems.length === 0) {
      newErrors.items = "Please select at least one material";
    }

    // Location is automatically set to MAIN_STORE - no validation needed

    // Validate each item
    stockInItems.forEach((item, index) => {
      console.log(`Validating item ${index}:`, item);
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        newErrors[`item_${index}_quantity`] = "Quantity must be greater than 0";
      }
      if (item.unit_cost && parseFloat(item.unit_cost) < 0) {
        newErrors[`item_${index}_unit_cost`] = "Unit cost must be a positive number";
      }
    });

    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log('Form is valid:', isValid);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      // Process each item
      const results = [];
      console.log('Stock In Items:', stockInItems);
      
      for (const item of stockInItems) {
        // Check if this item is from a procurement request
        const procurementRequest = getReceivedProcurementRequest(item.material_id);
        
        const stockInData = {
          material_id: item.material_id,
          quantity: parseFloat(item.quantity),
          location_id: item.location_id,
          po_id: bulkFormData.po_id || undefined,
          batch_no: item.batch_no || undefined,
          unit_cost: item.unit_cost ? parseFloat(item.unit_cost) : undefined,
          reference: item.reference || undefined,
          notes: item.notes || undefined,
          procurement_request_id: procurementRequest?.id || undefined,
          created_by: "current_user",
        };

        console.log('Sending Stock In Data:', stockInData);
        const result = await inventoryApi.stockIn(stockInData);
        console.log('Stock In Result:', result);
        results.push(result);
      }

      // Update procurement request status to FULFILLED for any items that came from procurement
      for (const item of stockInItems) {
        const procurementRequest = getReceivedProcurementRequest(item.material_id);
        if (procurementRequest) {
          try {
            await procurementRequestApi.updateStatus(
              procurementRequest.id,
              "FULFILLED",
              "current_user"
            );
          } catch (error) {
            console.error('Error updating procurement request status:', error);
          }
        }
      }

      toast({
        title: "Success",
        description: `Successfully added stock for ${results.length} material(s)`,
      });

      // Reset form
      resetForm();
      
      // Reload procurement requests to update the UI
      await loadReceivedProcurementRequests();

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
    setStockInItems([]);
    setSelectedMaterials(new Set());
    setBulkFormData({
      location_id: "",
      po_id: "",
      reference: "",
      notes: "",
    });
    setCurrentStock([]);
    setErrors({});
    setNextItemId(1);
  };

  // Check if material has zero stock
  const hasZeroStock = (materialId: string) => {
    const materialStock = currentStock.filter(stock => stock.material_id === materialId);
    return materialStock.length === 0 || materialStock.every(stock => stock.quantity <= 0);
  };

  // Check if material has a received procurement request
  const hasReceivedProcurementRequest = (materialId: string) => {
    return receivedProcurementRequests.some(request => request.material_id === materialId);
  };

  // Get received procurement request for a material
  const getReceivedProcurementRequest = (materialId: string) => {
    return receivedProcurementRequests.find(request => request.material_id === materialId);
  };

  // Check if material has any procurement request (for future enhancement)
  const hasAnyProcurementRequest = (materialId: string) => {
    // This could be expanded to check for pending/approved requests as well
    return hasReceivedProcurementRequest(materialId);
  };

  // Handle procurement request
  const handleProcurementRequest = (material: Material) => {
    setSelectedMaterialForProcurement(material);
    setProcurementFormData({
      quantity: "",
      notes: "",
      reference_po: "",
    });
    setShowProcurementModal(true);
  };

  // Submit procurement request
  const handleProcurementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMaterialForProcurement || !procurementFormData.quantity) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      await procurementRequestApi.create({
        material_id: selectedMaterialForProcurement.material_id,
        quantity: parseFloat(procurementFormData.quantity),
        requested_by: "current_user", // TODO: Get from auth context
        notes: procurementFormData.notes || undefined,
        reference_po: procurementFormData.reference_po || undefined,
      });

      toast({
        title: "Procurement Request Created",
        description: `Request for ${selectedMaterialForProcurement.name} has been submitted successfully`,
      });

      setShowProcurementModal(false);
      setSelectedMaterialForProcurement(null);
      setProcurementFormData({
        quantity: "",
        notes: "",
        reference_po: "",
      });
    } catch (error: any) {
      console.error('Error creating procurement request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create procurement request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle stock-in from procurement request
  const handleStockInFromProcurement = (procurementRequest: any) => {
    setSelectedProcurementRequest(procurementRequest);
    setShowStockInFromProcurementModal(true);
  };

  // Submit stock-in from procurement request
  const handleStockInFromProcurementSubmit = async () => {
    if (!selectedProcurementRequest) {
      toast({
        title: "Validation Error",
        description: "No procurement request selected",
        variant: "destructive",
      });
      return;
    }

    // Location is automatically set to MAIN_STORE - no validation needed

    try {
      setLoading(true);

      // Create stock-in item from procurement request
      const newItem: StockInItem = {
        id: `procurement_${selectedProcurementRequest.id}`,
        material_id: selectedProcurementRequest.material_id,
        material_name: selectedProcurementRequest.material.name,
        material_code: selectedProcurementRequest.material.material_code,
        quantity: selectedProcurementRequest.quantity.toString(),
        location_id: "main-store-001", // Fixed location
        location_name: "Main Store", // Fixed location name
        batch_no: "",
        unit_cost: "",
        reference: selectedProcurementRequest.reference_po || "",
        notes: `Stock-in from procurement request: ${selectedProcurementRequest.id}`,
      };

      // Add to stock-in items
      setStockInItems([newItem]);
      
      // Update selected materials
      setSelectedMaterials(new Set([selectedProcurementRequest.material_id]));

      // Close modal
      setShowStockInFromProcurementModal(false);
      setSelectedProcurementRequest(null);

      toast({
        title: "Stock-In Prepared",
        description: `Material ${selectedProcurementRequest.material.name} has been prepared for stock-in from procurement request`,
      });
    } catch (error: any) {
      console.error('Error preparing stock-in from procurement:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to prepare stock-in from procurement request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter materials based on search term
  const filteredMaterials = materials.filter(material =>
    material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.material_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (material.description && material.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6" />
              Stock In - Raw Materials
            </h1>
            <p className="text-gray-600">Add new inventory to the system</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCurrentStock(!showCurrentStock)}
          >
            {showCurrentStock ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showCurrentStock ? "Hide" : "Show"} Stock Info
          </Button>
          <Button variant="outline" size="sm" onClick={loadInitialData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {loadingData && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading form data...</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Material Selection */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5" />
                Select Materials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search materials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Material List */}
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredMaterials.map((material) => (
                  <div
                    key={material.material_id}
                    className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <Checkbox
                      checked={selectedMaterials.has(material.material_id)}
                      onCheckedChange={(checked) => 
                        handleMaterialSelection(material.material_id, checked as boolean)
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">
                          {material.material_code}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          Raw Material
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {material.name}
                      </p>
                      {material.description && (
                        <p className="text-xs text-gray-500 truncate">
                          {material.description}
                        </p>
                      )}
                      {material.uom_name && (
                        <p className="text-xs text-blue-600">
                          Unit: {material.uom_name}
                        </p>
                      )}
                      
                      {/* Status Alerts - Priority: Received Procurement > Empty Stock */}
                      {hasReceivedProcurementRequest(material.material_id) ? (
                        /* Received Procurement Request Alert */
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                          <div className="flex items-center gap-2 text-green-700">
                            <Package className="h-4 w-4" />
                            <span className="text-xs font-medium">Materials received and ready for stock-in.</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 h-6 px-2 text-xs text-green-600 hover:text-green-700"
                            onClick={() => handleStockInFromProcurement(getReceivedProcurementRequest(material.material_id))}
                          >
                            Stock In from Procurement
                          </Button>
                        </div>
                      ) : hasZeroStock(material.material_id) ? (
                        /* Zero Stock Alert */
                        <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-md">
                          <div className="flex items-center gap-2 text-orange-700">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-xs font-medium">Inventory is empty. Please request procurement.</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 h-6 px-2 text-xs"
                            onClick={() => handleProcurementRequest(material)}
                          >
                            Request Procurement
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              {filteredMaterials.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No materials found</p>
                  {searchTerm && (
                    <p className="text-sm">Try adjusting your search terms</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Stock Info */}
          {showCurrentStock && selectedMaterials.size > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-5 w-5" />
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
                          <p className="text-sm text-gray-500">{stock.material_name}</p>
                        </div>
                        <Badge variant={stock.quantity > 0 ? "default" : "destructive"}>
                          {stock.quantity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Info className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No current stock found</p>
                    <p className="text-sm mt-1">This is normal for new materials</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Stock In Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bulk Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bulk Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Location is now fixed to MAIN_STORE - no UI needed */}
                <div className="hidden">
                  {/* Hidden field to maintain form structure */}
                  <input type="hidden" value="main-store-001" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="po_id">Purchase Order</Label>
                  <Select
                    value={bulkFormData.po_id}
                    onValueChange={(value) => setBulkFormData(prev => ({ ...prev, po_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select PO (optional)" />
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference">Reference</Label>
                <Input
                  id="reference"
                  value={bulkFormData.reference}
                  onChange={(e) => setBulkFormData(prev => ({ ...prev, reference: e.target.value }))}
                  placeholder="Enter reference number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={bulkFormData.notes}
                  onChange={(e) => setBulkFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Enter any additional notes..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Selected Items */}
          {stockInItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Selected Materials ({stockInItems.length})</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetForm}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {stockInItems.map((item, index) => (
                    <div key={item.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{item.material_code}</Badge>
                          <span className="font-medium">{item.material_name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStockInItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Quantity *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                            placeholder="Enter quantity"
                            className={errors[`item_${index}_quantity`] ? "border-red-500" : ""}
                          />
                          {errors[`item_${index}_quantity`] && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {errors[`item_${index}_quantity`]}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Batch Number</Label>
                          <Input
                            value={item.batch_no}
                            onChange={(e) => handleItemChange(item.id, 'batch_no', e.target.value)}
                            placeholder="Enter batch number"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Unit Cost</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unit_cost}
                            onChange={(e) => handleItemChange(item.id, 'unit_cost', e.target.value)}
                            placeholder="Enter unit cost"
                            className={errors[`item_${index}_unit_cost`] ? "border-red-500" : ""}
                          />
                          {errors[`item_${index}_unit_cost`] && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {errors[`item_${index}_unit_cost`]}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

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

                  {/* Submit Button */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                      disabled={loading}
                    >
                      Reset
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={loading || stockInItems.length === 0}
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
                          Add Stock ({stockInItems.length})
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {stockInItems.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No materials selected</h3>
                <p className="text-gray-600 mb-4">
                  Select materials from the left panel to start adding stock
                </p>
                <Button
                  variant="outline"
                  onClick={() => setShowCurrentStock(!showCurrentStock)}
                >
                  {showCurrentStock ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                  {showCurrentStock ? "Hide" : "Show"} Stock Information
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Procurement Request Modal */}
      {showProcurementModal && selectedMaterialForProcurement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Request Procurement</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProcurementModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm font-medium text-blue-800">
                Material: {selectedMaterialForProcurement.name}
              </p>
              <p className="text-xs text-blue-600">
                Code: {selectedMaterialForProcurement.material_code}
              </p>
            </div>

            <form onSubmit={handleProcurementSubmit} className="space-y-4">
              <div>
                <Label htmlFor="quantity">Quantity Required *</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  min="0"
                  value={procurementFormData.quantity}
                  onChange={(e) => setProcurementFormData(prev => ({
                    ...prev,
                    quantity: e.target.value
                  }))}
                  placeholder="Enter quantity"
                  required
                />
              </div>

              <div>
                <Label htmlFor="reference_po">Reference PO</Label>
                <Input
                  id="reference_po"
                  value={procurementFormData.reference_po}
                  onChange={(e) => setProcurementFormData(prev => ({
                    ...prev,
                    reference_po: e.target.value
                  }))}
                  placeholder="Optional purchase order reference"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={procurementFormData.notes}
                  onChange={(e) => setProcurementFormData(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                  placeholder="Additional notes for procurement team"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowProcurementModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock In from Procurement Modal */}
      {showStockInFromProcurementModal && selectedProcurementRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Stock In from Procurement</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStockInFromProcurementModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm font-medium text-green-800">
                Material: {selectedProcurementRequest.material.name}
              </p>
              <p className="text-xs text-green-600">
                Code: {selectedProcurementRequest.material.material_code}
              </p>
              <p className="text-xs text-green-600">
                Quantity: {selectedProcurementRequest.quantity} {selectedProcurementRequest.material.uom.name}
              </p>
              {selectedProcurementRequest.reference_po && (
                <p className="text-xs text-green-600">
                  PO Reference: {selectedProcurementRequest.reference_po}
                </p>
              )}
            </div>

            <div className="space-y-4">
              {/* Location is fixed to MAIN_STORE - no selection needed */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center gap-2 text-blue-700">
                  <Package className="h-4 w-4" />
                  <span className="text-sm font-medium">Location: Main Store (Fixed)</span>
                </div>
                <p className="text-xs text-blue-600 mt-1">All materials will be stored in the main store location</p>
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={bulkFormData.notes}
                  onChange={(e) => setBulkFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any additional notes for this stock-in"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowStockInFromProcurementModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleStockInFromProcurementSubmit}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Preparing...
                  </>
                ) : (
                  'Prepare Stock-In'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockInPage;