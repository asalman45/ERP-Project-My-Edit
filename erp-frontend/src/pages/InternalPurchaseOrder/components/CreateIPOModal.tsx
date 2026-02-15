import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ipoApi } from "../api";
import { rawMaterialApi } from "@/services/api";
import { CreateIPORequest, IPOItem } from "../types";
import { Plus, Trash2, Loader2 } from "lucide-react";

interface CreateIPOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Partial<CreateIPORequest> | null;
}

const CreateIPOModal: React.FC<CreateIPOModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}) => {
  const [formData, setFormData] = useState<CreateIPORequest>(() => ({
    supplier_id: initialData?.supplier_id,
    supplier_name: initialData?.supplier_name || '',
    contact_person: initialData?.contact_person || '',
    contact_phone: initialData?.contact_phone || '',
    supplier_address: initialData?.supplier_address || '',
    supplier_email: initialData?.supplier_email || '',
    supplier_ntn: initialData?.supplier_ntn || '',
    supplier_strn: initialData?.supplier_strn || '',
    order_date: initialData?.order_date || new Date().toISOString().split('T')[0],
    expected_date: initialData?.expected_date || '',
    notes: initialData?.notes || '',
    items: initialData?.items || [],
    tax_percentage: initialData?.tax_percentage || 18,
    created_by: initialData?.created_by || 'current-user'
  }));

  const [newItem, setNewItem] = useState<IPOItem>({
    material_id: '',
    item_name: '',
    description: '',
    quantity: 1,
    unit_price: 0,
    uom_id: undefined
  });

  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");

  const { toast } = useToast();

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        supplier_id: initialData.supplier_id,
        supplier_name: initialData.supplier_name || '',
        contact_person: initialData.contact_person || '',
        contact_phone: initialData.contact_phone || '',
        supplier_address: initialData.supplier_address || '',
        supplier_email: initialData.supplier_email || '',
        supplier_ntn: initialData.supplier_ntn || '',
        supplier_strn: initialData.supplier_strn || '',
        order_date: initialData.order_date || new Date().toISOString().split('T')[0],
        expected_date: initialData.expected_date || '',
        notes: initialData.notes || '',
        items: initialData.items || [],
        tax_percentage: initialData.tax_percentage || 18,
        created_by: initialData.created_by || 'current-user'
      });
    }
  }, [initialData, isOpen]);

  // Fetch raw materials
  const { data: rawMaterials = [], isLoading: loadingMaterials } = useQuery({
    queryKey: ["raw-materials"],
    queryFn: () => rawMaterialApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateIPORequest) => ipoApi.create(data),
    onSuccess: (result) => {
      toast({
        title: "Success",
        description: `Internal Purchase Order ${result.po_number} created successfully`,
      });
      onSuccess();
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create Internal Purchase Order",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      supplier_id: undefined,
      supplier_name: '',
      contact_person: '',
      contact_phone: '',
      supplier_address: '',
      supplier_email: '',
      supplier_ntn: '',
      supplier_strn: '',
      order_date: new Date().toISOString().split('T')[0],
      expected_date: '',
      notes: '',
      items: [],
      tax_percentage: 18,
      created_by: 'current-user'
    });
    setNewItem({
      material_id: '',
      item_name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      uom_id: undefined
    });
    setSelectedMaterialId("");
  };

  const addItem = () => {
    if (newItem.item_name.trim() && newItem.quantity > 0 && newItem.unit_price >= 0) {
      const item: IPOItem = {
        ...newItem,
        total_amount: newItem.quantity * newItem.unit_price
      };
      
      setFormData({
        ...formData,
        items: [...formData.items, item]
      });
      
      setNewItem({
        item_name: '',
        description: '',
        quantity: 1,
        unit_price: 0
      });
      setSelectedMaterialId("");
    }
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const updateItem = (index: number, field: keyof IPOItem, value: any) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
      ...(field === 'quantity' || field === 'unit_price' ? {
        total_amount: (field === 'quantity' ? value : updatedItems[index].quantity) * 
                     (field === 'unit_price' ? value : updatedItems[index].unit_price)
      } : {})
    };
    
    setFormData({
      ...formData,
      items: updatedItems
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplier_name.trim()) {
      toast({
        title: "Error",
        description: "Supplier name is required",
        variant: "destructive",
      });
      return;
    }

    if (formData.items.length === 0) {
      toast({
        title: "Error",
        description: "At least one item is required",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate(formData);
  };

  const totalAmount = formData.items.reduce((sum, item) => sum + (item.total_amount || 0), 0);
  const taxPercentage = formData.tax_percentage || 18;
  const taxAmount = totalAmount * (taxPercentage / 100);
  const grandTotal = totalAmount + taxAmount;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Internal Purchase Order</DialogTitle>
          <DialogDescription>
            Fill in the supplier details and add items to create a new internal purchase order.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Supplier Information */}
          <Card>
            <CardHeader>
              <CardTitle>Supplier Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="supplier_name">Supplier Name *</Label>
                <Input
                  id="supplier_name"
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                  placeholder="Enter supplier company name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  placeholder="Contact person name"
                />
              </div>
              
              <div>
                <Label htmlFor="contact_phone">Phone Number</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="supplier_address">Address</Label>
                <Textarea
                  id="supplier_address"
                  value={formData.supplier_address}
                  onChange={(e) => setFormData({ ...formData, supplier_address: e.target.value })}
                  placeholder="Supplier address"
                  rows={2}
                />
              </div>
              
              <div>
                <Label htmlFor="supplier_email">Email</Label>
                <Input
                  id="supplier_email"
                  type="email"
                  value={formData.supplier_email}
                  onChange={(e) => setFormData({ ...formData, supplier_email: e.target.value })}
                  placeholder="supplier@example.com"
                />
              </div>
              
              <div>
                <Label htmlFor="supplier_ntn">NTN Number</Label>
                <Input
                  id="supplier_ntn"
                  value={formData.supplier_ntn}
                  onChange={(e) => setFormData({ ...formData, supplier_ntn: e.target.value })}
                  placeholder="NTN number"
                />
              </div>
              
              <div>
                <Label htmlFor="supplier_strn">STRN Number</Label>
                <Input
                  id="supplier_strn"
                  value={formData.supplier_strn}
                  onChange={(e) => setFormData({ ...formData, supplier_strn: e.target.value })}
                  placeholder="STRN number"
                />
              </div>
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="order_date">Order Date</Label>
                <Input
                  id="order_date"
                  type="date"
                  value={formData.order_date}
                  onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="expected_date">Expected Delivery Date</Label>
                <Input
                  id="expected_date"
                  type="date"
                  value={formData.expected_date}
                  onChange={(e) => setFormData({ ...formData, expected_date: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="tax_percentage">Tax Percentage (%)</Label>
                <Input
                  id="tax_percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.tax_percentage || 18}
                  onChange={(e) => setFormData({ ...formData, tax_percentage: parseFloat(e.target.value) || 0 })}
                  placeholder="18"
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes or special instructions"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Items Section */}
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Item */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label htmlFor="item_name">Raw Material *</Label>
                  <Select
                    value={selectedMaterialId}
                    onValueChange={(value) => {
                      const selectedMaterial = rawMaterials.find((m: any) => 
                        (m.raw_material_id && m.raw_material_id === value) || 
                        (m.material_id && m.material_id === value)
                      );
                      if (selectedMaterial) {
                        setSelectedMaterialId(value);
                        setNewItem({ 
                          ...newItem, 
                          material_id: selectedMaterial.material_id || selectedMaterial.raw_material_id || value,
                          item_name: `${selectedMaterial.material_code || selectedMaterial.code || ''} - ${selectedMaterial.name || ''}`.trim(),
                          description: selectedMaterial.description || newItem.description,
                          uom_id: selectedMaterial.uom_id || newItem.uom_id
                        });
                      }
                    }}
                    disabled={loadingMaterials}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingMaterials ? "Loading materials..." : "Select raw material"} />
                    </SelectTrigger>
                    <SelectContent>
                      {rawMaterials.length === 0 ? (
                        <SelectItem value="" disabled>No raw materials available</SelectItem>
                      ) : (
                        rawMaterials.map((material: any) => {
                          const materialId = material.raw_material_id || material.material_id;
                          const materialCode = material.material_code || material.code || '';
                          const materialName = material.name || '';
                          return (
                            <SelectItem 
                              key={materialId} 
                              value={materialId}
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {materialCode ? `${materialCode} - ${materialName}` : materialName}
                                </span>
                                {material.description && (
                                  <span className="text-xs text-gray-500">{material.description}</span>
                                )}
                              </div>
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="item_description">Description</Label>
                  <Input
                    id="item_description"
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Item description"
                  />
                </div>
                
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 1 })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="unit_price">Unit Price</Label>
                  <Input
                    id="unit_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newItem.unit_price}
                    onChange={(e) => setNewItem({ ...newItem, unit_price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                
                <div className="flex items-end">
                  <Button type="button" onClick={addItem} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>

              {/* Items List */}
              {formData.items.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Added Items</h4>
                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-3 border rounded-lg">
                      <div>
                        <Label>Item Name</Label>
                        <Input
                          value={item.item_name}
                          onChange={(e) => updateItem(index, 'item_name', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label>Description</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 1)}
                        />
                      </div>
                      
                      <div>
                        <Label>Unit Price</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      
                      <div className="flex items-end">
                        <div className="w-full">
                          <Label>Total</Label>
                          <div className="p-2 bg-gray-100 rounded text-sm font-medium">
                            PKR {(item.total_amount || 0).toLocaleString()}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="w-full mt-2"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Totals */}
              {formData.items.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>PKR {totalAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sales Tax ({taxPercentage}%):</span>
                        <span>PKR {taxAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Total:</span>
                        <span>PKR {grandTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create IPO'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateIPOModal;
