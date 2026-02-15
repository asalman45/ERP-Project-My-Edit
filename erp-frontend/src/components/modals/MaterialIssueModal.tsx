import React, { useState } from "react";
import { X, AlertTriangle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { sampleWorkOrders, sampleInventoryItems } from "@/data/sampleData";
import { InventoryItem, JobStep } from "@/types";

interface MaterialIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem?: InventoryItem | null;
}

const jobSteps: { value: JobStep; label: string }[] = [
  { value: "CUTTING", label: "Cutting" },
  { value: "WELDING", label: "Welding" },
  { value: "ASSEMBLY", label: "Assembly" },
  { value: "QA", label: "Quality Assurance" },
  { value: "FINISHED_GOODS", label: "Finished Goods" },
];

export const MaterialIssueModal: React.FC<MaterialIssueModalProps> = ({
  isOpen,
  onClose,
  selectedItem,
}) => {
  const [formData, setFormData] = useState({
    workOrderId: "",
    step: "" as JobStep,
    componentId: selectedItem?.productId || "",
    quantityToIssue: "",
    remarks: "",
  });
  
  const { toast } = useToast();

  const activeWorkOrders = sampleWorkOrders.filter(wo => wo.status === "IN_PROGRESS");
  const availableStock = selectedItem?.availableQuantity || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const quantityToIssue = parseFloat(formData.quantityToIssue);
    
    if (quantityToIssue > availableStock) {
      toast({
        title: "Insufficient Stock",
        description: `Cannot issue ${quantityToIssue} units. Available stock: ${availableStock}`,
        variant: "destructive",
      });
      return;
    }

    if (!formData.workOrderId || !formData.step || quantityToIssue <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields with valid values.",
        variant: "destructive",
      });
      return;
    }

    // Here you would typically call an API to issue materials
    console.log("Issuing materials:", formData);
    
    toast({
      title: "Materials Issued",
      description: `Successfully issued ${quantityToIssue} ${selectedItem?.uomCode} of ${selectedItem?.productName}`,
    });
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-background rounded-lg shadow-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Issue Materials</h2>
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
                <p>Location: {selectedItem.location}</p>
                <p>Batch: {selectedItem.batchNo}</p>
                <div className="flex items-center gap-2 mt-2">
                  {availableStock <= 0 ? (
                    <div className="flex items-center gap-1 text-destructive">
                      <AlertTriangle size={14} />
                      <span>Out of Stock</span>
                    </div>
                  ) : availableStock < 10 ? (
                    <div className="flex items-center gap-1 text-yellow-600">
                      <AlertTriangle size={14} />
                      <span>Low Stock: {availableStock} {selectedItem.uomCode}</span>
                    </div>
                  ) : (
                    <span className="text-emerald-600">Available: {availableStock} {selectedItem.uomCode}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="workOrder">Work Order *</Label>
            <Select value={formData.workOrderId} onValueChange={(value) => setFormData(prev => ({ ...prev, workOrderId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select work order" />
              </SelectTrigger>
              <SelectContent>
                {activeWorkOrders.map((wo) => (
                  <SelectItem key={wo.id} value={wo.id}>
                    {wo.number} - {wo.productName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="step">Step *</Label>
            <Select value={formData.step} onValueChange={(value) => setFormData(prev => ({ ...prev, step: value as JobStep }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select step" />
              </SelectTrigger>
              <SelectContent>
                {jobSteps.map((step) => (
                  <SelectItem key={step.value} value={step.value}>
                    {step.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity to Issue *</Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              min="0"
              max={availableStock}
              placeholder="Enter quantity"
              value={formData.quantityToIssue}
              onChange={(e) => setFormData(prev => ({ ...prev, quantityToIssue: e.target.value }))}
              required
            />
            {selectedItem && (
              <p className="text-xs text-muted-foreground">
                Available: {availableStock} {selectedItem.uomCode}
              </p>
            )}
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
            <Button 
              type="submit" 
              className="flex-1"
              disabled={availableStock <= 0}
            >
              Issue Materials
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};