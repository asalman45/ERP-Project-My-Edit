import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InternalPurchaseOrder } from "../types";
import { 
  Mail, 
  FileText, 
  Send,
  Loader2,
  AlertCircle,
  CheckCircle,
  Info
} from "lucide-react";

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ipo: InternalPurchaseOrder | null;
  onSend: (ipo: InternalPurchaseOrder, email: string) => void;
  isLoading: boolean;
}

const SendEmailModal: React.FC<SendEmailModalProps> = ({
  isOpen,
  onClose,
  ipo,
  onSend,
  isLoading,
}) => {
  const [email, setEmail] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  React.useEffect(() => {
    if (ipo?.supplier_email) {
      setEmail(ipo.supplier_email);
    }
  }, [ipo]);

  const handleSend = () => {
    if (!email.trim()) {
      return;
    }
    
    if (ipo) {
      onSend(ipo, email);
    }
  };

  const handleClose = () => {
    setEmail('');
    setCustomMessage('');
    onClose();
  };

  if (!ipo) return null;

  const items = Array.isArray(ipo.items) ? ipo.items : [];
  const subtotal = items.reduce((sum, item) => sum + (item.total_amount || 0), 0);
  const taxAmount = subtotal * 0.18;
  const grandTotal = subtotal + taxAmount;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Mail className="h-6 w-6" />
            Send Purchase Order via Email
          </DialogTitle>
          <DialogDescription>
            Send the purchase order PDF to the supplier via email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* IPO Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Purchase Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium text-sm text-gray-600">PO Number</Label>
                  <div className="font-semibold">{ipo.po_number}</div>
                </div>
                <div>
                  <Label className="font-medium text-sm text-gray-600">Supplier</Label>
                  <div className="font-semibold">{ipo.supplier_name}</div>
                </div>
                <div>
                  <Label className="font-medium text-sm text-gray-600">Items</Label>
                  <div>{items.length} items</div>
                </div>
                <div>
                  <Label className="font-medium text-sm text-gray-600">Total Amount</Label>
                  <div className="font-semibold">PKR {grandTotal.toLocaleString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Supplier Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="supplier@example.com"
                  required
                />
                <p className="text-sm text-gray-600 mt-1">
                  The Purchase Order PDF will be attached to this email
                </p>
              </div>

              <div>
                <Label htmlFor="customMessage">Custom Message (Optional)</Label>
                <Textarea
                  id="customMessage"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Add any additional message to include in the email..."
                  rows={3}
                />
                <p className="text-sm text-gray-600 mt-1">
                  This will be added to the standard email template
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Email Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Email Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div>
                  <strong>Subject:</strong> Purchase Order {ipo.po_number} - Enterprising Manufacturing Co Pvt Ltd.
                </div>
                <div>
                  <strong>To:</strong> {email || 'supplier@example.com'}
                </div>
                <div>
                  <strong>Message:</strong>
                  <div className="text-sm mt-2 space-y-2">
                    <p>Dear {ipo.contact_person || ipo.supplier_name},</p>
                    <p>We are pleased to inform you that a new Purchase Order has been generated for your company.</p>
                    <p><strong>Purchase Order Details:</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>PO Number: {ipo.po_number}</li>
                      <li>Order Date: {new Date(ipo.order_date).toLocaleDateString('en-GB')}</li>
                      <li>Supplier: {ipo.supplier_name}</li>
                      <li>Total Items: {items.length}</li>
                      <li>Total Amount: PKR {grandTotal.toLocaleString()}</li>
                    </ul>
                    {customMessage && (
                      <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                        <strong>Additional Message:</strong>
                        <p className="mt-1">{customMessage}</p>
                      </div>
                    )}
                    <p>The detailed Purchase Order document is attached to this email as a PDF file.</p>
                    <p>Please review the attached Purchase Order and confirm receipt.</p>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <strong>Attachment:</strong> PO_{ipo.po_number}_{ipo.supplier_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Information Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>What happens when you send:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>A professional PDF Purchase Order will be generated</li>
                <li>The PDF will be attached to the email</li>
                <li>Email will be sent to the supplier with order summary</li>
                <li>IPO status will be updated to "SENT"</li>
                <li>You will receive confirmation of successful delivery</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSend} 
              disabled={!email.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Generate PDF & Send Email
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SendEmailModal;
