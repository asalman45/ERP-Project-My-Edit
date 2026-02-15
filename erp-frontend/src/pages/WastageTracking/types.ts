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

export interface CreateWastageRequest {
  wo_id: string;
  step_id?: string;
  material_id: string;
  quantity: number;
  uom_id?: string;
  location_id?: string;
  reason?: string;
}

export interface UpdateWastageRequest {
  quantity?: number;
  uom_id?: string;
  location_id?: string;
  reason?: string;
}

export interface WastageFilters {
  wo_id?: string;
  material_id?: string;
  location_id?: string;
  limit?: number;
  offset?: number;
}

export interface WastageSummary {
  material_id: string;
  material_name: string;
  total_wastage: number;
  wastage_count: number;
  work_orders: string[];
  work_order_count: number;
  avg_wastage_per_incident: number;
}

export interface WastageReport {
  summary: WastageSummary[];
  details: Wastage[];
  total_records: number;
  date_range: {
    start_date?: string;
    end_date?: string;
  };
}

export interface WastageStats {
  totalWastage: number;
  totalIncidents: number;
  totalMaterials: number;
  avgWastagePerIncident: number;
}
