import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Recycle, Plus, Search, Package, TrendingUp } from 'lucide-react';

interface ScrapItem {
  scrap_id: string;
  blank_id?: string;
  material_id?: string;
  width_mm?: number;
  length_mm?: number;
  thickness_mm?: number;
  weight_kg: number;
  location_name?: string;
  material_code?: string;
  material_name?: string;
  sub_assembly_name?: string;
  status: 'AVAILABLE' | 'CONSUMED' | 'SOLD' | 'QUARANTINED';
  created_at: string;
  reference?: string;
}

interface ScrapSummary {
  status: string;
  count: number;
  total_weight: number;
  avg_weight: number;
  unique_materials: number;
}

interface ScrapInventoryManagerProps {
  productId?: string;
}

export const ScrapInventoryManager: React.FC<ScrapInventoryManagerProps> = ({
  productId
}) => {
  const [scrapItems, setScrapItems] = useState<ScrapItem[]>([]);
  const [summary, setSummary] = useState<ScrapSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    material_id: '',
    min_width: '',
    min_length: '',
    min_thickness: ''
  });
  const { toast } = useToast();

  // Form state for adding scrap
  const [newScrap, setNewScrap] = useState({
    blank_id: '',
    material_id: '',
    width_mm: '',
    length_mm: '',
    thickness_mm: '',
    weight_kg: '',
    location_id: '',
    reference: '',
    created_by: 'current_user'
  });

  // Form state for searching matching scrap
  const [searchCriteria, setSearchCriteria] = useState({
    width_mm: '',
    length_mm: '',
    thickness_mm: '',
    material_id: ''
  });

  useEffect(() => {
    loadScrapInventory();
    loadSummary();
  }, [filters]);

  const loadScrapInventory = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`/api/scrap-inventory/?${queryParams}`);
      const result = await response.json();
      
      if (response.ok) {
        setScrapItems(result.data || []);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to load scrap inventory",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load scrap inventory",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const response = await fetch('/api/scrap-inventory/summary');
      const result = await response.json();
      
      if (response.ok) {
        setSummary(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load scrap summary:', error);
    }
  };

  const addScrapItem = async () => {
    try {
      const response = await fetch('/api/scrap-inventory/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newScrap,
          width_mm: parseFloat(newScrap.width_mm) || null,
          length_mm: parseFloat(newScrap.length_mm) || null,
          thickness_mm: parseFloat(newScrap.thickness_mm) || null,
          weight_kg: parseFloat(newScrap.weight_kg)
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Scrap item added successfully"
        });
        setShowAddDialog(false);
        setNewScrap({
          blank_id: '',
          material_id: '',
          width_mm: '',
          length_mm: '',
          thickness_mm: '',
          weight_kg: '',
          location_id: '',
          reference: '',
          created_by: 'current_user'
        });
        loadScrapInventory();
        loadSummary();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to add scrap item",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add scrap item",
        variant: "destructive"
      });
    }
  };

  const findMatchingScrap = async () => {
    try {
      if (!searchCriteria.width_mm || !searchCriteria.length_mm || !searchCriteria.thickness_mm) {
        toast({
          title: "Error",
          description: "Width, length, and thickness are required for search",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch('/api/scrap-inventory/find-matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          width_mm: parseFloat(searchCriteria.width_mm),
          length_mm: parseFloat(searchCriteria.length_mm),
          thickness_mm: parseFloat(searchCriteria.thickness_mm),
          material_id: searchCriteria.material_id || null
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setScrapItems(result.data || []);
        toast({
          title: "Success",
          description: `Found ${result.data?.length || 0} matching scrap items`
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to find matching scrap",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to find matching scrap",
        variant: "destructive"
      });
    }
  };

  const markAsConsumed = async (scrapId: string) => {
    try {
      const response = await fetch(`/api/scrap-inventory/${scrapId}/consume`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consumed_by_po: `PO-${Date.now()}`
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Scrap item marked as consumed"
        });
        loadScrapInventory();
        loadSummary();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to mark scrap as consumed",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark scrap as consumed",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800';
      case 'CONSUMED': return 'bg-gray-100 text-gray-800';
      case 'SOLD': return 'bg-blue-100 text-blue-800';
      case 'QUARANTINED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Loading scrap inventory...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Recycle className="h-5 w-5" />
                Scrap Inventory Manager
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Manage reusable materials and scrap inventory
              </p>
            </div>
            <div className="flex gap-2">
              <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Search className="h-4 w-4 mr-2" />
                    Find Matching
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Find Matching Scrap</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="search-width">Width (mm)</Label>
                      <Input
                        id="search-width"
                        type="number"
                        value={searchCriteria.width_mm}
                        onChange={(e) => setSearchCriteria({...searchCriteria, width_mm: e.target.value})}
                        placeholder="Required width"
                      />
                    </div>
                    <div>
                      <Label htmlFor="search-length">Length (mm)</Label>
                      <Input
                        id="search-length"
                        type="number"
                        value={searchCriteria.length_mm}
                        onChange={(e) => setSearchCriteria({...searchCriteria, length_mm: e.target.value})}
                        placeholder="Required length"
                      />
                    </div>
                    <div>
                      <Label htmlFor="search-thickness">Thickness (mm)</Label>
                      <Input
                        id="search-thickness"
                        type="number"
                        value={searchCriteria.thickness_mm}
                        onChange={(e) => setSearchCriteria({...searchCriteria, thickness_mm: e.target.value})}
                        placeholder="Required thickness"
                      />
                    </div>
                    <div>
                      <Label htmlFor="search-material">Material ID (Optional)</Label>
                      <Input
                        id="search-material"
                        value={searchCriteria.material_id}
                        onChange={(e) => setSearchCriteria({...searchCriteria, material_id: e.target.value})}
                        placeholder="Material ID"
                      />
                    </div>
                    <Button onClick={findMatchingScrap} className="w-full">
                      <Search className="h-4 w-4 mr-2" />
                      Find Matching Scrap
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Scrap
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Scrap Item</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="scrap-material">Material ID</Label>
                      <Input
                        id="scrap-material"
                        value={newScrap.material_id}
                        onChange={(e) => setNewScrap({...newScrap, material_id: e.target.value})}
                        placeholder="Material ID"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label htmlFor="scrap-width">Width (mm)</Label>
                        <Input
                          id="scrap-width"
                          type="number"
                          value={newScrap.width_mm}
                          onChange={(e) => setNewScrap({...newScrap, width_mm: e.target.value})}
                          placeholder="Width"
                        />
                      </div>
                      <div>
                        <Label htmlFor="scrap-length">Length (mm)</Label>
                        <Input
                          id="scrap-length"
                          type="number"
                          value={newScrap.length_mm}
                          onChange={(e) => setNewScrap({...newScrap, length_mm: e.target.value})}
                          placeholder="Length"
                        />
                      </div>
                      <div>
                        <Label htmlFor="scrap-thickness">Thickness (mm)</Label>
                        <Input
                          id="scrap-thickness"
                          type="number"
                          value={newScrap.thickness_mm}
                          onChange={(e) => setNewScrap({...newScrap, thickness_mm: e.target.value})}
                          placeholder="Thickness"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="scrap-weight">Weight (kg)</Label>
                      <Input
                        id="scrap-weight"
                        type="number"
                        value={newScrap.weight_kg}
                        onChange={(e) => setNewScrap({...newScrap, weight_kg: e.target.value})}
                        placeholder="Weight in kg"
                      />
                    </div>
                    <div>
                      <Label htmlFor="scrap-reference">Reference</Label>
                      <Input
                        id="scrap-reference"
                        value={newScrap.reference}
                        onChange={(e) => setNewScrap({...newScrap, reference: e.target.value})}
                        placeholder="Reference (e.g., WO-123, GRN-456)"
                      />
                    </div>
                    <Button onClick={addScrapItem} className="w-full">
                      Add Scrap Item
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div>
              <Label htmlFor="filter-status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="CONSUMED">Consumed</SelectItem>
                  <SelectItem value="SOLD">Sold</SelectItem>
                  <SelectItem value="QUARANTINED">Quarantined</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-material">Material ID</Label>
              <Input
                id="filter-material"
                value={filters.material_id}
                onChange={(e) => setFilters({...filters, material_id: e.target.value})}
                placeholder="Material ID"
              />
            </div>
            <div>
              <Label htmlFor="filter-min-width">Min Width (mm)</Label>
              <Input
                id="filter-min-width"
                type="number"
                value={filters.min_width}
                onChange={(e) => setFilters({...filters, min_width: e.target.value})}
                placeholder="Min width"
              />
            </div>
            <div>
              <Label htmlFor="filter-min-length">Min Length (mm)</Label>
              <Input
                id="filter-min-length"
                type="number"
                value={filters.min_length}
                onChange={(e) => setFilters({...filters, min_length: e.target.value})}
                placeholder="Min length"
              />
            </div>
            <div>
              <Label htmlFor="filter-min-thickness">Min Thickness (mm)</Label>
              <Input
                id="filter-min-thickness"
                type="number"
                value={filters.min_thickness}
                onChange={(e) => setFilters({...filters, min_thickness: e.target.value})}
                placeholder="Min thickness"
              />
            </div>
          </div>

          {/* Summary Cards */}
          {summary.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {summary.map((item) => (
                <div key={item.status} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">{item.count}</div>
                  <div className="text-sm text-gray-600">{item.status}</div>
                  <div className="text-xs text-gray-500">{item.total_weight.toFixed(1)} kg</div>
                </div>
              ))}
            </div>
          )}

          {/* Scrap Items Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Dimensions (mm)</TableHead>
                <TableHead>Weight (kg)</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scrapItems.map((item) => (
                <TableRow key={item.scrap_id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.material_name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{item.material_code}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.width_mm && item.length_mm && item.thickness_mm ? (
                      <div className="text-sm">
                        <div>{item.width_mm} × {item.length_mm}</div>
                        <div className="text-gray-500">{item.thickness_mm} mm thick</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>{item.weight_kg.toFixed(2)}</TableCell>
                  <TableCell>{item.location_name || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(item.status)} variant="secondary">
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.reference || 'N/A'}</TableCell>
                  <TableCell>
                    {new Date(item.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {item.status === 'AVAILABLE' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsConsumed(item.scrap_id)}
                      >
                        Mark Consumed
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {scrapItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Recycle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No scrap items found matching the current filters.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
