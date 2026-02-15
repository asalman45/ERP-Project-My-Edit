import React, { useState, useEffect } from "react";
import { X, PackageCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface GRNReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: any;
  onSuccess: () => void;
}

interface POItem {
  po_item_id: string;
  material_id: string;
  material_name: string;
  quantity: number;
  received_qty: number;
  unit_price: number;
  uom_code: string;
}

interface GRNItem {
  po_item_id: string;
  material_id: string;
  qty_received: number;
  uom_id: string;
  batch_no: string;
}

export const GRNReceiveModal: React.FC<GRNReceiveModalProps> = ({
  isOpen,
  onClose,
  purchaseOrder,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [fetchingPODetails, setFetchingPODetails] = useState(false);
  const [poItems, setPOItems] = useState<POItem[]>([]);
  
  // Fixed location ID for Main Store
  const FIXED_LOCATION_ID = "main-store-001";
  
  const [formData, setFormData] = useState({
    location_id: FIXED_LOCATION_ID,
    received_by: "System User",
    notes: "",
  });
  const [receivingItems, setReceivingItems] = useState<{ [key: string]: { qty: string | number; batch: string } }>({});

  // Fetch PO details when modal opens
  useEffect(() => {
    if (isOpen && purchaseOrder) {
      fetchPODetails();
    }
  }, [isOpen, purchaseOrder]);

  const fetchPODetails = async () => {
    try {
      setFetchingPODetails(true);
      // Use relative URL with Vite proxy
      const response = await fetch(`/api/purchase-orders/${purchaseOrder.po_id}`);
      const data = await response.json();
      
      console.log('PO Details Response:', data);
      
      if (data.data && data.data.items && data.data.items.length > 0) {
        console.log('PO Items found:', data.data.items);
        setPOItems(data.data.items);
        
        // Initialize receiving quantities (default to remaining quantity)
        const initialReceiving: any = {};
        data.data.items.forEach((item: POItem) => {
          const remainingQty = item.quantity - (item.received_qty || 0);
          initialReceiving[item.po_item_id] = {
            qty: remainingQty > 0 ? remainingQty : '',
            batch: `BATCH-${Date.now()}`
          };
        });
        setReceivingItems(initialReceiving);
        console.log('Initial receiving items:', initialReceiving);
      } else {
        console.log('No items found in PO response:', data);
      }
    } catch (error) {
      console.error("Error fetching PO details:", error);
      toast.error("Failed to load purchase order details");
    } finally {
      setFetchingPODetails(false);
    }
  };


  const handleReceive = async () => {
    try {
      // Prepare GRN items
      const grnItems: GRNItem[] = poItems
        .filter(item => {
          const qty = receivingItems[item.po_item_id]?.qty;
          const numQty = typeof qty === 'string' ? parseFloat(qty) : (qty || 0);
          return numQty > 0;
        })
        .map(item => {
          const qty = receivingItems[item.po_item_id].qty;
          const numQty = typeof qty === 'string' ? parseFloat(qty) : (qty || 0);
          return {
            po_item_id: item.po_item_id,
            material_id: item.material_id,
            qty_received: numQty,
            uom_id: "88ed7640-5f9e-47c3-882c-a9bfbfbe0744", // Default UOM: Pieces
            batch_no: receivingItems[item.po_item_id].batch
          };
        });

      if (grnItems.length === 0) {
        toast.error("Please enter at least one receiving quantity");
        return;
      }

      setLoading(true);

      const grnData = {
        po_id: purchaseOrder.po_id,
        supplier_id: purchaseOrder.supplier_id,
        location_id: formData.location_id,
        received_by: formData.received_by,
        notes: formData.notes,
        items: grnItems
      };

      console.log('Sending GRN data:', grnData);

      // Use relative URL with Vite proxy
      const response = await fetch("/api/goods-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(grnData)
      });

      // Handle non-JSON responses (like 404 HTML pages)
      let result;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        result = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server returned ${response.status}: ${text.substring(0, 100)}`);
      }

      if (response.ok && result.success) {
        toast.success(`Materials received successfully! GRN: ${result.data.grn_no}`, {
          description: `${grnItems.length} item(s) added to inventory at Main Store`
        });
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || "Failed to receive materials");
      }

    } catch (error) {
      console.error("Error receiving materials:", error);
      toast.error("Failed to create Goods Receipt Note");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-purple-600" />
            Receive Materials - PO: {purchaseOrder?.po_no}
          </DialogTitle>
        </DialogHeader>

        {fetchingPODetails ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">Loading purchase order details...</span>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* PO Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Purchase Order Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Supplier:</span>
                  <span className="ml-2 font-medium">{purchaseOrder?.supplier_name || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Order Date:</span>
                  <span className="ml-2">{purchaseOrder?.order_date ? new Date(purchaseOrder.order_date).toLocaleDateString() : "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Receiving Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Storage Location</Label>
                <Input 
                  value="Main Store" 
                  disabled 
                  className="bg-gray-50 text-gray-700 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500">All materials are received in the Main Store by default</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="received_by">Received By</Label>
                <Input
                  id="received_by"
                  value={formData.received_by}
                  onChange={(e) => setFormData(prev => ({ ...prev, received_by: e.target.value }))}
                  placeholder="Enter receiver name"
                />
              </div>
            </div>

            {/* Items to Receive */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700">Items to Receive</h3>
              
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 font-medium text-gray-700">Material</th>
                      <th className="text-center p-3 font-medium text-gray-700">Ordered</th>
                      <th className="text-center p-3 font-medium text-gray-700">Already Received</th>
                      <th className="text-center p-3 font-medium text-gray-700">Receiving Now</th>
                      <th className="text-left p-3 font-medium text-gray-700">Batch Number</th>
                    </tr>
                  </thead>
                  <tbody>
                    {poItems.length > 0 ? (
                      poItems.map((item) => {
                        const remainingQty = item.quantity - (item.received_qty || 0);
                        return (
                          <tr key={item.po_item_id} className="border-t">
                            <td className="p-3">
                              <div className="font-medium">{item.material_name}</div>
                              <div className="text-xs text-gray-500">{item.uom_code || 'PCS'}</div>
                            </td>
                            <td className="text-center p-3">{item.quantity}</td>
                            <td className="text-center p-3">{item.received_qty || 0}</td>
                            <td className="p-3">
                              <Input
                                type="number"
                                min="0"
                                max={remainingQty}
                                step="0.01"
                                value={receivingItems[item.po_item_id]?.qty ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setReceivingItems(prev => ({
                                    ...prev,
                                    [item.po_item_id]: {
                                      ...prev[item.po_item_id],
                                      qty: value === '' ? '' : (parseFloat(value) || 0)
                                    }
                                  }));
                                }}
                                onBlur={(e) => {
                                  const value = e.target.value;
                                  if (value === '' || value === '0') {
                                    setReceivingItems(prev => ({
                                      ...prev,
                                      [item.po_item_id]: {
                                        ...prev[item.po_item_id],
                                        qty: 0
                                      }
                                    }));
                                  }
                                }}
                                className="text-center"
                                placeholder="0"
                              />
                            </td>
                            <td className="p-3">
                              <Input
                                value={receivingItems[item.po_item_id]?.batch || ""}
                                onChange={(e) => setReceivingItems(prev => ({
                                  ...prev,
                                  [item.po_item_id]: {
                                    ...prev[item.po_item_id],
                                    batch: e.target.value
                                  }
                                }))}
                                placeholder="Batch/Lot No"
                              />
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-gray-500">
                          {fetchingPODetails ? (
                            <div className="flex items-center justify-center">
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Loading PO items...
                            </div>
                          ) : (
                            <div>
                              <div className="text-sm font-medium">No items found in this Purchase Order</div>
                              <div className="text-xs mt-1">
                                This PO may not have any materials attached, or there was an error loading the items.
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any remarks or observations about the received materials..."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleReceive} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Receiving...
                  </>
                ) : (
                  <>
                    <PackageCheck className="h-4 w-4 mr-2" />
                    Receive Materials
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

