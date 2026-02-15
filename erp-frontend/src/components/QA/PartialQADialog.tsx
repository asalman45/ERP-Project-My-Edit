import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Plus, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface RejectionItem {
  id: string;
  quantity: number;
  disposition: 'REWORK' | 'SCRAP' | 'DISPOSAL' | '';
  reason: string;
  root_cause?: string;
  corrective_action?: string;
}

interface PartialQADialogProps {
  product: {
    inventory_id: string;
    product_name: string;
    product_code: string;
    quantity: number;
    uom_code?: string;
  } | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PartialQADialog({ product, open, onClose, onSuccess }: PartialQADialogProps) {
  const [approvedQuantity, setApprovedQuantity] = useState(0);
  const [rejections, setRejections] = useState<RejectionItem[]>([]);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (product && open) {
      // Reset form
      setApprovedQuantity(product.quantity);
      setRejections([]);
      setNotes('');
    }
  }, [product, open]);

  const addRejection = () => {
    setRejections([...rejections, {
      id: Date.now().toString(),
      quantity: 0,
      disposition: '',
      reason: '',
      root_cause: '',
      corrective_action: ''
    }]);
  };

  const removeRejection = (id: string) => {
    setRejections(rejections.filter(r => r.id !== id));
  };

  const updateRejection = (id: string, field: keyof RejectionItem, value: any) => {
    setRejections(rejections.map(r => 
      r.id === id ? { ...r, [field]: value } : r
    ));
  };

  const calculateTotalQuantity = () => {
    const totalRejected = rejections.reduce((sum, r) => sum + (parseFloat(r.quantity.toString()) || 0), 0);
    return approvedQuantity + totalRejected;
  };

  const getRemainingQuantity = () => {
    if (!product) return 0;
    return product.quantity - calculateTotalQuantity();
  };

  const isValid = () => {
    if (!product) return false;
    
    const remaining = getRemainingQuantity();
    if (Math.abs(remaining) > 0.001) return false; // Allow small floating point differences

    if (approvedQuantity < 0) return false;

    for (const rej of rejections) {
      if (rej.quantity <= 0) return false;
      if (!rej.disposition) return false;
      if (!rej.reason.trim()) return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!product || !isValid()) return;

    try {
      setProcessing(true);

      const payload = {
        approved_quantity: parseFloat(approvedQuantity.toString()),
        rejections: rejections.map(r => ({
          quantity: parseFloat(r.quantity.toString()),
          disposition: r.disposition,
          reason: r.reason,
          root_cause: r.root_cause || null,
          corrective_action: r.corrective_action || null
        })),
        notes,
        rejected_by: 'system' // TODO: Get from auth context
      };

      const response = await fetch(`/api/quality-assurance/${product.inventory_id}/partial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process partial inspection');
      }

      const result = await response.json();

      toast.success('Partial inspection completed successfully', {
        description: `${approvedQuantity} approved, ${rejections.length} rejection(s) processed`
      });

      onSuccess();
      onClose();

    } catch (error: any) {
      console.error('Partial inspection error:', error);
      toast.error('Failed to process partial inspection', {
        description: error.message
      });
    } finally {
      setProcessing(false);
    }
  };

  if (!product) return null;

  const remaining = getRemainingQuantity();
  const totalQty = calculateTotalQuantity();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Partial QA Inspection</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Product</Label>
                  <p className="font-medium">{product.product_name}</p>
                  <p className="text-sm text-muted-foreground">{product.product_code}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Total Quantity</Label>
                  <p className="font-medium text-lg">{product.quantity} {product.uom_code || 'pcs'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Remaining to Allocate</Label>
                  <p className={`font-bold text-lg ${Math.abs(remaining) < 0.001 ? 'text-green-600' : 'text-red-600'}`}>
                    {remaining.toFixed(2)} {product.uom_code || 'pcs'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approved Quantity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-green-600">Approved Quantity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="approved">Quantity to Approve</Label>
                  <Input
                    id="approved"
                    type="number"
                    value={approvedQuantity}
                    onChange={(e) => setApprovedQuantity(parseFloat(e.target.value) || 0)}
                    min={0}
                    max={product.quantity}
                    step={1}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Will be moved to Finished Goods
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rejections */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-red-600">Rejections</CardTitle>
              <Button onClick={addRejection} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Rejection
              </Button>
            </CardHeader>
            <CardContent>
              {rejections.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No rejections added. Click "Add Rejection" to reject some quantity.
                </p>
              ) : (
                <div className="space-y-4">
                  {rejections.map((rejection, index) => (
                    <Card key={rejection.id} className="border-red-200">
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Rejection {index + 1}</h4>
                            <Button
                              onClick={() => removeRejection(rejection.id)}
                              size="sm"
                              variant="ghost"
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Quantity <span className="text-red-600">*</span></Label>
                              <Input
                                type="number"
                                value={rejection.quantity}
                                onChange={(e) => updateRejection(rejection.id, 'quantity', parseFloat(e.target.value) || 0)}
                                min={0}
                                step={1}
                              />
                            </div>

                            <div>
                              <Label>Disposition <span className="text-red-600">*</span></Label>
                              <Select
                                value={rejection.disposition}
                                onValueChange={(value) => updateRejection(rejection.id, 'disposition', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select disposition" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="REWORK">REWORK - Create Rework WO</SelectItem>
                                  <SelectItem value="SCRAP">SCRAP - Move to Scrap</SelectItem>
                                  <SelectItem value="DISPOSAL">DISPOSAL - Record Disposal</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div>
                            <Label>Rejection Reason <span className="text-red-600">*</span></Label>
                            <Textarea
                              value={rejection.reason}
                              onChange={(e) => updateRejection(rejection.id, 'reason', e.target.value)}
                              placeholder="Describe why this quantity is being rejected..."
                              rows={2}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Root Cause (Optional)</Label>
                              <Textarea
                                value={rejection.root_cause}
                                onChange={(e) => updateRejection(rejection.id, 'root_cause', e.target.value)}
                                placeholder="Root cause analysis..."
                                rows={2}
                              />
                            </div>

                            <div>
                              <Label>Corrective Action (Optional)</Label>
                              <Textarea
                                value={rejection.corrective_action}
                                onChange={(e) => updateRejection(rejection.id, 'corrective_action', e.target.value)}
                                placeholder="Corrective actions..."
                                rows={2}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">QA Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="General inspection notes..."
              rows={3}
            />
          </div>

          {/* Validation Messages */}
          {!isValid() && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="space-y-1">
                    {Math.abs(remaining) > 0.001 && (
                      <p className="text-sm text-yellow-800">
                        ⚠️ Total quantity ({totalQty}) must equal inventory quantity ({product.quantity})
                      </p>
                    )}
                    {rejections.some(r => r.quantity <= 0) && (
                      <p className="text-sm text-yellow-800">
                        ⚠️ All rejection quantities must be greater than 0
                      </p>
                    )}
                    {rejections.some(r => !r.disposition) && (
                      <p className="text-sm text-yellow-800">
                        ⚠️ All rejections must have a disposition selected
                      </p>
                    )}
                    {rejections.some(r => !r.reason.trim()) && (
                      <p className="text-sm text-yellow-800">
                        ⚠️ All rejections must have a reason
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button onClick={onClose} variant="outline" disabled={processing}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isValid() || processing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Complete Inspection'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

