import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Eye, Edit, Trash2, AlertTriangle, TrendingUp, Package } from "lucide-react";
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
import { wastageApi } from "./api";
import { Wastage, CreateWastageRequest, WastageFilters } from "./types";
import { useToast } from "@/hooks/use-toast";

// Import material, location, and work order APIs from global services for now (we'll refactor this later)
import { materialApi, locationApi } from "@/services/api";

const WastageTrackingPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState<WastageFilters>({
    wo_id: "",
    material_id: "all",
    location_id: "all",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch wastage records with error handling
  const { data: wastageRecords = [], isLoading, error } = useQuery({
    queryKey: ["wastage-records", filters],
    queryFn: async () => {
      try {
        const data = await wastageApi.getAll({
          wo_id: filters.wo_id || undefined,
          material_id: filters.material_id === "all" ? undefined : filters.material_id,
          location_id: filters.location_id === "all" ? undefined : filters.location_id,
          limit: 100,
        });
        
        // Ensure we have an array and filter out any null/undefined records
        const validData = Array.isArray(data) ? data.filter(record => record != null) : [];
        
        return validData;
      } catch (error) {
        console.error('Error fetching wastage records:', error);
        throw error;
      }
    },
    retry: 2,
  });

  // Fetch materials with error handling
  const { data: materials = [] } = useQuery({
    queryKey: ["materials"],
    queryFn: () => materialApi.getAll(),
    retry: 2,
  });

  // Fetch locations with error handling
  const { data: locations = [] } = useQuery({
    queryKey: ["locations"],
    queryFn: () => locationApi.getAll(),
    retry: 2,
  });

  // Create wastage mutation
  const createWastageMutation = useMutation({
    mutationFn: wastageApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wastage-records"] });
      setShowCreateModal(false);
    },
  });

  // Update wastage mutation
  const updateWastageMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      wastageApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wastage-records"] });
    },
  });

  // Delete wastage mutation
  const deleteWastageMutation = useMutation({
    mutationFn: wastageApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wastage-records"] });
    },
  });

  // Filter wastage records based on search term (with null safety)
  const filteredWastage = wastageRecords.filter((wastage: Wastage) => {
    if (!wastage) return false; // Skip null/undefined records
    
    return (
      (wastage.material_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (wastage.work_order_number || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (wastage.location_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (wastage.reason || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Calculate statistics (with null safety)
  const validWastageRecords = wastageRecords.filter(w => w && typeof w.quantity === 'number');
  const totalWastage = validWastageRecords.reduce((sum: number, wastage: Wastage) => sum + wastage.quantity, 0);
  const totalIncidents = validWastageRecords.length;
  const totalMaterials = new Set(validWastageRecords.map(w => w.material_id).filter(Boolean)).size;
  const avgWastagePerIncident = totalIncidents > 0 ? totalWastage / totalIncidents : 0;

  const columns: Column<Wastage>[] = [
    {
      key: "work_order_number",
      header: "Work Order",
      render: (value, wastage) => (
        <div className="font-medium">{wastage?.work_order_number || "Unknown WO"}</div>
      ),
    },
    {
      key: "material_name",
      header: "Material",
      render: (value, wastage) => (
        <div>{wastage?.material_name || "Unknown Material"}</div>
      ),
    },
    {
      key: "quantity",
      header: "Quantity",
      render: (value, wastage) => (
        <div className="font-medium">
          {wastage?.quantity || 0} {wastage?.uom_code || ""}
        </div>
      ),
    },
    {
      key: "step_name",
      header: "Step",
      render: (value, wastage) => (
        <div className="text-sm text-muted-foreground">
          {wastage?.step_name || "-"}
        </div>
      ),
    },
    {
      key: "location_name",
      header: "Location",
      render: (value, wastage) => (
        <div>{wastage?.location_name || "Unknown Location"}</div>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      render: (value, wastage) => (
        <div className="text-sm text-muted-foreground max-w-xs truncate">
          {wastage?.reason || "-"}
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Date",
      render: (value, wastage) => (
        <div className="text-sm text-muted-foreground">
          {wastage?.created_at ? new Date(wastage.created_at).toLocaleDateString() : "-"}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (value, wastage) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              toast({
                title: "Info",
                description: `Viewing details for wastage ${wastage?.id || "unknown"}`,
              });
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => wastage?.id && deleteWastageMutation.mutate(wastage.id)}
            disabled={deleteWastageMutation.isPending || !wastage?.id}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Loading wastage records..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Wastage Tracking</h1>
          <p className="text-muted-foreground mt-2">
            Track material wastage during production processes
          </p>
        </div>
        <div className="card-enterprise p-8 text-center">
          <h2 className="text-xl font-semibold mb-2 text-destructive">Error Loading Data</h2>
          <p className="text-muted-foreground mb-4">
            There was an error loading the wastage records. Please check your connection and try again.
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
          <h1 className="text-3xl font-bold text-foreground">Wastage Tracking</h1>
          <p className="text-muted-foreground mt-2">
            Track material wastage during production processes
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Record Wastage
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Wastage"
          value={totalWastage.toString()}
          icon={AlertTriangle}
          trend={{ value: 12, isPositive: false }}
        />
        <StatsCard
          title="Total Incidents"
          value={totalIncidents.toString()}
          icon={Package}
          trend={{ value: 5, isPositive: false }}
        />
        <StatsCard
          title="Materials Affected"
          value={totalMaterials.toString()}
          icon={TrendingUp}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Avg per Incident"
          value={avgWastagePerIncident.toFixed(2)}
          icon={AlertTriangle}
          trend={{ value: 15, isPositive: false }}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search wastage records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
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
        data={filteredWastage}
        columns={columns}
        isLoading={isLoading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* Create Wastage Modal */}
      <CreateWastageModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={createWastageMutation.mutate}
        isLoading={createWastageMutation.isPending}
        materials={materials}
        locations={locations}
      />
    </div>
  );
};

// Create Wastage Modal Component
interface CreateWastageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateWastageRequest) => void;
  isLoading: boolean;
  materials: any[];
  locations: any[];
}

const CreateWastageModal: React.FC<CreateWastageModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  materials,
  locations,
}) => {
  const [formData, setFormData] = useState({
    wo_id: "",
    step_id: "",
    material_id: "",
    quantity: "",
    uom_id: "",
    location_id: "",
    reason: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: CreateWastageRequest = {
      ...formData,
      quantity: parseFloat(formData.quantity),
      wo_id: formData.wo_id,
      material_id: formData.material_id,
      step_id: formData.step_id || undefined,
      uom_id: formData.uom_id || undefined,
      location_id: formData.location_id || undefined,
      reason: formData.reason || undefined,
    };
    onSubmit(submitData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Record Wastage</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="wo_id">Work Order ID *</Label>
              <Input
                id="wo_id"
                value={formData.wo_id}
                onChange={(e) => setFormData(prev => ({ ...prev, wo_id: e.target.value }))}
                required
                placeholder="e.g., WO-2023-001"
              />
            </div>
            <div>
              <Label htmlFor="step_id">Step ID</Label>
              <Input
                id="step_id"
                value={formData.step_id}
                onChange={(e) => setFormData(prev => ({ ...prev, step_id: e.target.value }))}
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="material_id">Material *</Label>
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
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                required
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="uom_id">Unit of Measure</Label>
              <Input
                id="uom_id"
                value={formData.uom_id}
                onChange={(e) => setFormData(prev => ({ ...prev, uom_id: e.target.value }))}
                placeholder="e.g., kg, pieces"
              />
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
          <div>
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Describe the reason for wastage..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Recording..." : "Record Wastage"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WastageTrackingPage;
