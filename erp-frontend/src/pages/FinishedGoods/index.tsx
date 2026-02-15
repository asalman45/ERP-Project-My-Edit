import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Package, Search, Truck, FileText, CheckCircle, AlertCircle, ShoppingCart, RefreshCw, Info, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import GenericExportModal from '@/components/common/GenericExportModal';
import { finishedGoodsApi } from '@/services/api';

interface FinishedGood {
  inventory_id: string;
  product_id: string;
  product_code: string;
  product_name: string;
  quantity: number;
  location_id: string;
  location_name: string;
  location_code: string;
  status: string;
  uom_code?: string;
  wo_id?: string;
  wo_no?: string;
  received_at: string;
  product?: {
    oem?: { oem_name: string };
    model?: { model_name: string };
    standard_cost?: number;
  };
}

interface FinishedGoodHistoryEntry {
  txn_id: string;
  product_id: string;
  quantity: number;
  absoluteQuantity: number;
  status: string;
  direction: 'IN' | 'OUT';
  created_at: string;
  reference?: string;
  txn_type: string;
  product?: {
    part_name?: string;
    product_code?: string;
    oem?: { oem_name: string };
    model?: { model_name: string };
  };
  location?: {
    name?: string;
    code?: string;
  };
  workOrder?: {
    wo_no?: string;
  };
  inventory_status?: string | null;
  inventory_quantity?: number | null;
}

interface SalesOrder {
  so_id: string;
  sales_order_id?: string;
  so_no: string;
  order_number?: string;
  customer_id: string;
  customer_name?: string;
  order_date: string;
  required_quantity?: number;
  qty_ordered?: number;
  quantity?: number;
  status: string;
  items?: Array<{
    item_id: string;
    product_id?: string;
    item_code?: string;
    product_code?: string;
    quantity: number;
    qty_ordered?: number;
    qty_shipped?: number;
    pending_quantity?: number;
  }>;
}

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-800',
  ISSUED: 'bg-blue-100 text-blue-800',
  RESERVED: 'bg-yellow-100 text-yellow-800',
  DAMAGED: 'bg-red-100 text-red-800',
  QUARANTINE: 'bg-orange-100 text-orange-800',
  CONSUMED: 'bg-gray-200 text-gray-700'
};

const getStatusBadge = (status: string) => {
  const label = status.replace(/_/g, ' ');
  return (
    <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
      {label}
    </Badge>
  );
};

