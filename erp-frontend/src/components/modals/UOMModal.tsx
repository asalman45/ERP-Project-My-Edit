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
import { UOM } from "@/types";

interface UOMModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (uomData: Omit<UOM, "id" | "createdAt">) => Promise<void>;
  editingUOM?: UOM | null;
}

const UOMModal: React.FC<UOMModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingUOM,
}) => {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes or editing UOM changes
  useEffect(() => {
    if (isOpen) {
      if (editingUOM) {
        setFormData({
          code: editingUOM.code,
          name: editingUOM.name,
        });
      } else {
        setFormData({
          code: "",
          name: "",
        });
      }
      setErrors({});
    }
  }, [isOpen, editingUOM]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = "UOM code is required";
    }

    if (!formData.name.trim()) {
      newErrors.name = "UOM name is required";
    }

    // Check if code is alphanumeric and uppercase
    if (formData.code && !/^[A-Z0-9]+$/.test(formData.code.trim())) {
      newErrors.code = "UOM code must contain only uppercase letters and numbers";
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
      const uomData = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
      };

      await onSave(uomData);
      onClose();
    } catch (error) {
      console.error("Error saving UOM:", error);
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingUOM ? "Edit UOM" : "Add New UOM"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            {/* UOM Code */}
            <Label htmlFor="code">UOM Code *</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => handleInputChange("code", e.target.value.toUpperCase())}
              placeholder="e.g., PCS, KG, L"
              className={errors.code ? "border-red-500" : ""}
              maxLength={10}
            />
            {errors.code && (
              <p className="text-sm text-red-500">{errors.code}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Use uppercase letters and numbers only (e.g., PCS, KG, L)
            </p>
          </div>

          <div className="space-y-2">
            {/* UOM Name */}
            <Label htmlFor="name">UOM Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="e.g., Pieces, Kilogram, Liter"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {editingUOM ? "Update UOM" : "Add UOM"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UOMModal;
