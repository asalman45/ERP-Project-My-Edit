// src/pages/BOM/ProductionRecipe.tsx
// Production Recipe BOM Management (Assembly BOM)

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  Search, 
  AlertCircle,
  Package,
  Scissors,
  ShoppingCart,
  Droplet,
  Box,
  Calculator,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { productApi } from '@/services/api';

const ProductionRecipe: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [bomItems, setBomItems] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [blankSpecs, setBlankSpecs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    item_type: 'BOUGHT_OUT',
    reference_id: '',
    material_id: '',
    item_name: '',
    quantity: '',
    sub_assembly_name: '',
    step_sequence: '',
    is_critical: false,
    scrap_allowance_pct: '0',
    operation_code: ''
  });

  // Memoize fetch functions to prevent unnecessary recreations
  const fetchProducts = useCallback(async () => {
    try {
      const response = await productApi.getAll();
      setProducts(response || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive"
      });
      setProducts([]);
    }
  }, [toast]);

  const fetchMaterials = useCallback(async () => {
    try {
      console.log('Fetching materials from API...');
      const response = await fetch('http://localhost:4000/api/materials');
      console.log('Materials response status:', response.status);
      
      if (!response.ok) {
        console.warn(`Materials API returned status ${response.status}`);
        setMaterials([]);
        toast({
          title: "Warning",
          description: "Failed to fetch materials. Please check if materials exist in the system.",
          variant: "destructive"
        });
        return;
      }
      
      const data = await response.json();
      console.log('Raw materials API response:', data);
      
      // Handle both array and object response formats
      let materialsArray = [];
      
      if (Array.isArray(data)) {
        materialsArray = data;
      } else if (data.data && Array.isArray(data.data)) {
        materialsArray = data.data;
      } else if (data.success && Array.isArray(data.data)) {
        materialsArray = data.data;
      } else if (data.materials && Array.isArray(data.materials)) {
        materialsArray = data.materials;
      }
      
      console.log('Parsed materials array:', materialsArray.length, 'items');
      setMaterials(materialsArray);
      
      if (materialsArray.length === 0) {
        toast({
          title: "No Materials Found",
          description: "No materials available in the system. Please add materials first.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
      setMaterials([]);
      toast({
        title: "Error",
        description: "Failed to fetch materials",
        variant: "destructive"
      });
    }
  }, [toast]);

  const fetchProductionRecipe = useCallback(async () => {
    if (!selectedProduct) {
      setBomItems([]);
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:4000/api/bom-api/production-recipe/${selectedProduct}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch production recipe: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setBomItems(result.data || []);
      } else {
        setBomItems([]);
      }
    } catch (error) {
      console.error('Error fetching production recipe:', error);
      setBomItems([]);
      toast({
        title: "Error",
        description: "Failed to fetch production recipe",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [selectedProduct, toast]);

  const fetchBlankSpecs = useCallback(async () => {
    if (!selectedProduct) {
      setBlankSpecs([]);
      return;
    }
    
    try {
      console.log('Fetching blank specs for product:', selectedProduct);
      const response = await fetch(`http://localhost:4000/api/blank-specs/product/${selectedProduct}`);

      if (!response.ok) {
        if (response.status === 404) {
        setBlankSpecs([]);
          return;
        }
        const errorText = await response.text();
        throw new Error(`Failed to fetch blank specs (${response.status}): ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Unexpected response format while fetching blank specs.');
      }

      const result = await response.json();
      const data = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : [];

      setBlankSpecs(data);
    } catch (error) {
      console.error('Error fetching blank specs:', error);
      setBlankSpecs([]);
    }
  }, [selectedProduct]);

  useEffect(() => {
    fetchProducts();
    fetchMaterials();
    // Cleanup: Clear data when component unmounts
    return () => {
      setProducts([]);
      setMaterials([]);
    };
  }, [fetchProducts, fetchMaterials]);

  useEffect(() => {
    if (selectedProduct) {
      fetchProductionRecipe();
      fetchBlankSpecs();
    } else {
      // Clear data when no product is selected
      setBomItems([]);
      setBlankSpecs([]);
    }
    // Cleanup: Clear data when product changes or component unmounts
    return () => {
      if (!selectedProduct) {
        setBomItems([]);
        setBlankSpecs([]);
      }
    };
  }, [selectedProduct, fetchProductionRecipe, fetchBlankSpecs]);

  const handleSaveBOMItem = async () => {
    try {
      if (!selectedProduct) {
        toast({
          title: "Error",
          description: "Please select a product first",
          variant: "destructive"
        });
        return;
      }

      // For CUT_PART, material_id should be the selected raw material
      // For other types, material_id comes from the selected material as usual
      const payload = {
        ...editingItem,
        product_id: selectedProduct,
        item_type: formData.item_type,
        reference_type: formData.item_type === 'CUT_PART' ? 'BLANK' : 'MATERIAL',
        reference_id: formData.item_type === 'CUT_PART' ? formData.reference_id : formData.material_id,
        material_id: formData.material_id || null,
        item_name: formData.item_name,
        quantity: parseFloat(formData.quantity),
        sub_assembly_name: formData.sub_assembly_name,
        step_sequence: formData.step_sequence ? parseInt(formData.step_sequence) : null,
        is_critical: formData.is_critical,
        scrap_allowance_pct: parseFloat(formData.scrap_allowance_pct || '0'),
        operation_code: formData.operation_code || null,
        uom_id: null // Set to null if not specified
      };

      console.log('Saving BOM item with payload:', payload);

      const response = await fetch('http://localhost:4000/api/bom-api/item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error response:', errorData);
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const result = await response.json();
      console.log('Success response:', result);

      if (result.success) {
        // Close dialog first for better UX
        setShowAddDialog(false);
        setEditingItem(null);
        resetForm();
        
        // Force immediate UI update by optimistically updating state if we have the new item data
        if (result.data) {
          setBomItems(prev => {
            // Check if item already exists (for updates)
            const existingIndex = prev.findIndex(item => item.bom_id === result.data.bom_id);
            if (existingIndex >= 0) {
              // Update existing item
              const updated = [...prev];
              updated[existingIndex] = result.data;
              return updated;
            } else {
              // Add new item
              return [...prev, result.data];
            }
          });
        }
        
        // Then refresh from server to ensure consistency
        await fetchProductionRecipe();
        
        toast({
          title: "Success",
          description: result.message || "BOM item saved successfully"
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save BOM item",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving BOM item:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save BOM item. Check console for details.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteBOMItem = useCallback(async (bomId: string) => {
    try {
      const response = await fetch(`http://localhost:4000/api/bom-api/item/${bomId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Optimistically update UI for immediate feedback
        setBomItems(prev => prev.filter(item => item.bom_id !== bomId));
        
        // Refresh from server to ensure consistency
        await fetchProductionRecipe();
        
        toast({
          title: "Success",
          description: "BOM item deleted successfully"
        });
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting BOM item:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete BOM item",
        variant: "destructive"
      });
    }
  }, [fetchProductionRecipe, toast]);

  const handleEditItem = useCallback((item: any) => {
    setEditingItem(item);
    setFormData({
      item_type: item.item_type || 'BOUGHT_OUT',
      reference_id: item.reference_id || '',
      material_id: item.material_id || '',
      item_name: item.item_name || '',
      quantity: item.quantity?.toString() || '',
      sub_assembly_name: item.sub_assembly_name || '',
      step_sequence: item.step_sequence?.toString() || '',
      is_critical: item.is_critical || false,
      scrap_allowance_pct: item.scrap_allowance_pct?.toString() || '0',
      operation_code: item.operation_code || ''
    });
    setShowAddDialog(true);
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      item_type: 'BOUGHT_OUT',
      reference_id: '',
      material_id: '',
      item_name: '',
      quantity: '',
      sub_assembly_name: '',
      step_sequence: '',
      is_critical: false,
      scrap_allowance_pct: '0',
      operation_code: ''
    });
  }, []);

  // Memoize helper functions to prevent unnecessary recreations
  const getItemTypeIcon = useCallback((itemType: string) => {
    switch (itemType) {
      case 'CUT_PART': return <Scissors className="w-4 h-4 text-blue-600" />;
      case 'BOUGHT_OUT': return <ShoppingCart className="w-4 h-4 text-green-600" />;
      case 'CONSUMABLE': return <Droplet className="w-4 h-4 text-orange-600" />;
      case 'SUB_ASSEMBLY': return <Box className="w-4 h-4 text-purple-600" />;
      default: return <Package className="w-4 h-4 text-gray-600" />;
    }
  }, []);

  const getItemTypeBadge = useCallback((itemType: string) => {
    const colors = {
      'CUT_PART': 'bg-blue-100 text-blue-800 border-blue-300',
      'BOUGHT_OUT': 'bg-green-100 text-green-800 border-green-300',
      'CONSUMABLE': 'bg-orange-100 text-orange-800 border-orange-300',
      'SUB_ASSEMBLY': 'bg-purple-100 text-purple-800 border-purple-300'
    };
    
    return (
      <Badge variant="outline" className={colors[itemType] || 'bg-gray-100'}>
        {getItemTypeIcon(itemType)}
        <span className="ml-1">{itemType?.replace('_', ' ')}</span>
      </Badge>
    );
  }, [getItemTypeIcon]);

  // Memoize filtered BOM items to prevent unnecessary recalculations
  const filteredBomItems = useMemo(() => {
    if (!searchTerm.trim()) {
      return bomItems;
    }
    const searchLower = searchTerm.toLowerCase();
    return bomItems.filter(item =>
      item.item_name?.toLowerCase().includes(searchLower) ||
      item.material_name?.toLowerCase().includes(searchLower) ||
      item.sub_assembly_name?.toLowerCase().includes(searchLower)
    );
  }, [bomItems, searchTerm]);

  // Memoize statistics to avoid recalculating on every render
  const bomStats = useMemo(() => ({
    cutParts: bomItems.filter(i => i.item_type === 'CUT_PART').length,
    boughtItems: bomItems.filter(i => i.item_type === 'BOUGHT_OUT').length,
    consumables: bomItems.filter(i => i.item_type === 'CONSUMABLE').length,
    critical: bomItems.filter(i => i.is_critical).length,
    total: bomItems.length
  }), [bomItems]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-8 h-8" />
            Production Recipe BOM
          </h1>
          <p className="text-gray-600 mt-1">
            Define complete bill of materials including cut parts, bought items, and consumables
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              setLoading(true);
              try {
                await fetchProducts();
                if (selectedProduct) {
                  await fetchProductionRecipe();
                  await fetchBlankSpecs();
                }
                toast({
                  title: "Success",
                  description: "Data refreshed successfully"
                });
              } catch (error) {
                console.error('Error refreshing data:', error);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={() => {
              resetForm();
              setEditingItem(null);
              setShowAddDialog(true);
            }}
            disabled={!selectedProduct}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add BOM Item
          </Button>
        </div>
      </div>

      {/* Product Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Product</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="product">Product</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger id="product">
                  <SelectValue placeholder="Select a product..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.product_id} value={product.product_id}>
                      {product.product_code} - {product.part_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="search">Search BOM Items</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BOM Items Table */}
      {selectedProduct && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5" />
                BOM Items ({filteredBomItems.length})
              </CardTitle>
              {bomItems.length > 0 && (
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-blue-700">
                    <Scissors className="w-3 h-3 mr-1" />
                    {bomStats.cutParts} Cut Parts
                  </Badge>
                  <Badge variant="outline" className="text-green-700">
                    <ShoppingCart className="w-3 h-3 mr-1" />
                    {bomStats.boughtItems} Bought Items
                  </Badge>
                  <Badge variant="outline" className="text-orange-700">
                    <Droplet className="w-3 h-3 mr-1" />
                    {bomStats.consumables} Consumables
                  </Badge>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : filteredBomItems.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No BOM items found</p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First BOM Item
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Seq</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Sub-Assembly</TableHead>
                    <TableHead>Qty/Unit</TableHead>
                    <TableHead>Material/Details</TableHead>
                    <TableHead>Dimensions</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Sheet Info</TableHead>
                    <TableHead>Efficiency</TableHead>
                    <TableHead>Critical</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBomItems.map((item) => (
                    <TableRow key={item.bom_id}>
                      <TableCell>{item.step_sequence || '-'}</TableCell>
                      <TableCell>{getItemTypeBadge(item.item_type)}</TableCell>
                      <TableCell className="font-medium">{item.item_name || item.material_name || '-'}</TableCell>
                      <TableCell>{item.sub_assembly_name || '-'}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      
                      {/* Material/Details Column */}
                      <TableCell className="text-sm text-gray-600">
                        {item.item_type === 'CUT_PART' ? (
                          <div className="space-y-1">
                            <div className="font-medium text-blue-700">Cut Part</div>
                            <div className="text-xs font-medium text-green-700">
                              📋 Raw Material: {item.raw_material_name || item.material_name || 'Sheet Material'}
                              {item.material_code && ` (${item.material_code})`}
                            </div>
                            <div className="text-xs text-gray-500">
                              Sheet: {item.sheet_type || 'Standard'}
                            </div>
                            {item.material_density && (
                              <div className="text-xs text-gray-500">
                                Density: {item.material_density} kg/m³
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium">{item.material_code || '-'}</div>
                            <div className="text-xs text-gray-500">{item.material_name || '-'}</div>
                          </div>
                        )}
                      </TableCell>

                      {/* Dimensions Column */}
                      <TableCell>
                        {item.item_type === 'CUT_PART' ? (
                          <div className="text-sm">
                            <div className="font-medium">
                              {item.width_mm}×{item.length_mm}×{item.thickness_mm}mm
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.best_direction && `Best: ${item.best_direction}`}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>

                      {/* Weight Column */}
                      <TableCell>
                        {item.item_type === 'CUT_PART' ? (
                          <div className="text-sm">
                            <div className="font-medium">
                              {item.blank_weight_kg ? `${item.blank_weight_kg}kg` : '-'}
                            </div>
                            {item.sheet_weight_kg && (
                              <div className="text-xs text-gray-500">
                                Sheet: {item.sheet_weight_kg}kg
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>

                      {/* Sheet Info Column */}
                      <TableCell>
                        {item.item_type === 'CUT_PART' ? (
                          <div className="text-sm">
                            <div className="font-medium">
                              {item.pcs_per_sheet ? `${item.pcs_per_sheet} pcs/sheet` : '-'}
                            </div>
                            {item.total_blanks && (
                              <div className="text-xs text-gray-500">
                                Total: {item.total_blanks}
                              </div>
                            )}
                            {item.extra_blanks_from_leftover && item.extra_blanks_from_leftover > 0 && (
                              <div className="text-xs text-green-600">
                                +{item.extra_blanks_from_leftover} extra
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>

                      {/* Efficiency Column */}
                      <TableCell>
                        {item.item_type === 'CUT_PART' ? (
                          <div className="text-sm">
                            <div className="font-medium text-green-600">
                              {item.sheet_util_pct ? `${item.sheet_util_pct}%` : '-'}
                            </div>
                            {item.efficiency_percentage && (
                              <div className="text-xs text-gray-500">
                                Opt: {item.efficiency_percentage}%
                              </div>
                            )}
                            {item.scrap_percentage && (
                              <div className="text-xs text-red-500">
                                Scrap: {item.scrap_percentage}%
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>

                      {/* Critical Column */}
                      <TableCell>
                        {item.is_critical && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Critical
                          </Badge>
                        )}
                      </TableCell>

                      {/* Actions Column */}
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditItem(item)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteBOMItem(item.bom_id)}
                          >
                            <Trash2 className="w-3 h-3 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit BOM Item' : 'Add BOM Item'}
            </DialogTitle>
            <DialogDescription>
              Define a component or material required to make one unit of the product
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Item Type */}
            <div className="space-y-2">
              <Label>Item Type</Label>
              <Select value={formData.item_type} onValueChange={(value) => setFormData(prev => ({ ...prev, item_type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CUT_PART">
                    <div className="flex items-center gap-2">
                      <Scissors className="w-4 h-4 text-blue-600" />
                      Cut Part (from Blank Spec)
                    </div>
                  </SelectItem>
                  <SelectItem value="BOUGHT_OUT">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-green-600" />
                      Bought-Out Item
                    </div>
                  </SelectItem>
                  <SelectItem value="CONSUMABLE">
                    <div className="flex items-center gap-2">
                      <Droplet className="w-4 h-4 text-orange-600" />
                      Consumable
                    </div>
                  </SelectItem>
                  <SelectItem value="SUB_ASSEMBLY">
                    <div className="flex items-center gap-2">
                      <Box className="w-4 h-4 text-purple-600" />
                      Sub-Assembly
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reference Selection */}
            {formData.item_type === 'CUT_PART' ? (
              <>
                <div className="space-y-2">
                  <Label>Blank Specification</Label>
                  <Select value={formData.reference_id} onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, reference_id: value }));
                    // Auto-fill item name from blank spec
                    const blank = blankSpecs.find(b => b.blank_id === value);
                    if (blank) {
                      setFormData(prev => ({
                        ...prev,
                        item_name: blank.sub_assembly_name,
                        material_id: blank.blank_id // Use blank_id as material reference
                      }));
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blank specification..." />
                    </SelectTrigger>
                    <SelectContent>
                      {blankSpecs.map(blank => (
                        <SelectItem key={blank.blank_id} value={blank.blank_id}>
                          {blank.sub_assembly_name} ({blank.width_mm}×{blank.length_mm}×{blank.thickness_mm}mm)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    This links to a blank specification from the Cutting BOM
                  </p>
                </div>

                {/* Raw Material Dropdown for Cut Part */}
                <div className="space-y-2">
                  <Label>Raw Material</Label>
                  <Select value={formData.material_id} onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, material_id: value }));
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder={materials.length === 0 ? "No materials available" : "Select raw material..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {materials.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                          <p>No materials found in the system.</p>
                          <p className="mt-2">Please add materials from the Master Data page first.</p>
                        </div>
                      ) : (
                        materials.map(material => (
                          <SelectItem key={material.material_id} value={material.material_id}>
                            {material.material_code} - {material.name || material.material_name || 'Unnamed Material'}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Select the raw material that will be cut to create this part
                  </p>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label>Material</Label>
                <Select value={formData.material_id} onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, material_id: value, reference_id: value }));
                  // Auto-fill item name from material
                  const material = materials.find(m => m.material_id === value);
                  if (material) {
                    setFormData(prev => ({ ...prev, item_name: material.name || material.material_name || '' }));
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={materials.length === 0 ? "No materials available" : "Select material..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        <p>No materials found in the system.</p>
                        <p className="mt-2">Please add materials from the Master Data page first.</p>
                      </div>
                    ) : (
                      materials.map(material => (
                        <SelectItem key={material.material_id} value={material.material_id}>
                          {material.material_code} - {material.name || material.material_name || 'Unnamed Material'}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  {materials.length > 0 ? `${materials.length} material(s) available` : 'Add materials from Master Data → Materials'}
                </p>
              </div>
            )}

            {/* Item Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Item Name</Label>
                <Input
                  value={formData.item_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, item_name: e.target.value }))}
                  placeholder="Component name"
                />
              </div>

              <div className="space-y-2">
                <Label>Quantity per Unit</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="1"
                />
              </div>

              <div className="space-y-2">
                <Label>Sub-Assembly Name</Label>
                <Input
                  value={formData.sub_assembly_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, sub_assembly_name: e.target.value }))}
                  placeholder="Main Assembly"
                />
              </div>

              <div className="space-y-2">
                <Label>Step Sequence</Label>
                <Input
                  type="number"
                  value={formData.step_sequence}
                  onChange={(e) => setFormData(prev => ({ ...prev, step_sequence: e.target.value }))}
                  placeholder="10, 20, 30..."
                />
              </div>

              <div className="space-y-2">
                <Label>Scrap Allowance (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.scrap_allowance_pct}
                  onChange={(e) => setFormData(prev => ({ ...prev, scrap_allowance_pct: e.target.value }))}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label>Operation Code</Label>
                <Input
                  value={formData.operation_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, operation_code: e.target.value }))}
                  placeholder="CUT-001, WELD-002..."
                />
              </div>
            </div>

            {/* Critical Flag */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_critical"
                checked={formData.is_critical}
                onChange={(e) => setFormData(prev => ({ ...prev, is_critical: e.target.checked }))}
                className="h-4 w-4"
              />
              <Label htmlFor="is_critical" className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                Mark as Critical Item (affects MRP priority)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false);
              setEditingItem(null);
              resetForm();
            }}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveBOMItem} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Save BOM Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Info Cards */}
      {selectedProduct && bomItems.length > 0 && (
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Scissors className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cut Parts</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {bomStats.cutParts}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Bought Items</p>
                  <p className="text-2xl font-bold text-green-600">
                    {bomStats.boughtItems}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Droplet className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Consumables</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {bomStats.consumables}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Critical Items</p>
                  <p className="text-2xl font-bold text-red-600">
                    {bomStats.critical}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProductionRecipe;

