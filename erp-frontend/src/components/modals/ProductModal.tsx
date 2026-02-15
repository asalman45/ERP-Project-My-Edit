import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Product, OEM, Model, UOM, ProductCategory } from "@/types";
import { useOEMs, useModels, useUOMs } from "@/hooks/useMasterData";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Omit<Product, "id" | "createdAt" | "oemName" | "modelName" | "uomCode">) => Promise<void>;
  editingProduct?: Product | null;
}

const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingProduct,
}) => {
  const { oems } = useOEMs();
  const { models, fetchModels } = useModels();
  const { uoms } = useUOMs();

  const [formData, setFormData] = useState({
    code: "",
    partName: "",
    oemId: "",
    modelId: "",
    uomId: "",
    standardCost: "",
    category: "FINISHED_GOOD" as ProductCategory,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes or editing product changes
  useEffect(() => {
    if (isOpen) {
      if (editingProduct) {
        setFormData({
          code: editingProduct.code,
          partName: editingProduct.partName,
          oemId: editingProduct.oemId,
          modelId: editingProduct.modelId,
          uomId: editingProduct.uomId,
          standardCost: editingProduct.standardCost?.toString() || "",
          category: editingProduct.category,
        });
      } else {
        setFormData({
          code: "",
          partName: "",
          oemId: "",
          modelId: "",
          uomId: "",
          standardCost: "",
          category: "FINISHED_GOOD",
        });
      }
      setErrors({});
    }
  }, [isOpen, editingProduct]);

  // Fetch models when OEM changes
  useEffect(() => {
    if (formData.oemId) {
      fetchModels();
    }
  }, [formData.oemId, fetchModels]);

  // Filter models by selected OEM
  const filteredModels = models.filter(model => model.oemId === formData.oemId);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = "Product code is required";
    }

    if (!formData.partName.trim()) {
      newErrors.partName = "Part name is required";
    }

    if (!formData.oemId) {
      newErrors.oemId = "OEM is required";
    }

    if (!formData.modelId) {
      newErrors.modelId = "Model is required";
    }

    if (!formData.uomId) {
      newErrors.uomId = "UOM is required";
    }

    if (formData.standardCost && isNaN(Number(formData.standardCost))) {
      newErrors.standardCost = "Standard cost must be a valid number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const productData = {
        code: formData.code.trim(),
        partName: formData.partName.trim(),
        oemId: formData.oemId,
        modelId: formData.modelId,
        uomId: formData.uomId,
        standardCost: formData.standardCost ? Number(formData.standardCost) : undefined,
        category: formData.category,
      };

      await onSave(productData);
      onClose();
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingProduct ? "Edit Product" : "Add New Product"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Product Code */}
            <div className="space-y-2">
              <Label htmlFor="code">Product Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleInputChange("code", e.target.value)}
                placeholder="Enter product code"
                className={errors.code ? "border-red-500" : ""}
              />
              {errors.code && (
                <p className="text-sm text-red-500">{errors.code}</p>
              )}
            </div>

            {/* Part Name */}
            <div className="space-y-2">
              <Label htmlFor="partName">Part Name *</Label>
              <Input
                id="partName"
                value={formData.partName}
                onChange={(e) => handleInputChange("partName", e.target.value)}
                placeholder="Enter part name"
                className={errors.partName ? "border-red-500" : ""}
              />
              {errors.partName && (
                <p className="text-sm text-red-500">{errors.partName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* OEM Selection */}
            <div className="space-y-2">
              <Label htmlFor="oemId">OEM *</Label>
              <Select
                value={formData.oemId}
                onValueChange={(value) => {
                  handleInputChange("oemId", value);
                  handleInputChange("modelId", ""); // Reset model when OEM changes
                }}
              >
                <SelectTrigger className={errors.oemId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select OEM" />
                </SelectTrigger>
                <SelectContent>
                  {oems.map((oem) => (
                    <SelectItem key={oem.id} value={oem.id}>
                      {oem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.oemId && (
                <p className="text-sm text-red-500">{errors.oemId}</p>
              )}
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <Label htmlFor="modelId">Model *</Label>
              <Select
                value={formData.modelId}
                onValueChange={(value) => handleInputChange("modelId", value)}
                disabled={!formData.oemId}
              >
                <SelectTrigger className={errors.modelId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select Model" />
                </SelectTrigger>
                <SelectContent>
                  {filteredModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name} {model.year && `(${model.year})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.modelId && (
                <p className="text-sm text-red-500">{errors.modelId}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* UOM Selection */}
            <div className="space-y-2">
              <Label htmlFor="uomId">Unit of Measure *</Label>
              <Select
                value={formData.uomId}
                onValueChange={(value) => handleInputChange("uomId", value)}
              >
                <SelectTrigger className={errors.uomId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select UOM" />
                </SelectTrigger>
                <SelectContent>
                  {uoms.map((uom) => (
                    <SelectItem key={uom.id} value={uom.id}>
                      {uom.code} - {uom.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.uomId && (
                <p className="text-sm text-red-500">{errors.uomId}</p>
              )}
            </div>

            {/* Standard Cost */}
            <div className="space-y-2">
              <Label htmlFor="standardCost">Standard Cost</Label>
              <Input
                id="standardCost"
                type="number"
                step="0.01"
                value={formData.standardCost}
                onChange={(e) => handleInputChange("standardCost", e.target.value)}
                placeholder="0.00"
                className={errors.standardCost ? "border-red-500" : ""}
              />
              {errors.standardCost && (
                <p className="text-sm text-red-500">{errors.standardCost}</p>
              )}
            </div>
          </div>

          {/* Category Selection - Fixed to Finished Good */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value="FINISHED_GOOD"
              disabled={true}
            >
              <SelectTrigger className="bg-gray-50">
                <SelectValue>Finished Good</SelectValue>
              </SelectTrigger>
            </Select>
            <p className="text-xs text-muted-foreground">Category is fixed to Finished Good</p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {editingProduct ? "Update Product" : "Add Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductModal;
