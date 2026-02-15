import React, { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { sampleProducts } from "@/data/sampleData";

interface CreateWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateWorkOrderModal: React.FC<CreateWorkOrderModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    productId: "",
    quantity: "",
    startDate: "",
    endDate: "",
    remarks: "",
  });
  
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const quantity = parseFloat(formData.quantity);
    
    if (!formData.productId || quantity <= 0 || !formData.startDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields with valid values.",
        variant: "destructive",
      });
      return;
    }

    // Here you would typically call an API to create work order
    console.log("Creating work order:", formData);
    
    const selectedProduct = sampleProducts.find(p => p.id === formData.productId);
    const woNumber = `WO-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;
    
    toast({
      title: "Work Order Created",
      description: `Work order ${woNumber} created for ${quantity} ${selectedProduct?.partName}`,
    });
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-background rounded-lg shadow-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Create Work Order</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product">Product *</Label>
            <Select value={formData.productId} onValueChange={(value) => setFormData(prev => ({ ...prev, productId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select product to manufacture" />
              </SelectTrigger>
              <SelectContent>
                {sampleProducts.filter(p => p.category === "FINISHED_GOOD").map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.code} - {product.partName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity to Manufacture *</Label>
            <Input
              id="quantity"
              type="number"
              step="1"
              min="1"
              placeholder="Enter quantity"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date *</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">Target End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              min={formData.startDate}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              placeholder="Optional remarks or special instructions"
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
              Create Work Order
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};