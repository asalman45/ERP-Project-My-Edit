import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Workflow, 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  ArrowRight, 
  Factory, 
  Scissors, 
  Wrench, 
  CheckCircle, 
  Package,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface ProductOption { product_id: string; product_code: string; part_name: string; }
interface ProcessStep { step_no: number; operation: string; }

export default function ProcessFlowPage() {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [op, setOp] = useState('');
  const [seq, setSeq] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Get icon for operation type
  const getOperationIcon = (operation: string) => {
    const op = operation.toLowerCase();
    if (op.includes('cut') || op.includes('blank')) return Scissors;
    if (op.includes('form') || op.includes('bend')) return Wrench;
    if (op.includes('weld')) return Sparkles;
    if (op.includes('assembly') || op.includes('assemble')) return Package;
    if (op.includes('qc') || op.includes('quality') || op.includes('inspect')) return CheckCircle;
    if (op.includes('paint') || op.includes('finish')) return Factory;
    return Workflow;
  };

  // Get color for operation type
  const getOperationColor = (operation: string) => {
    const op = operation.toLowerCase();
    if (op.includes('cut') || op.includes('blank')) return 'bg-blue-100 text-blue-700 border-blue-300';
    if (op.includes('form') || op.includes('bend')) return 'bg-purple-100 text-purple-700 border-purple-300';
    if (op.includes('weld')) return 'bg-orange-100 text-orange-700 border-orange-300';
    if (op.includes('assembly') || op.includes('assemble')) return 'bg-green-100 text-green-700 border-green-300';
    if (op.includes('qc') || op.includes('quality') || op.includes('inspect')) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    if (op.includes('paint') || op.includes('finish')) return 'bg-pink-100 text-pink-700 border-pink-300';
    return 'bg-gray-100 text-gray-700 border-gray-300';
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/mrp-api/products');
        const data = await res.json();
        const list: ProductOption[] = (Array.isArray(data) ? data : data?.data || []).map((p: any) => ({
          product_id: p.product_id,
          product_code: p.product_code,
          part_name: p.part_name,
        }));
        setProducts(list);
        if (list.length) {
          setSelectedProductId(list[0].product_id);
          await loadFlow(list[0].product_id);
        }
      } catch {
        toast.error('Failed to load products');
      }
    };
    load();
  }, []);

  const selectedProduct = useMemo(() => products.find(p => p.product_id === selectedProductId), [products, selectedProductId]);

  const loadFlow = async (productId: string) => {
    if (!productId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/process-flows/product/${productId}`);
      const data = await res.json();
      const raw = Array.isArray(data) ? data
        : Array.isArray(data?.data) ? data.data
        : Array.isArray(data?.steps) ? data.steps
        : Array.isArray(data?.data?.steps) ? data.data.steps
        : Array.isArray(data?.data?.primary_flow) ? data.data.primary_flow
        : [];
      const rows: ProcessStep[] = raw.map((r: any) => ({
        step_no: Number(r.step_no ?? r.sequence ?? r.step ?? 0) || 0,
        operation: String(r.operation ?? r.operation_type ?? r.name ?? '').trim(),
      })).filter(r => r.operation).sort((a, b) => a.step_no - b.step_no);
      setSteps(rows);
      setSeq(rows.length + 1);
    } catch {
      toast.error('Failed to load process flow');
    } finally {
      setLoading(false);
    }
  };

  const add = () => {
    if (!op.trim()) { toast.error('Enter operation'); return; }
    const next = [...steps, { step_no: seq || steps.length + 1, operation: op.trim().toUpperCase() }].sort((a, b) => a.step_no - b.step_no);
    setSteps(next);
    setOp('');
    setSeq(next.length + 1);
  };

  const remove = (i: number) => {
    const next = steps.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, step_no: idx + 1 }));
    setSteps(next);
    setSeq(next.length + 1);
  };

  const save = async () => {
    if (!selectedProductId) { toast.error('Select product'); return; }
    if (!steps.length) { toast.error('Add at least one step'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/process-flows/product/${selectedProductId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps: steps.map(s => ({ step_no: s.step_no, operation: s.operation })) })
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Saved');
      await loadFlow(selectedProductId);
    } catch (e) {
      toast.error('Save failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Header Card */}
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Workflow className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Process Flow Management</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Define and manage production process steps for products
                </p>
              </div>
            </div>
            {selectedProduct && (
              <Badge variant="secondary" className="text-sm px-3 py-1.5">
                <Package className="w-3 h-3 mr-1" />
                {selectedProduct.product_code} • {selectedProduct.part_name}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Product Selection */}
            <div className="space-y-2">
              <Label htmlFor="product-select" className="text-base font-semibold flex items-center gap-2">
                <Package className="w-4 h-4" />
                Select Product
              </Label>
              <Select value={selectedProductId} onValueChange={(v) => { setSelectedProductId(v); loadFlow(v); }}>
                <SelectTrigger id="product-select" className="h-11">
                  <SelectValue placeholder="Choose a product..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.product_id} value={p.product_id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{p.product_code}</span>
                        <span className="text-xs text-muted-foreground">{p.part_name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Add Operation Form */}
            <div className="lg:col-span-2 space-y-2">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add New Step
              </Label>
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-7">
                  <Input 
                    value={op} 
                    onChange={(e) => setOp(e.target.value)} 
                    placeholder="e.g., CUTTING, FORMING, WELDING, ASSEMBLY..." 
                    className="h-11"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && op.trim()) {
                        add();
                      }
                    }}
                  />
                </div>
                <div className="col-span-3">
                  <Input 
                    type="number" 
                    value={seq} 
                    onChange={(e) => setSeq(Number(e.target.value) || 1)} 
                    placeholder="Step #"
                    className="h-11"
                    min={1}
                  />
                </div>
                <div className="col-span-2">
                  <Button 
                    onClick={add} 
                    className="w-full h-11"
                    disabled={!op.trim()}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Process Flow Steps */}
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <Factory className="w-5 h-5" />
              Process Steps
              {loading && (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </CardTitle>
            <Badge variant="outline" className="text-sm">
              {steps.length} {steps.length === 1 ? 'step' : 'steps'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {steps.length > 0 ? (
            <>
              {/* Visual Flow Timeline */}
              <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-lg border-2 border-dashed border-blue-200">
                <div className="flex items-center gap-2 flex-wrap">
                  {steps.map((step, idx) => {
                    const Icon = getOperationIcon(step.operation);
                    const colorClass = getOperationColor(step.operation);
                    return (
                      <React.Fragment key={`${step.operation}-${idx}`}>
                        <div className="flex flex-col items-center gap-2">
                          <div className={`relative flex items-center justify-center w-16 h-16 rounded-full border-2 ${colorClass} shadow-md`}>
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {step.step_no}
                            </div>
                            <Icon className="w-6 h-6" />
                          </div>
                          <span className="text-xs font-medium text-center max-w-[80px]">{step.operation}</span>
                        </div>
                        {idx < steps.length - 1 && (
                          <ArrowRight className="w-6 h-6 text-gray-400 flex-shrink-0" />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Table View */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="w-20">Step #</TableHead>
                      <TableHead>Operation</TableHead>
                      <TableHead className="w-32 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {steps.map((s, idx) => {
                      const Icon = getOperationIcon(s.operation);
                      const colorClass = getOperationColor(s.operation);
                      return (
                        <TableRow key={`${s.operation}-${idx}`} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-full ${colorClass} flex items-center justify-center font-bold text-sm`}>
                                {s.step_no}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Icon className={`w-5 h-5 ${colorClass.replace('bg-', 'text-').split(' ')[0]}`} />
                              <Badge variant="outline" className={colorClass}>
                                {s.operation}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => remove(idx)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                  <Workflow className="w-10 h-10 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-1">No Process Steps Defined</h3>
                  <p className="text-sm text-muted-foreground">
                    Start by adding operations to create your production process flow
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        {steps.length > 0 && (
          <CardFooter className="bg-gray-50 border-t justify-between items-center">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>Don't forget to save your changes</span>
            </div>
            <Button 
              onClick={save} 
              disabled={saving || !selectedProductId}
              className="min-w-[140px]"
              size="lg"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Process Flow
                </>
              )}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}


