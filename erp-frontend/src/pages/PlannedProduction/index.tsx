import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2,
  Package,
  Play,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { plannedProductionApi } from './api';
import type { PlannedProduction, PlannedProductionStatus, PlannedProductionFilters } from './types';
import CreatePlannedProductionModal from './components/CreatePlannedProductionModal';

const statusConfig: Record<PlannedProductionStatus, { label: string; color: string; icon: any }> = {
  PLANNED: { label: 'Planned', color: 'bg-blue-100 text-blue-800', icon: Clock },
  MRP_PLANNED: { label: 'MRP Planned', color: 'bg-yellow-100 text-yellow-800', icon: TrendingUp },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-purple-100 text-purple-800', icon: Play },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: AlertCircle },
};

export default function PlannedProductionPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<PlannedProductionFilters>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlannedProduction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch planned productions
  const { data: plannedProductions = [], isLoading, error, refetch } = useQuery({
    queryKey: ['planned-productions', filters],
    queryFn: () => plannedProductionApi.getAll(filters),
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  // Run MRP planning mutation
  const runMRPMutation = useMutation({
    mutationFn: (id: string) => plannedProductionApi.runMRP(id, 'user'),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['planned-productions'] });
      const shortages = data.data?.mrp_result?.summary?.total_shortages || 0;
      if (shortages > 0) {
        toast.warning(`MRP planning completed. ${shortages} material shortage(s) identified.`);
      } else {
        toast.success('MRP planning completed successfully. All materials available.');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to run MRP planning');
      console.error('MRP planning error:', error);
    },
  });

  // Convert to work orders mutation
  const convertToWorkOrdersMutation = useMutation({
    mutationFn: (id: string) => plannedProductionApi.convertToWorkOrders(id, 'user'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned-productions'] });
      toast.success('Planned production converted to work orders successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to convert planned production to work orders');
      console.error('Convert to work orders error:', error);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => plannedProductionApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned-productions'] });
      toast.success('Planned production deleted successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to delete planned production');
      console.error('Delete error:', error);
    },
  });

  const handleViewDetails = (plan: PlannedProduction) => {
    setSelectedPlan(plan);
    setShowDetailsModal(true);
  };

  const handleRunMRP = (id: string) => {
    if (confirm('Run MRP planning for this planned production? This will calculate material requirements.')) {
      runMRPMutation.mutate(id);
    }
  };

  const handleConvertToWorkOrders = (id: string) => {
    if (confirm('Convert this planned production to work orders? This will start production.')) {
      convertToWorkOrdersMutation.mutate(id);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this planned production?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-8 h-8" />
            Planned Production
          </h1>
          <p className="text-gray-600 mt-1">
            Schedule and produce goods in advance before Sales Orders arrive
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Planned Production
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select 
                value={filters.status || 'all'} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? undefined : value as PlannedProductionStatus }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="PLANNED">Planned</SelectItem>
                  <SelectItem value="MRP_PLANNED">MRP Planned</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Start Date From</label>
              <Input
                type="date"
                value={filters.start_date_from || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, start_date_from: e.target.value || undefined }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Start Date To</label>
              <Input
                type="date"
                value={filters.start_date_to || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, start_date_to: e.target.value || undefined }))}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setFilters({})}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Planned Productions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Planned Productions ({plannedProductions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              Error loading planned productions
            </div>
          ) : plannedProductions.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No planned productions found</p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Planned Production
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan Number</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plannedProductions.map((plan) => {
                  const StatusIcon = statusConfig[plan.status]?.icon || Clock;
                  return (
                    <TableRow key={plan.planned_production_id}>
                      <TableCell className="font-medium">{plan.plan_number}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{plan.product_code || '-'}</div>
                          <div className="text-sm text-gray-500">{plan.product_name || '-'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {plan.quantity_planned} {plan.uom_code || ''}
                      </TableCell>
                      <TableCell>
                        {plan.start_date ? new Date(plan.start_date).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        {plan.end_date ? new Date(plan.end_date).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig[plan.status]?.color || ''}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig[plan.status]?.label || plan.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{plan.priority}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(plan)}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          {plan.status === 'PLANNED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRunMRP(plan.planned_production_id)}
                              disabled={runMRPMutation.isPending}
                              title="Run MRP Planning"
                            >
                              <TrendingUp className="w-3 h-3 text-blue-600" />
                            </Button>
                          )}
                          {plan.status === 'MRP_PLANNED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleConvertToWorkOrders(plan.planned_production_id)}
                              disabled={convertToWorkOrdersMutation.isPending}
                              title="Convert to Work Orders"
                            >
                              <Play className="w-3 h-3 text-green-600" />
                            </Button>
                          )}
                          {(plan.status === 'PLANNED' || plan.status === 'MRP_PLANNED') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(plan.planned_production_id)}
                              disabled={deleteMutation.isPending}
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <CreatePlannedProductionModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['planned-productions'] });
          setShowCreateModal(false);
        }}
      />

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Planned Production Details</DialogTitle>
            <DialogDescription>
              View details for {selectedPlan?.plan_number}
            </DialogDescription>
          </DialogHeader>
          {selectedPlan && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Plan Number</label>
                  <p className="font-medium">{selectedPlan.plan_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <Badge className={statusConfig[selectedPlan.status]?.color || ''}>
                    {statusConfig[selectedPlan.status]?.label || selectedPlan.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Product</label>
                  <p className="font-medium">{selectedPlan.product_code} - {selectedPlan.product_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Quantity Planned</label>
                  <p className="font-medium text-lg text-blue-600">{selectedPlan.quantity_planned} {selectedPlan.uom_code || 'units'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Start Date</label>
                  <p>{selectedPlan.start_date ? new Date(selectedPlan.start_date).toLocaleDateString() : '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">End Date</label>
                  <p>{selectedPlan.end_date ? new Date(selectedPlan.end_date).toLocaleDateString() : '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Forecast Method</label>
                  <p>{selectedPlan.forecast_method}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Priority</label>
                  <p>{selectedPlan.priority}</p>
                </div>
              </div>

              {/* MRP Results Section */}
              {selectedPlan.status === 'MRP_PLANNED' && selectedPlan.material_requirements && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    MRP Planning Results
                  </h3>
                  
                  {/* Product and Quantity Summary */}
                  <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-blue-700">Product</label>
                        <p className="font-semibold text-blue-900">{selectedPlan.product_code} - {selectedPlan.product_name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-blue-700">Quantity for MRP</label>
                        <p className="font-semibold text-blue-900 text-xl">{selectedPlan.quantity_planned} {selectedPlan.uom_code || 'units'}</p>
                      </div>
                    </div>
                  </div>

                  {/* MRP Summary */}
                  {selectedPlan.forecast_data?.summary && (
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <Card className="p-3">
                        <div className="text-sm text-gray-600">Total Materials</div>
                        <div className="text-xl font-bold">{selectedPlan.forecast_data.summary.total_requirements || 0}</div>
                      </Card>
                      <Card className="p-3">
                        <div className="text-sm text-gray-600">Shortages</div>
                        <div className="text-xl font-bold text-orange-600">
                          {selectedPlan.forecast_data.summary.total_shortages || 0}
                        </div>
                      </Card>
                      <Card className="p-3">
                        <div className="text-sm text-gray-600">Total Cost</div>
                        <div className="text-xl font-bold text-green-600">
                          RS {selectedPlan.forecast_data.summary.total_cost?.toLocaleString() || '0'}
                        </div>
                      </Card>
                    </div>
                  )}

                  {/* Material Requirements Table */}
                  {Array.isArray(selectedPlan.material_requirements) && selectedPlan.material_requirements.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Material</TableHead>
                            <TableHead>Required</TableHead>
                            <TableHead>Available</TableHead>
                            <TableHead>Shortage</TableHead>
                            <TableHead>Unit Cost</TableHead>
                            <TableHead>Total Cost</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedPlan.material_requirements.map((req: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{req.material_name || req.item_name}</TableCell>
                              <TableCell>{req.quantity_required?.toLocaleString() || req.required_quantity?.toLocaleString() || 0}</TableCell>
                              <TableCell>{req.quantity_available?.toLocaleString() || req.available_quantity?.toLocaleString() || 0}</TableCell>
                              <TableCell>
                                {(req.quantity_shortage > 0 || req.shortage > 0) ? (
                                  <Badge variant="destructive">
                                    {(req.quantity_shortage || req.shortage).toLocaleString()}
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">0</Badge>
                                )}
                              </TableCell>
                              <TableCell>RS {parseFloat(req.unit_cost || 0).toFixed(2)}</TableCell>
                              <TableCell>RS {parseFloat(req.total_cost || 0).toLocaleString()}</TableCell>
                              <TableCell>
                                {(req.quantity_shortage > 0 || req.shortage > 0) ? (
                                  <Badge variant="destructive">Shortage</Badge>
                                ) : (
                                  <Badge variant="secondary">Available</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

