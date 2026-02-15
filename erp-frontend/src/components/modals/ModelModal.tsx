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
import { Model, OEM } from "@/types";
import { useOEMs } from "@/hooks/useMasterData";

interface ModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (modelData: Omit<Model, "id" | "createdAt" | "oemName">) => Promise<void>;
  editingModel?: Model | null;
}

const ModelModal: React.FC<ModelModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingModel,
}) => {
  const { oems } = useOEMs();

  const [formData, setFormData] = useState({
    name: "",
    year: "",
    oemId: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes or editing model changes
  useEffect(() => {
    if (isOpen) {
      if (editingModel) {
        setFormData({
          name: editingModel.name,
          year: editingModel.year || "",
          oemId: editingModel.oemId,
        });
      } else {
        setFormData({
          name: "",
          year: "",
          oemId: "",
        });
      }
      setErrors({});
    }
  }, [isOpen, editingModel]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Model name is required";
    }

    if (!formData.oemId) {
      newErrors.oemId = "OEM is required";
    }

    if (formData.year && isNaN(Number(formData.year))) {
      newErrors.year = "Year must be a valid number";
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
      const modelData = {
        name: formData.name.trim(),
        year: formData.year.trim() || undefined,
        oemId: formData.oemId,
      };

      await onSave(modelData);
      onClose();
    } catch (error) {
      console.error("Error saving model:", error);
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
            {editingModel ? "Edit Model" : "Add New Model"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            {/* Model Name */}
            <Label htmlFor="name">Model Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter model name"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* OEM Selection */}
            <div className="space-y-2">
              <Label htmlFor="oemId">OEM *</Label>
              <Select
                value={formData.oemId}
                onValueChange={(value) => handleInputChange("oemId", value)}
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

            {/* Year */}
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => handleInputChange("year", e.target.value)}
                placeholder="e.g., 2023"
                min="1900"
                max="2100"
                className={errors.year ? "border-red-500" : ""}
              />
              {errors.year && (
                <p className="text-sm text-red-500">{errors.year}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {editingModel ? "Update Model" : "Add Model"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ModelModal;
