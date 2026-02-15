import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OEM } from "@/types";

interface OEMModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (oem: Omit<OEM, "id" | "createdAt">) => void;
  editingOEM?: OEM | null;
}

export const OEMModal: React.FC<OEMModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingOEM,
}) => {
  const [name, setName] = useState("");

  useEffect(() => {
    if (editingOEM) {
      setName(editingOEM.name);
    } else {
      setName("");
    }
  }, [editingOEM, isOpen]);

  const handleSave = () => {
    if (!name.trim()) return;
    
    onSave({ name: name.trim() });
    setName("");
    onClose();
  };

  const handleClose = () => {
    setName("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingOEM ? "Edit OEM" : "Add New OEM"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="oem-name">OEM Name *</Label>
            <Input
              id="oem-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter OEM name"
              className="w-full"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!name.trim()}
          >
            {editingOEM ? "Update" : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};