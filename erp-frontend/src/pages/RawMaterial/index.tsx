import React, { useState, useEffect } from "react";
import { Package, Plus, RefreshCw, Edit, Trash2, AlertTriangle, TrendingUp, TrendingDown, Box, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatsCard } from "@/components/ui/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { rawMaterialApi, uomApi } from "@/services/api";
import RawMaterialImportModal from "@/components/raw-material/RawMaterialImportModal";
import GenericExportModal from "@/components/common/GenericExportModal";

interface RawMaterial {
  raw_material_id: string;
  material_code: string;
  name: string;
  description?: string;
  uom_id?: string;
  uom_code?: string;
  uom_name?: string;
  material_id?: string;
  created_at: string;
  updated_at: string;
}

interface RawMaterialFormData {
  material_code: string;
  name: string;
  description?: string;
  uom_id?: string;
}

const RawMaterial: React.FC = () => {
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [formData, setFormData] = useState<RawMaterialFormData>({
    material_code: "",
    name: "",
    description: "",
    uom_id: ""
  });
  const [uoms, setUoms] = useState<any[]>([]);
  const { toast } = useToast();

  // Load raw materials data
  const loadRawMaterials = async () => {
    try {
      setLoading(true);
      const [materials, uomsData] = await Promise.all([
        rawMaterialApi.getAll(),
        uomApi.getAll()
      ]);
      
      // Use all materials
      const validMaterials = materials || [];
      
      setRawMaterials(validMaterials);
      setUoms(uomsData || []);

    } catch (error: any) {
      console.error('Error loading raw materials:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load raw materials",
        variant: "destructive"
      });
      // Set empty array on error to prevent undefined data
      setRawMaterials([]);
      setUoms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRawMaterials();
  }, []);

  // Filter raw materials
  const filteredMaterials = rawMaterials.filter(material => {
    if (!material || !material.name || !material.material_code) {
      return false;
    }
    
    const matchesSearch = searchTerm === "" || 
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.material_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (material.description && material.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (material.uom_name && material.uom_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });


  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingMaterial) {
        // Update existing material - exclude material_code as it's not allowed in updates
        const { material_code, ...updateData } = formData;
        await rawMaterialApi.update(editingMaterial.raw_material_id, updateData);
        toast({
          title: "Success",
          description: "Raw material updated successfully",
        });
      } else {
        // Create new material - include all fields
        await rawMaterialApi.create(formData);
        toast({
          title: "Success",
          description: "Raw material created successfully",
        });
      }
      
      // Reset form and reload data
      resetForm();
      loadRawMaterials();
      
    } catch (error: any) {
      console.error('Error saving raw material:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save raw material",
        variant: "destructive"
      });
    }
  };

  // Handle add new material
  const handleAddNew = () => {
    setEditingMaterial(null);
    setFormData({
      material_code: "",
      name: "",
      description: "",
      uom_id: ""
    });
    setIsModalOpen(true);
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      material_code: "",
      name: "",
      description: "",
      uom_id: ""
    });
    setEditingMaterial(null);
    setIsModalOpen(false);
  };

  // Handle edit
  const handleEdit = (material: RawMaterial) => {
    setEditingMaterial(material);
    setFormData({
      material_code: material.material_code,
      name: material.name,
      description: material.description || "",
      uom_id: material.uom_id || ""
    });
    setIsModalOpen(true);
  };

  // Handle delete
  const handleDelete = async (materialId: string) => {
    if (!window.confirm('Are you sure you want to delete this raw material?')) {
      return;
    }
    
    try {
      await rawMaterialApi.delete(materialId);
      toast({
        title: "Success",
        description: "Raw material deleted successfully",
      });
      // Refresh the list after successful deletion
      await loadRawMaterials();
    } catch (error: any) {
      console.error('Error deleting raw material:', error);
      
      // Build detailed error message
      let errorMessage = error.message || "Failed to delete raw material. It may be in use.";
      
      // If the error response includes detailed references, format them nicely
      // The ApiError stores response data in error.response property
      const errorData = error.response || {};
      if (errorData.issues && errorData.issues.length > 0) {
        errorMessage = `Cannot delete this raw material. It is currently being used in:\n\n• ${errorData.issues.join('\n• ')}\n\nPlease remove all references first.`;
      } else if (errorData.references) {
        // Build message from references object if issues array is not available
        const refList: string[] = [];
        if (errorData.references.inventory > 0) refList.push(`${errorData.references.inventory} inventory record(s)`);
        if (errorData.references.bom > 0) refList.push(`${errorData.references.bom} BOM item(s)`);
        if (errorData.references.purchaseOrders > 0) refList.push(`${errorData.references.purchaseOrders} purchase order item(s)`);
        if (errorData.references.purchaseRequisitions > 0) refList.push(`${errorData.references.purchaseRequisitions} purchase requisition item(s)`);
        if (errorData.references.wastages > 0) refList.push(`${errorData.references.wastages} wastage record(s)`);
        if (errorData.references.scrapInventory > 0) refList.push(`${errorData.references.scrapInventory} scrap inventory record(s)`);
        if (refList.length > 0) {
          errorMessage = `Cannot delete this raw material. It is currently being used in:\n\n• ${refList.join('\n• ')}\n\nPlease remove all references first.`;
        }
      }
      
      toast({
        title: "Cannot Delete Raw Material",
        description: errorMessage,
        variant: "destructive",
        duration: 10000 // Show for 10 seconds to allow reading
      });
    }
  };

  // Data table columns
  const columns: Column<RawMaterial>[] = [
    {
      key: "material_code",
      header: "Material Code",
      render: (item) => {
        // The item here is the actual value, not the full object
        return (
          <div className="font-medium text-sm">
            {item || 'N/A'}
          </div>
        );
      }
    },
    {
      key: "name",
      header: "Material Name",
      render: (item) => {
        // The item here is the actual value, not the full object
        return (
          <div className="font-medium">
            {item || 'N/A'}
          </div>
        );
      }
    },
    {
      key: "description",
      header: "Description",
      render: (item) => (
        <div className="text-sm text-gray-600 max-w-xs truncate">
          {item || 'N/A'}
        </div>
      )
    },
    {
      key: "uom_name",
      header: "Unit",
      render: (item) => (
        <div className="text-sm text-gray-600">
          {item || 'N/A'}
        </div>
      )
    },
    {
      key: "created_at",
      header: "Created",
      render: (item) => (
        <div className="text-sm">
          {item ? new Date(item).toLocaleDateString() : 'N/A'}
        </div>
      )
    },
    {
      key: "actions",
      header: "Actions",
      render: (item, rowData) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => rowData && handleEdit(rowData)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => rowData && handleDelete(rowData.raw_material_id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  // Calculate statistics
  const totalItems = rawMaterials.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading raw materials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Raw Materials</h1>
          <p className="text-muted-foreground">
            Manage raw material master data and specifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowImportModal(true)} 
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowExportModal(true)} 
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={loadRawMaterials}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Raw Material
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Total Raw Materials"
          value={totalItems.toLocaleString()}
          icon={Package}
        />
        <StatsCard
          title="With UOM"
          value={rawMaterials.filter(m => m.uom_id).length.toLocaleString()}
          icon={Box}
        />
        <StatsCard
          title="Active Materials"
          value={totalItems.toLocaleString()}
          icon={TrendingUp}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Search</Label>
              <Input
                placeholder="Search by name, code, description, UOM..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Raw Materials Table */}
      <Card>
        <CardHeader>
          <CardTitle>Raw Materials ({filteredMaterials.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMaterials.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No raw materials found</p>
              <p className="text-sm text-gray-400 mt-2">
                {rawMaterials.length === 0 
                  ? "Add your first raw material to get started"
                  : "Try adjusting your search or filter criteria"
                }
              </p>
            </div>
          ) : (
            <DataTable
              data={filteredMaterials}
              columns={columns}
              searchable={false}
            />
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMaterial ? 'Edit Raw Material' : 'Add New Raw Material'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 pb-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 border-b pb-2">Basic Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="material_code">Material Code *</Label>
                  <Input
                    id="material_code"
                    value={formData.material_code}
                    onChange={(e) => setFormData({...formData, material_code: e.target.value})}
                    placeholder="e.g., RM001"
                    required
                    disabled={!!editingMaterial}
                  />
                </div>
                <div>
                  <Label htmlFor="name">Material Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Steel Rod"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter material description..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="uom_id">Unit of Measurement</Label>
                <Select value={formData.uom_id || "none"} onValueChange={(value) => setFormData({...formData, uom_id: value === "none" ? "" : value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No unit</SelectItem>
                    {uoms.map((uom) => (
                      <SelectItem key={uom.uom_id} value={uom.uom_id}>
                        {uom.name} ({uom.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            
            <div className="flex justify-end gap-3 pt-6 border-t bg-gray-50 -mx-6 -mb-6 px-6 py-4">
              <Button type="button" variant="outline" onClick={resetForm} className="min-w-[100px]">
                Cancel
              </Button>
              <Button type="submit" className="min-w-[150px]">
                {editingMaterial ? 'Update' : 'Create'} Raw Material
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {showImportModal && (
        <RawMaterialImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false);
            loadRawMaterials(); // Refresh raw materials data
          }}
        />
      )}

      {showExportModal && (
        <GenericExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onSuccess={() => {
            setShowExportModal(false);
          }}
          title="Export Raw Materials"
          exportFunction={rawMaterialApi.exportRawMaterials}
          filename="raw-materials"
          availableFormats={['pdf', 'csv']}
        />
      )}
    </div>
  );
};

export default RawMaterial;
