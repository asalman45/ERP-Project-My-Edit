import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Plus, Wrench, Network, Play, CheckCircle, Clock, AlertCircle, Calendar, Boxes, Trash2, Download } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import GenericExportModal from '@/components/common/GenericExportModal';
import { workOrderApi } from '@/services/api';

interface Product {
  product_id: string;
  product_code: string;
  part_name: string;
  description?: string;
  model_name?: string;
  oem_name?: string;
  uom_code?: string;
  uom_name?: string;
  category?: string;
}

interface WorkOrder {
  wo_id: string;
  wo_no: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  status: string;
  operation_type?: string;
  parent_wo_id?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  priority: string;
  customer?: string;
  sales_order_ref?: string;
  purchase_order_ref?: string;
  created_at: string;
}

interface WorkOrderHierarchy {
  master: WorkOrder;
  children: WorkOrder[];
}

type BaseMaterialPlan = {
  material_id: string;
  material_name: string;
  suggested_qty: number;
  uom?: string;
};

type MaterialPlan = BaseMaterialPlan & {
  available_qty?: number;
  has_shortage?: boolean;
};

export default function WorkOrderManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [hierarchies, setHierarchies] = useState<WorkOrderHierarchy[]>([]);
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [salesOrderItems, setSalesOrderItems] = useState<any[]>([]);
  const [bomData, setBomData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedHierarchy, setSelectedHierarchy] = useState<WorkOrderHierarchy | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCreateChildDialog, setShowCreateChildDialog] = useState(false);
  const [selectedParentWO, setSelectedParentWO] = useState<WorkOrder | null>(null);
  const [processFlowSteps, setProcessFlowSteps] = useState<{ step_no: number; operation: string }[]>([]);
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [issueSelectedWO, setIssueSelectedWO] = useState<WorkOrder | null>(null);
  const [materialPlans, setMaterialPlans] = useState<MaterialPlan[]>([]);
  const [availableBomItems, setAvailableBomItems] = useState<Array<any>>([]);
  const [selectedBomItemIds, setSelectedBomItemIds] = useState<Set<string>>(new Set<string>());
  const [showExportModal, setShowExportModal] = useState(false);

  const buildPlansFromItems = (
    items: any[],
    operationType: string,
    parentQuantity: number
  ): BaseMaterialPlan[] => {
    const plans: BaseMaterialPlan[] = [];
    const normalizedOperation = (operationType || '').toUpperCase();

    items.forEach((item: any) => {
      if (!item || !item.material_id) {
        return;
      }

      const materialId = String(item.material_id);
      const qtyPerUnit = Number(item.quantity) || 1;

      if (
        normalizedOperation === 'CUTTING' &&
        item.item_type === 'CUT_PART' &&
        Number(item.pcs_per_sheet)
      ) {
        const blanksPerUnit = qtyPerUnit;
        const totalBlanks = blanksPerUnit * parentQuantity;
        const pcsPerSheet = Number(item.pcs_per_sheet) || 1;
        const sheets = Math.ceil(totalBlanks / pcsPerSheet);
        if (!Number.isFinite(sheets) || sheets <= 0) {
          return;
        }

        const existingPlan = plans.find((plan) => plan.material_id === materialId);
        if (existingPlan) {
          existingPlan.suggested_qty += sheets;
        } else {
          plans.push({
            material_id: materialId,
            material_name: item.material_name || item.item_name || 'Raw Sheet',
            suggested_qty: sheets,
            uom: item.uom_code || 'Sheet',
          });
        }
        return;
      }

      const totalQty = qtyPerUnit * parentQuantity;
      if (!Number.isFinite(totalQty) || totalQty <= 0) {
        return;
      }

      const existingPlan = plans.find((plan) => plan.material_id === materialId);
      if (existingPlan) {
        existingPlan.suggested_qty += totalQty;
      } else {
        plans.push({
          material_id: materialId,
          material_name: item.material_name || item.item_name || 'Material',
          suggested_qty: totalQty,
          uom: item.uom_code || 'unit',
        });
      }
    });

    return plans;
  };

  const enrichPlansWithInventory = async (plans: BaseMaterialPlan[]): Promise<MaterialPlan[]> => {
    if (plans.length === 0) {
      return [];
    }

    let allStock: any[] = [];
    try {
      const stockResponse = await fetch('/api/inventory/current-stock/all?item_type=material&limit=1000');
      if (stockResponse.ok) {
        const stockData = await stockResponse.json();
        allStock = Array.isArray(stockData.data) ? stockData.data : [];
      }
    } catch (error) {
      console.error('Failed to fetch inventory data:', error);
    }

    return plans.map((plan) => {
      const inventory = allStock.find((item: any) => {
        const candidateId =
          item?.material_id ??
          item?.material?.material_id ??
          item?.material?.materialId ??
          item?.materialId;
        return String(candidateId) === plan.material_id;
      });

      const availableQty = Number(
        inventory?.quantity ??
        inventory?.available_quantity ??
        inventory?.availableQuantity ??
        0
      ) || 0;

      return {
        ...plan,
        available_qty: availableQty,
        has_shortage: availableQty < plan.suggested_qty,
      };
    });
  };

  const prepareMaterialPlans = async (
    items: any[],
    operationType: string,
    parentQuantity: number
  ) => {
    if (!items || items.length === 0) {
      setMaterialPlans([]);
      return;
    }

    const basePlans = buildPlansFromItems(items, operationType, parentQuantity);

    if (basePlans.length === 0) {
      setMaterialPlans([]);
      return;
    }

    try {
      const plansWithInventory = await enrichPlansWithInventory(basePlans);
      setMaterialPlans(plansWithInventory);
    } catch (error) {
      console.error('Failed to prepare material plans', error);
      toast.error('Failed to prepare material plans');
    }
  };

  // Form state for creating work orders
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: 500,
    customer: 'Test Customer',
    sales_order_ref: 'none',
    purchase_order_ref: 'none',
    priority: 'High',
    scheduled_start: new Date().toISOString().split('T')[0],
    scheduled_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  // Form state for creating child work orders
  const [childFormData, setChildFormData] = useState({
    operation_type: 'CUTTING',
    quantity: 100,
    sheets_required: 0,
    blanks_per_sheet: 0,
    priority: 'High',
    scheduled_start: new Date().toISOString().split('T')[0],
    scheduled_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    cutPartsBreakdown: [] as Array<{
      item_name: string;
      sub_assembly: string;
      qty_per_unit: number;
      total_blanks: number;
      pcs_per_sheet: number;
      sheets_required: number;
    }>
  });

  useEffect(() => {
    fetchProducts();
    fetchWorkOrders();
    fetchSalesOrders();
    fetchPurchaseOrders();
  }, []);

  // Fetch BOM data when parent work order is selected
  useEffect(() => {
    if (selectedParentWO && selectedParentWO.product_id) {
      fetchBOMData(selectedParentWO.product_id);
      fetchProcessFlow(selectedParentWO.product_id);
    }
  }, [selectedParentWO]);

  // Recalculate quantity when BOM data is loaded or operation type changes
  useEffect(() => {
    if (selectedParentWO && selectedParentWO.quantity && bomData.length > 0) {
      const operationType = childFormData.operation_type || 'CUTTING';
      const calculation = calculateOperationQuantity(operationType, selectedParentWO.quantity);
      setChildFormData(prev => ({
        ...prev,
        quantity: calculation.blanksQuantity,
        sheets_required: calculation.sheetsRequired,
        blanks_per_sheet: calculation.blanksPerSheet,
        cutPartsBreakdown: calculation.cutPartsBreakdown || []
      }));
    }
  }, [bomData, selectedParentWO, childFormData.operation_type]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/mrp-api/products');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          // Transform the data to match the expected Product interface
          const transformedProducts = data.map((product: any) => ({
            product_id: product.product_id,
            product_code: product.product_code,
            part_name: product.part_name,
            description: product.description,
            model_name: product.model_name,
            oem_name: product.oem_name,
            uom_code: product.uom_code,
            uom_name: product.uom_name,
            category: product.category
          }));
          setProducts(transformedProducts);
        } else {
          setProducts([]);
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    }
  };

  const openIssueMaterial = async (wo: WorkOrder) => {
    try {
      setIssueSelectedWO(wo);
      setShowIssueDialog(true);
      setMaterialPlans([]);
      setAvailableBomItems([]);
      setSelectedBomItemIds(new Set<string>());
      
      // Get parent work order quantity if this is a child work order
      let parentQuantity = wo.quantity;
      if (wo.parent_wo_id) {
        const parentWO = workOrders.find(w => w.wo_id === wo.parent_wo_id);
        if (parentWO) {
          parentQuantity = parentWO.quantity;
        }
      }
      
      const res = await fetch(`/api/bom-api/production-recipe/${wo.product_id}`);
      const result = await res.json();
      const items = Array.isArray(result?.data) ? result.data : [];
      const operationType = wo.operation_type || '';
      const operationLower = operationType.toLowerCase();

      if (operationType.toUpperCase() === 'CUTTING') {
        // For CUTTING, store all available BOM items for user selection
        // User can select which items are required for this specific cutting operation
        const availableItems = items.filter((it: any) => it.material_id);
        setAvailableBomItems(availableItems);
        setSelectedBomItemIds(new Set<string>()); // Start with no items selected
        // Don't auto-calculate - wait for user selection
        return; // Exit early, user will select items
      } else {
        // For other operations (FORMING, ASSEMBLY, WELDING, etc.):
        // Filter items that match the operation type based on sub_assembly_name or operation_code
        const matchingItems = items.filter((it: any) => {
          if (!it.material_id || it.item_type === 'CUT_PART') return false;
          
          // Match by operation_code if available
          if (it.operation_code && it.operation_code.toLowerCase().includes(operationLower)) {
            return true;
          }
          
          // Match by sub_assembly_name
          const subAssembly = it.sub_assembly_name?.toLowerCase() || '';
          if (subAssembly.includes(operationLower) ||
              (subAssembly.includes('form') && operationLower === 'forming') ||
              (subAssembly.includes('assembly') && operationLower === 'assembly') ||
              (subAssembly.includes('weld') && operationLower === 'welding') ||
              (subAssembly.includes('qc') && operationLower === 'qc') ||
              (subAssembly.includes('paint') && operationLower === 'painting')) {
            return true;
          }
          
          // For ASSEMBLY operations, include all BOUGHT_OUT items (components to assemble)
          if (operationLower === 'assembly' && it.item_type === 'BOUGHT_OUT') {
            return true;
          }
          
          return false;
        });
        
        if (matchingItems.length > 0) {
          const defaultSelection = new Set<string>(
            matchingItems.map((it: any) => String(it.bom_id ?? it.material_id))
          );
          setAvailableBomItems(matchingItems);
          setSelectedBomItemIds(defaultSelection);
          await prepareMaterialPlans(matchingItems, operationType, parentQuantity);
          return;
        }

        const fallbackItems = items.filter((it: any) => it.material_id && it.item_type !== 'CUT_PART');
        if (fallbackItems.length > 0) {
          const defaultSelection = new Set<string>(
            fallbackItems.map((it: any) => String(it.bom_id ?? it.material_id))
          );
          setAvailableBomItems(fallbackItems);
          setSelectedBomItemIds(defaultSelection);
          await prepareMaterialPlans(fallbackItems, operationType, parentQuantity);
          return;
        }
      }

    } catch (e) {
      console.error('Failed to prepare issue list', e);
      toast.error('Failed to prepare issue list');
    }
  };

  const submitIssue = async () => {
    if (!issueSelectedWO) return;
    try {
      const body: any = {
        wo_id: issueSelectedWO.wo_id,
        materials: materialPlans.map(m => ({ material_id: m.material_id, quantity: m.suggested_qty })),
        reference: `ISSUE-${issueSelectedWO.wo_no}`
      };
      const res = await fetch('/api/inventory/stock-out/bulk', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Issue failed');
      toast.success(data.message || 'Material issued');
      setShowIssueDialog(false);
    } catch (e) {
      console.error(e);
      toast.error('Failed to issue material');
    }
  };

  // Calculate material plans from selected BOM items
  const calculateMaterialPlansFromSelection = async () => {
    if (!issueSelectedWO) return;
    if (selectedBomItemIds.size === 0) {
      toast.error('Select at least one BOM item');
      return;
    }

    try {
      let parentQuantity = issueSelectedWO.quantity;
      if (issueSelectedWO.parent_wo_id) {
        const parentWO = workOrders.find(w => w.wo_id === issueSelectedWO.parent_wo_id);
        if (parentWO) {
          parentQuantity = parentWO.quantity;
        }
      }

      const selectedItems = availableBomItems.filter((it: any) => 
        selectedBomItemIds.has(String(it.bom_id ?? it.material_id))
      );

      if (selectedItems.length === 0) {
        toast.error('No BOM items selected');
        setMaterialPlans([]);
        return;
          }

      await prepareMaterialPlans(
        selectedItems,
        issueSelectedWO.operation_type || '',
        parentQuantity
      );
    } catch (e) {
      console.error('Failed to calculate material plans from selection', e);
      toast.error('Failed to calculate material plans');
    }
  };

  // Handle BOM item selection toggle
  const handleBomItemToggle = (bomId: string) => {
    const id = String(bomId);
    const newSelected = new Set<string>(selectedBomItemIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedBomItemIds(newSelected);
  };

  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/hierarchical-work-order/work-orders');
      if (response.ok) {
        const data = await response.json();
        setWorkOrders(data.workOrders || []);
        
        // Group work orders into hierarchies
        const masterWOs = data.workOrders.filter((wo: WorkOrder) => !wo.parent_wo_id);
        const hierarchies = masterWOs.map((master: WorkOrder) => ({
          master,
          children: data.workOrders.filter((wo: WorkOrder) => wo.parent_wo_id === master.wo_id)
        }));
        setHierarchies(hierarchies);
      }
    } catch (error) {
      console.error('Error fetching work orders:', error);
      toast.error('Failed to fetch work orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesOrders = async () => {
    try {
      const response = await fetch('/api/sales-orders');
      if (response.ok) {
        const data = await response.json();
        setSalesOrders(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching sales orders:', error);
      toast.error('Failed to fetch sales orders');
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      const response = await fetch('/api/purchase-orders?limit=100');
      if (response.ok) {
        const data = await response.json();
        setPurchaseOrders(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
    }
  };

  const fetchSalesOrderDetails = async (orderNumber: string) => {
    try {
      const response = await fetch(`/api/sales-orders/number/${orderNumber}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.items) {
          setSalesOrderItems(data.data.items);
          return data.data;
        }
      }
    } catch (error) {
      console.error('Error fetching sales order details:', error);
      toast.error('Failed to fetch sales order details');
    }
    return null;
  };

  const fetchBOMData = async (productId: string) => {
    try {
      // Use the endpoint that includes blank specs to identify cut parts
      const response = await fetch(`/api/bom/${productId}/sub-assemblies?includeBlankSpecs=true`);
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          // The response has structure: { bom: [...], blankSpecs: [...] }
          // We need to merge BOM items with blank specs to identify cut parts
          const bomItems = data.data.bom || data.data || [];
          const blankSpecs = data.data.blankSpecs || [];
          
          // Enrich BOM items with blank spec info to identify cut parts
          const enrichedBom = bomItems.map((item: any) => {
            // Check if this BOM item is a cut part by:
            // 1. Checking if item_type is 'CUT_PART' and has reference_id
            // 2. Or matching by sub_assembly_name with blank specs (most common case)
            let blankSpec = null;
            
            // First try: match by reference_id if item_type is CUT_PART
            if (item.item_type === 'CUT_PART' && item.reference_id) {
              blankSpec = blankSpecs.find((bs: any) => bs.blank_id === item.reference_id);
            }
            
            // Second try: match by sub_assembly_name (this is the most reliable method)
            if (!blankSpec && item.sub_assembly_name) {
              blankSpec = blankSpecs.find((bs: any) => 
                bs.product_id === productId && 
                bs.sub_assembly_name === item.sub_assembly_name
              );
            }
            
            // If we found a blank spec, it's definitely a cut part
            const isCutPart = !!blankSpec || item.item_type === 'CUT_PART';
            
            return {
              ...item,
              is_cut_part: isCutPart,
              pcs_per_sheet: blankSpec?.pcs_per_sheet || item.pcs_per_sheet || 8,
              item_type: isCutPart ? 'CUT_PART' : (item.item_type || 'BOUGHT_OUT'),
              item_name: item.item_name || item.material_name || 'Unknown'
            };
          });
          
          console.log('Enriched BOM data:', enrichedBom);
          console.log('Blank specs available:', blankSpecs);
          console.log('Cut parts found:', enrichedBom.filter(item => item.is_cut_part));
          
          setBomData(enrichedBom);
          return enrichedBom;
        }
      }
    } catch (error) {
      console.error('Error fetching BOM data:', error);
      toast.error('Failed to fetch BOM data');
    }
    return [];
  };

  const fetchProcessFlow = async (productId: string) => {
    try {
      const res = await fetch(`/api/process-flows/product/${productId}`);
      const data = await res.json();
      const raw = Array.isArray(data) ? data
        : Array.isArray(data?.data) ? data.data
        : Array.isArray(data?.steps) ? data.steps
        : Array.isArray(data?.data?.steps) ? data.data.steps
        : Array.isArray(data?.data?.primary_flow) ? data.data.primary_flow
        : [];
      const steps = raw.map((r: any) => ({
        step_no: Number(r.step_no ?? r.sequence ?? r.step ?? 0) || 0,
        operation: String(r.operation ?? r.operation_type ?? r.name ?? '').trim(),
      })).filter(r => r.operation).sort((a: any, b: any) => a.step_no - b.step_no);
      setProcessFlowSteps(steps);
    } catch (e) {
      console.error('Failed to load process flow', e);
      setProcessFlowSteps([]);
    }
  };

  const calculateOperationQuantity = (operationType: string, parentQuantity: number) => {
    if (!bomData || bomData.length === 0) {
      return {
        blanksQuantity: parentQuantity,
        sheetsRequired: Math.ceil(parentQuantity / 8), // Default 8 blanks per sheet
        blanksPerSheet: 8
      };
    }

    // Find BOM items that match the operation type
    const operationItems = bomData.filter((item: any) => {
      if (operationType.toLowerCase() === 'cutting') {
        // For CUTTING, only include items that are cut parts (have blank specs)
        const isCutPart = item.is_cut_part === true || item.item_type === 'CUT_PART';
        console.log('Checking item for CUTTING:', {
          item_name: item.item_name || item.material_name,
          sub_assembly: item.sub_assembly_name,
          is_cut_part: item.is_cut_part,
          item_type: item.item_type,
          matches: isCutPart
        });
        return isCutPart;
    } else {
      // For other operations, match by:
      // 1. operation_code (if available)
      // 2. sub_assembly_name
      // 3. item_type (for bought-out items in assembly operations)
      const operationLower = operationType.toLowerCase();
      const subAssembly = item.sub_assembly_name?.toLowerCase() || '';
      const operationCode = item.operation_code?.toLowerCase() || '';
      
      // Check if operation_code matches
      if (operationCode && operationCode.includes(operationLower)) {
        return true;
      }
      
      // Check if sub_assembly_name matches
      if (subAssembly.includes(operationLower) || 
          (subAssembly.includes('form') && operationLower === 'forming') ||
          (subAssembly.includes('assembly') && operationLower === 'assembly') ||
          (subAssembly.includes('weld') && operationLower === 'welding') ||
          (subAssembly.includes('qc') && operationLower === 'qc') ||
          (subAssembly.includes('paint') && operationLower === 'painting')) {
        return true;
      }
      
      // For ASSEMBLY operations, include all BOUGHT_OUT items (components to assemble)
      if (operationLower === 'assembly' && item.item_type === 'BOUGHT_OUT') {
        return true;
      }
      
      // For other operations, exclude CUT_PART items (those are for CUTTING only)
      if (item.item_type === 'CUT_PART') {
        return false;
      }
      
      return false;
    }
    });

    if (operationItems.length === 0) {
      return {
        blanksQuantity: parentQuantity,
        sheetsRequired: Math.ceil(parentQuantity / 8),
        blanksPerSheet: 8
      };
    }

    // For CUTTING operations: sum all cut parts quantities
    // Each cut part has a quantity per unit, so we need to sum: (qty1 × parentQty) + (qty2 × parentQty) + ...
    // For other operations: use the parent quantity (each operation processes the same number of units)
    let blanksQuantity = parentQuantity;
    
    if (operationType.toLowerCase() === 'cutting') {
      // Sum all cut parts: each BOM item quantity × parent quantity
      const totalBlanks = operationItems.reduce((sum: number, item: any) => {
        const qtyPerUnit = item.quantity || 1;
        return sum + (qtyPerUnit * parentQuantity);
      }, 0);
      blanksQuantity = totalBlanks;
    } else {
      // For non-cutting operations (FORMING, ASSEMBLY, WELDING, etc.):
      // The quantity should be the parent quantity (number of units to process)
      // Each operation processes the same number of finished products
      // Individual material quantities are calculated separately when issuing materials
      blanksQuantity = parentQuantity;
    }
    
    // For cutting operations, calculate sheets required from all cut parts
    let blanksPerSheet = 8; // Default
    let sheetsRequired = Math.ceil(blanksQuantity / blanksPerSheet);
    let cutPartsBreakdown: Array<{
      item_name: string;
      sub_assembly: string;
      qty_per_unit: number;
      total_blanks: number;
      pcs_per_sheet: number;
      sheets_required: number;
    }> = [];
    
    console.log('Operation items for', operationType, ':', operationItems.length, operationItems);
    
    if (operationType.toLowerCase() === 'cutting' && operationItems.length > 0) {
      // For cutting, we need to calculate sheets based on the cut parts
      // Each cut part may have different pcs_per_sheet, so we calculate sheets for each and sum
      let totalSheets = 0;
      let avgBlanksPerSheet = 0;
      
      operationItems.forEach((item: any) => {
        console.log('Processing cut part:', {
          item_name: item.item_name || item.material_name,
          quantity: item.quantity,
          pcs_per_sheet: item.pcs_per_sheet
        });
        const qtyPerUnit = item.quantity || 1;
        const blanksForThisPart = qtyPerUnit * parentQuantity;
        const pcsPerSheet = item.pcs_per_sheet || 8;
        const sheetsForThisPart = Math.ceil(blanksForThisPart / pcsPerSheet);
        totalSheets += sheetsForThisPart;
        avgBlanksPerSheet += pcsPerSheet;
        
        // Add to breakdown
        cutPartsBreakdown.push({
          item_name: item.item_name || item.material_name || 'Unknown',
          sub_assembly: item.sub_assembly_name || '',
          qty_per_unit: qtyPerUnit,
          total_blanks: blanksForThisPart,
          pcs_per_sheet: pcsPerSheet,
          sheets_required: sheetsForThisPart
        });
      });
      
      if (totalSheets > 0) {
        sheetsRequired = totalSheets;
        blanksPerSheet = Math.round(avgBlanksPerSheet / operationItems.length);
      } else {
        // Fallback: use first item's pcs_per_sheet if available
        const firstCutItem = operationItems.find((item: any) => item.pcs_per_sheet);
        if (firstCutItem && firstCutItem.pcs_per_sheet) {
          blanksPerSheet = firstCutItem.pcs_per_sheet;
          sheetsRequired = Math.ceil(blanksQuantity / blanksPerSheet);
        }
      }
    } else {
      // For non-cutting operations, create a breakdown of parts
      operationItems.forEach((item: any) => {
        const qtyPerUnit = item.quantity || 1;
        const totalQty = qtyPerUnit * parentQuantity;
        
        cutPartsBreakdown.push({
          item_name: item.item_name || item.material_name || 'Unknown',
          sub_assembly: item.sub_assembly_name || '',
          qty_per_unit: qtyPerUnit,
          total_blanks: totalQty,
          pcs_per_sheet: 0, // Not applicable for non-cutting
          sheets_required: 0 // Not applicable for non-cutting
        });
      });
    }

    return {
      blanksQuantity,
      sheetsRequired,
      blanksPerSheet,
      cutPartsBreakdown
    };
  };

  const createWorkOrder = async () => {
    try {
      // Validate required fields
      if (!formData.product_id) {
        toast.error('Please select a product');
        return;
      }
      if (!formData.quantity || formData.quantity <= 0) {
        toast.error('Please enter a valid quantity');
        return;
      }
      
      // Create MWO directly using hierarchical work order generation
      const workOrderData = {
        productId: formData.product_id,
        quantity: formData.quantity,
        startDate: formData.scheduled_start,
        dueDate: formData.scheduled_end,
        createdBy: 'system',
        customer: formData.customer,
        sales_order_ref: formData.sales_order_ref === 'none' ? null : formData.sales_order_ref,
        purchase_order_ref: formData.purchase_order_ref === 'none' ? null : formData.purchase_order_ref
      };
      
      console.log('🚀 Creating Master Work Order (MWO) with data:', workOrderData);
      console.log('📋 Form data:', formData);
      console.log('🔍 Product ID check:', formData.product_id);
      console.log('🔍 Quantity check:', formData.quantity);
      
      const response = await fetch('/api/hierarchical-work-order/hierarchical', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workOrderData),
      });

      console.log('📡 MWO creation response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Master Work Order (MWO) created successfully:', data);
        toast.success(`Master Work Order created with ${data.data.total_work_orders} work orders`);
        setShowCreateDialog(false);
        fetchWorkOrders();
      } else {
        const errorData = await response.text();
        console.error('❌ Failed to create Master Work Order:', errorData);
        throw new Error('Failed to create Master Work Order');
      }
    } catch (error) {
      console.error('Error creating Master Work Order:', error);
      toast.error('Failed to create Master Work Order');
    }
  };

  const generateHierarchicalWorkOrders = async (workOrderData: any) => {
    try {
      console.log('🚀 Calling hierarchical work order generation with data:', {
        productId: workOrderData.product_id,
        quantity: workOrderData.quantity,
        dueDate: workOrderData.scheduled_end,
        createdBy: workOrderData.createdBy || 'system'
      });
      
      const response = await fetch('/api/hierarchical-work-order/hierarchical', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: workOrderData.product_id,
          quantity: workOrderData.quantity,
          dueDate: workOrderData.scheduled_end,
          createdBy: workOrderData.createdBy || 'system'
        }),
      });

      console.log('📡 Hierarchical generation response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Hierarchical work orders generated successfully:', data);
        toast.success('Hierarchical work orders generated successfully');
        fetchWorkOrders();
      } else {
        const errorData = await response.text();
        console.error('❌ Failed to generate hierarchical work orders:', errorData);
        throw new Error('Failed to generate hierarchical work orders');
      }
    } catch (error) {
      console.error('Error generating hierarchical work orders:', error);
      toast.error('Failed to generate hierarchical work orders');
    }
  };

  const createChildWorkOrder = async () => {
    if (!selectedParentWO) {
      toast.error('No parent work order selected');
      return;
    }

    try {
      const childWorkOrderData = {
        product_id: selectedParentWO.product_id,
        quantity: childFormData.quantity,
        operation_type: childFormData.operation_type,
        priority: childFormData.priority === 'High' ? 1 : childFormData.priority === 'Medium' ? 2 : 3,
        scheduled_start: childFormData.scheduled_start,
        scheduled_end: childFormData.scheduled_end,
        parent_wo_id: selectedParentWO.wo_id,
        customer: selectedParentWO.customer,
        sales_order_ref: selectedParentWO.sales_order_ref,
        createdBy: 'system',
        notes: childFormData.notes
      };

      console.log('🚀 Creating child work order with data:', childWorkOrderData);

      const response = await fetch('/api/hierarchical-work-order/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(childWorkOrderData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Child work order created successfully:', data);
        toast.success('Child work order created successfully');
        setShowCreateChildDialog(false);
        setSelectedParentWO(null);
        fetchWorkOrders();
      } else {
        const errorData = await response.text();
        console.error('❌ Failed to create child work order:', errorData);
        throw new Error('Failed to create child work order');
      }
    } catch (error) {
      console.error('Error creating child work order:', error);
      toast.error('Failed to create child work order');
    }
  };

  const updateWorkOrderStatus = async (woId: string, status: string) => {
    try {
      const response = await fetch(`/api/hierarchical-work-order/${woId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Work order status updated');
        
        // Show notification if product was moved to QA
        if (data.qaTransfer && data.qaTransfer.success) {
          toast.success(`✅ Product moved to QA section`);
        }
        
        fetchWorkOrders();
      } else {
        const errorMessage = data?.error || data?.message || `HTTP ${response.status}: ${response.statusText}`;
        console.error('Error updating status:', errorMessage, data);
        toast.error(`Failed to update status: ${errorMessage}`);
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      const errorMessage = error?.message || 'Network error or server unavailable';
      toast.error(`Failed to update work order status: ${errorMessage}`);
    }
  };

  const deleteWorkOrder = async (woId: string, woNo: string, isParent: boolean = false) => {
    const confirmMessage = isParent 
      ? `Are you sure you want to delete parent work order ${woNo}?\n\n⚠️ This will also delete ALL child work orders associated with it.`
      : `Are you sure you want to delete child work order ${woNo}?\n\nThis will delete only this child work order. The parent work order will remain.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch(`/api/hierarchical-work-order/${woId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Work order deleted successfully');
        fetchWorkOrders();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete work order');
      }
    } catch (error: any) {
      console.error('Error deleting work order:', error);
      toast.error(error.message || 'Failed to delete work order');
    }
  };

  const canStartOperation = (operation: any, allOperations: any[]) => {
    // If materials have been issued, operation can start
    // (materials_issued flag indicates material has been issued)
    if (operation.materials_issued) {
      return true;
    }

    // Define operation dependencies
    const dependencies: { [key: string]: string[] } = {
      'FORMING': ['CUTTING'],
      'ASSEMBLY': ['FORMING', 'CUTTING'], // Can assemble after forming OR cutting
      'WELDING': ['CUTTING'], // Welding can start after cutting (no forming required)
      'PAINTING': ['WELDING', 'ASSEMBLY'],
      'PACKAGING': ['PAINTING', 'QC'],
      'QC': ['ASSEMBLY', 'WELDING'] // QC after assembly or welding
    };

    const requiredOperations = dependencies[operation.operation_type] || [];
    
    // If no dependencies required, can start immediately
    if (requiredOperations.length === 0) {
      return true;
    }
    
    // Check if all required operations are completed OR at least one exists
    // This allows flexible workflows where some operations may not be present
    const completedOperations = requiredOperations.filter(requiredOp => 
      allOperations.some(op => 
        op.operation_type === requiredOp && op.status === 'COMPLETED'
      )
    );
    
    // Can start if:
    // 1. All required operations are completed, OR
    // 2. At least half of required operations are completed (flexible workflow)
    return completedOperations.length === requiredOperations.length || 
           completedOperations.length >= Math.ceil(requiredOperations.length / 2);
  };

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'PLANNED': return 0;
      case 'IN_PROGRESS': return 50;
      case 'COMPLETED': return 100;
      default: return 0;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'IN_PROGRESS':
        return <Play className="w-4 h-4 text-blue-600" />;
      case 'PLANNED':
        return <Clock className="w-4 h-4 text-gray-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      'COMPLETED': 'default',
      'IN_PROGRESS': 'secondary',
      'PLANNED': 'outline',
      'CANCELLED': 'destructive',
    };
    return (
      <Badge variant={variants[status] || 'outline'} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      'High': 'destructive',
      'Medium': 'default',
      'Low': 'secondary',
    };
    return <Badge variant={colors[priority] || 'outline'}>{priority}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Master Work Order Management</h1>
          <p className="text-muted-foreground">Create Master Work Orders with automatic hierarchical structure</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Master Work Order (MWO)
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Work Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product">Product *</Label>
                <Select value={formData.product_id} onValueChange={(value) => setFormData({...formData, product_id: value})}>
                  <SelectTrigger className={formData.sales_order_ref !== 'none' && formData.product_id ? "border-green-500 bg-green-50" : ""}>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.product_id} value={product.product_id}>
                        {product.product_code} - {product.part_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.sales_order_ref !== 'none' && formData.product_id && (
                  <p className="text-xs text-green-600">✓ Auto-selected from sales order</p>
                )}
                {!formData.product_id && (
                  <p className="text-sm text-red-500">Please select a product</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <div className="relative">
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})}
                  min="1"
                    className={formData.sales_order_ref !== 'none' ? "border-green-500 bg-green-50" : ""}
                  />
                  {formData.sales_order_ref !== 'none' && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                        Auto-filled
                      </Badge>
                    </div>
                  )}
                </div>
                {formData.sales_order_ref !== 'none' && (
                  <p className="text-xs text-green-600">✓ Auto-filled from sales order</p>
                )}
                {(!formData.quantity || formData.quantity <= 0) && (
                  <p className="text-sm text-red-500">Please enter a valid quantity</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sales_order">Sales Order (Optional)</Label>
                <Select 
                  value={formData.sales_order_ref} 
                  onValueChange={async (value) => {
                    if (value === 'none') {
                      setFormData({
                        ...formData, 
                        sales_order_ref: 'none',
                        customer: 'Test Customer',
                        product_id: '',
                        quantity: 500
                      });
                      setSalesOrderItems([]);
                    } else {
                    const selectedSO = salesOrders.find(so => so.order_number === value);
                      const salesOrderDetails = await fetchSalesOrderDetails(value);
                      
                      // Find the first production item from the sales order
                      let selectedProduct = '';
                      let selectedQuantity = 500;
                      
                      if (salesOrderDetails && salesOrderDetails.items) {
                        const productionItems = salesOrderDetails.items.filter((item: any) => item.production_required);
                        if (productionItems.length > 0) {
                          const firstItem = productionItems[0];
                          // Find matching product by item_code or use product_id if available
                          let matchingProduct = null;
                          if (firstItem.product_id) {
                            matchingProduct = products.find(p => p.product_id === firstItem.product_id);
                          } else {
                            matchingProduct = products.find(p => p.product_code === firstItem.item_code);
                          }
                          
                          if (matchingProduct) {
                            selectedProduct = matchingProduct.product_id;
                            selectedQuantity = parseInt(firstItem.quantity);
                          }
                        }
                      }
                      
                    setFormData({
                      ...formData, 
                      sales_order_ref: value,
                        customer: selectedSO ? selectedSO.customer_name : formData.customer,
                        product_id: selectedProduct,
                        quantity: selectedQuantity
                    });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sales order (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Sales Order</SelectItem>
                    {salesOrders.map((so) => (
                      <SelectItem key={so.sales_order_id} value={so.order_number}>
                        <div className="flex flex-col">
                          <span className="font-medium">{so.order_number}</span>
                          <span className="text-xs text-gray-500">{so.customer_name} - {so.status}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchase_order_ref">Purchase Order (Optional)</Label>
                <Select 
                  value={formData.purchase_order_ref} 
                  onValueChange={(value) => setFormData({...formData, purchase_order_ref: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select purchase order (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Purchase Order</SelectItem>
                    {purchaseOrders.map((po) => (
                      <SelectItem key={po.po_id} value={po.po_number || po.po_no}>
                        <div className="flex flex-col">
                          <span className="font-medium">{po.po_number || po.po_no}</span>
                          <span className="text-xs text-gray-500">{po.supplier_name || po.supplier} - {po.status}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer">Customer</Label>
                <div className="relative">
                <Input
                  id="customer"
                  value={formData.customer}
                  onChange={(e) => setFormData({...formData, customer: e.target.value})}
                  placeholder="Customer name (auto-filled if sales order selected)"
                    className={formData.sales_order_ref !== 'none' ? "border-green-500 bg-green-50" : ""}
                  />
                  {formData.sales_order_ref !== 'none' && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                        Auto-filled
                      </Badge>
                    </div>
                  )}
                </div>
                {formData.sales_order_ref !== 'none' && (
                  <p className="text-xs text-green-600">✓ Auto-filled from sales order</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduled_start">Start Date</Label>
                  <Input
                    id="scheduled_start"
                    type="date"
                    value={formData.scheduled_start}
                    onChange={(e) => setFormData({...formData, scheduled_start: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduled_end">End Date</Label>
                  <Input
                    id="scheduled_end"
                    type="date"
                    value={formData.scheduled_end}
                    onChange={(e) => setFormData({...formData, scheduled_end: e.target.value})}
                  />
                </div>
              </div>

              <Button 
                onClick={createWorkOrder} 
                className="w-full"
                disabled={!formData.product_id || !formData.quantity || formData.quantity <= 0}
              >
                <Wrench className="w-4 h-4 mr-2" />
                Create Master Work Order (MWO)
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Child Work Order Dialog */}
        <Dialog open={showCreateChildDialog} onOpenChange={setShowCreateChildDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Child Work Order</DialogTitle>
              <DialogDescription>
                Create a child work order for: {selectedParentWO?.wo_no}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="operation_type">Operation Type</Label>
                <Select 
                  value={childFormData.operation_type} 
                  onValueChange={(value) => {
                    if (selectedParentWO?.quantity) {
                      const calculation = calculateOperationQuantity(value, selectedParentWO.quantity);
                      setChildFormData({
                        ...childFormData, 
                        operation_type: value,
                        quantity: calculation.blanksQuantity,
                        sheets_required: calculation.sheetsRequired,
                        blanks_per_sheet: calculation.blanksPerSheet,
                        cutPartsBreakdown: calculation.cutPartsBreakdown || []
                      });
                    } else {
                      setChildFormData({
                        ...childFormData, 
                        operation_type: value
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {processFlowSteps.length > 0 ? (
                      processFlowSteps.map(step => (
                        <SelectItem key={`${step.step_no}-${step.operation}`} value={step.operation}>
                          {step.operation}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                    <SelectItem value="CUTTING">CUTTING</SelectItem>
                    <SelectItem value="FORMING">FORMING</SelectItem>
                    <SelectItem value="ASSEMBLY">ASSEMBLY</SelectItem>
                    <SelectItem value="QC">QC</SelectItem>
                    <SelectItem value="WELDING">WELDING</SelectItem>
                    <SelectItem value="PAINTING">PAINTING</SelectItem>
                    <SelectItem value="PACKAGING">PACKAGING</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <div className="relative">
                <Input
                  id="quantity"
                  type="number"
                  value={childFormData.quantity}
                  onChange={(e) => setChildFormData({...childFormData, quantity: Number(e.target.value)})}
                  min="1"
                    className="border-green-500 bg-green-50"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                      Auto-calculated
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-green-600">
                    ✓ {childFormData.quantity} {childFormData.operation_type === 'CUTTING' ? 'blanks' : 'units'} calculated from BOM × Sales Order
                  </p>
                  {childFormData.cutPartsBreakdown.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {childFormData.cutPartsBreakdown.map((part, idx) => (
                        <div key={idx} className="text-xs bg-blue-50 p-2 rounded border border-blue-200">
                          <p className="font-medium text-blue-900">
                            {part.item_name} ({part.sub_assembly})
                          </p>
                          {childFormData.operation_type === 'CUTTING' ? (
                            <>
                              <p className="text-blue-700">
                                • Qty/Unit: {part.qty_per_unit} × {selectedParentWO?.quantity || 0} = {part.total_blanks} blanks
                              </p>
                              <p className="text-blue-700">
                                • {part.sheets_required} sheets required ({part.pcs_per_sheet} blanks per sheet)
                              </p>
                            </>
                          ) : (
                            <p className="text-blue-700">
                              • Qty/Unit: {part.qty_per_unit} × {selectedParentWO?.quantity || 0} = {part.total_blanks} {childFormData.operation_type === 'ASSEMBLY' ? 'pieces' : 'units'}
                            </p>
                          )}
                        </div>
                      ))}
                      {childFormData.operation_type === 'CUTTING' && (
                        <p className="text-xs text-blue-600 mt-1">
                          ✓ Total: {childFormData.sheets_required} sheets required
                        </p>
                      )}
                    </div>
                  )}
                  {childFormData.operation_type === 'CUTTING' && childFormData.cutPartsBreakdown.length === 0 && (
                    <p className="text-xs text-blue-600">
                      ✓ {childFormData.sheets_required} sheets required ({childFormData.blanks_per_sheet} blanks per sheet)
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={childFormData.priority} 
                  onValueChange={(value) => setChildFormData({...childFormData, priority: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduled_start">Start Date</Label>
                  <Input
                    id="scheduled_start"
                    type="date"
                    value={childFormData.scheduled_start}
                    onChange={(e) => setChildFormData({...childFormData, scheduled_start: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduled_end">End Date</Label>
                  <Input
                    id="scheduled_end"
                    type="date"
                    value={childFormData.scheduled_end}
                    onChange={(e) => setChildFormData({...childFormData, scheduled_end: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  value={childFormData.notes}
                  onChange={(e) => setChildFormData({...childFormData, notes: e.target.value})}
                  placeholder="Additional notes for this work order"
                />
              </div>

              <Button onClick={createChildWorkOrder} className="w-full">
                <Wrench className="w-4 h-4 mr-2" />
                Create Child Work Order
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Work Order Summary Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Work Orders</p>
                <p className="text-2xl font-bold">{workOrders.length}</p>
              </div>
              <Wrench className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">
                  {workOrders.filter(wo => wo.status === 'IN_PROGRESS').length}
                </p>
              </div>
              <Play className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {workOrders.filter(wo => wo.status === 'COMPLETED').length}
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
                <p className="text-sm font-medium text-muted-foreground">Planned</p>
                <p className="text-2xl font-bold text-gray-600">
                  {workOrders.filter(wo => wo.status === 'PLANNED').length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="hierarchy" className="space-y-6">
        <TabsList>
          <TabsTrigger value="hierarchy">Hierarchy View</TabsTrigger>
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="hierarchy" className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : hierarchies.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Network className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No work orders found. Create your first work order to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {hierarchies.map((hierarchy) => (
                <Card key={hierarchy.master.wo_id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Network className="w-5 h-5" />
                          {hierarchy.master.wo_no}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {hierarchy.master.product_name || 'Product Not Found'} - {hierarchy.master.quantity} units
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(hierarchy.master.status)}
                        {getPriorityBadge(hierarchy.master.priority)}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedParentWO(hierarchy.master);
                            setShowCreateChildDialog(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Child WO
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteWorkOrder(hierarchy.master.wo_id, hierarchy.master.wo_no, true)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="font-medium">Customer</p>
                          <p className="text-muted-foreground">{hierarchy.master.customer || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="font-medium">Sales Order</p>
                          <p className="text-muted-foreground">{hierarchy.master.sales_order_ref || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="font-medium">Purchase Order</p>
                          <p className="text-muted-foreground">{hierarchy.master.purchase_order_ref || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="font-medium">Start Date</p>
                          <p className="text-muted-foreground">
                            {hierarchy.master.scheduled_start ? new Date(hierarchy.master.scheduled_start).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">End Date</p>
                          <p className="text-muted-foreground">
                            {hierarchy.master.scheduled_end ? new Date(hierarchy.master.scheduled_end).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>

                      {hierarchy.children.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-3">Child Work Orders ({hierarchy.children.length})</h4>
                          <div className="grid gap-2">
                            {hierarchy.children.map((child) => (
                              <div key={child.wo_id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                <div className="flex items-center gap-3">
                                  {getStatusIcon(child.status)}
                                  <div>
                                    <p className="font-medium">{child.wo_no}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {child.operation_type} - {child.quantity} units
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <div className="w-20 bg-gray-200 rounded-full h-2">
                                        <div 
                                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                          style={{ 
                                            width: `${getProgressPercentage(child.status)}%` 
                                          }}
                                        ></div>
                                      </div>
                                      <span className="text-xs text-muted-foreground">
                                        {getProgressPercentage(child.status)}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {getStatusBadge(child.status)}
                                  {child.status === 'PLANNED' && (
                                    <div className="flex items-center gap-2">
                                      {!canStartOperation(child, hierarchy.children) && (
                                        <div className="flex items-center gap-1 text-xs text-orange-600">
                                          <AlertCircle className="w-3 h-3" />
                                          <span>Dependencies</span>
                                        </div>
                                      )}
                                      <Button
                                        size="sm"
                                        onClick={() => updateWorkOrderStatus(child.wo_id, 'IN_PROGRESS')}
                                        disabled={!canStartOperation(child, hierarchy.children)}
                                      >
                                        <Play className="w-3 h-3 mr-1" />
                                        Start
                                      </Button>
                                    </div>
                                  )}
                                  {child.status === 'IN_PROGRESS' && (
                                    <Button
                                      size="sm"
                                      onClick={() => updateWorkOrderStatus(child.wo_id, 'COMPLETED')}
                                    >
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Complete
                                    </Button>
                                  )}
                                  <Button size="sm" variant="outline" onClick={() => openIssueMaterial(child)}>
                                    <Boxes className="w-3 h-3 mr-1" />
                                    Issue
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : hierarchies.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Network className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No work orders found. Create your first work order to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {hierarchies.map((hierarchy) => (
                <Card key={hierarchy.master.wo_id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="w-5 h-5" />
                      {hierarchy.master.wo_no} - Timeline
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {hierarchy.master.product_name || 'Product Not Found'} - {hierarchy.master.quantity} units
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                      
                      {/* Timeline items */}
                      <div className="space-y-4">
                        {/* Master Work Order */}
                        <div className="relative flex items-start gap-4">
                          <div className="relative z-10 flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full">
                            <Wrench className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 bg-blue-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-blue-900">{hierarchy.master.wo_no}</h4>
                                <p className="text-sm text-blue-700">Master Work Order</p>
                              </div>
                              {getStatusBadge(hierarchy.master.status)}
                            </div>
                            <p className="text-sm text-blue-600 mt-1">
                              {hierarchy.master.customer} • {hierarchy.master.sales_order_ref}
                            </p>
                          </div>
                        </div>

                        {/* Child Work Orders */}
                        {hierarchy.children.map((child, index) => (
                          <div key={child.wo_id} className="relative flex items-start gap-4">
                            <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${
                              child.status === 'COMPLETED' ? 'bg-green-600' : 
                              child.status === 'IN_PROGRESS' ? 'bg-blue-600' : 'bg-gray-400'
                            }`}>
                              {getStatusIcon(child.status)}
                            </div>
                            <div className={`flex-1 p-4 rounded-lg ${
                              child.status === 'COMPLETED' ? 'bg-green-50' : 
                              child.status === 'IN_PROGRESS' ? 'bg-blue-50' : 'bg-gray-50'
                            }`}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium">{child.wo_no}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {child.operation_type} • {child.quantity} units
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {getStatusBadge(child.status)}
                                  {child.status === 'PLANNED' && (
                                    <Button
                                      size="sm"
                                      onClick={() => updateWorkOrderStatus(child.wo_id, 'IN_PROGRESS')}
                                      disabled={!canStartOperation(child, hierarchy.children)}
                                    >
                                      <Play className="w-3 h-3 mr-1" />
                                      Start
                                    </Button>
                                  )}
                                  {child.status === 'IN_PROGRESS' && (
                                    <Button
                                      size="sm"
                                      onClick={() => updateWorkOrderStatus(child.wo_id, 'COMPLETED')}
                                    >
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Complete
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openIssueMaterial(child)}
                                  >
                                    <Boxes className="w-3 h-3 mr-1" />
                                    Issue
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => deleteWorkOrder(child.wo_id, child.wo_no, false)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-3 h-3 mr-1" />
                                    Delete
                                  </Button>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <div className="w-32 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                    style={{ 
                                      width: `${getProgressPercentage(child.status)}%` 
                                    }}
                                  ></div>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {getProgressPercentage(child.status)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="list" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Work Orders</CardTitle>
                <Button 
                  variant="outline" 
                  onClick={() => setShowExportModal(true)} 
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>WO No</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Operation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workOrders.map((wo) => (
                    <TableRow key={wo.wo_id}>
                      <TableCell className="font-medium">{wo.wo_no}</TableCell>
                      <TableCell>{wo.product_name}</TableCell>
                      <TableCell>{wo.quantity}</TableCell>
                      <TableCell>{wo.operation_type || 'Assembly'}</TableCell>
                      <TableCell>{getStatusBadge(wo.status)}</TableCell>
                      <TableCell>{getPriorityBadge(wo.priority)}</TableCell>
                      <TableCell>{new Date(wo.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {wo.status === 'PLANNED' && (
                            <Button
                              size="sm"
                              onClick={() => updateWorkOrderStatus(wo.wo_id, 'IN_PROGRESS')}
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Start
                            </Button>
                          )}
                          {wo.status === 'IN_PROGRESS' && (
                            <Button
                              size="sm"
                              onClick={() => updateWorkOrderStatus(wo.wo_id, 'COMPLETED')}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Complete
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteWorkOrder(wo.wo_id, wo.wo_no, !wo.parent_wo_id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Dialog open={showIssueDialog} onOpenChange={(open) => {
        setShowIssueDialog(open);
        if (!open) {
          // Reset state when dialog closes
          setAvailableBomItems([]);
          setSelectedBomItemIds(new Set<string>());
          setMaterialPlans([]);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Issue Material {issueSelectedWO ? `for ${issueSelectedWO.wo_no}` : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* BOM Item Selection */}
            {availableBomItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Select BOM Items Required for This Operation</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select which materials are needed for this{' '}
                    {issueSelectedWO?.operation_type
                      ? `${issueSelectedWO.operation_type.toLowerCase()} operation`
                      : 'operation'}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {availableBomItems.map((item: any) => {
                      const itemId = String(item.bom_id ?? item.material_id);
                      const isSelected = selectedBomItemIds.has(itemId);
                      return (
                        <div 
                          key={itemId} 
                          className="flex items-center space-x-3 p-2 rounded border hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleBomItemToggle(itemId)}
                        >
                          <Checkbox 
                            checked={isSelected}
                            onCheckedChange={() => handleBomItemToggle(itemId)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{item.item_name || item.material_name || 'Unknown'}</span>
                              <Badge variant="outline" className="text-xs">
                                {item.item_type || 'N/A'}
                              </Badge>
                              {item.sub_assembly_name && (
                                <Badge variant="secondary" className="text-xs">
                                  {item.sub_assembly_name}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Qty/Unit: {item.quantity || 1} {item.uom_code || 'unit'}
                              {item.item_type === 'CUT_PART' && item.pcs_per_sheet && (
                                <span className="ml-2">• {item.pcs_per_sheet} pcs/sheet</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button 
                      onClick={calculateMaterialPlansFromSelection}
                      disabled={selectedBomItemIds.size === 0}
                    >
                      Calculate Material Requirements
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <Card>
              <CardHeader><CardTitle className="text-base">Materials</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>UOM</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materialPlans.map(mp => (
                      <TableRow key={mp.material_id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {mp.has_shortage && (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className={mp.has_shortage ? 'text-red-600 font-medium' : ''}>
                              {mp.material_name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className={mp.has_shortage ? 'text-red-600 font-medium' : ''}>
                              {mp.suggested_qty}
                            </span>
                            {mp.available_qty !== undefined && (
                              <span className={`text-xs ${mp.has_shortage ? 'text-red-500' : 'text-gray-500'}`}>
                                Available: {mp.available_qty}
                                {mp.has_shortage && (
                                  <span className="ml-1">(Shortage: {mp.suggested_qty - mp.available_qty})</span>
                                )}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{mp.uom || 'unit'}</TableCell>
                      </TableRow>
                    ))}
                    {materialPlans.length === 0 && (
                      <TableRow><TableCell colSpan={3} className="text-muted-foreground">No materials</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          {materialPlans.some(mp => mp.has_shortage) && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-1">⚠️ Insufficient Inventory</div>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {materialPlans.filter(mp => mp.has_shortage).map(mp => (
                    <li key={mp.material_id}>
                      <strong>{mp.material_name}</strong>: Required {mp.suggested_qty} {mp.uom || 'unit'}, 
                      but only {mp.available_qty || 0} {mp.uom || 'unit'} available
                      {mp.available_qty !== undefined && (
                        <span> (Shortage: {mp.suggested_qty - mp.available_qty} {mp.uom || 'unit'})</span>
                      )}
                    </li>
                  ))}
                </ul>
                <p className="text-sm mt-2">Please ensure sufficient inventory before issuing materials.</p>
              </AlertDescription>
            </Alert>
          )}
          <div className="flex justify-end">
            <Button 
              onClick={submitIssue} 
              disabled={!issueSelectedWO || materialPlans.some(mp => mp.has_shortage) || materialPlans.length === 0}
            >
              Issue Material
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {showExportModal && (
        <GenericExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onSuccess={() => setShowExportModal(false)}
          title="Work Orders"
          exportFunction={workOrderApi.exportWorkOrders}
          filename="work-orders"
          availableFormats={['pdf', 'csv']}
        />
      )}
    </div>
  );
}
