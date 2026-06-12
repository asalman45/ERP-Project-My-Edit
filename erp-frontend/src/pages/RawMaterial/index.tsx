import React, { useState, useEffect } from "react";
import { Package, Plus, RefreshCw, Edit, Trash2, TrendingUp, Box, Upload, Download, Filter, Tag, Layers, Wrench, Archive, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatsCard } from "@/components/ui/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { rawMaterialApi, uomApi } from "@/services/api";
import RawMaterialImportModal from "@/components/raw-material/RawMaterialImportModal";
import GenericExportModal from "@/components/common/GenericExportModal";

// ─── Sub-Category Configuration ──────────────────────────────────────────────
const SUB_CATEGORIES = [
  {
    value: "DIRECT_MATERIAL",
    label: "Direct Material",
    description: "Goes directly into the finished product",
    icon: Package,
    color: "bg-blue-100 text-blue-700 border-blue-300",
    dotColor: "bg-blue-500",
    examples: "Steel sheets, rubber, plastic caps",
  },
  {
    value: "INDIRECT_MATERIAL",
    label: "Indirect Material",
    description: "Supports production but not part of product",
    icon: FlaskConical,
    color: "bg-purple-100 text-purple-700 border-purple-300",
    dotColor: "bg-purple-500",
    examples: "Cutting oil, abrasives, sandpaper, solvents",
  },
  {
    value: "MRO",
    label: "MRO",
    description: "Maintenance, Repair & Operations",
    icon: Wrench,
    color: "bg-orange-100 text-orange-700 border-orange-300",
    dotColor: "bg-orange-500",
    examples: "Machine parts, tools, lubricants, fuel",
  },
  {
    value: "PACKAGING",
    label: "Packaging",
    description: "Packing and shipping materials",
    icon: Archive,
    color: "bg-green-100 text-green-700 border-green-300",
    dotColor: "bg-green-500",
    examples: "Polythene bags, cartons, bubble wrap",
  },
  {
    value: "SEMI_FINISHED",
    label: "Semi-Finished",
    description: "Work-in-progress / intermediate goods",
    icon: Layers,
    color: "bg-yellow-100 text-yellow-700 border-yellow-300",
    dotColor: "bg-yellow-500",
    examples: "Cut blanks, sub-assemblies",
  },
];

const getCategoryMeta = (value: string | null | undefined) =>
  SUB_CATEGORIES.find((c) => c.value === value) || null;

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface RawMaterial {
  raw_material_id: string;
  material_code: string;
  name: string;
  description?: string;
  uom_id?: string;
  uom_code?: string;
  uom_name?: string;
  material_id?: string;
  hs_code?: string;
  sub_category?: string | null;
  created_at: string;
  updated_at: string;
}

interface RawMaterialFormData {
  material_code: string;
  name: string;
  description?: string;
  uom_id?: string;
  hs_code?: string;
  sub_category?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
const RawMaterial: React.FC = () => {
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [formData, setFormData] = useState<RawMaterialFormData>({
    material_code: "",
    name: "",
    description: "",
    uom_id: "",
    hs_code: "",
    sub_category: "",
  });
  const [uoms, setUoms] = useState<any[]>([]);
  const { toast } = useToast();

  const loadRawMaterials = async () => {
    try {
      setLoading(true);
      const [materials, uomsData] = await Promise.all([
        rawMaterialApi.getAll(),
        uomApi.getAll(),
      ]);
      setRawMaterials(materials || []);
      setUoms(uomsData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load raw materials",
        variant: "destructive",
      });
      setRawMaterials([]);
      setUoms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRawMaterials();
  }, []);

