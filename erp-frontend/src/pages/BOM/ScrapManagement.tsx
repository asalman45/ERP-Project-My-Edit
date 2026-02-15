import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Recycle, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  AlertCircle,
  CheckCircle,
  Package,
  Scale,
  MapPin,
  Calendar,
  TrendingUp,
  DollarSign,
  Target
} from 'lucide-react';
import { enhancedScrapApi, materialApi, locationApi, scrapManagementApi, productionMaterialConsumptionApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface ScrapItem {
  scrap_id: string;
  material_id: string;
  material_name: string;
  sub_assembly_name?: string; // Keep for backward compatibility
  sub_assembly_names?: string; // New: comma-separated list
  sub_assembly_count?: number; // New: count
  work_order_no?: string; // New: Work Order Number
  work_order_id?: string; // New: Work Order ID
  width_mm: number;
  length_mm: number;
  thickness_mm: number;
  weight_kg: number;
  location_id: string;
  location_name: string;
  status: string;
  reference: string;
  created_at: string;
  created_by: string;
  consumed_by_po?: string;
  consumed_at?: string;
}

interface ScrapSummary {
  total_items: number;
  total_weight: number;
  total_value: number;
  available_items: number;
  consumed_items: number;
  by_status: Record<string, number>;
  by_material: Array<{
    material_name: string;
    count: number;
    total_weight: number;
  }>;
  by_location: Array<{
    location_name: string;
    count: number;
    total_weight: number;
  }>;
}

const ScrapManagement: React.FC = () => {
  const [scrapItems, setScrapItems] = useState<ScrapItem[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [summary, setSummary] = useState<ScrapSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMaterial, setFilterMaterial] = useState<string>('all');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScrapItem | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showReuseDialog, setShowReuseDialog] = useState(false);
  const [selectedScrap, setSelectedScrap] = useState<ScrapItem | null>(null);
  const [productionOrders, setProductionOrders] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    material_id: '',
    width_mm: 0,
    length_mm: 0,
    thickness_mm: 0,
    weight_kg: 0,
    location_id: '',
    status: 'AVAILABLE',
    reference: '',
    created_by: 'current_user'
  });
  const [restoreData, setRestoreData] = useState({
    quantity_to_restore: '',
    reason: '',
    material_id: '' // Added material_id field
  });
  const [reuseOpportunities, setReuseOpportunities] = useState<any[]>([]);
  const [selectedScrapForReuse, setSelectedScrapForReuse] = useState<ScrapItem | null>(null);
  const [loadingOpportunities, setLoadingOpportunities] = useState(false);
  
  // Enhanced filters
  const [filterThickness, setFilterThickness] = useState<string>('');
  const [filterDimensionMin, setFilterDimensionMin] = useState<string>('');
  const [filterDimensionMax, setFilterDimensionMax] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterSourceProcess, setFilterSourceProcess] = useState<string>('all');
  
  const [reuseData, setReuseData] = useState({
    production_order_id: '',
    product_id: '',
    quantity_to_reuse: '',
    reason: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchScrapItems();
    fetchMaterials();
    fetchLocations();
    fetchSummary();
    fetchProductionOrders();
  }, []);

  const fetchScrapItems = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await enhancedScrapApi.getAll();
      setScrapItems(data);
    } catch (error) {
      console.error('Error fetching scrap items:', error);
      setError('Failed to load scrap items');
      toast({
        title: "Error",
        description: "Failed to load scrap items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      const data = await materialApi.getAll();
      setMaterials(data);
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const data = await locationApi.getAll();
      setLocations(data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  // New: Fetch reuse opportunities for a scrap item
  const fetchReuseOpportunities = async (scrapId: string) => {
    setLoadingOpportunities(true);
    try {
      const response = await scrapManagementApi.getReuseOpportunities(scrapId);
      setReuseOpportunities(response.data || []);
      toast({
        title: "Reuse Opportunities Found",
        description: `Found ${response.data?.length || 0} potential reuse opportunities`,
      });
    } catch (error) {
      console.error('Error fetching reuse opportunities:', error);
      setReuseOpportunities([]);
      toast({
        title: "Info",
        description: "No reuse opportunities found for this scrap",
      });
    } finally {
      setLoadingOpportunities(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const data = await enhancedScrapApi.getSummary();
      setSummary(data);
    } catch (error) {
      console.error('Error fetching summary:', error);
      // Set default summary if API fails
      setSummary({
        total_items: 0,
        total_weight: 0,
        total_value: 0,
        available_items: 0,
        consumed_items: 0,
        by_status: [],
        by_material: []
      });
    }
  };

  const fetchProductionOrders = async () => {
    try {
      // Mock production orders - in real implementation, this would come from production API
      const mockOrders = [
        {
          production_order_id: 'po-001',
          production_order_number: 'PO-2024-001',
          product_id: '5cdef655-4cf2-400f-8609-189236cc9a8c',
          product_name: 'Base Plate',
          product_code: '89806273NM',
          status: 'PLANNED'
        }
      ];
      setProductionOrders(mockOrders);
    } catch (error) {
      console.error('Error fetching production orders:', error);
    }
  };

  const handleRestoreScrap = async () => {
    if (!selectedScrap || !restoreData.quantity_to_restore || !restoreData.reason || !restoreData.material_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (Material, Quantity, and Reason)",
        variant: "destructive",
      });
      return;
    }

    try {
      await scrapManagementApi.restoreToInventory(selectedScrap.scrap_id, {
        quantity_to_restore: parseFloat(restoreData.quantity_to_restore),
        reason: restoreData.reason,
        material_id: restoreData.material_id,
        restored_by: 'current_user'
      });

      toast({
        title: "Success",
        description: `Successfully restored ${restoreData.quantity_to_restore} kg to inventory`,
      });

      setShowRestoreDialog(false);
      setSelectedScrap(null);
      setRestoreData({ quantity_to_restore: '', reason: '', material_id: '' });
      fetchScrapItems();
      fetchSummary();
    } catch (error) {
      console.error('Error restoring scrap:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to restore scrap to inventory",
        variant: "destructive",
      });
    }
  };

  const handleReuseScrap = async () => {
    if (!selectedScrap || !reuseData.production_order_id || !reuseData.product_id || !reuseData.quantity_to_reuse || !reuseData.reason) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await scrapManagementApi.reuseInProduction(selectedScrap.scrap_id, {
        production_order_id: reuseData.production_order_id,
        product_id: reuseData.product_id,
        quantity_to_reuse: parseFloat(reuseData.quantity_to_reuse),
        reason: reuseData.reason,
        reused_by: 'current_user'
      });

      toast({
        title: "Success",
        description: `Successfully reused ${reuseData.quantity_to_reuse} kg in production`,
      });

      setShowReuseDialog(false);
      setSelectedScrap(null);
      setReuseData({ production_order_id: '', product_id: '', quantity_to_reuse: '', reason: '' });
      fetchScrapItems();
      fetchSummary();
    } catch (error) {
      console.error('Error reusing scrap:', error);
      toast({
        title: "Error",
        description: "Failed to reuse scrap in production",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingItem) {
        await enhancedScrapApi.update(editingItem.scrap_id, formData);
        toast({
          title: "Success",
          description: "Scrap item updated successfully",
        });
      } else {
        await enhancedScrapApi.create(formData);
        toast({
          title: "Success",
          description: "Scrap item created successfully",
        });
      }
      
      setIsDialogOpen(false);
      setEditingItem(null);
      setFormData({
        material_id: '',
        width_mm: 0,
        length_mm: 0,
        thickness_mm: 0,
        weight_kg: 0,
        location_id: '',
        status: 'AVAILABLE',
        reference: '',
        created_by: 'current_user'
      });
      fetchScrapItems();
      fetchSummary();
    } catch (error) {
      console.error('Error saving scrap item:', error);
      toast({
        title: "Error",
        description: "Failed to save scrap item",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: ScrapItem) => {
    setEditingItem(item);
    setFormData({
      material_id: item.material_id,
      width_mm: item.width_mm,
      length_mm: item.length_mm,
      thickness_mm: item.thickness_mm,
      weight_kg: item.weight_kg,
      location_id: item.location_id,
      status: item.status,
      reference: item.reference,
      created_by: item.created_by
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scrap item?')) return;
    
    try {
      await enhancedScrapApi.delete(id);
      toast({
        title: "Success",
        description: "Scrap item deleted successfully",
      });
      fetchScrapItems();
      fetchSummary();
    } catch (error) {
      console.error('Error deleting scrap item:', error);
      toast({
        title: "Error",
        description: "Failed to delete scrap item",
        variant: "destructive",
      });
    }
  };

  const handleConsume = async (scrapId: string, productId: string, quantity: number) => {
    try {
      await enhancedScrapApi.recordConsumption({
        scrap_id: scrapId,
        product_id: productId,
        quantity_used: quantity,
        reference: `Consumed for production`,
        created_by: 'current_user'
      });
      
      toast({
        title: "Success",
        description: "Scrap consumption recorded successfully",
      });
      
      fetchScrapItems();
      fetchSummary();
    } catch (error) {
      console.error('Error recording consumption:', error);
      toast({
        title: "Error",
        description: "Failed to record scrap consumption",
        variant: "destructive",
      });
    }
  };

  const filteredItems = scrapItems.filter(item => {
    const matchesSearch = (item.material_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (item.reference?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (item.work_order_no?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (item.sub_assembly_names?.toLowerCase() || item.sub_assembly_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesMaterial = filterMaterial === 'all' || item.material_id === filterMaterial;
    const matchesLocation = filterLocation === 'all' || item.location_id === filterLocation;
    
    // New enhanced filters
    const matchesThickness = !filterThickness || (item.thickness_mm && Math.abs(item.thickness_mm - parseFloat(filterThickness)) < 0.1);
    const matchesDimensionMin = !filterDimensionMin || 
      ((item.width_mm && item.width_mm >= parseFloat(filterDimensionMin)) || (item.length_mm && item.length_mm >= parseFloat(filterDimensionMin)));
    const matchesDimensionMax = !filterDimensionMax || 
      ((item.width_mm && item.width_mm <= parseFloat(filterDimensionMax)) && (item.length_mm && item.length_mm <= parseFloat(filterDimensionMax)));
    
    const matchesDateFrom = !filterDateFrom || (item.created_at && new Date(item.created_at) >= new Date(filterDateFrom));
    const matchesDateTo = !filterDateTo || (item.created_at && new Date(item.created_at) <= new Date(filterDateTo));
    
    // Source process filter would require joining with scrap_origin table (done on backend)
    
    return matchesSearch && matchesStatus && matchesMaterial && matchesLocation &&
           matchesThickness && matchesDimensionMin && matchesDimensionMax &&
           matchesDateFrom && matchesDateTo;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800';
      case 'CONSUMED': return 'bg-gray-100 text-gray-800';
      case 'RESERVED': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'CONSUMED': return <Package className="w-4 h-4 text-gray-500" />;
      case 'RESERVED': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Scrap Management</h1>
          <p className="text-gray-600 mt-1">Manage reusable scrap materials and track consumption</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Scrap Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit Scrap Item' : 'Add New Scrap Item'}
              </DialogTitle>
              <DialogDescription>
                Record scrap material details for reuse tracking
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="material_id">Material</Label>
                  <Select value={formData.material_id} onValueChange={(value) => setFormData({...formData, material_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map((material) => (
                        <SelectItem key={material.material_id} value={material.material_id}>
                          {material.material_code} - {material.material_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location_id">Location</Label>
                  <Select value={formData.location_id} onValueChange={(value) => setFormData({...formData, location_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.location_id} value={location.location_id}>
                          {location.location_code} - {location.location_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="width_mm">Width (mm)</Label>
                  <Input
                    id="width_mm"
                    type="number"
                    value={formData.width_mm}
                    onChange={(e) => setFormData({...formData, width_mm: Number(e.target.value)})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="length_mm">Length (mm)</Label>
                  <Input
                    id="length_mm"
                    type="number"
                    value={formData.length_mm}
                    onChange={(e) => setFormData({...formData, length_mm: Number(e.target.value)})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="thickness_mm">Thickness (mm)</Label>
                  <Input
                    id="thickness_mm"
                    type="number"
                    value={formData.thickness_mm}
                    onChange={(e) => setFormData({...formData, thickness_mm: Number(e.target.value)})}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight_kg">Weight (kg)</Label>
                  <Input
                    id="weight_kg"
                    type="number"
                    step="0.1"
                    value={formData.weight_kg}
                    onChange={(e) => setFormData({...formData, weight_kg: Number(e.target.value)})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AVAILABLE">Available</SelectItem>
                      <SelectItem value="RESERVED">Reserved</SelectItem>
                      <SelectItem value="CONSUMED">Consumed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reference">Reference</Label>
                <Input
                  id="reference"
                  value={formData.reference}
                  onChange={(e) => setFormData({...formData, reference: e.target.value})}
                  placeholder="e.g., WO-001, PO-123, Batch-456"
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingItem ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold text-blue-600">{summary.total_items}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Weight</p>
                  <p className="text-2xl font-bold text-green-600">{summary.total_weight.toFixed(1)} kg</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <Scale className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Available Items</p>
                  <p className="text-2xl font-bold text-yellow-600">{summary.available_items}</p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Consumed Items</p>
                  <p className="text-2xl font-bold text-gray-600">{summary.consumed_items}</p>
                </div>
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Target className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                placeholder="Search by material or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label>Status</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="AVAILABLE">Available</SelectItem>
                <SelectItem value="RESERVED">Reserved</SelectItem>
                <SelectItem value="CONSUMED">Consumed</SelectItem>
              </SelectContent>
            </Select>
            </div>

            {/* Material Type Filter */}
            <div className="space-y-2">
              <Label>Material Type</Label>
            <Select value={filterMaterial} onValueChange={setFilterMaterial}>
                <SelectTrigger>
                <SelectValue placeholder="Filter by material" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Materials</SelectItem>
                {materials.map((material) => (
                  <SelectItem key={material.material_id} value={material.material_id}>
                    {material.material_code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </div>

            {/* Location Filter */}
            <div className="space-y-2">
              <Label>Location</Label>
            <Select value={filterLocation} onValueChange={setFilterLocation}>
                <SelectTrigger>
                <SelectValue placeholder="Filter by location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.location_id} value={location.location_id}>
                    {location.location_code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </div>

            {/* Thickness Filter */}
            <div className="space-y-2">
              <Label>Thickness (mm)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g., 2.5"
                value={filterThickness}
                onChange={(e) => setFilterThickness(e.target.value)}
              />
            </div>

            {/* Dimension Min Filter */}
            <div className="space-y-2">
              <Label>Min Dimension (mm)</Label>
              <Input
                type="number"
                placeholder="Min width/length"
                value={filterDimensionMin}
                onChange={(e) => setFilterDimensionMin(e.target.value)}
              />
            </div>

            {/* Dimension Max Filter */}
            <div className="space-y-2">
              <Label>Max Dimension (mm)</Label>
              <Input
                type="number"
                placeholder="Max width/length"
                value={filterDimensionMax}
                onChange={(e) => setFilterDimensionMax(e.target.value)}
              />
            </div>

            {/* Date From Filter */}
            <div className="space-y-2">
              <Label>Date From</Label>
              <Input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
              />
            </div>

            {/* Date To Filter */}
            <div className="space-y-2">
              <Label>Date To</Label>
              <Input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
              />
            </div>

            {/* Source Process Filter */}
            <div className="space-y-2">
              <Label>Source Process</Label>
              <Select value={filterSourceProcess} onValueChange={setFilterSourceProcess}>
                <SelectTrigger>
                  <SelectValue placeholder="All processes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Processes</SelectItem>
                  <SelectItem value="CUTTING">Cutting</SelectItem>
                  <SelectItem value="WELDING">Welding</SelectItem>
                  <SelectItem value="BOM">BOM Optimization</SelectItem>
                  <SelectItem value="PRODUCTION">Production</SelectItem>
                  <SelectItem value="ASSEMBLY">Assembly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="mt-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterMaterial('all');
                setFilterLocation('all');
                setFilterThickness('');
                setFilterDimensionMin('');
                setFilterDimensionMax('');
                setFilterDateFrom('');
                setFilterDateTo('');
                setFilterSourceProcess('all');
              }}
            >
              Clear All Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content with Tabs */}
      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="inventory">Scrap Inventory</TabsTrigger>
          <TabsTrigger value="reuse-suggestions">Reuse Suggestions</TabsTrigger>
        </TabsList>

        {/* Scrap Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
      {/* Scrap Items List */}
      <div className="grid gap-4">
        {filteredItems.map((item) => (
          <Card key={item.scrap_id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Recycle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.material_name || 'Unknown Material'}</h3>
                    {/* Sub Assembly Names */}
                    {(item.sub_assembly_names || item.sub_assembly_name) && (
                      <p className="text-xs text-gray-500 mt-1">
                        {item.sub_assembly_names || item.sub_assembly_name}
                        {item.sub_assembly_count && item.sub_assembly_count > 1 && (
                          <span className="ml-1 text-blue-600">({item.sub_assembly_count})</span>
                        )}
                      </p>
                    )}
                    {/* Work Order */}
                    {item.work_order_no ? (
                      <p className="text-sm text-gray-600 mt-1">
                        WO: {item.work_order_no}
                      </p>
                    ) : (
                    <p className="text-sm text-gray-600">Ref: {item.reference || 'N/A'}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(item.status)}>
                    {getStatusIcon(item.status)}
                    <span className="ml-1">{item.status}</span>
                  </Badge>
                  {item.status === 'AVAILABLE' && (
                    <>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setSelectedScrap(item);
                          setRestoreData({ 
                            quantity_to_restore: (item.weight_kg || 0).toString(), 
                            reason: '',
                            material_id: item.material_id || '' // Pre-fill material_id from scrap
                          });
                          setShowRestoreDialog(true);
                        }}
                        title="Restore to Inventory"
                      >
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setSelectedScrap(item);
                          setReuseData({ 
                            production_order_id: '', 
                            product_id: '', 
                            quantity_to_reuse: (item.weight_kg || 0).toString(), 
                            reason: '' 
                          });
                          setShowReuseDialog(true);
                        }}
                        title="Reuse in Production"
                      >
                        <Package className="w-4 h-4 text-blue-600" />
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(item.scrap_id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm text-gray-600">Dimensions</Label>
                  <p className="font-medium">{item.width_mm || 0} × {item.length_mm || 0} × {item.thickness_mm || 0} mm</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-gray-600">Weight</Label>
                  <p className="font-medium">{item.weight_kg ? item.weight_kg.toFixed(2) : '0.00'} kg</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-gray-600">Work Order</Label>
                  <p className="font-medium">
                    {item.work_order_no || item.reference || 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-gray-600">Location</Label>
                  <p className="font-medium flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {item.location_name || 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-gray-600">Created</Label>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              
              {item.status === 'AVAILABLE' && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Recycle className="w-4 h-4 mr-2" />
                      Use for Production
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              )}
              
              {item.status === 'CONSUMED' && item.consumed_by_po && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    <p>Consumed by: {item.consumed_by_po}</p>
                    {item.consumed_at && (
                      <p>Consumed on: {new Date(item.consumed_at).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && !loading && (
        <Card>
          <CardContent className="pt-6 text-center">
            <Recycle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No scrap items found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus !== 'all' || filterMaterial !== 'all' || filterLocation !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first scrap item'
              }
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Scrap Item
            </Button>
          </CardContent>
        </Card>
      )}
        </TabsContent>

        {/* Reuse Suggestions Tab */}
        <TabsContent value="reuse-suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Smart Reuse Matching</CardTitle>
              <CardDescription>
                Select a scrap piece to find products that can be made from it
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Scrap Selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Select Scrap Piece</Label>
                  <Select 
                    value={selectedScrapForReuse?.scrap_id || ''} 
                    onValueChange={(scrapId) => {
                      const scrap = scrapItems.find(s => s.scrap_id === scrapId);
                      setSelectedScrapForReuse(scrap || null);
                      if (scrap) {
                        fetchReuseOpportunities(scrapId);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select scrap piece" />
                    </SelectTrigger>
                    <SelectContent>
                      {scrapItems.filter(item => item.status === 'AVAILABLE').map((scrap) => (
                        <SelectItem key={scrap.scrap_id} value={scrap.scrap_id}>
                          {scrap.material_name} - {scrap.weight_kg ? scrap.weight_kg.toFixed(2) : '0.00'}kg ({scrap.width_mm}×{scrap.length_mm}×{scrap.thickness_mm}mm)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedScrapForReuse && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-sm text-blue-900 mb-1">Selected Scrap</h4>
                    <p className="text-sm text-blue-700">
                      {selectedScrapForReuse.width_mm}×{selectedScrapForReuse.length_mm}×{selectedScrapForReuse.thickness_mm}mm | {selectedScrapForReuse.weight_kg ? selectedScrapForReuse.weight_kg.toFixed(2) : '0.00'}kg
                    </p>
                  </div>
                )}
              </div>

              {/* Loading State */}
              {loadingOpportunities && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Finding reuse opportunities...</p>
                </div>
              )}

              {/* Reuse Opportunities List */}
              {!loadingOpportunities && reuseOpportunities.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Reuse Opportunities ({reuseOpportunities.length})
                  </h4>
                  <div className="space-y-2">
                    {reuseOpportunities.map((opp, index) => (
                      <Card key={index} className="bg-green-50 border-green-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h5 className="font-semibold text-sm">{opp.product_code} - {opp.part_name}</h5>
                              <p className="text-xs text-gray-600 mt-1">
                                Sub-assembly: {opp.sub_assembly_name}
                              </p>
                              <p className="text-xs text-gray-600">
                                Blank size: {opp.width_mm}×{opp.length_mm}×{opp.thickness_mm}mm
                              </p>
                              <div className="mt-2 flex gap-2">
                                <Badge variant="outline" className="text-blue-600">
                                  {opp.max_blanks_fit} blanks can fit
                                </Badge>
                                <Badge variant="outline" className="text-green-600">
                                  H: {opp.blanks_fit_horizontal} | V: {opp.blanks_fit_vertical}
                                </Badge>
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => {
                                // Mark for reuse logic
                                toast({
                                  title: "Mark for Reuse",
                                  description: `Scrap will be allocated to ${opp.part_name}`,
                                });
                              }}
                            >
                              Mark for Reuse
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* No Opportunities Found */}
              {!loadingOpportunities && selectedScrapForReuse && reuseOpportunities.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No reuse opportunities found</h3>
                    <p className="text-gray-600">
                      This scrap piece doesn't match any current BOM requirements.
                      Try restoring it to inventory instead.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Instructions */}
              {!selectedScrapForReuse && (
                <Card className="bg-gray-50">
                  <CardContent className="py-8 text-center">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a scrap piece</h3>
                    <p className="text-gray-600">
                      Choose a scrap piece from the dropdown above to see smart reuse suggestions
                    </p>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Restore to Inventory Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Scrap to Inventory</DialogTitle>
            <DialogDescription>
              Restore {selectedScrap?.material_name} back to regular inventory
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="restore-material">Raw Material *</Label>
              <Select 
                value={restoreData.material_id || selectedScrap?.material_id || ''} 
                onValueChange={(value) => setRestoreData({...restoreData, material_id: value})}
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
              {selectedScrap?.material_name && (
                <p className="text-xs text-muted-foreground mt-1">
                  Original scrap material: {selectedScrap.material_name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="restore-quantity">Quantity to Restore (kg) *</Label>
              <Input
                id="restore-quantity"
                type="number"
                step="0.1"
                value={restoreData.quantity_to_restore}
                onChange={(e) => setRestoreData({...restoreData, quantity_to_restore: e.target.value})}
                placeholder="Enter quantity to restore"
              />
              <p className="text-sm text-gray-600">
                Available: {selectedScrap?.weight_kg ? selectedScrap.weight_kg.toFixed(2) : '0.00'} kg
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="restore-reason">Reason for Restoration *</Label>
              <Input
                id="restore-reason"
                value={restoreData.reason}
                onChange={(e) => setRestoreData({...restoreData, reason: e.target.value})}
                placeholder="e.g., Material is still usable"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRestoreScrap}>
              Restore to Inventory
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reuse in Production Dialog */}
      <Dialog open={showReuseDialog} onOpenChange={setShowReuseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reuse Scrap in Production</DialogTitle>
            <DialogDescription>
              Use {selectedScrap?.material_name} in a production order
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reuse-production-order">Production Order</Label>
              <Select 
                value={reuseData.production_order_id} 
                onValueChange={(value) => setReuseData({...reuseData, production_order_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select production order" />
                </SelectTrigger>
                <SelectContent>
                  {productionOrders.map((order) => (
                    <SelectItem key={order.production_order_id} value={order.production_order_id}>
                      {order.production_order_number} - {order.product_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reuse-product">Product</Label>
              <Select 
                value={reuseData.product_id} 
                onValueChange={(value) => setReuseData({...reuseData, product_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {productionOrders.map((order) => (
                    <SelectItem key={order.product_id} value={order.product_id}>
                      {order.product_code} - {order.product_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reuse-quantity">Quantity to Reuse (kg)</Label>
              <Input
                id="reuse-quantity"
                type="number"
                step="0.1"
                value={reuseData.quantity_to_reuse}
                onChange={(e) => setReuseData({...reuseData, quantity_to_reuse: e.target.value})}
                placeholder="Enter quantity to reuse"
              />
              <p className="text-sm text-gray-600">
                Available: {selectedScrap?.weight_kg ? selectedScrap.weight_kg.toFixed(2) : '0.00'} kg
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reuse-reason">Reason for Reuse</Label>
              <Input
                id="reuse-reason"
                value={reuseData.reason}
                onChange={(e) => setReuseData({...reuseData, reason: e.target.value})}
                placeholder="e.g., Suitable for production requirements"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReuseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleReuseScrap}>
              Reuse in Production
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScrapManagement;

