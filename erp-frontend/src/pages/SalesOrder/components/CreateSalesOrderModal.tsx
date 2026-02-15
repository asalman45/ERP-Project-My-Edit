import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Trash2, Calculator } from 'lucide-react';
import { salesOrderApi } from '../api';
import { productApi } from '@/services/api';
import type { CreateSalesOrderRequest, Customer, SalesOrderItem } from '../types';

interface CreateSalesOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateSalesOrderModal({ open, onOpenChange, onSuccess }: CreateSalesOrderModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<CreateSalesOrderRequest>>({
    customer_id: '',
    reference_number: '',
    required_date: '',
    delivery_date: '',
    order_type: 'STANDARD',
    priority: 'NORMAL',
    shipping_method: '',
    payment_terms: 'NET 30',
    items: []
  });

  const [items, setItems] = useState<Omit<SalesOrderItem, 'item_id' | 'line_total'>[]>([
    {
      item_code: '',
      item_name: '',
      description: '',
      specification: '',
      quantity: 1,
      unit_of_measure: 'PCS',
      unit_price: 0,
      production_required: true,
      delivery_required: true
    }
  ]);

  const [selectedOEMProducts, setSelectedOEMProducts] = useState<any[]>([]);

  // Fetch customers (OEMs)
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => salesOrderApi.getCustomers(),
  });

  // Fetch all products for selection
  const { data: allProducts = [], isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ['all-products'],
    queryFn: () => productApi.getAll(),
  });

  // Create sales order mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateSalesOrderRequest) => salesOrderApi.create(data),
    onSuccess: () => {
      onSuccess();
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Failed to create sales order');
      console.error('Create sales order error:', error);
    },
  });

  const resetForm = () => {
    setFormData({
      customer_id: '',
      reference_number: '',
      required_date: '',
      delivery_date: '',
      order_type: 'STANDARD',
      priority: 'NORMAL',
      shipping_method: '',
      payment_terms: 'NET 30',
      items: []
    });
    setItems([
      {
        item_code: '',
        item_name: '',
        description: '',
        specification: '',
        quantity: 1,
        unit_of_measure: 'PCS',
        unit_price: 0,
        production_required: true,
        delivery_required: true
      }
    ]);
  };

  const addItem = () => {
    setItems([...items, {
      item_code: '',
      item_name: '',
      description: '',
      specification: '',
      quantity: 1,
      unit_of_measure: 'PCS',
      unit_price: 0,
      production_required: true,
      delivery_required: true
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof SalesOrderItem, value: any) => {
    const updatedItems = items.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setItems(updatedItems);
  };

  const handleProductCodeChange = (index: number, productCode: string) => {
    const selectedProduct = allProducts.find(p => p.product_code === productCode);
    if (selectedProduct) {
      const updatedItems = items.map((item, i) => 
        i === index ? {
          ...item,
          item_code: productCode,
          item_name: selectedProduct.part_name,
          description: selectedProduct.description || '',
          unit_of_measure: selectedProduct.uom_code || 'PCS',
          unit_price: selectedProduct.standard_cost || 0
        } : item
      );
      setItems(updatedItems);
    } else {
      updateItem(index, 'item_code', productCode);
    }
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const taxRate = 18; // 18% tax
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    
    return { subtotal, taxRate, taxAmount, total };
  };

  const handleSubmit = () => {
    // Validation
    if (!formData.customer_id) {
      toast.error('Please select a customer');
      return;
    }

    if (items.some(item => !item.item_name || !item.quantity || !item.unit_price)) {
      toast.error('Please fill in all required item fields');
      return;
    }

    // Clean up date fields - convert empty strings to null/undefined
    const cleanedFormData = {
      ...formData,
      required_date: formData.required_date && formData.required_date.trim() !== '' ? formData.required_date : undefined,
      delivery_date: formData.delivery_date && formData.delivery_date.trim() !== '' ? formData.delivery_date : undefined,
    };

    // Find the selected customer and use its mapped_customer_id for database compatibility
    const selectedCustomer = customers.find(c => c.customer_id === cleanedFormData.customer_id);
    const customerIdForDB = selectedCustomer?.mapped_customer_id || cleanedFormData.customer_id;

    const orderData: CreateSalesOrderRequest = {
      ...cleanedFormData,
      customer_id: customerIdForDB, // Use mapped customer ID for database
      items: items.map(item => ({
        ...item,
        line_total: item.quantity * item.unit_price
      }))
    } as CreateSalesOrderRequest;

    createMutation.mutate(orderData);
  };

  const { subtotal, taxRate, taxAmount, total } = calculateTotals();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Sales Order</DialogTitle>
          <DialogDescription>
            Create a new sales order for customer production requirements
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer and Order Details */}
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_id">OEM (Customer) *</Label>
                  <Select
                    value={formData.customer_id}
                    onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select OEM" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.customer_id} value={customer.customer_id}>
                          {customer.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reference_number">Customer PO Number</Label>
                  <Input
                    id="reference_number"
                    value={formData.reference_number || ''}
                    onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                    placeholder="Enter customer PO number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="required_date">Required Date</Label>
                  <Input
                    id="required_date"
                    type="date"
                    value={formData.required_date || ''}
                    onChange={(e) => setFormData({ ...formData, required_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery_date">Delivery Date</Label>
                  <Input
                    id="delivery_date"
                    type="date"
                    value={formData.delivery_date || ''}
                    onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order_type">Order Type</Label>
                  <Select
                    value={formData.order_type}
                    onValueChange={(value) => setFormData({ ...formData, order_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STANDARD">Standard</SelectItem>
                      <SelectItem value="RUSH">Rush</SelectItem>
                      <SelectItem value="REPEAT">Repeat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shipping_method">Shipping Method</Label>
                <Input
                  id="shipping_method"
                  value={formData.shipping_method || ''}
                  onChange={(e) => setFormData({ ...formData, shipping_method: e.target.value })}
                  placeholder="e.g., Road Transport, Air Freight"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="special_instructions">Special Instructions</Label>
                <Textarea
                  id="special_instructions"
                  value={formData.special_instructions || ''}
                  onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                  placeholder="Any special instructions or requirements..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Items Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Order Items</CardTitle>
                <Button onClick={addItem} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Code</TableHead>
                    <TableHead>Item Name *</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Qty *</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Unit Price *</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {productsLoading ? (
                          <div className="text-sm text-gray-500">Loading products...</div>
                        ) : productsError ? (
                          <div className="text-sm text-red-500">Error loading products</div>
                        ) : allProducts.length > 0 ? (
                          <Select
                            value={item.item_code || ''}
                            onValueChange={(value) => handleProductCodeChange(index, value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select product code" />
                            </SelectTrigger>
                            <SelectContent>
                              {allProducts.map((product) => (
                                <SelectItem key={product.product_id} value={product.product_code}>
                                  <div className="flex flex-col">
                                    <span>{product.product_code}</span>
                                    <span className="text-xs text-gray-500">
                                      {product.part_name} - {product.oem_name}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={item.item_code || ''}
                            onChange={(e) => updateItem(index, 'item_code', e.target.value)}
                            placeholder="Item code"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.item_name}
                          onChange={(e) => updateItem(index, 'item_name', e.target.value)}
                          placeholder="Item name"
                          required
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.description || ''}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          placeholder="Description"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.quantity || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            updateItem(index, 'quantity', value === '' ? 0 : parseFloat(value) || 0);
                          }}
                          min="0"
                          step="0.01"
                          placeholder="0"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={item.unit_of_measure || 'PCS'}
                          onValueChange={(value) => updateItem(index, 'unit_of_measure', value)}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PCS">PCS</SelectItem>
                            <SelectItem value="KG">KG</SelectItem>
                            <SelectItem value="M">M</SelectItem>
                            <SelectItem value="M2">M²</SelectItem>
                            <SelectItem value="L">L</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.unit_price || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            updateItem(index, 'unit_price', value === '' ? 0 : parseFloat(value) || 0);
                          }}
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(item.quantity * item.unit_price)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax ({taxRate}%):</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Sales Order'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
