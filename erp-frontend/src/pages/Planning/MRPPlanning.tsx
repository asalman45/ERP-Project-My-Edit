import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Calculator, ShoppingCart, Package, FileText, Edit, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { mrpApi } from '@/services/api';
import CreateIPOModal from '@/pages/InternalPurchaseOrder/components/CreateIPOModal';

interface Product {
  product_id: string;
  product_code: string;
  part_name: string;
  description: string;
  bom_items_count: number;
  total_production_quantity: number;
  sales_order_quantity?: number;
  planned_production_quantity?: number;
  active_sales_orders_count: number;
  active_planned_productions_count?: number;
  display_name: string;
  has_production_demand: boolean;
}

interface SalesOrder {
  sales_order_id: string;
  order_number: string;
  status: string;
  required_date: string;
  delivery_date: string;
  customer_name: string;
  total_items: number;
  production_quantity: number;
  production_items_count: number;
  display_name: string;
}

interface SalesOrderItem {
  item_id: string;
  item_code: string;
  item_name: string;
  description: string;
  specification: string;
  quantity: number;
  unit_of_measure: string;
  unit_price: number;
  line_total: number;
  production_required: boolean;
  delivery_required: boolean;
  delivery_date: string;
  product_id: string;
  product_code: string;
  product_name: string;
  display_name: string;
  has_product_link: boolean;
}

interface MaterialRequirement {
  material_id: string;
  material_name: string;
  required_quantity: number;
  available_quantity: number;
  shortage: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
}

interface PurchaseRequisition {
  pr_id: string;
  material_id?: string;
  material_code?: string;
  material_name: string;
  quantity: number;
  unit: string;
  supplier: string;
  required_date: string;
  status: string;
  shortage_sources?: Array<{ reference?: string; shortage: number }>;
}

interface Supplier {
  supplier_id: string;
  code: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  lead_time_days: number;
  display_name: string;
}

