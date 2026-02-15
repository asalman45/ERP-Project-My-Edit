import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, Truck, Package, CheckCircle, Clock, XCircle, Search, Filter, RefreshCw, Eye, Calendar, User, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';

interface DispatchRecord {
  dispatch_id: string;
  dispatch_no: string;
  so_id?: string;
  so_number?: string;
  po_number?: string;
  customer_name?: string;
  vehicle_no?: string;
  driver_name?: string;
  dispatch_date?: string;
  dispatched_by?: string;
  status: string;
  created_at?: string;
  items?: Array<{
    product_id: string;
    product_code: string;
    product_name: string;
    quantity: number;
    uom_code?: string;
  }>;
}

export default function Dispatch() {
  const [dispatchRecords, setDispatchRecords] = useState<DispatchRecord[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [customerFilter, setCustomerFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Management
  const [selectedDispatch, setSelectedDispatch] = useState<DispatchRecord | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null);

  useEffect(() => {
      fetchDispatchRecords();
  }, []);

  const fetchDispatchRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dispatch');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch dispatch records: ${response.status}`);
      }
      
      const data = await response.json();
      setDispatchRecords(Array.isArray(data) ? data : (data.data || []));
    } catch (error) {
      console.error('Error fetching dispatch records:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch dispatch records');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDispatchStatus = async () => {
    if (!selectedDispatch || !newStatus) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/dispatch/${selectedDispatch.dispatch_id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success(`Dispatch status updated to ${newStatus}`);
        setShowStatusDialog(false);
        setSelectedDispatch(null);
        setNewStatus('');
        fetchDispatchRecords();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update dispatch status');
      }
    } catch (error: any) {
      console.error('Error updating dispatch status:', error);
      toast.error(error.message || 'Failed to update dispatch status');
    } finally {
      setUpdating(false);
    }
  };

  const openStatusDialog = (dispatch: DispatchRecord, status: string) => {
    setSelectedDispatch(dispatch);
    setNewStatus(status);
    setShowStatusDialog(true);
  };

  const openDetailsDialog = (dispatch: DispatchRecord) => {
    setSelectedDispatch(dispatch);
    setShowDetailsDialog(true);
  };

  const handleGenerateInvoicePDF = async (dispatchId: string, dispatchNo: string) => {
    try {
      setGeneratingPDF(dispatchId);
      const response = await fetch(`/api/dispatch/${dispatchId}/invoice-pdf`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate invoice PDF');
      }

      // Get the PDF blob
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `DispatchInvoice_${dispatchNo}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Dispatch invoice PDF generated successfully');
    } catch (error: any) {
      console.error('Error generating invoice PDF:', error);
      toast.error(error.message || 'Failed to generate invoice PDF');
    } finally {
      setGeneratingPDF(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'DISPATCHED': 'bg-blue-100 text-blue-800',
      'DELIVERED': 'bg-green-100 text-green-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'CANCELLED': 'bg-red-100 text-red-800',
    };

    const icons: Record<string, React.ReactNode> = {
      'DISPATCHED': <Truck className="w-3 h-3 mr-1" />,
      'DELIVERED': <CheckCircle className="w-3 h-3 mr-1" />,
      'PENDING': <Clock className="w-3 h-3 mr-1" />,
      'CANCELLED': <XCircle className="w-3 h-3 mr-1" />,
    };

    return (
      <Badge className={`${colors[status] || 'bg-gray-100 text-gray-800'} flex items-center w-fit`}>
        {icons[status]}
        {status}
      </Badge>
    );
  };

  // Filter dispatch records
  const filteredRecords = useMemo(() => {
    return dispatchRecords.filter((dispatch) => {
      // Status filter
      if (statusFilter !== 'ALL' && dispatch.status !== statusFilter) {
        return false;
      }

      // Date range filter
      if (dateFrom) {
        const dispatchDate = dispatch.dispatch_date || dispatch.created_at;
        if (dispatchDate && new Date(dispatchDate) < new Date(dateFrom)) {
          return false;
        }
      }
      if (dateTo) {
        const dispatchDate = dispatch.dispatch_date || dispatch.created_at;
        if (dispatchDate) {
          const endDate = new Date(dateTo);
          endDate.setHours(23, 59, 59, 999);
          if (new Date(dispatchDate) > endDate) {
            return false;
          }
        }
      }

      // Customer filter
      if (customerFilter !== 'ALL' && dispatch.customer_name) {
        if (dispatch.customer_name !== customerFilter) {
          return false;
        }
      }

      // Search filter (dispatch no, SO number)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesDispatchNo = dispatch.dispatch_no?.toLowerCase().includes(searchLower);
        const matchesSONo = dispatch.so_number?.toLowerCase().includes(searchLower);
        const matchesCustomer = dispatch.customer_name?.toLowerCase().includes(searchLower);
        
        if (!matchesDispatchNo && !matchesSONo && !matchesCustomer) {
          return false;
        }
      }

      return true;
    });
  }, [dispatchRecords, statusFilter, dateFrom, dateTo, customerFilter, searchTerm]);

  // Summary statistics
  const stats = useMemo(() => {
    const total = dispatchRecords.length;
    const pending = dispatchRecords.filter(d => d.status === 'PENDING' || d.status === 'DISPATCHED').length;
    const delivered = dispatchRecords.filter(d => d.status === 'DELIVERED').length;
    const cancelled = dispatchRecords.filter(d => d.status === 'CANCELLED').length;
    
    return { total, pending, delivered, cancelled };
  }, [dispatchRecords]);

  // Unique customers for filter
  const uniqueCustomers = useMemo(() => {
    return Array.from(new Set(dispatchRecords.map(d => d.customer_name).filter(Boolean))) as string[];
  }, [dispatchRecords]);

  return (
    <TooltipProvider>
    <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dispatch Management</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              View and manage dispatch history and delivery status
          </p>
        </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={fetchDispatchRecords} variant="outline" disabled={loading} className="w-full sm:w-auto">
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Refresh dispatch records</p>
            </TooltipContent>
          </Tooltip>
      </div>

      {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
            <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Dispatches</p>
                  <p className="text-3xl font-bold mt-1">{stats.total}</p>
                </div>
                <Truck className="w-10 h-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending / In Transit</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
                </div>
                <Clock className="w-10 h-10 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
            <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                  <p className="text-sm font-medium text-muted-foreground">Delivered</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{stats.delivered}</p>
              </div>
                <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
            <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                  <p className="text-sm font-medium text-muted-foreground">Cancelled</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">{stats.cancelled}</p>
              </div>
                <XCircle className="w-10 h-10 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

        {/* Filters */}
          <Card>
            <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle>Filters</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter('ALL');
                  setDateFrom('');
                  setDateTo('');
                  setCustomerFilter('ALL');
                  setSearchTerm('');
                }}
                className="w-full sm:w-auto"
              >
                Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Dispatch No, SO No, Customer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="DISPATCHED">Dispatched</SelectItem>
                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date-from">Date From</Label>
                <div className="relative">
                  <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="date-from"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date-to">Date To</Label>
                <div className="relative">
                  <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="date-to"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="pl-8"
                  />
                </div>
                            </div>

              <div className="space-y-2">
                <Label htmlFor="customer-filter">Customer</Label>
                <Select value={customerFilter} onValueChange={setCustomerFilter}>
                  <SelectTrigger id="customer-filter">
                    <SelectValue placeholder="All Customers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Customers</SelectItem>
                    {uniqueCustomers.map((customer) => (
                      <SelectItem key={customer} value={customer}>
                        {customer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            </CardContent>
          </Card>

        {/* Dispatch Records Table */}
          <Card>
            <CardHeader>
            <CardTitle>
              Dispatch Records
              {filteredRecords.length !== dispatchRecords.length && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({filteredRecords.length} of {dispatchRecords.length})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2">Loading dispatch records...</span>
              </div>
            ) : filteredRecords.length === 0 ? (
                <div className="text-center py-12">
                  <Truck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No dispatch records found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                  {dispatchRecords.length === 0
                    ? 'Dispatch records will appear here after creating dispatch orders'
                    : 'Try adjusting your filters'}
                  </p>
                </div>
              ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dispatch No</TableHead>
                      <TableHead>SO Number</TableHead>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Vehicle / Driver</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((dispatch) => (
                      <TableRow key={dispatch.dispatch_id}>
                        <TableCell className="font-medium">{dispatch.dispatch_no}</TableCell>
                        <TableCell>{dispatch.so_number || '-'}</TableCell>
                        <TableCell>{dispatch.po_number || '-'}</TableCell>
                        <TableCell>{dispatch.customer_name || '-'}</TableCell>
                        <TableCell>
                          {dispatch.items && dispatch.items.length > 0 ? (
                            <div className="space-y-1 max-w-xs">
                              {dispatch.items.map((item, idx) => (
                                <div key={`${dispatch.dispatch_id}-${item.product_id || idx}`} className="text-sm">
                                  <span className="font-medium">{item.product_name}</span>
                                  <span className="text-muted-foreground ml-1">
                                    - {item.quantity} {item.uom_code || 'PCS'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            {dispatch.vehicle_no && (
                              <div className="flex items-center gap-1">
                                <Truck className="w-3 h-3" />
                                {dispatch.vehicle_no}
                              </div>
                            )}
                            {dispatch.driver_name && (
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {dispatch.driver_name}
                              </div>
                            )}
                            {!dispatch.vehicle_no && !dispatch.driver_name && '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {dispatch.dispatch_date
                            ? new Date(dispatch.dispatch_date).toLocaleDateString()
                            : dispatch.created_at
                            ? new Date(dispatch.created_at).toLocaleDateString()
                            : '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(dispatch.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openDetailsDialog(dispatch)}
                                  className="w-full sm:w-auto"
                                >
                                  <Eye className="w-4 h-4 sm:mr-0" />
                                  <span className="sm:hidden ml-2">View</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View Details</p>
                              </TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleGenerateInvoicePDF(dispatch.dispatch_id, dispatch.dispatch_no)}
                                  disabled={generatingPDF === dispatch.dispatch_id}
                                  className="w-full sm:w-auto"
                                >
                                  {generatingPDF === dispatch.dispatch_id ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin sm:mr-0" />
                                      <span className="sm:hidden ml-2">Generating...</span>
                                    </>
                                  ) : (
                                    <>
                                      <FileText className="w-4 h-4 sm:mr-0" />
                                      <span className="sm:hidden ml-2">Invoice</span>
                                    </>
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Generate Dispatch Invoice PDF</p>
                              </TooltipContent>
                            </Tooltip>
                            
                          {dispatch.status === 'DISPATCHED' && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                                    onClick={() => openStatusDialog(dispatch, 'DELIVERED')}
                                    className="w-full sm:w-auto"
                            >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    <span className="hidden sm:inline">Mark Delivered</span>
                                    <span className="sm:hidden">Delivered</span>
                            </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Mark as Delivered</p>
                                </TooltipContent>
                              </Tooltip>
                          )}
                            
                            {dispatch.status === 'PENDING' && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openStatusDialog(dispatch, 'CANCELLED')}
                                    className="w-full sm:w-auto"
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Cancel
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Cancel Dispatch</p>
                                </TooltipContent>
                              </Tooltip>
                          )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              )}
            </CardContent>
          </Card>

        {/* Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl w-[95vw] sm:w-full">
          <DialogHeader>
              <DialogTitle>Dispatch Details</DialogTitle>
            <DialogDescription>
                Complete information about this dispatch order
            </DialogDescription>
          </DialogHeader>
            {selectedDispatch && (
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Dispatch Number</Label>
                    <p className="font-medium">{selectedDispatch.dispatch_no}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedDispatch.status)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Sales Order Number</Label>
                    <p className="font-medium">{selectedDispatch.so_number || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">PO Number</Label>
                    <p className="font-medium">{selectedDispatch.po_number || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Customer</Label>
                    <p className="font-medium">{selectedDispatch.customer_name || '-'}</p>
                          </div>
                  <div>
                    <Label className="text-muted-foreground">Vehicle Number</Label>
                    <p className="font-medium">{selectedDispatch.vehicle_no || '-'}</p>
                    </div>
                  <div>
                    <Label className="text-muted-foreground">Driver Name</Label>
                    <p className="font-medium">{selectedDispatch.driver_name || '-'}</p>
                </div>
                  <div>
                    <Label className="text-muted-foreground">Dispatch Date</Label>
                    <p className="font-medium">
                      {selectedDispatch.dispatch_date
                        ? new Date(selectedDispatch.dispatch_date).toLocaleString()
                        : selectedDispatch.created_at
                        ? new Date(selectedDispatch.created_at).toLocaleString()
                        : '-'}
                    </p>
              </div>
                  <div>
                    <Label className="text-muted-foreground">Dispatched By</Label>
                    <p className="font-medium">{selectedDispatch.dispatched_by || '-'}</p>
                  </div>
                </div>
                
                {selectedDispatch.items && selectedDispatch.items.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground mb-2 block">Products</Label>
                    <div className="border rounded-lg p-4 space-y-2">
                      {selectedDispatch.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{item.product_name}</p>
                            <p className="text-sm text-muted-foreground">{item.product_code}</p>
                          </div>
                          <Badge variant="outline">
                            {item.quantity} {item.uom_code || 'PCS'}
                          </Badge>
              </div>
                      ))}
              </div>
              </div>
                )}
                
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => selectedDispatch && handleGenerateInvoicePDF(selectedDispatch.dispatch_id, selectedDispatch.dispatch_no)}
                    disabled={!selectedDispatch || generatingPDF === selectedDispatch.dispatch_id}
                    className="w-full sm:w-auto"
                  >
                    {generatingPDF === selectedDispatch?.dispatch_id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Generate Invoice PDF
                      </>
                    )}
                  </Button>
                </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

        {/* Status Update Confirmation Dialog */}
        <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Status Update</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to update dispatch <strong>{selectedDispatch?.dispatch_no}</strong> status to{' '}
                <strong>{newStatus}</strong>?
                {newStatus === 'CANCELLED' && (
                  <span className="block mt-2 text-red-600">
                    This action cannot be undone. The dispatch will be marked as cancelled.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setShowStatusDialog(false);
                setSelectedDispatch(null);
                setNewStatus('');
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleUpdateDispatchStatus}
                disabled={updating}
                className={newStatus === 'CANCELLED' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                {updating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Confirm'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
    </TooltipProvider>
  );
}
