import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Eye, Edit, Trash2, Package, AlertTriangle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatsCard } from "@/components/ui/stats-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import LoadingSpinner from "@/components/LoadingSpinner";
import { scrapApi } from "./api";
import { ScrapInventory, CreateScrapRequest, ScrapFilters } from "./types";
import { useToast } from "@/hooks/use-toast";

// Import material and location APIs from global services for now (we'll refactor this later)
import { materialApi, locationApi, scrapManagementApi } from "@/services/api";

const ScrapManagementPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [selectedScrapForRestore, setSelectedScrapForRestore] = useState<ScrapInventory | null>(null);
  const [restoreData, setRestoreData] = useState({
    quantity_to_restore: '',
    reason: '',
    material_id: '' // Added material_id field
  });
  const [filters, setFilters] = useState<ScrapFilters>({
    status: "all",
    location_id: "all",
    material_id: "all",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch scrap inventory with error handling
  const { data: scrapInventory = [], isLoading, error } = useQuery({
    queryKey: ["scrap-inventory", filters],
    queryFn: async () => {
      try {
        const data = await scrapApi.getAll({
          status: filters.status === "all" ? undefined : filters.status,
          location_id: filters.location_id === "all" ? undefined : filters.location_id,
          material_id: filters.material_id === "all" ? undefined : filters.material_id,
          limit: 100,
        });
        
        // Ensure we have an array and filter out any null/undefined records
        const validData = Array.isArray(data) ? data.filter(record => record != null) : [];
        
        // Map scrap_id to id for frontend compatibility
        const mappedData = validData.map((record: any) => ({
          ...record,
          id: record.scrap_id || record.id,
        }));
        
        console.log('Scrap inventory loaded:', mappedData.length, 'valid records');
        
        return mappedData;
      } catch (error) {
        console.error('Error fetching scrap inventory:', error);
        throw error;
      }
    },
    retry: 2,
  });

  // Fetch materials with error handling
  const { data: materials = [], isLoading: materialsLoading, error: materialsError } = useQuery({
    queryKey: ["materials"],
    queryFn: async () => {
      try {
        const data = await materialApi.getAll();
        console.log('Materials loaded:', data?.length || 0, 'materials');
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching materials:', error);
        return [];
      }
    },
    retry: 2,
  });

  // Fetch locations with error handling
  const { data: locations = [] } = useQuery({
    queryKey: ["locations"],
    queryFn: () => locationApi.getAll(),
    retry: 2,
  });

  // Create scrap mutation
  const createScrapMutation = useMutation({
    mutationFn: scrapApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scrap-inventory"] });
      setShowCreateModal(false);
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      scrapApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scrap-inventory"] });
    },
  });

  // Delete scrap mutation
  const deleteScrapMutation = useMutation({
    mutationFn: scrapApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scrap-inventory"] });
    },
  });

  // Restore scrap to inventory mutation
  const restoreMutation = useMutation({
    mutationFn: ({ scrapId, data }: { scrapId: string, data: any }) =>
      scrapManagementApi.restoreToInventory(scrapId, data),
    onSuccess: (data, variables) => {
      const restoredQuantity = variables.data.quantity_to_restore;
      queryClient.invalidateQueries({ queryKey: ["scrap-inventory"] });
      setShowRestoreDialog(false);
      setSelectedScrapForRestore(null);
      setRestoreData({ quantity_to_restore: '', reason: '', material_id: '' });
      toast({
        title: "Success",
        description: data?.message || `Successfully restored ${restoredQuantity} kg to inventory`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to restore scrap to inventory",
        variant: "destructive",
      });
    },
  });

  // Filter scrap inventory based on search term (with null safety)
  const filteredScrap = scrapInventory.filter((scrap: ScrapInventory) => {
    if (!scrap) return false; // Skip null/undefined records
    
    return (
      (scrap.material_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (scrap.location_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (scrap.status || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (scrap.reference || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (scrap.work_order_no || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (scrap.sub_assembly_names || scrap.sub_assembly_name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Calculate statistics (with null safety)
  const validScrapRecords = scrapInventory.filter(scrap => scrap && typeof scrap.weight_kg === 'number');
  const totalScrap = validScrapRecords.length;
  const availableScrap = validScrapRecords.filter((scrap: ScrapInventory) => scrap.status === "AVAILABLE").length;
  const consumedScrap = validScrapRecords.filter((scrap: ScrapInventory) => scrap.status === "CONSUMED").length;
  const totalWeight = validScrapRecords.reduce((sum: number, scrap: ScrapInventory) => sum + scrap.weight_kg, 0);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      AVAILABLE: { variant: "default" as const, label: "Available" },
      CONSUMED: { variant: "secondary" as const, label: "Consumed" },
      SOLD: { variant: "success" as const, label: "Sold" },
      QUARANTINED: { variant: "destructive" as const, label: "Quarantined" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { variant: "default" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const columns: Column<ScrapInventory>[] = [
    {
      key: "material_name",
      header: "Material",
      render: (value, scrap) => (
        <div>
        <div className="font-medium">{scrap?.material_name || "Unknown Material"}</div>
          {(scrap?.sub_assembly_names || scrap?.sub_assembly_name) && (
            <div className="text-xs text-muted-foreground mt-1">
              {scrap.sub_assembly_names || scrap.sub_assembly_name}
              {scrap.sub_assembly_count && scrap.sub_assembly_count > 1 && (
                <span className="ml-1 text-blue-600">({scrap.sub_assembly_count})</span>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "dimensions",
      header: "Dimensions (mm)",
      render: (value, scrap) => (
        <div className="text-sm text-muted-foreground">
          {scrap?.width_mm && scrap?.length_mm && scrap?.thickness_mm 
            ? `${scrap.width_mm} × ${scrap.length_mm} × ${scrap.thickness_mm}`
            : "-"
          }
        </div>
      ),
    },
    {
      key: "weight_kg",
      header: "Weight (kg)",
      render: (value, scrap) => (
        <div className="font-medium">{scrap?.weight_kg ? scrap.weight_kg.toFixed(2) : "0.00"}</div>
      ),
    },
    {
      key: "location_name",
      header: "Location",
      render: (value, scrap) => (
        <div>{scrap?.location_name || "Unknown Location"}</div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (value, scrap) => getStatusBadge(scrap?.status),
    },
    {
      key: "work_order",
      header: "Work Order",
      render: (value, scrap) => (
        <div>
          {scrap?.work_order_no ? (
            <div className="text-sm">
              <div className="font-medium">{scrap.work_order_no}</div>
              {scrap?.reference && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  ID: {scrap.reference.substring(0, 8)}...
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              {scrap?.reference || "N/A"}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "reference",
      header: "Reference",
      render: (value, scrap) => (
        <div className="text-sm text-muted-foreground">
          {scrap?.reference || "-"}
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      render: (value, scrap) => (
        <div className="text-sm text-muted-foreground">
          {scrap?.created_at ? new Date(scrap.created_at).toLocaleDateString() : "-"}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (value, scrap) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              toast({
                title: "Info",
                description: `Viewing details for scrap ${scrap?.id || scrap?.scrap_id || "unknown"}`,
              });
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {scrap?.status === "AVAILABLE" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (scrap?.id) {
                  setSelectedScrapForRestore(scrap);
                  setRestoreData({ 
                    quantity_to_restore: scrap?.weight_kg?.toString() || '', 
                    reason: '',
                    material_id: scrap?.material_id || '' // Pre-fill material_id from scrap
                  });
                  setShowRestoreDialog(true);
                }
              }}
              disabled={!scrap?.id}
              title="Restore to Inventory"
            >
              Restore
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (scrap?.id) {
                const newStatus = scrap.status === "AVAILABLE" ? "CONSUMED" : "AVAILABLE";
                updateStatusMutation.mutate({ id: scrap.id, status: newStatus });
              }
            }}
            disabled={updateStatusMutation.isPending || !scrap?.id}
          >
            {scrap?.status === "AVAILABLE" ? "Mark Consumed" : "Mark Available"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (scrap?.id) {
                deleteScrapMutation.mutate(scrap.id);
              }
            }}
            disabled={deleteScrapMutation.isPending || !scrap?.id}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Loading scrap inventory..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Scrap Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage scrap inventory and track material wastage
          </p>
        </div>
        <div className="card-enterprise p-8 text-center">
          <h2 className="text-xl font-semibold mb-2 text-destructive">Error Loading Data</h2>
          <p className="text-muted-foreground mb-4">
            There was an error loading the scrap inventory. Please check your connection and try again.
          </p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Scrap Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage scrap inventory and track material wastage
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Scrap
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Scrap Items"
          value={totalScrap.toString()}
          icon={Package}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Available Scrap"
          value={availableScrap.toString()}
          icon={TrendingUp}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Consumed Scrap"
          value={consumedScrap.toString()}
          icon={AlertTriangle}
          trend={{ value: 5, isPositive: false }}
        />
        <StatsCard
          title="Total Weight (kg)"
          value={totalWeight.toFixed(2)}
          icon={Package}
          trend={{ value: 15, isPositive: true }}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search scrap inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="CONSUMED">Consumed</SelectItem>
            <SelectItem value="SOLD">Sold</SelectItem>
            <SelectItem value="QUARANTINED">Quarantined</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.material_id} onValueChange={(value) => setFilters(prev => ({ ...prev, material_id: value }))}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by material" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Materials</SelectItem>
            {materials.map((material: any) => (
              <SelectItem key={material.material_id} value={material.material_id}>
                {material.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.location_id} onValueChange={(value) => setFilters(prev => ({ ...prev, location_id: value }))}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map((location: any) => (
              <SelectItem key={location.location_id} value={location.location_id}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredScrap}
        columns={columns}
        isLoading={isLoading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* Create Scrap Modal */}
      <CreateScrapModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={createScrapMutation.mutate}
        isLoading={createScrapMutation.isPending}
        materials={materials}
        locations={locations}
      />

      {/* Restore to Inventory Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Restore Scrap to Inventory</DialogTitle>
          </DialogHeader>
          {selectedScrapForRestore && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="material_id">Raw Material *</Label>
                {materialsLoading ? (
                  <div className="text-sm text-muted-foreground p-2 border rounded">
                    Loading materials...
                  </div>
                ) : materialsError ? (
                  <div className="text-sm text-destructive p-2 border rounded border-destructive">
                    Error loading materials. Please refresh the page.
                  </div>
                ) : materials && materials.length > 0 ? (
                  <Select 
                    value={restoreData.material_id || selectedScrapForRestore?.material_id || ''} 
                    onValueChange={(value) => setRestoreData(prev => ({ ...prev, material_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select raw material" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map((material: any) => (
                        <SelectItem key={material.material_id} value={material.material_id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{material.name || material.material_name || 'Unknown'}</span>
                            <span className="text-xs text-gray-500">{material.material_code || material.code || 'N/A'}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm text-muted-foreground p-2 border rounded">
                    No materials available. Please add materials first.
                  </div>
                )}
                {selectedScrapForRestore?.material_name && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Original scrap material: {selectedScrapForRestore.material_name}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="quantity_to_restore">Quantity to Restore (kg) *</Label>
                <Input
                  id="quantity_to_restore"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={restoreData.quantity_to_restore}
                  onChange={(e) => {
                    const value = e.target.value;
                    const maxValue = selectedScrapForRestore?.weight_kg || 0;
                    if (value === '' || (parseFloat(value) >= 0.01 && parseFloat(value) <= maxValue)) {
                      setRestoreData(prev => ({ ...prev, quantity_to_restore: value }));
                    }
                  }}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Available: {selectedScrapForRestore?.weight_kg?.toFixed(2) || '0.00'} kg
                </p>
              </div>
              <div>
                <Label htmlFor="reason">Reason *</Label>
                <Textarea
                  id="reason"
                  value={restoreData.reason}
                  onChange={(e) => setRestoreData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Enter reason for restoring to inventory"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowRestoreDialog(false);
                    setSelectedScrapForRestore(null);
                    setRestoreData({ quantity_to_restore: '', reason: '', material_id: '' });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const scrapId = selectedScrapForRestore?.id;
                    if (scrapId && restoreData.quantity_to_restore && restoreData.reason && restoreData.material_id) {
                      const quantity = parseFloat(restoreData.quantity_to_restore);
                      if (quantity > 0 && quantity <= (selectedScrapForRestore?.weight_kg || 0)) {
                        restoreMutation.mutate({
                          scrapId: scrapId,
                          data: {
                            quantity_to_restore: quantity,
                            reason: restoreData.reason,
                            material_id: restoreData.material_id,
                            restored_by: 'system' // TODO: Replace with actual user ID from auth context
                          }
                        });
                      } else {
                        toast({
                          title: "Error",
                          description: "Invalid quantity. Must be greater than 0 and not exceed available weight.",
                          variant: "destructive",
                        });
                      }
                    } else {
                      toast({
                        title: "Error",
                        description: "Please fill in all required fields",
                        variant: "destructive",
                      });
                    }
                  }}
                  disabled={
                    restoreMutation.isPending || 
                    !restoreData.quantity_to_restore || 
                    !restoreData.reason ||
                    !restoreData.material_id ||
                    parseFloat(restoreData.quantity_to_restore) <= 0
                  }
                >
                  {restoreMutation.isPending ? "Restoring..." : "Restore to Inventory"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Create Scrap Modal Component
interface CreateScrapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateScrapRequest) => void;
  isLoading: boolean;
  materials: any[];
  locations: any[];
}

const CreateScrapModal: React.FC<CreateScrapModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  materials,
  locations,
}) => {
  const [formData, setFormData] = useState({
    material_id: "",
    location_id: "",
    width_mm: "",
    length_mm: "",
    thickness_mm: "",
    weight_kg: "",
    status: "AVAILABLE",
    reference: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: CreateScrapRequest = {
      ...formData,
      width_mm: formData.width_mm ? parseFloat(formData.width_mm) : undefined,
      length_mm: formData.length_mm ? parseFloat(formData.length_mm) : undefined,
      thickness_mm: formData.thickness_mm ? parseFloat(formData.thickness_mm) : undefined,
      weight_kg: parseFloat(formData.weight_kg),
      material_id: formData.material_id || undefined,
      location_id: formData.location_id || undefined,
      reference: formData.reference || undefined,
    };
    onSubmit(submitData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Scrap Record</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="material_id">Material</Label>
              <Select value={formData.material_id} onValueChange={(value) => setFormData(prev => ({ ...prev, material_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((material: any) => (
                    <SelectItem key={material.material_id} value={material.material_id}>
                      {material.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="location_id">Location</Label>
              <Select value={formData.location_id} onValueChange={(value) => setFormData(prev => ({ ...prev, location_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location: any) => (
                    <SelectItem key={location.location_id} value={location.location_id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="width_mm">Width (mm)</Label>
              <Input
                id="width_mm"
                type="number"
                step="0.1"
                value={formData.width_mm}
                onChange={(e) => setFormData(prev => ({ ...prev, width_mm: e.target.value }))}
                placeholder="0.0"
              />
            </div>
            <div>
              <Label htmlFor="length_mm">Length (mm)</Label>
              <Input
                id="length_mm"
                type="number"
                step="0.1"
                value={formData.length_mm}
                onChange={(e) => setFormData(prev => ({ ...prev, length_mm: e.target.value }))}
                placeholder="0.0"
              />
            </div>
            <div>
              <Label htmlFor="thickness_mm">Thickness (mm)</Label>
              <Input
                id="thickness_mm"
                type="number"
                step="0.1"
                value={formData.thickness_mm}
                onChange={(e) => setFormData(prev => ({ ...prev, thickness_mm: e.target.value }))}
                placeholder="0.0"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weight_kg">Weight (kg) *</Label>
              <Input
                id="weight_kg"
                type="number"
                step="0.01"
                value={formData.weight_kg}
                onChange={(e) => setFormData(prev => ({ ...prev, weight_kg: e.target.value }))}
                required
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="CONSUMED">Consumed</SelectItem>
                  <SelectItem value="SOLD">Sold</SelectItem>
                  <SelectItem value="QUARANTINED">Quarantined</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="reference">Reference</Label>
            <Input
              id="reference"
              value={formData.reference}
              onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
              placeholder="Optional reference"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Add Scrap Record"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScrapManagementPage;
