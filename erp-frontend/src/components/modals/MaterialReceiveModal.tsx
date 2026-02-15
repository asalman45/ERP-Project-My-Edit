import React, { useState } from "react";
import { X, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { sampleProducts } from "@/data/sampleData";
import { InventoryItem } from "@/types";

interface MaterialReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem?: InventoryItem | null;
}

const locations = ["Warehouse A", "Warehouse B", "Production Floor", "QC Area", "Raw Material Store"];

export const MaterialReceiveModal: React.FC<MaterialReceiveModalProps> = ({
  isOpen,
  onClose,
  selectedItem,
}) => {
  const [formData, setFormData] = useState({
    productId: selectedItem?.productId || "",
    quantity: "",
    location: selectedItem?.location || "",
    batchNo: "",
    remarks: "",
  });
  
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const quantity = parseFloat(formData.quantity);
    
    if (!formData.productId || !formData.location || !formData.batchNo || quantity <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields with valid values.",
        variant: "destructive",
      });
      return;
    }

    // Here you would typically call an API to receive materials
    console.log("Receiving materials:", formData);
    
    const selectedProduct = sampleProducts.find(p => p.id === formData.productId);
    
    toast({
      title: "Materials Received",
      description: `Successfully received ${quantity} ${selectedProduct?.partName} to ${formData.location}`,
    });
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-background rounded-lg shadow-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Receive Materials</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {selectedItem && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Package size={16} />
                <span className="font-medium">{selectedItem.productName}</span>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Code: {selectedItem.productCode}</p>
                <p>Current Stock: {selectedItem.quantityOnHand} {selectedItem.uomCode}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="product">Product *</Label>
            <Select value={formData.productId} onValueChange={(value) => setFormData(prev => ({ ...prev, productId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {sampleProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.code} - {product.partName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter quantity"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Select value={formData.location} onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="batchNo">Batch Number *</Label>
            <Input
              id="batchNo"
              placeholder="Enter batch number"
              value={formData.batchNo}
              onChange={(e) => setFormData(prev => ({ ...prev, batchNo: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              placeholder="Optional remarks"
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Receive Materials
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};