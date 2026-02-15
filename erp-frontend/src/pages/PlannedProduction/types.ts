// Planned Production Types

export type PlannedProductionStatus = 
  | 'PLANNED'
  | 'MRP_PLANNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type ForecastMethod = 
  | 'MANUAL'
  | 'MRP_BASED'
  | 'HISTORICAL';

export interface PlannedProduction {
  planned_production_id: string;
  plan_number: string;
  product_id: string;
  product_code?: string;
  product_name?: string;
  quantity_planned: number;
  uom_id?: string;
  uom_code?: string;
  uom_name?: string;
  forecast_method: ForecastMethod;
  start_date: string;
  end_date?: string;
  delivery_date?: string;
  status: PlannedProductionStatus;
  priority: number;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  forecast_data?: any;
  material_requirements?: any;
}

export interface CreatePlannedProductionRequest {
  product_id: string;
  quantity_planned: number;
  uom_id?: string;
  forecast_method?: ForecastMethod;
  start_date: string;
  end_date?: string;
  delivery_date?: string;
  priority?: number;
  created_by?: string;
  forecast_data?: any;
  material_requirements?: any;
}

export interface UpdatePlannedProductionRequest {
  quantity_planned?: number;
  uom_id?: string;
  forecast_method?: ForecastMethod;
  start_date?: string;
  end_date?: string;
  delivery_date?: string;
  status?: PlannedProductionStatus;
  priority?: number;
  forecast_data?: any;
  material_requirements?: any;
}

export interface PlannedProductionFilters {
  status?: PlannedProductionStatus;
  product_id?: string;
  start_date_from?: string;
  start_date_to?: string;
  limit?: number;
  offset?: number;
}

export interface MaterialRequirement {
  material_id: string;
  material_code: string;
  material_name: string;
  quantity_required: number;
  quantity_available: number;
  shortage: number;
  unit: string;
}

