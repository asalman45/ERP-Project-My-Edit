export interface OEM {
  id: string;
  name: string;
  createdAt: string;
}

export interface Model {
  id: string;
  name: string;
  year?: string;
  oemId: string;
  oemName: string;
  createdAt: string;
}

export interface UOM {
  id: string;
  code: string;
  name: string;
  createdAt: string;
}

export type ProductCategory = "RAW_MATERIAL" | "SEMI_FINISHED" | "FINISHED_GOOD";

export interface Product {
  id: string;
  code: string;
  partName: string;
  oemId: string;
  oemName: string;
  modelId: string;
  modelName: string;
  uomId: string;
  uomCode: string;
  standardCost?: number;
  category: ProductCategory;
  createdAt: string;
}

export type WorkOrderStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type JobStep = "CUTTING" | "WELDING" | "ASSEMBLY" | "QA" | "FINISHED_GOODS";
export type InventoryTransactionType = "ISSUE" | "RECEIVE";
export type InventoryStatus = "AVAILABLE" | "RESERVED" | "LOW_STOCK" | "OUT_OF_STOCK";

export interface WorkOrder {
  id: string;
  number: string;
  productId: string;
  productName: string;
  quantity: number;
  status: WorkOrderStatus;
  startDate?: string;
  endDate?: string;
  progress: number;
  currentStep: JobStep;
  createdAt: string;
}

export interface WorkOrderStep {
  id: string;
  workOrderId: string;
  step: JobStep;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  startTime?: string;
  endTime?: string;
  completedBy?: string;
  remarks?: string;
  requiredMaterials: BOMItem[];
}

export interface BOM {
  id: string;
  productId: string;
  productName: string;
  version: string;
  isActive: boolean;
  items: BOMItem[];
  createdAt: string;
}

export interface BOMItem {
  id: string;
  bomId: string;
  componentId: string;
  componentName: string;
  componentCode: string;
  quantity: number;
  uomId: string;
  uomCode: string;
  step: JobStep;
}

export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  batchNo: string;
  location: string;
  quantityOnHand: number;
  reservedQuantity: number;
  availableQuantity: number;
  uomId: string;
  uomCode: string;
  status: InventoryStatus;
  lastUpdated: string;
}

export interface InventoryTransaction {
  id: string;
  date: string;
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  type: InventoryTransactionType;
  workOrderId?: string;
  workOrderNumber?: string;
  step?: JobStep;
  location: string;
  batchNo?: string;
  userId: string;
  userName: string;
  remarks?: string;
}

export interface MaterialIssueRequest {
  workOrderId: string;
  step: JobStep;
  componentId: string;
  availableStock: number;
  quantityToIssue: number;
  location: string;
  batchNo: string;
}

export interface MaterialReceiveRequest {
  productId: string;
  quantity: number;
  location: string;
  batchNo: string;
  remarks?: string;
}

// Scrap Management Types
export type ScrapStatus = "AVAILABLE" | "CONSUMED" | "SOLD" | "QUARANTINED";
export type ScrapTransactionType = "GENERATED" | "REUSED" | "ADJUSTED" | "CONSUMED" | "SOLD";

export interface ScrapInventory {
  id: string;
  blank_id?: string;
  material_id?: string;
  material_name?: string;
  width_mm?: number;
  length_mm?: number;
  thickness_mm?: number;
  weight_kg: number;
  location_id?: string;
  location_name?: string;
  status: ScrapStatus;
  reference?: string;
  consumed_by_po?: string;
  created_at: string;
  updated_at?: string;
}

export interface ScrapTransaction {
  id: string;
  scrap_id: string;
  txn_type: ScrapTransactionType;
  qty_used?: number;
  weight_kg?: number;
  reference?: string;
  created_by?: string;
  created_at: string;
}

// Wastage Tracking Types
export interface Wastage {
  id: string;
  wo_id: string;
  work_order_number?: string;
  step_id?: string;
  step_name?: string;
  material_id: string;
  material_name?: string;
  quantity: number;
  uom_id?: string;
  uom_code?: string;
  location_id?: string;
  location_name?: string;
  reason?: string;
  created_at: string;
}