export default function FinishedGoods() {
  const [finishedGoods, setFinishedGoods] = useState<FinishedGood[]>([]);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<FinishedGood | null>(null);
  const [showDispatchDialog, setShowDispatchDialog] = useState(false);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<string>('');
  const [dispatchQuantity, setDispatchQuantity] = useState<number>(0);
  const [dispatchMethod, setDispatchMethod] = useState<string>('Ground Shipping');
  const [loadingSalesOrders, setLoadingSalesOrders] = useState(false);
  const [balanceData, setBalanceData] = useState<Array<{
    product_id: string;
    product_code: string | null;
    product_name: string | null;
    available_quantity: number;
    reserved_quantity: number;
    dispatched_quantity: number;
    ready_to_dispatch: number;
  }>>([]);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [history, setHistory] = useState<FinishedGoodHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('ALL');
  const [historyProductFilter, setHistoryProductFilter] = useState<string>('ALL');
  const [historyStartDate, setHistoryStartDate] = useState<string>('');
  const [historyEndDate, setHistoryEndDate] = useState<string>('');
  const [showDispatchConfirm, setShowDispatchConfirm] = useState(false);
  const [creatingDispatch, setCreatingDispatch] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const availableGoods = finishedGoods.filter(fg => fg.status === 'AVAILABLE');
  const nonAvailableGoods = finishedGoods.filter(fg => fg.status !== 'AVAILABLE');
  const totalAvailableQuantity = availableGoods.reduce((sum, fg) => sum + fg.quantity, 0);
  useEffect(() => {
    fetchFinishedGoods();
    fetchDispatchableBalance();
    fetchFinishedGoodsHistory();
  }, []);

  const fetchFinishedGoods = async () => {
    try {
      setLoading(true);
      console.log('Fetching finished goods...');
      
      // Use the same location-type endpoint with FINISHED_GOODS type
      const response = await fetch('/api/inventory/by-location-type?type=FINISHED_GOODS');
      
      if (response.ok) {
        const data = await response.json();
        console.log('Finished goods API response:', data);
        const products = (data.data || data || [])
          .filter((item: any) => item.product_id && item.product_id !== null && item.quantity > 0)
          .map((item: any) => {
            // Debug: Log product structure
            if (item.product) {
              console.log('Product data structure:', {
                product_id: item.product_id,
                product_code: item.product?.product_code,
                oem: item.product?.oem,
                model: item.product?.model,
                oem_name: item.product?.oem?.oem_name,
                model_name: item.product?.model?.model_name
              });
            }
            return {
            ...item,
            status: item.status || 'AVAILABLE'
            };
          });
        console.log('Filtered finished goods:', products);
        setFinishedGoods(products);
      } else {
        console.warn('Finished goods location endpoint failed, trying alternative...');
        // Fallback to finished-goods endpoint
        const altResponse = await fetch('/api/inventory/finished-goods');
        if (altResponse.ok) {
          const altData = await altResponse.json();
          const products = (altData.data || altData || [])
            .filter((item: any) => item.product_id && item.product_id !== null && item.quantity > 0)
            .map((item: any) => ({
              ...item,
              status: item.status || 'AVAILABLE'
            }));
          setFinishedGoods(products);
        } else {
          console.error('Failed to fetch finished goods, status:', altResponse.status);
        }
      }
    } catch (error) {
      console.error('Error fetching finished goods:', error);
      toast.error('Failed to fetch finished goods');
    } finally {
      setLoading(false);
    }
  };

  const fetchDispatchableBalance = async () => {
    try {
      setLoadingBalance(true);
      const response = await fetch('/api/inventory/finished-goods/dispatchable-balance');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch dispatchable balance');
      }
      const data = await response.json();
      const balances = Array.isArray(data?.data) ? data.data : [];
      setBalanceData(balances);
    } catch (error) {
      console.error('Error fetching dispatchable balance:', error);
      toast.error('Failed to fetch dispatchable balance');
    } finally {
      setLoadingBalance(false);
    }
  };

  const fetchSalesOrdersForProduct = async (productId: string, productCode?: string, availableQuantity?: number) => {
    try {
      setLoadingSalesOrders(true);
      console.log('Fetching sales orders for product:', { productId, productCode, availableQuantity });
      
      // Fetch sales orders that can be dispatched (multiple statuses)
      // Try different statuses: READY_FOR_DISPATCH, APPROVED, IN_PRODUCTION
      const statuses = ['READY_FOR_DISPATCH', 'APPROVED', 'IN_PRODUCTION'];
      const allOrders: any[] = [];
      
      for (const status of statuses) {
        try {
          const response = await fetch(`/api/sales-orders?status=${status}`);
          if (response.ok) {
            const data = await response.json();
            const orders = Array.isArray(data) ? data : (data.data || []);
            allOrders.push(...orders);
          }
        } catch (err) {
          console.warn(`Failed to fetch orders with status ${status}:`, err);
        }
      }
      
      // Remove duplicates
      const uniqueOrders = allOrders.filter((order, index, self) => 
        index === self.findIndex(o => (o.sales_order_id || o.so_id) === (order.sales_order_id || order.so_id))
      );
      
      console.log(`Found ${uniqueOrders.length} total sales orders to check`);
      
      // Filter orders that have items matching this product
      const matchingOrders: SalesOrder[] = [];
      
      // Split product code for partial matching (handles "898486-3830 / 897924-3392")
      const productCodeParts = productCode ? productCode.split(/\s*\/\s*/).map(p => p.trim()) : [];
      
      for (const order of uniqueOrders) {
        const orderId = order.sales_order_id || order.so_id;
        if (!orderId) continue;
        
        // Fetch full order details with items
        try {
          const orderDetailResponse = await fetch(`/api/sales-orders/${orderId}`);
          if (orderDetailResponse.ok) {
            const orderDetailData = await orderDetailResponse.json();
            const fullOrder = Array.isArray(orderDetailData) ? orderDetailData[0] : (orderDetailData.data || orderDetailData);
            
            if (fullOrder && fullOrder.items && Array.isArray(fullOrder.items)) {
              // Find items that match this product
              const matchingItems = fullOrder.items.filter((item: any) => {
                // Exact product ID match
                if (item.product_id === productId) return true;
                
                // Exact code match
                if (productCode) {
                  if (item.product_code === productCode || item.item_code === productCode) return true;
                  
                  // Partial code match (handles compound codes like "898486-3830 / 897924-3392")
                  if (productCodeParts.length > 0) {
                    const itemCodes = [
                      item.product_code,
                      item.item_code,
                      ...(item.product_code || '').split(/\s*\/\s*/),
                      ...(item.item_code || '').split(/\s*\/\s*/)
                    ].filter(Boolean);
                    
                    return productCodeParts.some(part => 
                      itemCodes.some(code => code && code.includes(part))
                    );
                  }
                }
                
                return false;
              });
                
                if (matchingItems.length > 0) {
                  // Calculate pending quantity (ordered - shipped)
                  const item = matchingItems[0];
                  const orderedQty = Number(item.quantity || item.qty_ordered || 0);
                  const shippedQty = Number(item.qty_shipped || 0);
                  const pendingQty = Math.max(0, orderedQty - shippedQty);
                  
                  // Only include if there's pending quantity
                  if (pendingQty > 0) {
                    console.log('Found matching order:', {
                      orderId: fullOrder.sales_order_id || fullOrder.so_id,
                      orderNo: fullOrder.order_number || fullOrder.so_no,
                      itemCode: item.item_code || item.product_code,
                      orderedQty,
                      shippedQty,
                      pendingQty
                    });
                    
                    matchingOrders.push({
                      ...fullOrder,
                      so_id: fullOrder.sales_order_id || fullOrder.so_id,
                      so_no: fullOrder.order_number || fullOrder.so_no,
                      required_quantity: pendingQty,
                      quantity: pendingQty,
                      matchingItem: item
                    });
                  }
                }
              }
            }
          } catch (err) {
            console.warn(`Failed to fetch details for order ${orderId}:`, err);
          }
        }
        
        console.log(`Found ${matchingOrders.length} matching sales orders`);
        setSalesOrders(matchingOrders);
        
        // Auto-select first matching order if available
        if (matchingOrders.length > 0) {
          const firstOrder = matchingOrders[0];
          const orderId = firstOrder.sales_order_id || firstOrder.so_id;
          setSelectedSalesOrder(orderId);
          
          // Auto-set quantity from matching item
          const pendingQty = firstOrder.required_quantity || firstOrder.quantity || 0;
          // Use passed availableQuantity or fall back to selectedProduct state
          const availableQty = availableQuantity ?? selectedProduct?.quantity ?? 0;
          // Set quantity to minimum of pending and available
          const qtyToSet = Math.min(pendingQty, availableQty);
          setDispatchQuantity(qtyToSet);
          
          console.log('Auto-selected order and quantity:', {
            orderId,
            orderNo: firstOrder.so_no,
            pendingQty,
            availableQty,
            availableQuantity,
            selectedProductQuantity: selectedProduct?.quantity,
            qtyToSet
          });
        } else {
          console.log('No matching sales orders found');
        }
    } catch (error) {
      console.error('Error fetching sales orders:', error);
      toast.error('Failed to fetch sales orders');
    } finally {
      setLoadingSalesOrders(false);
    }
  };

  const openDispatchDialog = async (product: FinishedGood) => {
    if (product.status !== 'AVAILABLE') {
      toast.error('Only available finished goods can be dispatched');
      return;
    }
    setSelectedProduct(product);
    setSelectedSalesOrder('');
    setDispatchQuantity(0);
    setSalesOrders([]);
    setShowDispatchDialog(true);
    // Fetch sales orders with product ID, code, and available quantity for matching
    await fetchSalesOrdersForProduct(product.product_id, product.product_code, product.quantity);
  };

  const handleCreateDispatch = async () => {
    if (!selectedProduct || !selectedSalesOrder || dispatchQuantity <= 0) {
      toast.error('Please select sales order and enter valid quantity', {
        description: 'All fields are required to create a dispatch order'
      });
      return;
    }

    if (dispatchQuantity > selectedProduct.quantity) {
      toast.error(`Cannot dispatch more than available quantity`, {
        description: `Available: ${selectedProduct.quantity} ${selectedProduct.uom_code || 'PCS'}, Requested: ${dispatchQuantity}`
      });
      return;
    }

    // Show confirmation dialog
    setShowDispatchConfirm(true);
  };

  const confirmCreateDispatch = async () => {
    if (!selectedProduct || !selectedSalesOrder || dispatchQuantity <= 0) {
      return;
    }

    try {
      setCreatingDispatch(true);
      const selectedSO = salesOrders.find(so => {
        const orderId = so.sales_order_id || so.so_id;
        return orderId === selectedSalesOrder;
      });
      
      // Ensure we use the correct so_id format (use so_id if available, otherwise sales_order_id)
      const soIdToSend = selectedSO?.so_id || selectedSO?.sales_order_id || selectedSalesOrder;
      
      console.log('Creating dispatch with:', {
        selectedSalesOrder,
        selectedSO,
        soIdToSend,
        product_id: selectedProduct.product_id,
        quantity: dispatchQuantity
      });
      
      const response = await fetch('/api/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          so_id: soIdToSend,
          so_number: selectedSO?.so_no || '',
          customer_name: selectedSO?.customer_name || 'Unknown',
          product_id: selectedProduct.product_id,
          product_name: selectedProduct.product_name,
          quantity: dispatchQuantity,
          dispatch_method: dispatchMethod,
          dispatched_by: 'system',
          notes: `Dispatched from Finished Goods inventory`
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Dispatch order created successfully`, {
          description: `Dispatch No: ${data.data?.dispatch_no || 'N/A'}`
        });
        setShowDispatchDialog(false);
        setShowDispatchConfirm(false);
        setSelectedProduct(null);
        setSelectedSalesOrder('');
        setDispatchQuantity(0);
        fetchFinishedGoods(); // Refresh inventory
        fetchDispatchableBalance();
        fetchFinishedGoodsHistory();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create dispatch order');
      }
    } catch (error: any) {
      console.error('Error creating dispatch:', error);
      toast.error(error.message || 'Failed to create dispatch order', {
        description: 'Please check your connection and try again'
      });
    } finally {
      setCreatingDispatch(false);
    }
  };

  const filteredGoods = finishedGoods.filter(product =>
    product.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.product_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.wo_no?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalProducts = finishedGoods.length;
  const totalQuantity = finishedGoods.reduce((sum, item) => sum + item.quantity, 0);
  const totalProductsAvailable = availableGoods.length;
  const totalProductsNonAvailable = nonAvailableGoods.length;

  const visibleGoods = showOnlyAvailable ? filteredGoods.filter(fg => fg.status === 'AVAILABLE') : filteredGoods;

  const totalReadyToDispatch = balanceData.reduce((sum, item) => sum + (item.ready_to_dispatch || 0), 0);
  const totalReserved = balanceData.reduce((sum, item) => sum + (item.reserved_quantity || 0), 0);
  const totalDispatched = balanceData.reduce((sum, item) => sum + (item.dispatched_quantity || 0), 0);

  const balanceMap = useMemo(() => {
    const map = new Map<string, typeof balanceData[number]>();
    balanceData.forEach((item) => {
      if (item.product_id) {
        map.set(item.product_id, item);
      }
    });
    return map;
  }, [balanceData]);

  const fetchFinishedGoodsHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await fetch('/api/inventory/finished-goods/history?limit=200');
      if (response.ok) {
        const data = await response.json();
        const historyEntries = (data.data || data || [])
          .map((item: any) => ({
          ...item,
          status: item.status || item.txn_type,
          direction: item.direction || (item.quantity >= 0 ? 'IN' : 'OUT'),
          absoluteQuantity: Math.abs(item.absoluteQuantity ?? item.quantity ?? 0)
          }))
          // Filter out QA location entries - only show Finished Goods related transactions
          .filter((item: any) => {
            const locationCode = item.location?.code || '';
            const locationName = item.location?.name || '';
            const locationType = item.location?.type || '';
            const reference = item.reference || '';
            
            // Exclude QA location entries
            const isQALocation = 
              locationCode === 'QA-SECTION' || 
              locationType === 'QA' ||
              locationName?.toLowerCase().includes('quality assurance');
            
            // Include Finished Goods location transactions
            const isFinishedGoodsLocation = 
              locationCode === 'FINISHED-GOODS' ||
              locationType === 'FINISHED_GOODS' ||
              locationName?.toLowerCase().includes('finished goods');
            
            // Show transactions at Finished Goods location
            if (isFinishedGoodsLocation) return true;
            
            // Show dispatch/issue transactions (even if location is not explicitly Finished Goods)
            if (item.txn_type === 'ISSUE' || reference?.includes('DISPATCH')) return true;
            
            // Exclude QA location transfers
            if (isQALocation) return false;
            
            // Include other transactions (receive, adjustment, etc.) that are not QA-related
            return true;
          });
        setHistory(historyEntries);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch finished goods history');
      }
    } catch (error) {
      console.error('Error fetching finished goods history:', error);
      toast.error('Failed to fetch finished goods history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const historyStatusColors: Record<string, string> = {
    'Ready for Dispatch': 'bg-green-100 text-green-800',
    'Dispatched': 'bg-blue-100 text-blue-800',
    'Transferred': 'bg-purple-100 text-purple-800',
    'Returned': 'bg-yellow-100 text-yellow-800',
    'Adjusted': 'bg-gray-200 text-gray-700'
  };

  const getHistoryStatusBadge = (status: string) => (
    <Badge className={historyStatusColors[status] || 'bg-gray-100 text-gray-800'}>
      {status}
    </Badge>
  );

  const historyStatuses = ['ALL', 'Ready for Dispatch', 'Dispatched', 'Transferred', 'Returned', 'Adjusted'];

  const historyProductOptions = Array.from(
    new Set(history.map((entry) => entry.product?.product_code || entry.product_id))
  ).filter((val): val is string => Boolean(val));

  const filteredHistory = history.filter((entry) => {
    if (historyStatusFilter !== 'ALL' && entry.status !== historyStatusFilter) {
      return false;
    }

    if (
      historyProductFilter !== 'ALL' &&
      (entry.product?.product_code || entry.product_id) !== historyProductFilter
    ) {
      return false;
    }

    if (historyStartDate) {
      const entryDate = new Date(entry.created_at);
      if (entryDate < new Date(historyStartDate)) {
        return false;
      }
    }

    if (historyEndDate) {
      const entryDate = new Date(entry.created_at);
      const endDate = new Date(historyEndDate);
      endDate.setHours(23, 59, 59, 999);
      if (entryDate > endDate) {
        return false;
      }
    }

    return true;
  });

  return (
    <TooltipProvider>
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Finished Goods Inventory</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Manage products after QA approval - ready for dispatch
          </p>
        </div>
        <Package className="w-8 h-8 text-blue-600 hidden sm:block" />
      </div>

      {totalReadyToDispatch > 0 && (
        <div>
          <Badge className="bg-green-100 text-green-800 px-3 py-1 text-sm">
            {totalReadyToDispatch.toLocaleString()} units ready to dispatch
          </Badge>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{totalProducts}</p>
                <div className="text-xs text-muted-foreground mt-1">
                  Available: {totalProductsAvailable} • Other statuses: {totalProductsNonAvailable}
                </div>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Quantity</p>
                <p className="text-2xl font-bold">{totalQuantity.toLocaleString()}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Reserved: {totalReserved.toLocaleString()} • Dispatched: {totalDispatched.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Location</p>
                <p className="text-2xl font-bold text-blue-600">Finished Goods</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ready to Dispatch</p>
                <p className="text-2xl font-bold text-green-600">
                  {loadingBalance ? <Loader2 className="w-5 h-5 animate-spin" /> : totalReadyToDispatch.toLocaleString()}
                </p>
              </div>
              <Truck className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory and History with Tabs */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg sm:text-xl">Finished Goods</CardTitle>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge className="bg-green-100 text-green-800">Available: {availableGoods.length} ({totalAvailableQuantity})</Badge>
                <Badge className="bg-blue-100 text-blue-800">Other statuses: {nonAvailableGoods.length}</Badge>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Label htmlFor="availability-filter" className="text-sm whitespace-nowrap">Show only available</Label>
                <Select
                  value={showOnlyAvailable ? 'available' : 'all'}
                  onValueChange={(value) => setShowOnlyAvailable(value === 'available')}
                >
                  <SelectTrigger className="w-full sm:w-[140px]" id="availability-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="available">Available only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-full sm:w-64"
                />
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowExportModal(true)}
                    className="w-full sm:w-auto"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Export finished goods data</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="inventory" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="inventory" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Inventory
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                History
              </TabsTrigger>
            </TabsList>

            {/* Inventory Tab */}
            <TabsContent value="inventory" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2">Loading finished goods...</span>
            </div>
          ) : visibleGoods.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No finished goods available</p>
              <p className="text-sm text-muted-foreground mt-2">
                Products will appear here after QA approval
              </p>
            </div>
          ) : (
                <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Code</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>OEM / Model</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Ready</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead>Dispatched</TableHead>
                  <TableHead>UOM</TableHead>
                  <TableHead>Work Order</TableHead>
                  <TableHead>Received At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                      {visibleGoods.map((product) => {
                        // Debug: Log product structure for each row
                        console.log('Rendering product:', {
                          inventory_id: product.inventory_id,
                          product_id: product.product_id,
                          product: product.product,
                          oem: product.product?.oem,
                          model: product.product?.model,
                          oem_name: product.product?.oem?.oem_name,
                          model_name: product.product?.model?.model_name
                        });
                        
                        return (
                  <TableRow key={product.inventory_id}>
                            <TableCell className="font-medium">{product.product_code || product.product?.product_code}</TableCell>
                            <TableCell>{product.product_name || product.product?.part_name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                                <div className="font-medium">
                                  {product.product?.oem?.oem_name || product.oem_name || 'N/A'}
                                </div>
                                <div className="text-muted-foreground mt-1">
                                  {product.product?.model?.model_name || product.model_name || 'Model: N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-base font-semibold">
                        {product.quantity.toLocaleString()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">
                        {balanceMap.get(product.product_id || '')?.ready_to_dispatch?.toLocaleString() ?? '0'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-blue-100 text-blue-800">
                        {balanceMap.get(product.product_id || '')?.reserved_quantity?.toLocaleString() ?? '0'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-gray-100 text-gray-800">
                        {balanceMap.get(product.product_id || '')?.dispatched_quantity?.toLocaleString() ?? '0'}
                      </Badge>
                    </TableCell>
                    <TableCell>{product.uom_code || 'PCS'}</TableCell>
                    <TableCell>
                      {product.wo_no ? (
                        <Badge variant="secondary">{product.wo_no}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.received_at
                        ? new Date(product.received_at).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(product.status)}</TableCell>
                    <TableCell>
                              <Tooltip>
                                <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        onClick={() => openDispatchDialog(product)}
                        disabled={product.quantity <= 0 || product.status !== 'AVAILABLE'}
                      >
                        <Truck className="w-4 h-4 mr-2" />
                        Dispatch
                      </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {product.status !== 'AVAILABLE' ? (
                                    <p>Product is not available for dispatch</p>
                                  ) : product.quantity <= 0 ? (
                                    <p>No quantity available</p>
                                  ) : (
                                    <p>Click to dispatch {product.quantity} {product.uom_code || 'PCS'}</p>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                    </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={historyStatusFilter}
                    onValueChange={(value) => setHistoryStatusFilter(value)}
                    disabled={loadingHistory}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      {historyStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status === 'ALL' ? 'All statuses' : status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={historyProductFilter}
                    onValueChange={(value) => setHistoryProductFilter(value)}
                    disabled={loadingHistory || historyProductOptions.length === 0}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by product" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All products</SelectItem>
                      {historyProductOptions.map((productCode) => (
                        <SelectItem key={productCode as string} value={productCode as string}>
                          {productCode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={historyStartDate}
                    onChange={(e) => setHistoryStartDate(e.target.value)}
                    className="w-full sm:w-40"
                  />
                  <Input
                    type="date"
                    value={historyEndDate}
                    onChange={(e) => setHistoryEndDate(e.target.value)}
                    className="w-full sm:w-40"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={fetchFinishedGoodsHistory} disabled={loadingHistory} className="w-full sm:w-auto">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {loadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-2">Loading history...</span>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No history records</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Receive finished goods or dispatch them to build history.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Work Order</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHistory.map((entry) => (
                        <TableRow key={entry.txn_id}>
                          <TableCell>{new Date(entry.created_at).toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{entry.product?.part_name || 'Product'}</div>
                            <div className="text-xs text-muted-foreground">{entry.product?.product_code || entry.product_id}</div>
                          </TableCell>
                          <TableCell>
                            <Badge className={entry.direction === 'IN' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                              {entry.direction === 'IN' ? '+' : '-'}{entry.absoluteQuantity}
                            </Badge>
                          </TableCell>
                          <TableCell>{getHistoryStatusBadge(entry.status)}</TableCell>
                          <TableCell>
                            <div className="text-sm">{entry.location?.name || 'Finished Goods'}</div>
                            <div className="text-xs text-muted-foreground">{entry.location?.code || '-'}</div>
                          </TableCell>
                          <TableCell>{entry.reference || '-'}</TableCell>
                          <TableCell>{entry.workOrder?.wo_no || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
                </div>
          )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dispatch Dialog */}
      <Dialog open={showDispatchDialog} onOpenChange={setShowDispatchDialog}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Create Dispatch Order</DialogTitle>
            <DialogDescription>
              Dispatch finished goods to customer
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium">Product Details</div>
                <div className="mt-2 space-y-1">
                  <div><span className="font-medium">Product:</span> {selectedProduct.product_name}</div>
                  <div><span className="font-medium">Code:</span> {selectedProduct.product_code}</div>
                  <div><span className="font-medium">Available:</span> {selectedProduct.quantity} {selectedProduct.uom_code || 'PCS'}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sales-order">Sales Order</Label>
                {loadingSalesOrders ? (
                  <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading sales orders...
                  </div>
                ) : (
                  <Select
                    value={selectedSalesOrder}
                    onValueChange={(value) => {
                      setSelectedSalesOrder(value);
                      const order = salesOrders.find(so => {
                        const orderId = so.sales_order_id || so.so_id;
                        return orderId === value;
                      });
                      if (order && selectedProduct) {
                        const pendingQty = order.required_quantity || order.quantity || 0;
                        const availableQty = selectedProduct.quantity || 0;
                        // Set quantity to minimum of pending and available
                        setDispatchQuantity(Math.min(pendingQty, availableQty));
                      }
                    }}
                    disabled={loadingSalesOrders}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingSalesOrders ? "Loading..." : "Select sales order"} />
                    </SelectTrigger>
                    <SelectContent>
                      {salesOrders.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No sales orders found for this product
                        </div>
                      ) : (
                        salesOrders.map((so) => {
                          const orderId = so.sales_order_id || so.so_id;
                          const orderNo = so.order_number || so.so_no;
                          const pendingQty = so.required_quantity || so.quantity || 0;
                          return (
                            <SelectItem key={orderId} value={orderId}>
                              {orderNo} - Pending: {pendingQty} {selectedProduct?.uom_code || 'PCS'}
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Dispatch Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={dispatchQuantity}
                  onChange={(e) => setDispatchQuantity(Number(e.target.value))}
                  min="1"
                  max={selectedProduct.quantity}
                  placeholder="Enter quantity"
                />
                <p className="text-xs text-muted-foreground">
                  Available: {selectedProduct.quantity} {selectedProduct.uom_code || 'PCS'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dispatch-method">Dispatch Method</Label>
                <Select value={dispatchMethod} onValueChange={setDispatchMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ground Shipping">Ground Shipping</SelectItem>
                    <SelectItem value="Express Delivery">Express Delivery</SelectItem>
                    <SelectItem value="Air Freight">Air Freight</SelectItem>
                    <SelectItem value="Customer Pickup">Customer Pickup</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowDispatchDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateDispatch}
                  disabled={!selectedSalesOrder || dispatchQuantity <= 0 || dispatchQuantity > selectedProduct.quantity || creatingDispatch}
                >
                  {creatingDispatch ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                  <Truck className="w-4 h-4 mr-2" />
                  Create Dispatch
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>


      {/* Dispatch Confirmation Dialog */}
      <AlertDialog open={showDispatchConfirm} onOpenChange={setShowDispatchConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Dispatch Order</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Are you sure you want to create a dispatch order for:
            </p>
            <div className="space-y-2 p-3 bg-muted rounded-lg">
              <div><strong>Product:</strong> {selectedProduct?.product_name}</div>
              <div><strong>Code:</strong> {selectedProduct?.product_code}</div>
              <div><strong>Quantity:</strong> {dispatchQuantity} {selectedProduct?.uom_code || 'PCS'}</div>
              <div><strong>Sales Order:</strong> {salesOrders.find(so => {
                const orderId = so.sales_order_id || so.so_id;
                return orderId === selectedSalesOrder;
              })?.so_no || 'N/A'}</div>
              <div><strong>Method:</strong> {dispatchMethod}</div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDispatchConfirm(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCreateDispatch}
              disabled={creatingDispatch}
            >
              {creatingDispatch ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Confirm & Create'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showExportModal && (
        <GenericExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onSuccess={() => {
            setShowExportModal(false);
          }}
          title="Export Finished Goods"
          exportFunction={finishedGoodsApi.exportFinishedGoods}
          filename="finished-goods"
          availableFormats={['csv', 'excel']}
        />
      )}
    </div>
    </TooltipProvider>
  );
}
