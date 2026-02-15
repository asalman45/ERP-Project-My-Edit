// Enhanced Reports page specific types

export interface ReportFilters {
  start_date: string;
  end_date: string;
  material_id: string;
  location_id: string;
  product_id: string;
  status: string;
}

export interface WastageReport {
  total_records: number;
  summary: Array<{
    material_name: string;
    work_order_count: number;
    total_wastage: number;
    avg_wastage_per_incident: number;
  }>;
  details: Array<{
    material_name: string;
    quantity: number;
    uom_code: string;
    work_order_number: string;
    reason: string;
    created_at: string;
  }>;
}

export interface ScrapReport {
  total_records: number;
  summary: Array<{
    status: string;
    count: number;
    total_weight: number;
    avg_weight: number;
  }>;
  details: Array<{
    material_name: string;
    weight_kg: number;
    location_name: string;
    reference: string;
    status: string;
    created_at: string;
  }>;
}

export interface InventoryReport {
  summary: {
    total_items: number;
    low_stock_items: number;
    low_stock_percentage: number;
    estimated_total_value: number;
  };
  details: Array<{
    product_name?: string;
    material_name?: string;
    quantity: number;
    uom_code: string;
    location_name: string;
    is_low_stock: boolean;
    reorder_level?: number;
    last_updated: string;
  }>;
}

export interface ProductionReport {
  total_records: number;
  summary: Array<{
    status: string;
    count: number;
    total_ordered: number;
    total_completed: number;
    completion_rate: number;
  }>;
  details: Array<{
    po_no: string;
    product_name: string;
    qty_ordered: number;
    qty_completed: number;
    status: string;
    created_at: string;
  }>;
}

export interface CostAnalysisReport {
  total_material_cost: number;
  total_wastage_cost: number;
  overall_efficiency: number;
  summary: Array<{
    material_name: string;
    reuse_count: number;
    total_weight_reused: number;
    estimated_cost_savings: number;
    efficiency_percentage: number;
    wastage_percentage: number;
  }>;
}
