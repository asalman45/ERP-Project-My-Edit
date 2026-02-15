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

export interface RecordMaterialUsageRequest {
  production_id: string;
  material_id?: string;
  scrap_id?: string;
  qty_issued: number;
  uom_id?: string;
}

export interface UpdateProductionStepRequest {
  completed_qty?: number;
  status?: ProductionStepStatus;
  start_time?: string;
  end_time?: string;
  remarks?: string;
}

export interface ProductionOrderFilters {
  status?: string;
  product_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export interface ProductionEfficiency {
  date: string;
  product_id: string;
  product_name: string;
  planned_qty: number;
  completed_qty: number;
  efficiency_percentage: number;
  total_downtime: number;
  total_runtime: number;
}

export interface ProductionTrackingStats {
  totalOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  totalEfficiency: number;
}
