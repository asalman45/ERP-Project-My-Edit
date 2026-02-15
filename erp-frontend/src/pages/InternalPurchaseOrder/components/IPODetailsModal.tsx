import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InternalPurchaseOrder } from "../types";
import { 
  FileText, 
  Mail, 
  CheckCircle, 
  Clock, 
  XCircle,
  AlertCircle,
  Download,
  User,
  Phone,
  MapPin,
  Calendar
} from "lucide-react";

interface IPODetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ipo: InternalPurchaseOrder | null;
}

const IPODetailsModal: React.FC<IPODetailsModalProps> = ({
  isOpen,
  onClose,
  ipo,
}) => {
  if (!ipo) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'APPROVED': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'SENT': return <Mail className="h-4 w-4 text-purple-500" />;
      case 'RECEIVED': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'CANCELLED': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      SENT: 'bg-purple-100 text-purple-800',
      RECEIVED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  const items = Array.isArray(ipo.items) ? ipo.items : [];

  const subtotal = items.reduce((sum, item) => sum + (item.total_amount || 0), 0);
  const taxAmount = subtotal * 0.18;
  const grandTotal = subtotal + taxAmount;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileText className="h-6 w-6" />
            Purchase Order Details - {ipo.po_number}
          </DialogTitle>
          <DialogDescription>
            View complete details of the internal purchase order including supplier information and items.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Purchase Order Information</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(ipo.status)}
                  {getStatusBadge(ipo.status)}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <Label className="font-medium text-sm text-gray-600">PO Number</Label>
                  <div className="text-lg font-semibold">{ipo.po_number}</div>
                </div>
                <div>
                  <Label className="font-medium text-sm text-gray-600">Order Date</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(ipo.order_date).toLocaleDateString('en-GB')}
                  </div>
                </div>
                <div>
                  <Label className="font-medium text-sm text-gray-600">Expected Date</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {ipo.expected_date ? new Date(ipo.expected_date).toLocaleDateString('en-GB') : 'Not set'}
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="font-medium text-sm text-gray-600">Created By</Label>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {ipo.created_by || 'System'}
                  </div>
                </div>
                {ipo.created_at && (
                  <div>
                    <Label className="font-medium text-sm text-gray-600">Created At</Label>
                    <div>{new Date(ipo.created_at).toLocaleString('en-GB')}</div>
                  </div>
                )}
                {ipo.updated_by && (
                  <div>
                    <Label className="font-medium text-sm text-gray-600">Last Updated</Label>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {ipo.updated_by} - {new Date(ipo.updated_at || '').toLocaleString('en-GB')}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Supplier Information */}
          <Card>
            <CardHeader>
              <CardTitle>Supplier Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <Label className="font-medium text-sm text-gray-600">Company Name</Label>
                  <div className="text-lg font-semibold">{ipo.supplier_name}</div>
                </div>
                {ipo.contact_person && (
                  <div>
                    <Label className="font-medium text-sm text-gray-600">Contact Person</Label>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {ipo.contact_person}
                    </div>
                  </div>
                )}
                {ipo.contact_phone && (
                  <div>
                    <Label className="font-medium text-sm text-gray-600">Phone</Label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {ipo.contact_phone}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {ipo.supplier_address && (
                  <div>
                    <Label className="font-medium text-sm text-gray-600">Address</Label>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-1" />
                      <div className="text-sm">{ipo.supplier_address}</div>
                    </div>
                  </div>
                )}
                {ipo.supplier_email && (
                  <div>
                    <Label className="font-medium text-sm text-gray-600">Email</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${ipo.supplier_email}`} className="text-blue-600 hover:underline">
                        {ipo.supplier_email}
                      </a>
                    </div>
                  </div>
                )}
                {(ipo.supplier_ntn || ipo.supplier_strn) && (
                  <div className="grid grid-cols-2 gap-2">
                    {ipo.supplier_ntn && (
                      <div>
                        <Label className="font-medium text-sm text-gray-600">NTN</Label>
                        <div className="text-sm">{ipo.supplier_ntn}</div>
                      </div>
                    )}
                    {ipo.supplier_strn && (
                      <div>
                        <Label className="font-medium text-sm text-gray-600">STRN</Label>
                        <div className="text-sm">{ipo.supplier_strn}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Items Table */}
          <Card>
            <CardHeader>
              <CardTitle>Items ({items.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                  <AlertCircle className="h-10 w-10 mb-3" />
                  <p>No items added to this purchase order yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">S.No</th>
                        <th className="text-left p-3 font-medium">Item Description</th>
                        <th className="text-center p-3 font-medium">Qty</th>
                        <th className="text-right p-3 font-medium">Price/pc</th>
                        <th className="text-right p-3 font-medium">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={item.ipo_item_id || index} className="border-b hover:bg-gray-50">
                          <td className="p-3">{index + 1}</td>
                          <td className="p-3">
                            <div>
                              <div className="font-medium">{item.item_name}</div>
                              {item.description && (
                                <div className="text-sm text-gray-600">{item.description}</div>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-center">{item.quantity}</td>
                          <td className="p-3 text-right">PKR {item.unit_price.toLocaleString()}</td>
                          <td className="p-3 text-right font-medium">
                            PKR {(item.total_amount || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Totals */}
              <div className="mt-6 flex justify-end">
                <div className="w-80 space-y-2">
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Subtotal:</span>
                    <span className="font-medium">PKR {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Sales Tax (18%):</span>
                    <span className="font-medium">PKR {taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-2 text-lg font-bold bg-gray-50 p-3 rounded">
                    <span>Total Amount:</span>
                    <span>PKR {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {ipo.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{ipo.notes}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Simple Label component since it's not imported
const Label: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`text-sm font-medium text-gray-700 ${className}`}>{children}</div>
);

export default IPODetailsModal;