// Stock Adjustment Types
export type AdjustmentType = "INCREASE" | "DECREASE" | "SET";

export interface StockAdjustment {
  id: string;
  product_id?: string;
  product_name?: string;
  material_id?: string;
  material_name?: string;
  quantity: number;
  adjustment_type: AdjustmentType;
  reason: string;
  location_id?: string;
  location_name?: string;
  reference?: string;
  created_by?: string;
  created_at: string;
}

export interface StockLevel {
  id: string;
  product_id?: string;
  product_name?: string;
  material_id?: string;
  material_name?: string;
  quantity: number;
  location_id?: string;
  location_name?: string;
  uom_id?: string;
  uom_code?: string;
  status: string;
  is_low_stock: boolean;
  reorder_level?: number;
  last_updated: string;
}

// Production Tracking Types
export type ProductionOrderStatus = "PLANNED" | "RELEASED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type ProductionStepStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";

export interface ProductionOrder {
  id: string;
  po_no: string;
  product_id: string;
  product_name?: string;
  qty_ordered: number;
  qty_completed: number;
  uom_id?: string;
  uom_code?: string;
  priority: number;
  planned_start?: string;
  planned_end?: string;
  status: ProductionOrderStatus;
  created_by?: string;
  created_at: string;
}

export interface ProductionStep {
  id: string;
  production_id: string;
  step_no: number;
  operation: string;
  planned_qty: number;
  completed_qty?: number;
  status: ProductionStepStatus;
  start_time?: string;
  end_time?: string;
  remarks?: string;
}

export interface ProductionMaterialUsage {
  id: string;
  production_id: string;
  material_id?: string;
  material_name?: string;
  scrap_id?: string;
  qty_required: number;
  qty_issued: number;
  uom_id?: string;
  uom_code?: string;
}

export interface ProductionProgress {
  id: string;
  po_no: string;
  product_name?: string;
  qty_ordered: number;
  qty_completed: number;
  status: ProductionOrderStatus;
  progress_metrics: {
    step_progress: {
      total_steps: number;
      completed_steps: number;
      in_progress_steps: number;
      progress_percentage: number;
    };
    material_progress: {
      total_required: number;
      total_issued: number;
      progress_percentage: number;
    };
    production_progress: {
      qty_ordered: number;
      qty_completed: number;
      completion_percentage: number;
    };
  };
  materials: ProductionMaterialUsage[];
  steps: ProductionStep[];
}

// Report Types
export interface WastageReport {
  summary: Array<{
    material_id: string;
    material_name: string;
    total_wastage: number;
    wastage_count: number;
    work_orders: string[];
    work_order_count: number;
    avg_wastage_per_incident: number;
  }>;
  details: Wastage[];
  total_records: number;
  date_range: {
    start_date?: string;
    end_date?: string;
  };
}

export interface ScrapReport {
  summary: Array<{
    status: ScrapStatus;
    count: number;
    total_weight: number;
    avg_weight: number;
  }>;
  details: ScrapInventory[];
  total_records: number;
  date_range: {
    start_date?: string;
    end_date?: string;
  };
}

export interface InventoryReport {
  summary: {
    total_items: number;
    low_stock_items: number;
    low_stock_percentage: number;
    estimated_total_value: number;
  };
  details: StockLevel[];
  date_range: {
    generated_at: string;
  };
}

export interface ProductionReport {
  summary: Array<{
    status: ProductionOrderStatus;
    count: number;
    total_ordered: number;
    total_completed: number;
    completion_rate: number;
  }>;
  details: ProductionOrder[];
  total_records: number;
  date_range: {
    start_date?: string;
    end_date?: string;
  };
}

export interface CostAnalysisReport {
  summary: Array<{
    material_id: string;
    material_name: string;
    total_weight_reused: number;
    estimated_cost_savings: number;
    reuse_count: number;
    wastage_percentage: number;
    efficiency_percentage: number;
  }>;
  total_material_cost: number;
  total_wastage_cost: number;
  overall_efficiency: number;
  date_range: {
    start_date?: string;
    end_date?: string;
  };
}