  // ─── Filtering ─────────────────────────────────────────────────────────────
  const filteredMaterials = rawMaterials.filter((material) => {
    if (!material?.name || !material?.material_code) return false;
    const matchesSearch =
      !searchTerm ||
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.material_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (material.description?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (material.hs_code?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (material.uom_name?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory =
      filterCategory === "ALL" || material.sub_category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // ─── Stats ─────────────────────────────────────────────────────────────────
  const countByCategory = (cat: string) =>
    rawMaterials.filter((m) => m.sub_category === cat).length;
  const uncategorised = rawMaterials.filter((m) => !m.sub_category).length;

  // ─── CRUD Handlers ─────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        sub_category: formData.sub_category || null,
        uom_id: formData.uom_id || null,
      };
      if (editingMaterial) {
        await rawMaterialApi.update(editingMaterial.raw_material_id, payload);
        toast({ title: "Success", description: "Raw material updated successfully" });
      } else {
        await rawMaterialApi.create(payload);
        toast({ title: "Success", description: "Raw material created successfully" });
      }
      resetForm();
      loadRawMaterials();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save raw material",
        variant: "destructive",
      });
    }
  };

  const handleAddNew = () => {
    setEditingMaterial(null);
    setFormData({ material_code: "", name: "", description: "", uom_id: "", hs_code: "", sub_category: "" });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({ material_code: "", name: "", description: "", uom_id: "", hs_code: "", sub_category: "" });
    setEditingMaterial(null);
    setIsModalOpen(false);
  };

