import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { plannedProductionApi } from '../api';
import { productApi } from '@/services/api';
import type { CreatePlannedProductionRequest } from '../types';

interface CreatePlannedProductionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreatePlannedProductionModal({
  open,
  onOpenChange,
  onSuccess,
}: CreatePlannedProductionModalProps) {
  const [formData, setFormData] = useState<CreatePlannedProductionRequest>({
    product_id: '',
    quantity_planned: 0,
    forecast_method: 'MANUAL',
    start_date: new Date().toISOString().split('T')[0],
    priority: 1,
  });

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => productApi.getAll(),
    enabled: open,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreatePlannedProductionRequest) => plannedProductionApi.create(data),
    onSuccess: () => {
      toast.success('Planned production created successfully');
      onSuccess();
      // Reset form
      setFormData({
        product_id: '',
        quantity_planned: 0,
        forecast_method: 'MANUAL',
        start_date: new Date().toISOString().split('T')[0],
        priority: 1,
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create planned production');
      console.error('Create error:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.product_id || !formData.quantity_planned || !formData.start_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Planned Production</DialogTitle>
          <DialogDescription>
            Schedule production in advance before Sales Orders arrive
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product_id">Product *</Label>
              <Select
                value={formData.product_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, product_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product: any) => (
                    <SelectItem key={product.product_id} value={product.product_id}>
                      {product.product_code} - {product.part_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity_planned">Quantity Planned *</Label>
              <Input
                id="quantity_planned"
                type="number"
                step="0.01"
                min="0"
                value={formData.quantity_planned || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity_planned: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date (Optional)</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value || undefined }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_date">Delivery Date (Optional)</Label>
              <Input
                id="delivery_date"
                type="date"
                value={formData.delivery_date || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, delivery_date: e.target.value || undefined }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="forecast_method">Forecast Method</Label>
              <Select
                value={formData.forecast_method || 'MANUAL'}
                onValueChange={(value) => setFormData(prev => ({ ...prev, forecast_method: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANUAL">Manual</SelectItem>
                  <SelectItem value="MRP_BASED">MRP Based</SelectItem>
                  <SelectItem value="HISTORICAL">Historical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                type="number"
                min="1"
                max="10"
                value={formData.priority || 1}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Planned Production'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


