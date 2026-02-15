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
  details: Array<{
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
  }>;
  total_records: number;
  date_range: {
    start_date?: string;
    end_date?: string;
  };
}

export interface ScrapReport {
  summary: Array<{
    status: string;
    count: number;
    total_weight: number;
    avg_weight: number;
  }>;
  details: Array<{
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
    status: string;
    reference?: string;
    consumed_by_po?: string;
    created_at: string;
    updated_at?: string;
  }>;
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
  details: Array<{
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
  }>;
  date_range: {
    generated_at: string;
  };
}

export interface ProductionReport {
  summary: Array<{
    status: string;
    count: number;
    total_ordered: number;
    total_completed: number;
    completion_rate: number;
  }>;
  details: Array<{
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
    status: string;
    created_by?: string;
    created_at: string;
  }>;
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

export interface ReportFilters {
  start_date?: string;
  end_date?: string;
  material_id?: string;
  wo_id?: string;
  location_id?: string;
  product_id?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface ReportStats {
  totalReports: number;
  lastGenerated: string;
  reportTypes: string[];
}
