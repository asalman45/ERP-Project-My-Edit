import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, Package, PackageCheck, Truck, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface Material {
  material_id: string;
  name: string;  // Changed from material_name to name
  material_type: string;
  unit: string;
  unit_cost: number;
  supplier_id?: string;
  supplier_name?: string;
}

interface Location {
  location_id: string;
  location_name: string;
  location_type: string;
}

interface StockInRecord {
  stock_in_id: string;
  material_id: string;
  material_name: string;
  quantity: number;
  unit: string;
  location: string;
  supplier: string;
  purchase_order_ref: string;
  cost_per_unit: number;
  total_cost: number;
  received_date: string;
  received_by: string;
  status: string;
}

export default function StockIn() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [stockInRecords, setStockInRecords] = useState<StockInRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Form state for creating stock in records
  const [formData, setFormData] = useState({
    material_id: '',
    name: '',  // Changed from material_name to name
    quantity: 0,
    unit: '',
    location: 'Raw Material Warehouse',
    supplier: '',
    purchase_order_ref: '',
    cost_per_unit: 0,
    total_cost: 0,
    received_by: 'current_user',
  });

  useEffect(() => {
    fetchMaterials();
    fetchLocations();
    fetchStockInRecords();
  }, []);

  useEffect(() => {
    // Auto-calculate total cost when quantity or cost per unit changes
    const totalCost = formData.quantity * formData.cost_per_unit;
    setFormData(prev => ({ ...prev, total_cost: totalCost }));
  }, [formData.quantity, formData.cost_per_unit]);

  const fetchMaterials = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/materials');
      if (response.ok) {
        const data = await response.json();
        setMaterials(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast.error('Failed to fetch materials');
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/locations');
      if (response.ok) {
        const data = await response.json();
        setLocations(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error('Failed to fetch locations');
    }
  };

  const fetchStockInRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:4000/api/inventory/stock-in');
      if (response.ok) {
        const data = await response.json();
        setStockInRecords(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Error fetching stock in records:', error);
      toast.error('Failed to fetch stock in records');
    } finally {
      setLoading(false);
    }
  };

  const createStockInRecord = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/inventory/stock-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Stock in record created successfully');
        setShowCreateDialog(false);
        resetForm();
        fetchStockInRecords();
      } else {
        throw new Error('Failed to create stock in record');
      }
    } catch (error) {
      console.error('Error creating stock in record:', error);
      toast.error('Failed to create stock in record');
    }
  };

  const resetForm = () => {
    setFormData({
      material_id: '',
      name: '',  // Changed from material_name to name
      quantity: 0,
      unit: '',
      location: 'Raw Material Warehouse',
      supplier: '',
      purchase_order_ref: '',
      cost_per_unit: 0,
      total_cost: 0,
      received_by: 'current_user',
    });
  };

  const handleMaterialChange = (materialId: string) => {
    const material = materials.find(m => m.material_id === materialId);
    if (material) {
      setFormData(prev => ({
        ...prev,
        material_id: materialId,
        name: material.name || '',
        unit: material.unit || '',
        cost_per_unit: material.unit_cost || 0,
      }));
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'RECEIVED': 'default',
      'PENDING': 'secondary',
      'REJECTED': 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const totalStockInValue = stockInRecords.reduce((sum, record) => sum + record.total_cost, 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stock In</h1>
          <p className="text-muted-foreground">Record material receipts and inventory updates</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Stock In
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Stock In Record</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="material">Material</Label>
                <Select value={formData.material_id} onValueChange={handleMaterialChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((material) => (
                      <SelectItem key={material.material_id} value={material.material_id}>
                        {material.name} ({material.material_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    placeholder="e.g., Sheet, kg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g., Raw Material Warehouse"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                  placeholder="e.g., Steel Supplier A"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchase_order_ref">Purchase Order Ref</Label>
                <Input
                  id="purchase_order_ref"
                  value={formData.purchase_order_ref}
                  onChange={(e) => setFormData({...formData, purchase_order_ref: e.target.value})}
                  placeholder="e.g., PO-001"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cost_per_unit">Cost per Unit (Rs)</Label>
                  <Input
                    id="cost_per_unit"
                    type="number"
                    value={formData.cost_per_unit}
                    onChange={(e) => setFormData({...formData, cost_per_unit: Number(e.target.value)})}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total_cost">Total Cost (Rs)</Label>
                  <Input
                    id="total_cost"
                    type="number"
                    value={formData.total_cost}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="received_by">Received By</Label>
                <Input
                  id="received_by"
                  value={formData.received_by}
                  onChange={(e) => setFormData({...formData, received_by: e.target.value})}
                  placeholder="e.g., Warehouse Manager"
                />
              </div>

              <Button onClick={createStockInRecord} className="w-full">
                <PackageCheck className="w-4 h-4 mr-2" />
                Add Stock In
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="records">Stock In Records</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stockInRecords.length}</div>
                <p className="text-xs text-muted-foreground">
                  Stock in records this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Rs {totalStockInValue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Total stock in value
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Materials</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{materials.length}</div>
                <p className="text-xs text-muted-foreground">
                  Available materials
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Stock In Records</CardTitle>
            </CardHeader>
            <CardContent>
              {stockInRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No stock in records found. Add your first record to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stockInRecords.slice(0, 5).map((record) => (
                    <div key={record.stock_in_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Package className="w-8 h-8 text-blue-600" />
                        <div>
                          <p className="font-medium">{record.material_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {record.quantity} {record.unit} • {record.supplier} • {record.location}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">Rs {record.total_cost.toLocaleString()}</p>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(record.status)}
                          <span className="text-sm text-muted-foreground">
                            {new Date(record.received_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Stock In Records</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>PO Ref</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Received Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockInRecords.map((record) => (
                      <TableRow key={record.stock_in_id}>
                        <TableCell className="font-medium">{record.material_name}</TableCell>
                        <TableCell>{record.quantity.toLocaleString()} {record.unit}</TableCell>
                        <TableCell>{record.location}</TableCell>
                        <TableCell>{record.supplier}</TableCell>
                        <TableCell>{record.purchase_order_ref}</TableCell>
                        <TableCell>Rs {record.total_cost.toLocaleString()}</TableCell>
                        <TableCell>{new Date(record.received_date).toLocaleDateString()}</TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