export default function MRPPlanning() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [salesOrderItems, setSalesOrderItems] = useState<SalesOrderItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<string>('manual');
  const [quantity, setQuantity] = useState<number>(500);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [mrpResults, setMrpResults] = useState<MaterialRequirement[]>([]);
  const [purchaseRequisitions, setPurchaseRequisitions] = useState<PurchaseRequisition[]>([]);
  const [running, setRunning] = useState(false);
  const [selectedSuppliers, setSelectedSuppliers] = useState<{[prId: string]: string}>({});
  const [selectedPRs, setSelectedPRs] = useState<Set<string>>(new Set());
  const [showIPOModal, setShowIPOModal] = useState(false);
  const [ipoInitialData, setIpoInitialData] = useState<any>(null);

  // Calculate selected product data
  const selectedProductData = filteredProducts.find(p => p.product_id === selectedProduct);

  useEffect(() => {
    fetchProducts();
    fetchSalesOrders();
    fetchSuppliers();
  }, []);

  // Auto-set quantity when product is selected
  useEffect(() => {
    if (selectedProduct && selectedProductData) {
      let quantityToSet = 0;
      
      // If a sales order is selected, use the quantity from that specific sales order item
      if (selectedSalesOrder && selectedSalesOrder !== 'manual' && salesOrderItems.length > 0) {
        const salesOrderItem = salesOrderItems.find(item => item.item_code === selectedProductData.product_code);
        if (salesOrderItem) {
          // Add sales order quantity + planned production quantity
          quantityToSet = salesOrderItem.quantity + (selectedProductData.planned_production_quantity || 0);
        }
      }
      
      // Fallback to total production quantity if no sales order item found
      if (quantityToSet === 0 && selectedProductData.total_production_quantity > 0) {
        quantityToSet = selectedProductData.total_production_quantity;
      }
      
      if (quantityToSet > 0) {
        setQuantity(quantityToSet);
      }
    }
  }, [selectedProduct, selectedProductData, selectedSalesOrder, salesOrderItems]);

  // Fetch sales order items when sales order is selected
  useEffect(() => {
    if (selectedSalesOrder && selectedSalesOrder !== 'manual') {
      fetchSalesOrderItems(selectedSalesOrder);
    } else {
      setSalesOrderItems([]);
    }
  }, [selectedSalesOrder]);

  // Filter products based on selected sales order
  useEffect(() => {
    let newFilteredProducts: Product[] = [];
    
    if (selectedSalesOrder && selectedSalesOrder !== 'manual' && salesOrderItems.length > 0) {
      // Get item codes from the selected sales order
      const salesOrderItemCodes = new Set(salesOrderItems.map(item => item.item_code));
      
      // Filter products to only show those that exist in the sales order
      newFilteredProducts = products.filter(product => 
        salesOrderItemCodes.has(product.product_code)
      );
    } else {
      // Show all products if no sales order selected or 'manual' entry
      newFilteredProducts = products;
    }
    
    setFilteredProducts(newFilteredProducts);
    
    // Reset selected product if it's no longer in the filtered list
    if (selectedProduct && !newFilteredProducts.some(p => p.product_id === selectedProduct)) {
      setSelectedProduct('');
    }
  }, [selectedSalesOrder, salesOrderItems, products, selectedProduct]);

  const fetchProducts = async () => {
    try {
      console.log('Fetching products for MRP...');
      const data = await mrpApi.getProducts();
      console.log('Products API response:', data);
      
      if (Array.isArray(data) && data.length > 0) {
        setProducts(data);
        console.log('Products loaded:', data.length);
      } else {
        setProducts([]);
        console.warn('No products data in response');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    }
  };

  const fetchSalesOrders = async () => {
    try {
      console.log('Fetching sales orders for MRP...');
      const data = await mrpApi.getSalesOrders();
      console.log('Sales Orders API response:', data);
      
      if (Array.isArray(data) && data.length > 0) {
        setSalesOrders(data);
        console.log('Sales orders loaded:', data.length);
      } else {
        setSalesOrders([]);
        console.warn('No sales orders data in response');
      }
    } catch (error) {
      console.error('Error fetching sales orders:', error);
      toast.error('Failed to fetch sales orders');
    }
  };

  const fetchSalesOrderItems = async (salesOrderId: string) => {
    try {
      console.log('Fetching sales order items for:', salesOrderId);
      const data = await mrpApi.getSalesOrderItems(salesOrderId);
      console.log('Sales Order Items API response:', data);
      
      if (Array.isArray(data) && data.length > 0) {
        setSalesOrderItems(data);
        console.log('Sales order items loaded:', data.length);
      } else {
        setSalesOrderItems([]);
        console.warn('No sales order items data in response');
      }
    } catch (error) {
      console.error('Error fetching sales order items:', error);
      toast.error('Failed to fetch sales order items');
    }
  };

  const fetchSuppliers = async () => {
    try {
      console.log('Fetching suppliers for MRP...');
      const data = await mrpApi.getSuppliers();
      console.log('Suppliers API response:', data);
      
      if (Array.isArray(data) && data.length > 0) {
        setSuppliers(data);
        console.log('Suppliers loaded:', data.length);
      } else {
        setSuppliers([]);
        console.warn('No suppliers data in response');
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Failed to fetch suppliers');
    }
  };

  const runMRP = async () => {
    if (!selectedProduct || quantity <= 0) {
      toast.error('Please select a product and enter quantity');
      return;
    }

    setRunning(true);
    try {
      const data = await mrpApi.runMRP({
        product_id: selectedProduct,
        quantity: quantity,
      });

      setMrpResults(data.requirements || []);
      toast.success('MRP calculation completed successfully');
    } catch (error) {
      console.error('Error running MRP:', error);
      toast.error('Failed to run MRP calculation');
    } finally {
      setRunning(false);
    }
  };

  const generatePurchaseRequisitions = async () => {
    if (mrpResults.length === 0) {
      toast.error('No MRP results to generate PRs from');
      return;
    }

    try {
      const data = await mrpApi.generatePurchaseRequisitions({
        requirements: mrpResults.filter(req => req.shortage > 0),
        selected_suppliers: selectedSuppliers,
      });

      setPurchaseRequisitions(data.prs || []);
      toast.success('Purchase requisitions generated successfully');
    } catch (error) {
      console.error('Error generating PRs:', error);
      toast.error('Failed to generate purchase requisitions');
    }
  };

  const convertPRToIPO = (prData: PurchaseRequisition) => {
    const selectedSupplierId = selectedSuppliers[prData.pr_id];
    
    if (!selectedSupplierId) {
      toast.error('Please select a supplier for this Purchase Requisition');
      return;
    }

    // Find supplier details
    const supplier = suppliers.find(s => s.supplier_id === selectedSupplierId);
    
    // Prepare initial data for Internal Purchase Order
    const initialData = {
      supplier_name: supplier?.name || '',
      contact_person: supplier?.contact || '',
      contact_phone: supplier?.phone || '',
      supplier_address: supplier?.address || '',
      supplier_email: supplier?.email || '',
      supplier_ntn: '',
      supplier_strn: '',
      order_date: new Date().toISOString().split('T')[0],
      expected_date: prData.required_date ? new Date(prData.required_date).toISOString().split('T')[0] : '',
      notes: `Generated from Purchase Requisition: ${prData.pr_id}`,
      items: [{
        item_name: prData.material_name,
        description: `Material from PR: ${prData.pr_id}`,
        quantity: prData.quantity,
        unit_price: 0,
        total_amount: 0,
        material_id: prData.material_id
      }],
      tax_percentage: 18,
      created_by: 'current-user',
      supplier_id: selectedSupplierId
    };

    setIpoInitialData(initialData);
    setShowIPOModal(true);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Select all PENDING PRs that have suppliers selected
      const pendingPRs = purchaseRequisitions
        .filter(pr => pr.status === 'PENDING' && selectedSuppliers[pr.pr_id])
        .map(pr => pr.pr_id);
      setSelectedPRs(new Set(pendingPRs));
    } else {
      setSelectedPRs(new Set());
    }
  };

  const handleSelectPR = (prId: string, checked: boolean) => {
    const newSelected = new Set(selectedPRs);
    if (checked) {
      newSelected.add(prId);
    } else {
      newSelected.delete(prId);
    }
    setSelectedPRs(newSelected);
  };

  const handleCreateAllPOs = async () => {
    if (selectedPRs.size === 0) {
      toast.error('Please select at least one Purchase Requisition');
      return;
    }

    // Check if all selected PRs have suppliers
    const prsWithoutSuppliers = Array.from(selectedPRs).filter(
      prId => !selectedSuppliers[prId]
    );

    if (prsWithoutSuppliers.length > 0) {
      toast.error('Please select suppliers for all selected Purchase Requisitions');
      return;
    }

    // Group PRs by supplier to create combined IPOs
    const prsBySupplier = new Map<string, PurchaseRequisition[]>();
    
    Array.from(selectedPRs).forEach(prId => {
      const pr = purchaseRequisitions.find(p => p.pr_id === prId);
      if (pr) {
        const supplierId = selectedSuppliers[prId];
        if (!prsBySupplier.has(supplierId)) {
          prsBySupplier.set(supplierId, []);
        }
        prsBySupplier.get(supplierId)!.push(pr);
      }
    });

    try {
      setLoading(true);
      let createdCount = 0;

      // Create one IPO per supplier (combining all PRs for that supplier)
      for (const [supplierId, prs] of prsBySupplier.entries()) {
        const supplier = suppliers.find(s => s.supplier_id === supplierId);
        if (!supplier) continue;

        // Combine all items from PRs for this supplier
        const items = prs.map(pr => ({
          item_name: pr.material_name,
          description: `Material from PR: ${pr.pr_id}`,
          quantity: pr.quantity,
          unit_price: 0,
          total_amount: 0,
          material_id: pr.material_id
        }));

        // Use the earliest required date
        const earliestDate = prs.reduce((earliest, pr) => {
          const prDate = pr.required_date ? new Date(pr.required_date) : null;
          if (!prDate) return earliest;
          if (!earliest) return prDate;
          return prDate < earliest ? prDate : earliest;
        }, null as Date | null);

        const initialData = {
          supplier_name: supplier.name || '',
          contact_person: supplier.contact || '',
          contact_phone: supplier.phone || '',
          supplier_address: supplier.address || '',
          supplier_email: supplier.email || '',
          supplier_ntn: '',
          supplier_strn: '',
          order_date: new Date().toISOString().split('T')[0],
          expected_date: earliestDate ? earliestDate.toISOString().split('T')[0] : '',
          notes: `Generated from ${prs.length} Purchase Requisition(s): ${prs.map(p => p.pr_id).join(', ')}`,
          items: items,
          tax_percentage: 18,
          created_by: 'current-user',
          supplier_id: supplierId
        };

        // Open modal for this supplier's IPO
        setIpoInitialData(initialData);
        setShowIPOModal(true);
        createdCount++;

        // Wait for user to complete this IPO before showing next one
        // (User will close modal after creating IPO)
        break; // Create one at a time, user can click "Create All" again for next batch
      }

      if (createdCount > 0) {
        toast.success(`Opening IPO creation for ${createdCount} supplier(s). Complete each one to continue.`);
        // Remove created PRs from selection
        const remainingPRs = Array.from(selectedPRs).filter(
          prId => !Array.from(prsBySupplier.values()).flat().some(pr => pr.pr_id === prId)
        );
        setSelectedPRs(new Set(remainingPRs));
      }

    } catch (error: any) {
      toast.error(error.message || 'Failed to create Purchase Orders');
    } finally {
      setLoading(false);
    }
  };

  const completedPOs = purchaseRequisitions.filter(pr => pr.status === 'PO_CREATED').length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">MRP Planning</h1>
          <p className="text-muted-foreground">Material Requirement Planning & Purchase Requisitions</p>
        </div>
        <div className="flex gap-2">
          {completedPOs > 0 && (
            <Button 
              variant="outline" 
              onClick={() => navigate('/purchase-orders')}
              className="gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              View {completedPOs} Purchase Order{completedPOs > 1 ? 's' : ''}
            </Button>
          )}
          <Button 
            variant="outline"
            onClick={() => navigate('/production-planning')}
            className="gap-2"
          >
            <Calculator className="w-4 h-4" />
            Production Planning
          </Button>
        </div>
      </div>

      {/* Sales Orders Summary */}
      {salesOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Active Sales Orders with Production Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {salesOrders.slice(0, 6).map((order) => (
                <div key={order.sales_order_id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={order.status === 'APPROVED' ? 'default' : 'secondary'}>
                      {order.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(order.required_date).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-medium">{order.order_number}</h4>
                  <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">{order.production_quantity} pcs</span>
                  </div>
                </div>
              ))}
            </div>
            {salesOrders.length > 6 && (
              <p className="text-sm text-muted-foreground mt-4 text-center">
                And {salesOrders.length - 6} more sales orders...
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="mrp" className="space-y-6">
        <TabsList>
          <TabsTrigger value="mrp">MRP Calculation</TabsTrigger>
          <TabsTrigger value="requirements">Material Requirements</TabsTrigger>
          <TabsTrigger value="purchase-reqs">Purchase Requisitions</TabsTrigger>
        </TabsList>

        <TabsContent value="mrp" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Run MRP Calculation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product">Select Product</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a product" />
                    </SelectTrigger>
                    <SelectContent>
            {filteredProducts.map((product) => {
              const soQty = product.sales_order_quantity || 0;
              const plannedQty = product.planned_production_quantity || 0;
              return (
                <SelectItem key={product.product_id} value={product.product_id}>
                            {product.display_name}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {selectedProductData && selectedProductData.has_production_demand && (
                    <div className="text-xs space-y-0.5 mt-1 pl-1">
                      <span className="text-green-600 font-medium">
                        Total: {selectedProductData.total_production_quantity} pcs needed
                        </span>
                      {selectedProductData.planned_production_quantity > 0 && (
                          <span className="block text-blue-600">
                          • Planned: {selectedProductData.planned_production_quantity} pcs
                          </span>
                        )}
                      </div>
                    )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sales-order">Sales Order (Optional)</Label>
                  <Select value={selectedSalesOrder} onValueChange={setSelectedSalesOrder}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a sales order" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual Entry</SelectItem>
                      {salesOrders.map((order) => (
                        <SelectItem key={order.sales_order_id} value={order.sales_order_id}>
                          <div className="flex flex-col">
                            <span>{order.order_number}</span>
                            <span className="text-xs text-muted-foreground">
                              {order.customer_name} - {order.production_quantity} pcs
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity to Produce</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    placeholder="Enter quantity"
                    min="1"
                      className={selectedProductData?.total_production_quantity > 0 ? "border-green-500 bg-green-50" : ""}
                    />
              {selectedProductData?.total_production_quantity > 0 && (
                    <div className="space-y-1">
                      <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                        Auto-filled from sales orders
                  </Badge>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <span>💡</span>
                        <span>Quantity automatically set to {quantity} pcs based on planned production.</span>
                      </p>
                </div>
                  )}
                </div>
              </div>

              {selectedProductData && (
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <h4 className="font-semibold text-base">Total Production Demand</h4>
                  <div className="space-y-2">
                    <p className="text-base font-semibold">
                      Total Production Demand: <span className="text-primary">{selectedProductData.total_production_quantity} pcs</span>
                        </p>
                      {selectedProductData.planned_production_quantity && selectedProductData.planned_production_quantity > 0 && (
                        <p className="text-sm text-blue-600">
                          • From Planned Production: {selectedProductData.planned_production_quantity} pcs ({selectedProductData.active_planned_productions_count || 0} plans)
                        </p>
                      )}
                    {selectedProductData.sales_order_quantity > 0 && (
                      <p className="text-sm text-muted-foreground">
                        • From Sales Orders: {selectedProductData.sales_order_quantity} pcs ({selectedProductData.active_sales_orders_count} orders)
                      </p>
                    )}
                      {selectedProductData.has_production_demand && (
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant="secondary" className="gap-1">
                          <Package className="w-3 h-3" />
                          Production Required
                        </Badge>
                      </div>
                      )}
                  </div>
                </div>
              )}

              {/* Sales Order Items Display */}
              {selectedSalesOrder !== 'manual' && salesOrderItems.length > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium mb-3 text-blue-800">Sales Order Items:</h4>
                  <div className="space-y-2">
                    {salesOrderItems.map((item) => (
                      <div key={item.item_id} className="flex items-center justify-between p-3 bg-white rounded border">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{item.item_code}</span>
                            <span className="text-sm text-gray-600">{item.item_name}</span>
                            {item.production_required && (
                              <Badge variant="secondary" className="text-xs">
                                <Package className="w-3 h-3 mr-1" />
                                Production Required
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {item.description && `${item.description} • `}
                            {item.specification && `${item.specification} • `}
                            {item.has_product_link && `Linked to Product: ${item.product_code}`}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-sm">{item.quantity} {item.unit_of_measure}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4">
              <Button 
                onClick={runMRP} 
                disabled={running || !selectedProduct}
                  size="lg"
                  className="gap-2"
              >
                {running ? (
                  <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                    Running MRP Calculation...
                  </>
                ) : (
                  <>
                      <Calculator className="w-4 h-4" />
                    Run MRP
                  </>
                )}
              </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requirements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Material Requirements
                </div>
                {mrpResults.length > 0 && (
                  <Badge variant="secondary">
                    {mrpResults.filter(r => r.shortage > 0).length} Shortages
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mrpResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No MRP results available. Run MRP calculation first.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4">
                      <div className="text-sm text-muted-foreground">Total Materials</div>
                      <div className="text-2xl font-bold">{mrpResults.length}</div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-sm text-muted-foreground">Shortages</div>
                      <div className="text-2xl font-bold text-orange-600">
                        {mrpResults.filter(r => r.shortage > 0).length}
                      </div>
                    </Card>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Required</TableHead>
                        <TableHead>Available</TableHead>
                        <TableHead>Shortage</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mrpResults.map((req, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{req.material_name}</TableCell>
                          <TableCell>{req.required_quantity.toLocaleString()}</TableCell>
                          <TableCell>{req.available_quantity.toLocaleString()}</TableCell>
                          <TableCell>
                            {req.shortage > 0 ? (
                              <Badge variant="destructive">{req.shortage.toLocaleString()}</Badge>
                            ) : (
                              <Badge variant="secondary">0</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {req.shortage > 0 ? (
                              <Badge variant="destructive">Shortage</Badge>
                            ) : (
                              <Badge variant="secondary">Available</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {mrpResults.filter(r => r.shortage > 0).length > 0 && (
                    <Button onClick={generatePurchaseRequisitions} className="w-full">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Generate Purchase Requisitions
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchase-reqs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Purchase Requisitions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {purchaseRequisitions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No purchase requisitions generated yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedPRs.size > 0 && (
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-blue-900">
                          {selectedPRs.size} Purchase Requisition(s) selected
                        </span>
                      </div>
                      <Button
                        onClick={handleCreateAllPOs}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4 mr-2" />
                            Create All POs ({selectedPRs.size})
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              purchaseRequisitions.filter(pr => pr.status === 'PENDING' && selectedSuppliers[pr.pr_id]).length > 0 &&
                              purchaseRequisitions.filter(pr => pr.status === 'PENDING' && selectedSuppliers[pr.pr_id]).every(pr => selectedPRs.has(pr.pr_id))
                            }
                            onCheckedChange={handleSelectAll}
                            disabled={purchaseRequisitions.filter(pr => pr.status === 'PENDING' && selectedSuppliers[pr.pr_id]).length === 0}
                          />
                        </TableHead>
                        <TableHead>PR ID</TableHead>
                        <TableHead>Material</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Required Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseRequisitions.map((pr) => (
                        <TableRow key={pr.pr_id}>
                          <TableCell>
                            {pr.status === 'PENDING' && selectedSuppliers[pr.pr_id] ? (
                              <Checkbox
                                checked={selectedPRs.has(pr.pr_id)}
                                onCheckedChange={(checked) => handleSelectPR(pr.pr_id, checked as boolean)}
                              />
                            ) : null}
                          </TableCell>
                          <TableCell className="font-medium">{pr.pr_id}</TableCell>
                          <TableCell>{pr.material_name}</TableCell>
                          <TableCell>{pr.quantity.toLocaleString()} {pr.unit || ''}</TableCell>
                          <TableCell>
                            {pr.status === 'PENDING' ? (
                              <Select
                                value={selectedSuppliers[pr.pr_id] || ''}
                                onValueChange={(value) => {
                                  setSelectedSuppliers(prev => ({
                                    ...prev,
                                    [pr.pr_id]: value
                                  }));
                                  // Auto-select if supplier is chosen
                                  if (value) {
                                    handleSelectPR(pr.pr_id, true);
                                  } else {
                                    handleSelectPR(pr.pr_id, false);
                                  }
                                }}
                              >
                                <SelectTrigger className="w-[200px]">
                                  <SelectValue placeholder="Select supplier" />
                                </SelectTrigger>
                                <SelectContent>
                                  {suppliers.map((supplier) => (
                                    <SelectItem key={supplier.supplier_id} value={supplier.supplier_id}>
                                      {supplier.display_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {suppliers.find(s => s.supplier_id === selectedSuppliers[pr.pr_id])?.name || pr.supplier}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>{new Date(pr.required_date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={pr.status === 'PENDING' ? 'destructive' : 'secondary'}
                            >
                              {pr.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {pr.status === 'PENDING' ? (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => convertPRToIPO(pr)}
                                  className="h-8"
                                  disabled={!selectedSuppliers[pr.pr_id]}
                                >
                                  <FileText className="w-3 h-3 mr-1" />
                                  Create PO
                                </Button>
                              </div>
                            ) : pr.status === 'PO_CREATED' ? (
                              <div className="flex gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  PO Created
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => navigate('/purchase-orders')}
                                  className="h-8"
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  View in PO
                                </Button>
                              </div>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                {pr.status}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Internal Purchase Order Modal */}
      <CreateIPOModal
        isOpen={showIPOModal}
        onClose={() => {
          setShowIPOModal(false);
          setIpoInitialData(null);
        }}
        onSuccess={() => {
          // Update PR status to PO_CREATED for all PRs in the current IPO
          if (ipoInitialData?.notes) {
            // Extract PR IDs from notes (format: "Generated from X Purchase Requisition(s): PR-ID1, PR-ID2, ...")
            const prIdsMatch = ipoInitialData.notes.match(/Purchase Requisition\(s\): (.+)/);
            if (prIdsMatch) {
              const prIds = prIdsMatch[1].split(',').map(id => id.trim());
              setPurchaseRequisitions(prev => 
                prev.map(pr => {
                  if (prIds.some(id => pr.pr_id.includes(id) || pr.pr_id === id)) {
                    return { ...pr, status: 'PO_CREATED' };
                  }
                  return pr;
                })
              );
              // Remove created PRs from selection
              setSelectedPRs(prev => {
                const newSet = new Set(prev);
                purchaseRequisitions.forEach(pr => {
                  if (prIds.some(id => pr.pr_id.includes(id) || pr.pr_id === id)) {
                    newSet.delete(pr.pr_id);
                  }
                });
                return newSet;
              });
            } else {
              // Fallback: single PR format
              const prIdMatch = ipoInitialData.notes.match(/PR: ([^\s]+)/) || 
                               ipoInitialData.notes.match(/PR-([^\s]+)/);
              if (prIdMatch) {
                const prId = prIdMatch[1] || prIdMatch[0];
                setPurchaseRequisitions(prev => 
                  prev.map(pr => {
                    if (pr.pr_id.includes(prId) || pr.pr_id === prId) {
                      return { ...pr, status: 'PO_CREATED' };
                    }
                    return pr;
                  })
                );
                setSelectedPRs(prev => {
                  const newSet = new Set(prev);
                  purchaseRequisitions.forEach(pr => {
                    if (pr.pr_id.includes(prId) || pr.pr_id === prId) {
                      newSet.delete(pr.pr_id);
                    }
                  });
                  return newSet;
                });
              }
            }
          }
          setShowIPOModal(false);
          setIpoInitialData(null);
          
          // Check if there are more selected PRs to process after state updates
          setTimeout(() => {
            const remainingSelected = purchaseRequisitions.filter(
              pr => selectedPRs.has(pr.pr_id) && pr.status === 'PENDING' && selectedSuppliers[pr.pr_id]
            );
            
            if (remainingSelected.length > 0) {
              toast.success('Purchase Order created! Continuing with next batch...');
              // Continue with next batch
              handleCreateAllPOs();
            } else {
              toast.success('All Purchase Orders created successfully!');
              setSelectedPRs(new Set());
            }
          }, 100);
        }}
        initialData={ipoInitialData}
      />
    </div>
  );
}