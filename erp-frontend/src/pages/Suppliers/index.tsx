import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Eye, Edit, Trash2, Building2, Phone, Mail, MapPin, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatsCard } from "@/components/ui/stats-card";
import GlassCard from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import LoadingSpinner from "@/components/LoadingSpinner";
import { supplierApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import SupplierImportModal from "@/components/suppliers/SupplierImportModal";
import GenericExportModal from "@/components/common/GenericExportModal";

interface Supplier {
  supplier_id: string;
  code: string;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  lead_time_days?: number;
  created_at: string;
}

interface CreateSupplierRequest {
  code: string;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  lead_time_days?: number;
}

const SuppliersPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch suppliers with error handling
  const { data: suppliers = [], isLoading, error } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => supplierApi.getAll(),
    retry: 2,
  });

  // Create supplier mutation
  const createSupplierMutation = useMutation({
    mutationFn: supplierApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setShowCreateModal(false);
      toast({
        title: "Success",
        description: "Supplier created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create supplier",
        variant: "destructive",
      });
    },
  });

  // Delete supplier mutation
  const deleteSupplierMutation = useMutation({
    mutationFn: supplierApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast({
        title: "Success",
        description: "Supplier deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete supplier",
        variant: "destructive",
      });
    },
  });

  // Filter suppliers based on search term
  const filteredSuppliers = suppliers.filter((supplier: Supplier) =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.contact && supplier.contact.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculate statistics
  const totalSuppliers = suppliers.length;
  const suppliersWithContact = suppliers.filter((s: Supplier) => s.contact).length;
  const suppliersWithEmail = suppliers.filter((s: Supplier) => s.email).length;
  const suppliersWithPhone = suppliers.filter((s: Supplier) => s.phone).length;

  const columns: Column<Supplier>[] = [
    {
      key: "code",
      header: "Code",
      render: (value, row) => (
        <div className="font-medium">{value || row?.code || "N/A"}</div>
      ),
    },
    {
      key: "name",
      header: "Supplier Name",
      render: (value, row) => (
        <div className="font-medium">{value || row?.name || "N/A"}</div>
      ),
    },
    {
      key: "contact",
      header: "Contact Person",
      render: (value, row) => (
        <div>{value || row?.contact || "-"}</div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (value, row) => (
        <div className="flex items-center gap-1">
          <Phone className="h-4 w-4 text-muted-foreground" />
          {value || row?.phone || "-"}
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (value, row) => (
        <div className="flex items-center gap-1">
          <Mail className="h-4 w-4 text-muted-foreground" />
          {value || row?.email || "-"}
        </div>
      ),
    },
    {
      key: "lead_time_days",
      header: "Lead Time",
      render: (value, row) => {
        const days = value || row?.lead_time_days;
        return (
          <div>
            {days ? `${days} days` : "-"}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              toast({
                title: "Info",
                description: `Viewing details for ${row?.name || "N/A"}`,
              });
            }}
            disabled={!row?.supplier_id}
            className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all duration-200"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              toast({
                title: "Edit",
                description: `Editing ${row?.name || "N/A"}`,
              });
            }}
            disabled={!row?.supplier_id}
            className="hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-all duration-200"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => row?.supplier_id && deleteSupplierMutation.mutate(row.supplier_id)}
            disabled={deleteSupplierMutation.isPending || !row?.supplier_id}
            className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-200"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Loading suppliers..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Suppliers</h1>
          <p className="text-muted-foreground mt-2">
            Manage supplier information and contacts
          </p>
        </div>
        <div className="card-enterprise p-8 text-center">
          <h2 className="text-xl font-semibold mb-2 text-destructive">Error Loading Data</h2>
          <p className="text-muted-foreground mb-4">
            There was an error loading the suppliers. Please check your connection and try again.
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
          <h1 className="text-3xl font-bold text-foreground">Suppliers</h1>
          <p className="text-muted-foreground mt-2">
            Manage supplier information and contacts
          </p>
        </div>
        <div className="flex gap-3">
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
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {!isLoading && suppliers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard
            title="Total Suppliers"
            value={totalSuppliers.toString()}
            icon={Building2}
            trend={{ value: 5, isPositive: true }}
          />
          <StatsCard
            title="With Contact Info"
            value={suppliersWithContact.toString()}
            icon={Phone}
            trend={{ value: 8, isPositive: true }}
          />
          <StatsCard
            title="With Email"
            value={suppliersWithEmail.toString()}
            icon={Mail}
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="With Phone"
            value={suppliersWithPhone.toString()}
            icon={Phone}
            trend={{ value: 3, isPositive: true }}
          />
        </div>
      )}

      {/* Search */}
      <GlassCard>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Data Table */}
      {!isLoading && suppliers.length > 0 ? (
        <GlassCard title="Suppliers">
          <DataTable
            data={suppliers}
            columns={columns}
            loading={isLoading}
          />
        </GlassCard>
      ) : !isLoading && suppliers.length === 0 ? (
        <GlassCard>
          <div className="p-8 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Suppliers Found</h3>
            <p className="text-muted-foreground mb-4">
              Get started by adding your first supplier.
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </div>
        </GlassCard>
      ) : null}

      {/* Create Supplier Modal */}
      <CreateSupplierModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={createSupplierMutation.mutate}
        isLoading={createSupplierMutation.isPending}
      />

      {showImportModal && (
        <SupplierImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false);
            queryClient.invalidateQueries({ queryKey: ["suppliers"] });
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
          title="Export Suppliers"
          exportFunction={supplierApi.exportSuppliers}
          filename="suppliers"
          availableFormats={['pdf', 'csv']}
        />
      )}
    </div>
  );
};

// Create Supplier Modal Component
interface CreateSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSupplierRequest) => void;
  isLoading: boolean;
}

const CreateSupplierModal: React.FC<CreateSupplierModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    contact: "",
    phone: "",
    email: "",
    address: "",
    lead_time_days: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.code.trim() || !formData.name.trim()) {
      return;
    }
    
    const submitData: CreateSupplierRequest = {
      code: formData.code.trim(),
      name: formData.name.trim(),
      contact: formData.contact.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      email: formData.email.trim() || undefined,
      address: formData.address.trim() || undefined,
      lead_time_days: formData.lead_time_days ? parseInt(formData.lead_time_days) : undefined,
    };
    onSubmit(submitData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Supplier</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">Supplier Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                required
                placeholder="e.g., SUP-001"
              />
            </div>
            <div>
              <Label htmlFor="name">Supplier Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                placeholder="e.g., ABC Manufacturing Ltd"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="contact">Contact Person</Label>
            <Input
              id="contact"
              value={formData.contact}
              onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
              placeholder="e.g., John Smith"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="e.g., +1 (555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="e.g., contact@supplier.com"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Full address including city, state, country"
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="lead_time_days">Lead Time (Days)</Label>
            <Input
              id="lead_time_days"
              type="number"
              min="0"
              value={formData.lead_time_days}
              onChange={(e) => setFormData(prev => ({ ...prev, lead_time_days: e.target.value }))}
              placeholder="e.g., 7"
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Supplier"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SuppliersPage;