  const handleEdit = (material: RawMaterial) => {
    setEditingMaterial(material);
    setFormData({
      material_code: material.material_code,
      name: material.name,
      description: material.description || "",
      uom_id: material.uom_id || "",
      hs_code: material.hs_code || "",
      sub_category: material.sub_category || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (materialId: string) => {
    if (!window.confirm("Are you sure you want to delete this raw material?")) return;
    try {
      await rawMaterialApi.delete(materialId);
      toast({ title: "Success", description: "Raw material deleted successfully" });
      await loadRawMaterials();
    } catch (error: any) {
      const errorData = error.response || {};
      let errorMessage = error.message || "Failed to delete raw material. It may be in use.";
      if (errorData.issues?.length > 0) {
        errorMessage = `Cannot delete. In use by:\n• ${errorData.issues.join("\n• ")}`;
      }
      toast({ title: "Cannot Delete", description: errorMessage, variant: "destructive", duration: 10000 });
    }
  };

  // ─── Table Columns ─────────────────────────────────────────────────────────
  const columns: Column<RawMaterial>[] = [
    {
      key: "material_code",
      header: "Code",
      render: (item) => <div className="font-mono font-semibold text-sm text-blue-700">{item || "N/A"}</div>,
    },
    {
      key: "name",
      header: "Material Name",
      render: (item) => <div className="font-medium">{item || "N/A"}</div>,
    },
    {
      key: "sub_category",
      header: "Category",
      render: (item) => {
        const meta = getCategoryMeta(item as string);
        if (!meta) return <span className="text-xs text-gray-400 italic">Uncategorised</span>;
        return (
          <Badge variant="outline" className={`text-xs font-medium ${meta.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${meta.dotColor} mr-1.5 inline-block`} />
            {meta.label}
          </Badge>
        );
      },
    },
    {
      key: "hs_code",
      header: "HS Code",
      render: (item) => <div className="text-sm font-semibold text-blue-600">{item || "—"}</div>,
    },
    {
      key: "uom_name",
      header: "Unit",
      render: (item) => <div className="text-sm text-gray-600">{item || "—"}</div>,
    },
    {
      key: "created_at",
      header: "Created",
      render: (item) => (
        <div className="text-sm text-gray-500">{item ? new Date(item).toLocaleDateString() : "—"}</div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item, rowData) => (
        <div className="flex items-center gap-1">
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
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
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
          <p className="text-muted-foreground">Manage raw material master data and specifications</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowImportModal(true)} className="flex items-center gap-2">
            <Upload className="h-4 w-4" /> Import
          </Button>
          <Button variant="outline" onClick={() => setShowExportModal(true)} className="flex items-center gap-2">
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button variant="outline" onClick={loadRawMaterials}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" /> Add Raw Material
          </Button>
        </div>
      </div>

      {/* Stats Cards — by sub-category */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatsCard title="Total" value={rawMaterials.length.toString()} icon={Package} />
        {SUB_CATEGORIES.map((cat) => (
          <div
            key={cat.value}
            onClick={() => setFilterCategory(filterCategory === cat.value ? "ALL" : cat.value)}
            className={`cursor-pointer rounded-lg border-2 p-3 transition-all hover:shadow-md ${
              filterCategory === cat.value
                ? "border-blue-500 bg-blue-50"
                : "border-transparent bg-white hover:border-gray-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${cat.dotColor}`} />
              <span className="text-xs font-medium text-gray-600 truncate">{cat.label}</span>
            </div>
            <div className="text-2xl font-bold">{countByCategory(cat.value)}</div>
            {filterCategory === cat.value && (
              <div className="text-xs text-blue-600 mt-0.5">● Filtered</div>
            )}
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Search</Label>
              <Input
                placeholder="Name, code, HS code, UOM..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories ({rawMaterials.length})</SelectItem>
                  {SUB_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label} ({countByCategory(cat.value)})
                    </SelectItem>
                  ))}
                  <SelectItem value="NONE">Uncategorised ({uncategorised})</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(searchTerm || filterCategory !== "ALL") && (
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => { setSearchTerm(""); setFilterCategory("ALL"); }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Raw Materials ({filteredMaterials.length})</span>
            {filterCategory !== "ALL" && (
              <Badge variant="outline" className={getCategoryMeta(filterCategory)?.color || ""}>
                Filtered: {getCategoryMeta(filterCategory)?.label || filterCategory}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMaterials.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">No raw materials found</p>
              <p className="text-sm text-gray-400 mt-1">
                {rawMaterials.length === 0
                  ? "Add your first raw material to get started"
                  : "Try adjusting your search or category filter"}
              </p>
            </div>
          ) : (
            <DataTable data={filteredMaterials} columns={columns} searchable={false} />
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMaterial ? "Edit Raw Material" : "Add New Raw Material"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 pb-4">

            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 border-b pb-2">Basic Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="material_code">Material Code *</Label>
                  <Input
                    id="material_code"
                    value={formData.material_code}
                    onChange={(e) => setFormData({ ...formData, material_code: e.target.value })}
                    placeholder="e.g., RM001"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="name">Material Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter material description..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="uom_id">Unit of Measurement</Label>
                  <Select
                    value={formData.uom_id || "none"}
                    onValueChange={(v) => setFormData({ ...formData, uom_id: v === "none" ? "" : v })}
                  >
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
                <div>
                  <Label htmlFor="hs_code">HS Code</Label>
                  <Input
                    id="hs_code"
                    value={formData.hs_code || ""}
                    onChange={(e) => setFormData({ ...formData, hs_code: e.target.value })}
                    placeholder="e.g., 7208.51.00"
                  />
                </div>
              </div>
            </div>

            {/* Category Selection */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                <Tag className="h-4 w-4" /> Material Category
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {SUB_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = formData.sub_category === cat.value;
                  return (
                    <div
                      key={cat.value}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          sub_category: isSelected ? "" : cat.value,
                        })
                      }
                      className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? `${cat.color} border-current`
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className={`p-1.5 rounded-md ${isSelected ? "bg-white/60" : "bg-gray-100"}`}>
                        <Icon className={`h-4 w-4 ${isSelected ? "" : "text-gray-500"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{cat.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{cat.description}</div>
                        <div className="text-xs text-gray-400 mt-0.5 italic">e.g. {cat.examples}</div>
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-current flex-shrink-0 mt-1 opacity-60" />
                      )}
                    </div>
                  );
                })}
              </div>
              {!formData.sub_category && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  ⚠ No category selected — material will appear as "Uncategorised"
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t bg-gray-50 -mx-6 -mb-6 px-6 py-4">
              <Button type="button" variant="outline" onClick={resetForm} className="min-w-[100px]">
                Cancel
              </Button>
              <Button type="submit" className="min-w-[160px]">
                {editingMaterial ? "Update" : "Create"} Raw Material
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {showImportModal && (
        <RawMaterialImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => { setShowImportModal(false); loadRawMaterials(); }}
        />
      )}

      {showExportModal && (
        <GenericExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onSuccess={() => setShowExportModal(false)}
          title="Export Raw Materials"
          exportFunction={rawMaterialApi.exportRawMaterials}
          filename="raw-materials"
          availableFormats={["pdf", "csv"]}
        />
      )}
    </div>
  );
};

export default RawMaterial;
