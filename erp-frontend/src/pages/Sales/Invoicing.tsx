import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, FileText, Plus, DollarSign, CheckCircle, Clock, AlertCircle, ShoppingCart, Receipt, Download } from 'lucide-react';
import { toast } from 'sonner';

interface SalesOrder {
  so_id: string;
  so_no: string;
  customer_name: string;
  customer_id: string;
  total_amount: number;
  tax_amount?: number;
  order_date: string;
  status: string;
  items?: Array<{
    product_id: string;
    product_name: string;
    qty_ordered: number;
    unit_price: number;
  }>;
}

interface DispatchRecord {
  dispatch_id: string;
  dispatch_no: string;
  so_id?: string;
  so_number?: string;
  customer_name?: string;
  status: string;
}

interface Invoice {
  invoice_id: string;
  invoice_no: string;
  so_id?: string;
  so_number?: string;
  customer_id: string;
  customer_name?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  invoice_date: string;
  due_date: string;
  payment_terms: string;
  status: string;
  payment_status: string;
  payment_date?: string;
  payment_method?: string;
}

export default function Invoicing() {
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [dispatchRecords, setDispatchRecords] = useState<DispatchRecord[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<SalesOrder | null>(null);
  const [selectedDispatch, setSelectedDispatch] = useState<DispatchRecord | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentTerms, setPaymentTerms] = useState<string>('NET_30');
  const [paymentMethod, setPaymentMethod] = useState<string>('BANK_TRANSFER');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  useEffect(() => {
    fetchSalesOrders();
    fetchDispatchRecords();
    fetchInvoices();
  }, []);

  const fetchSalesOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sales-orders');
      if (response.ok) {
        const data = await response.json();
        const orders = Array.isArray(data) ? data : (data.data || []);
        // Show dispatched or completed orders that can be invoiced
        const filtered = orders.filter((so: any) =>
          so.status === 'DISPATCHED' ||
          so.status === 'COMPLETED' ||
          so.status === 'READY_FOR_DISPATCH'
        );
        setSalesOrders(filtered);
      }
    } catch (error) {
      console.error('Error fetching sales orders:', error);
      toast.error('Failed to fetch sales orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchDispatchRecords = async () => {
    try {
      const response = await fetch('/api/dispatch');
      if (response.ok) {
        const data = await response.json();
        const dispatches = Array.isArray(data) ? data : (data.data || []);
        // Show dispatched orders
        const filtered = dispatches.filter((d: any) =>
          d.status === 'DISPATCHED' || d.status === 'DELIVERED'
        );
        setDispatchRecords(filtered);
      }
    } catch (error) {
      console.error('Error fetching dispatch records:', error);
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/customer-invoices');
      if (response.ok) {
        const data = await response.json();
        setInvoices(Array.isArray(data) ? data : (data.data || []));
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to fetch invoices');
    }
  };

  const openInvoiceDialog = (so?: SalesOrder, dispatch?: DispatchRecord) => {
    if (so) {
      setSelectedSalesOrder(so);
      setSelectedDispatch(null);
    } else if (dispatch) {
      setSelectedDispatch(dispatch);
      // Find matching sales order
      const matchingSO = salesOrders.find(s => s.so_id === dispatch.so_id);
      setSelectedSalesOrder(matchingSO || null);
    }
    setShowInvoiceDialog(true);
  };

  const handleCreateInvoice = async () => {
    if (!selectedSalesOrder && !selectedDispatch) {
      toast.error('Please select a sales order or dispatch');
      return;
    }

    try {
      const response = await fetch('/api/customer-invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          so_id: selectedSalesOrder?.so_id || selectedDispatch?.so_id,
          dispatch_id: selectedDispatch?.dispatch_id || null,
          customer_id: selectedSalesOrder?.customer_id,
          invoice_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          payment_terms: paymentTerms,
          notes: `Invoice generated from ${selectedSalesOrder ? 'Sales Order' : 'Dispatch'}`
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Invoice ${data.data?.invoice_no || ''} created successfully`);
        setShowInvoiceDialog(false);
        setSelectedSalesOrder(null);
        setSelectedDispatch(null);
        fetchInvoices();
        fetchSalesOrders();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create invoice');
      }
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast.error(error.message || 'Failed to create invoice');
    }
  };

  const openPaymentDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(invoice.total_amount);
    setShowPaymentDialog(true);
  };

  const handleUpdatePayment = async () => {
    if (!selectedInvoice) return;

    try {
      const response = await fetch(`/api/customer-invoices/${selectedInvoice.invoice_id}/payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_status: paymentAmount >= selectedInvoice.total_amount ? 'PAID' : 'PARTIAL',
          payment_amount: paymentAmount,
          payment_date: new Date().toISOString().split('T')[0],
          payment_method: paymentMethod,
          notes: `Payment received via ${paymentMethod}`
        }),
      });

      if (response.ok) {
        toast.success('Payment status updated successfully');
        setShowPaymentDialog(false);
        setSelectedInvoice(null);
        fetchInvoices();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update payment status');
      }
    } catch (error: any) {
      console.error('Error updating payment:', error);
      toast.error(error.message || 'Failed to update payment status');
    }
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      const response = await fetch(`/api/customer-invoices/${invoice.invoice_id}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice_${invoice.invoice_no}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Invoice PDF downloaded successfully');
      } else {
        toast.error('Failed to download invoice PDF');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download invoice PDF');
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'PARTIAL': 'bg-blue-100 text-blue-800',
      'PAID': 'bg-green-100 text-green-800',
      'OVERDUE': 'bg-red-100 text-red-800',
      'CANCELLED': 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  const getInvoiceStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'ACTIVE': 'bg-blue-100 text-blue-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  const totalInvoices = invoices.length;
  const pendingPayments = invoices.filter(inv => inv.payment_status === 'PENDING' || inv.payment_status === 'PARTIAL').length;
  const totalPendingAmount = invoices
    .filter(inv => inv.payment_status === 'PENDING' || inv.payment_status === 'PARTIAL')
    .reduce((sum, inv) => sum + (inv.total_amount - (inv.payment_status === 'PARTIAL' ? 0 : 0)), 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoicing & Payment Management</h1>
          <p className="text-muted-foreground mt-1">
            Generate invoices from sales orders and track payments
          </p>
        </div>
        <Receipt className="w-8 h-8 text-blue-600" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Invoices</p>
                <p className="text-2xl font-bold">{totalInvoices}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingPayments}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Pending Amount</p>
                <p className="text-2xl font-bold text-red-600">
                  ₹{totalPendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Paid Invoices</p>
                <p className="text-2xl font-bold text-green-600">
                  {invoices.filter(inv => inv.payment_status === 'PAID').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices">All Invoices</TabsTrigger>
          <TabsTrigger value="sales-orders">Sales Orders</TabsTrigger>
          <TabsTrigger value="dispatches">Dispatches</TabsTrigger>
        </TabsList>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Customer Invoices</CardTitle>
                <Button onClick={() => fetchInvoices()}>
                  <FileText className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No invoices found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Create invoices from sales orders or dispatch records
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice No</TableHead>
                      <TableHead>SO Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.invoice_id}>
                        <TableCell className="font-medium">{invoice.invoice_no}</TableCell>
                        <TableCell>{invoice.so_number || '-'}</TableCell>
                        <TableCell>{invoice.customer_name || '-'}</TableCell>
                        <TableCell>
                          ₹{invoice.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>{getInvoiceStatusBadge(invoice.status)}</TableCell>
                        <TableCell>{getPaymentStatusBadge(invoice.payment_status)}</TableCell>
                        <TableCell>
                          {(invoice.payment_status === 'PENDING' || invoice.payment_status === 'PARTIAL') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openPaymentDialog(invoice)}
                            >
                              <DollarSign className="w-4 h-4 mr-2" />
                              Record Payment
                            </Button>
                          )}
                          {invoice.payment_status === 'PAID' && (
                            <Badge className="bg-green-100 text-green-800">Paid</Badge>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="ml-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            onClick={() => handleDownloadPDF(invoice)}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            PDF
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales Orders Tab */}
        <TabsContent value="sales-orders" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sales Orders Ready for Invoicing</CardTitle>
                <Button onClick={() => fetchSalesOrders()}>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : salesOrders.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No sales orders ready for invoicing</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SO Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesOrders.map((so) => (
                      <TableRow key={so.so_id}>
                        <TableCell className="font-medium">{so.so_no}</TableCell>
                        <TableCell>{so.customer_name}</TableCell>
                        <TableCell>
                          ₹{so.total_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                        </TableCell>
                        <TableCell>{getInvoiceStatusBadge(so.status)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => openInvoiceDialog(so)}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Create Invoice
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dispatches Tab */}
        <TabsContent value="dispatches" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Dispatches Ready for Invoicing</CardTitle>
                <Button onClick={() => fetchDispatchRecords()}>
                  <FileText className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {dispatchRecords.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No dispatches ready for invoicing</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dispatch No</TableHead>
                      <TableHead>SO Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dispatchRecords.map((dispatch) => (
                      <TableRow key={dispatch.dispatch_id}>
                        <TableCell className="font-medium">{dispatch.dispatch_no}</TableCell>
                        <TableCell>{dispatch.so_number || '-'}</TableCell>
                        <TableCell>{dispatch.customer_name || '-'}</TableCell>
                        <TableCell>{getInvoiceStatusBadge(dispatch.status)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => openInvoiceDialog(undefined, dispatch)}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Create Invoice
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Invoice Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
            <DialogDescription>
              Generate invoice from {selectedSalesOrder ? 'sales order' : 'dispatch'}
            </DialogDescription>
          </DialogHeader>

          {(selectedSalesOrder || selectedDispatch) && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium mb-2">Details</div>
                <div className="space-y-1 text-sm">
                  {selectedSalesOrder && (
                    <>
                      <div><span className="font-medium">SO Number:</span> {selectedSalesOrder.so_no}</div>
                      <div><span className="font-medium">Customer:</span> {selectedSalesOrder.customer_name}</div>
                      <div><span className="font-medium">Amount:</span> ₹{selectedSalesOrder.total_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}</div>
                    </>
                  )}
                  {selectedDispatch && (
                    <>
                      <div><span className="font-medium">Dispatch No:</span> {selectedDispatch.dispatch_no}</div>
                      <div><span className="font-medium">Customer:</span> {selectedDispatch.customer_name}</div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-terms">Payment Terms</Label>
                <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NET_15">NET 15</SelectItem>
                    <SelectItem value="NET_30">NET 30</SelectItem>
                    <SelectItem value="NET_45">NET 45</SelectItem>
                    <SelectItem value="NET_60">NET 60</SelectItem>
                    <SelectItem value="DUE_ON_RECEIPT">Due on Receipt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowInvoiceDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateInvoice}>
                  <FileText className="w-4 h-4 mr-2" />
                  Create Invoice
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Update payment status for invoice
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-sm font-medium mb-2">Invoice Details</div>
                <div className="space-y-1 text-sm">
                  <div><span className="font-medium">Invoice No:</span> {selectedInvoice.invoice_no}</div>
                  <div><span className="font-medium">Total Amount:</span> ₹{selectedInvoice.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  <div><span className="font-medium">Due Date:</span> {selectedInvoice.due_date ? new Date(selectedInvoice.due_date).toLocaleDateString() : '-'}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-amount">Payment Amount</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  min="0"
                  max={selectedInvoice.total_amount}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-method">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                    <SelectItem value="DEBIT_CARD">Debit Card</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdatePayment}>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Record Payment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

