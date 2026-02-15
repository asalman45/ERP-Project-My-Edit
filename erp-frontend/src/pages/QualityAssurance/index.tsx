import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle, XCircle, Search, Package, FileCheck, Info, ListChecks, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { PartialQADialog } from '@/components/QA/PartialQADialog';
import GenericExportModal from '@/components/common/GenericExportModal';
import { qualityAssuranceApi } from '@/services/api';

interface QAProduct {
  inventory_id: string;
  product_id: string;
  product_code: string;
  product_name: string;
  quantity: number;
  location_id: string;
  location_name: string;
  wo_id?: string;
  wo_no?: string;
  received_at: string;
  uom_code?: string;
  qa_status?: 'PENDING' | 'APPROVED' | 'REJECTED'; // QA status for filtering
  // History fields
  disposition?: 'REWORK' | 'SCRAP' | 'DISPOSAL';
  rejection_reason?: string;
  rework_wo_no?: string;
  quantity_breakdown?: {
    approved: number;
    rejected: number;
    by_disposition: {
      REWORK?: number;
      SCRAP?: number;
      DISPOSAL?: number;
    };
  };
}

export default function QualityAssurance() {
  const [qaProducts, setQaProducts] = useState<QAProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<QAProduct | null>(null);
  const [showQADialog, setShowQADialog] = useState(false);
  const [showPartialDialog, setShowPartialDialog] = useState(false);
  const [qaStatus, setQaStatus] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [qaNotes, setQaNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [disposition, setDisposition] = useState<'REWORK' | 'SCRAP' | 'DISPOSAL' | ''>('');
  const [rootCause, setRootCause] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    fetchQAProducts();
  }, []);

  const fetchQAProducts = async () => {
    try {
      setLoading(true);
      console.log('Fetching QA products...');
      const response = await fetch('/api/inventory/by-location-type?type=QA');
      
      if (response.ok) {
        const data = await response.json();
        console.log('QA API response:', data);
        // Filter to only show products (not materials) at QA location
        // ✅ Removed quantity filter - show history too
        const products = (data.data || data || [])
          .filter((item: any) => 
            item.product_id && 
            item.product_id !== null
          )
          .map((item: any) => ({
            ...item,
            qa_status: item.qa_status || 'PENDING' // Default to PENDING if not set
          }));
        console.log('Filtered QA products:', products);
        setQaProducts(products);
      } else {
        console.warn('QA location endpoint failed, trying fallback...');
        // Fallback: try to get all inventory and filter by QA location
        const allResponse = await fetch('/api/inventory/current-stock/all');
        if (allResponse.ok) {
          const allData = await allResponse.json();
          const qaItems = Array.isArray(allData) ? allData : (allData.data || []);
          const qaProducts = qaItems
            .filter((item: any) => 
              item.product_id && 
              // ✅ Removed quantity filter - show history too
              (item.location?.type === 'QA' || 
               item.location?.code === 'QA-SECTION' ||
               item.location_name?.toLowerCase().includes('quality assurance'))
            )
            .map((item: any) => {
              // Calculate QA status for fallback
              let qaStatus: 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING';
              if (item.quantity === 0) {
                if (item.status === 'QUARANTINE') {
                  qaStatus = 'REJECTED';
                } else if (item.status === 'AVAILABLE') {
                  qaStatus = 'APPROVED';
                }
              }
              
              return {
                inventory_id: item.inventory_id,
                product_id: item.product_id,
                product_code: item.product?.product_code || item.product_code || '',
                product_name: item.product?.part_name || item.product_name || '',
                quantity: item.quantity || 0,
                location_id: item.location_id,
                location_name: item.location?.name || item.location_name || '',
                uom_code: item.uom?.code || item.uom_code || '',
                received_at: item.updated_at || item.created_at,
                qa_status: qaStatus,
                wo_id: null,
                wo_no: null
              };
            });
          setQaProducts(qaProducts);
        } else {
          console.warn('Failed to fetch QA products, status:', allResponse.status);
        }
      }
    } catch (error) {
      console.error('Error fetching QA products:', error);
      toast.error('Failed to fetch QA products');
    } finally {
      setLoading(false);
    }
  };

  const handleQAApprovalClick = (approved: boolean) => {
    if (!selectedProduct) return;

    if (!selectedProduct.quantity || selectedProduct.quantity <= 0) {
      toast.error('Cannot process product with invalid quantity', {
        description: 'Please check the work order that produced this item.'
      });
      return;
    }

    // For REJECTED status, validate required fields
    if (!approved) {
      if (!rejectionReason.trim()) {
        toast.error('Rejection reason is required', {
          description: 'Please provide a reason for rejecting this product.'
        });
        return;
      }
      if (!disposition) {
        toast.error('Disposition is required', {
          description: 'Please select how to handle this rejected product (REWORK, SCRAP, or DISPOSAL).'
        });
        return;
      }
    }
    
    setQaStatus(approved ? 'APPROVED' : 'REJECTED');
    setShowConfirmDialog(true);
  };

  const confirmQAApproval = async () => {
    if (!selectedProduct || !qaStatus) return;

    try {
      setProcessing(true);
      const approved = qaStatus === 'APPROVED';
      
      const response = await fetch(`/api/quality-assurance/${selectedProduct.inventory_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: approved ? 'APPROVED' : 'REJECTED',
          notes: qaNotes,
          rejection_reason: approved ? null : rejectionReason,
          disposition: approved ? null : disposition,
          root_cause: approved ? null : rootCause,
          corrective_action: approved ? null : correctiveAction,
          rejected_by: 'system' // TODO: Get from auth context
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(
          approved 
            ? 'Product approved and moved to finished goods' 
            : 'Product rejected and moved to quarantine',
          {
            description: approved 
              ? 'The product is now available for dispatch'
              : 'The product has been moved to rejection/quarantine area'
          }
        );
        setShowQADialog(false);
        setShowConfirmDialog(false);
        setSelectedProduct(null);
        setQaStatus(null);
        setQaNotes('');
        setRejectionReason('');
        setDisposition('');
        setRootCause('');
        setCorrectiveAction('');
        fetchQAProducts();
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Failed to update QA status';
        
        // Show specific error messages
        if (errorMessage.includes('zero') || errorMessage.includes('quantity')) {
          toast.error(errorMessage, {
            duration: 6000,
            description: 'This product may have an invalid inventory record. Please check the work order that produced this item.'
          });
        } else {
          toast.error(errorMessage, {
            description: 'Please check your connection and try again'
          });
        }
        
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error updating QA status:', error);
      // Error toast already shown above, but log for debugging
      if (!error.message?.includes('Failed to fetch')) {
        console.error('QA approval error details:', {
          inventoryId: selectedProduct?.inventory_id,
          productCode: selectedProduct?.product_code,
          quantity: selectedProduct?.quantity,
          error: error.message
        });
      }
    } finally {
      setProcessing(false);
    }
  };

  const openQADialog = (product: QAProduct) => {
    setSelectedProduct(product);
    setShowQADialog(true);
    setQaStatus(null);
    setQaNotes('');
    setRejectionReason('');
    setDisposition('');
    setRootCause('');
    setCorrectiveAction('');
  };

  // Separate pending and history items
  const pendingProducts = qaProducts.filter(p => p.quantity > 0);
  const historyProducts = qaProducts.filter(p => p.quantity === 0);

  // Get products based on active tab
  const productsToShow = activeTab === 'pending' ? pendingProducts : historyProducts;

  const filteredProducts = productsToShow.filter(product => {
    // Search filter - enhanced to search in more fields
    const searchLower = searchTerm.toLowerCase().trim();
    if (searchLower) {
      const matchesSearch = 
        product.product_name?.toLowerCase().includes(searchLower) ||
        product.product_code?.toLowerCase().includes(searchLower) ||
        product.wo_no?.toLowerCase().includes(searchLower) ||
        product.rework_wo_no?.toLowerCase().includes(searchLower) ||
        product.disposition?.toLowerCase().includes(searchLower) ||
        product.rejection_reason?.toLowerCase().includes(searchLower) ||
        product.product?.oem?.name?.toLowerCase().includes(searchLower) ||
        product.product?.model?.name?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) {
        return false;
      }
    }
    
    // Status filter (only for history tab)
    const matchesStatus = 
      activeTab === 'pending' || // Pending tab shows all pending items
      statusFilter === 'ALL' || 
      product.qa_status === statusFilter;
    
    return matchesStatus;
  });

  return (
    <TooltipProvider>
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <FileCheck className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            Quality Assurance
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Review and approve finished products before dispatch
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowExportModal(true)} 
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={fetchQAProducts} variant="outline" className="w-full sm:w-auto">
            <Loader2 className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending QA</p>
                <p className="text-2xl font-bold">
                  {qaProducts.filter(p => p.qa_status === 'PENDING').length}
                </p>
              </div>
              <Package className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {qaProducts.filter(p => p.qa_status === 'APPROVED').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-red-600">
                  {qaProducts.filter(p => p.qa_status === 'REJECTED').length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{qaProducts.length}</p>
              </div>
              <FileCheck className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending/History Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'pending' | 'history')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pending">
                Pending ({pendingProducts.length})
              </TabsTrigger>
              <TabsTrigger value="history">
                History ({historyProducts.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Status Filter (only for History tab) */}
          {activeTab === 'history' && (
            <div className="mt-4">
              <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED')}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="ALL">
                    All ({historyProducts.length})
                  </TabsTrigger>
                  <TabsTrigger value="APPROVED">
                    Approved ({historyProducts.filter(p => p.qa_status === 'APPROVED').length})
                  </TabsTrigger>
                  <TabsTrigger value="REJECTED">
                    Rejected ({historyProducts.filter(p => p.qa_status === 'REJECTED').length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by product name, code, work order, disposition..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                  type="button"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {activeTab === 'pending' 
                  ? (pendingProducts.length === 0 
                      ? 'No pending products in QA section. Products will appear here after all work orders are completed.'
                      : 'No pending products match your search.')
                  : (historyProducts.length === 0
                      ? 'No history records found.'
                      : 'No history records match your search.')}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Code</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Work Order</TableHead>
                  <TableHead>Received At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const isHistory = product.quantity === 0;
                  return (
                  <TableRow 
                    key={product.inventory_id}
                    className={isHistory ? 'opacity-75 bg-gray-50' : ''}
                  >
                    <TableCell className="font-medium">
                      {product.product_code}
                      {isHistory && (
                        <Badge variant="outline" className="ml-2 text-xs">History</Badge>
                      )}
                    </TableCell>
                    <TableCell>{product.product_name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {/* Only show quantity badge if no breakdown OR if quantity > 0 (pending items) */}
                        {(!isHistory || !product.quantity_breakdown || product.quantity > 0) && (
                          <Badge variant="outline">
                            {product.quantity} {product.uom_code || 'units'}
                          </Badge>
                        )}
                        
                        {/* Show breakdown for history items (hides "0 PCS" badge) */}
                        {isHistory && product.quantity_breakdown && (
                          <div className="text-xs space-y-0.5">
                            {product.quantity_breakdown.approved > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-green-700 font-semibold">✓</span>
                                <span className="text-gray-800">Approved: {product.quantity_breakdown.approved} {product.uom_code || 'units'}</span>
                              </div>
                            )}
                            {product.quantity_breakdown.by_disposition.REWORK > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-blue-700 font-semibold">↻</span>
                                <span className="text-gray-800">Rework: {product.quantity_breakdown.by_disposition.REWORK} {product.uom_code || 'units'}</span>
                              </div>
                            )}
                            {product.quantity_breakdown.by_disposition.SCRAP > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-red-700 font-semibold">✗</span>
                                <span className="text-gray-800">Scrap: {product.quantity_breakdown.by_disposition.SCRAP} {product.uom_code || 'units'}</span>
                              </div>
                            )}
                            {product.quantity_breakdown.by_disposition.DISPOSAL > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-gray-700 font-semibold">🗑️</span>
                                <span className="text-gray-800">Disposal: {product.quantity_breakdown.by_disposition.DISPOSAL} {product.uom_code || 'units'}</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Fallback for old records without breakdown */}
                        {isHistory && !product.quantity_breakdown && product.disposition && (
                          <span className="mt-1 text-xs text-muted-foreground">
                            ({product.disposition})
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.rework_wo_no || product.wo_no || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {new Date(product.received_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {product.qa_status === 'APPROVED' ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approved
                        </Badge>
                      ) : product.qa_status === 'REJECTED' ? (
                        <Badge className="bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3 mr-1" />
                          Rejected
                          {product.disposition && (
                            <span className="ml-1 text-xs">({product.disposition})</span>
                          )}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700">
                          Pending QA
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {isHistory ? (
                        // History items - show read-only info
                        <div className="text-sm text-muted-foreground">
                          {product.qa_status === 'APPROVED' ? (
                            <span>Moved to Finished Goods</span>
                          ) : product.qa_status === 'REJECTED' ? (
                            <div>
                              <div>Moved to {product.disposition === 'REWORK' ? 'Rework Area' : 
                                           product.disposition === 'SCRAP' ? 'Scrap Inventory' : 
                                           'Disposal'}</div>
                              {product.rework_wo_no && (
                                <div className="text-xs mt-1">WO: {product.rework_wo_no}</div>
                              )}
                            </div>
                          ) : (
                            <span>Processed</span>
                          )}
                        </div>
                      ) : product.qa_status === 'PENDING' ? (
                        // Pending items - show action buttons
                        <div className="flex gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                onClick={() => openQADialog(product)}
                                variant="outline"
                              >
                                <FileCheck className="w-4 h-4 mr-2" />
                                Review
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Full approval or rejection</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setShowPartialDialog(true);
                                }}
                                variant="outline"
                                className="bg-blue-50"
                              >
                                <ListChecks className="w-4 h-4 mr-2" />
                                Partial
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Partial inspection (approve some, reject others)</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      ) : product.qa_status === 'APPROVED' ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approved
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3 mr-1" />
                          Rejected
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* QA Review Dialog */}
      <Dialog open={showQADialog} onOpenChange={setShowQADialog}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Quality Assurance Review</DialogTitle>
            <DialogDescription>
              Review product quality and approve or reject for dispatch
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Product Code</Label>
                  <p className="font-medium">{selectedProduct.product_code}</p>
                </div>
                <div>
                  <Label>Product Name</Label>
                  <p className="font-medium">{selectedProduct.product_name}</p>
                </div>
                <div>
                  <Label>Quantity</Label>
                  <p className="font-medium">{selectedProduct.quantity} {selectedProduct.uom_code || 'units'}</p>
                </div>
                <div>
                  <Label>Work Order</Label>
                  <p className="font-medium">{selectedProduct.wo_no || 'N/A'}</p>
                </div>
              </div>

              {(!selectedProduct.quantity || selectedProduct.quantity <= 0) && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800 font-medium">
                    ⚠️ Warning: This product has zero or invalid quantity ({selectedProduct.quantity}). 
                    Approval is disabled. Please check the work order that produced this item.
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="qaNotes">QA Notes (Optional)</Label>
                <Textarea
                  id="qaNotes"
                  value={qaNotes}
                  onChange={(e) => setQaNotes(e.target.value)}
                  placeholder="Enter any quality inspection notes..."
                  rows={3}
                />
              </div>

              {/* Rejection-specific fields - shown when user clicks Reject */}
              {qaStatus === 'REJECTED' && (
                <div className="space-y-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <h3 className="font-semibold text-red-900">Rejection Details</h3>
                  
                  <div>
                    <Label htmlFor="rejectionReason" className="text-red-900">
                      Rejection Reason <span className="text-red-600">*</span>
                    </Label>
                    <Textarea
                      id="rejectionReason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Please provide a detailed reason for rejection..."
                      rows={3}
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="disposition" className="text-red-900">
                      Disposition <span className="text-red-600">*</span>
                    </Label>
                    <Select value={disposition} onValueChange={(value: 'REWORK' | 'SCRAP' | 'DISPOSAL') => setDisposition(value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select how to handle this rejected product" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="REWORK">REWORK - Create Rework Work Order</SelectItem>
                        <SelectItem value="SCRAP">SCRAP - Move to Scrap Inventory</SelectItem>
                        <SelectItem value="DISPOSAL">DISPOSAL - Record Disposal</SelectItem>
                      </SelectContent>
                    </Select>
                    {disposition === 'REWORK' && (
                      <p className="text-sm text-muted-foreground mt-1">
                        A rework work order will be created to reprocess this product.
                      </p>
                    )}
                    {disposition === 'SCRAP' && (
                      <p className="text-sm text-muted-foreground mt-1">
                        This product will be transferred to scrap inventory for tracking.
                      </p>
                    )}
                    {disposition === 'DISPOSAL' && (
                      <p className="text-sm text-muted-foreground mt-1">
                        This product will be marked for disposal and write-off.
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="rootCause">Root Cause Analysis (Optional)</Label>
                    <Textarea
                      id="rootCause"
                      value={rootCause}
                      onChange={(e) => setRootCause(e.target.value)}
                      placeholder="Describe the root cause of the rejection..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="correctiveAction">Corrective Action (Optional)</Label>
                    <Textarea
                      id="correctiveAction"
                      value={correctiveAction}
                      onChange={(e) => setCorrectiveAction(e.target.value)}
                      placeholder="Describe the corrective actions taken or planned..."
                      rows={3}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowQADialog(false);
                    setQaStatus(null);
                    setQaNotes('');
                    setRejectionReason('');
                    setDisposition('');
                    setRootCause('');
                    setCorrectiveAction('');
                  }}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="w-full sm:w-auto">
                <Button
                  variant="destructive"
                        onClick={() => {
                          if (qaStatus === 'REJECTED' && rejectionReason && disposition) {
                            // If rejection form is filled, proceed to confirmation
                            handleQAApprovalClick(false);
                          } else {
                            // Show rejection form
                            setQaStatus('REJECTED');
                          }
                        }}
                        disabled={!selectedProduct.quantity || selectedProduct.quantity <= 0 || processing}
                        className="w-full sm:w-auto"
                      >
                        {processing && qaStatus === 'REJECTED' ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : qaStatus === 'REJECTED' && (!rejectionReason || !disposition) ? (
                          <>
                            <XCircle className="w-4 h-4 mr-2" />
                            Fill Rejection Details
                          </>
                        ) : (
                          <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                          </>
                        )}
                </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {!selectedProduct.quantity || selectedProduct.quantity <= 0 ? (
                      <p>Cannot reject product with invalid quantity</p>
                    ) : qaStatus === 'REJECTED' && (!rejectionReason || !disposition) ? (
                      <p>Please fill rejection reason and select disposition</p>
                    ) : (
                      <p>Reject product and move to quarantine</p>
                    )}
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="w-full sm:w-auto">
                <Button
                        onClick={() => handleQAApprovalClick(true)}
                        className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                        disabled={!selectedProduct.quantity || selectedProduct.quantity <= 0 || processing}
                >
                        {processing && qaStatus === 'APPROVED' ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                          </>
                        )}
                </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {!selectedProduct.quantity || selectedProduct.quantity <= 0 ? (
                      <p>Cannot approve product with invalid quantity</p>
                    ) : (
                      <p>Approve product and move to finished goods</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {qaStatus === 'APPROVED' ? 'Confirm Approval' : 'Confirm Rejection'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {qaStatus === 'APPROVED' ? (
                <>
                  Are you sure you want to approve this product?
                  <div className="mt-3 space-y-2 p-3 bg-green-50 rounded-lg">
                    <div><strong>Product:</strong> {selectedProduct?.product_name}</div>
                    <div><strong>Code:</strong> {selectedProduct?.product_code}</div>
                    <div><strong>Quantity:</strong> {selectedProduct?.quantity} {selectedProduct?.uom_code || 'units'}</div>
                  </div>
                  <p className="mt-2 text-sm">
                    This product will be moved to Finished Goods and will be available for dispatch.
                  </p>
                </>
              ) : (
                <>
                  Are you sure you want to reject this product?
                  <div className="mt-3 space-y-2 p-3 bg-red-50 rounded-lg">
                    <div><strong>Product:</strong> {selectedProduct?.product_name}</div>
                    <div><strong>Code:</strong> {selectedProduct?.product_code}</div>
                    <div><strong>Quantity:</strong> {selectedProduct?.quantity} {selectedProduct?.uom_code || 'units'}</div>
                  </div>
                  <p className="mt-2 text-sm text-red-600">
                    This product will be moved to Rejection/Quarantine area. This action cannot be undone.
                  </p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowConfirmDialog(false);
              setQaStatus(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmQAApproval}
              disabled={processing}
              className={qaStatus === 'REJECTED' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                qaStatus === 'APPROVED' ? 'Confirm Approval' : 'Confirm Rejection'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Partial QA Dialog */}
      <PartialQADialog
        product={selectedProduct}
        open={showPartialDialog}
        onClose={() => {
          setShowPartialDialog(false);
          setSelectedProduct(null);
        }}
        onSuccess={fetchQAProducts}
      />

      {showExportModal && (
        <GenericExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onSuccess={() => setShowExportModal(false)}
          title="QA History"
          exportFunction={qualityAssuranceApi.exportQAHistory}
          filename="qa-history"
          availableFormats={['pdf', 'csv']}
        />
      )}
    </div>
    </TooltipProvider>
  );
}

