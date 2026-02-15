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

export interface CreateStockAdjustmentRequest {
  product_id?: string;
  material_id?: string;
  quantity: number;
  adjustment_type: AdjustmentType;
  reason: string;
  location_id?: string;
  reference?: string;
}

export interface StockAdjustmentFilters {
  product_id?: string;
  material_id?: string;
  location_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export interface StockMovementReport {
  item_id: string;
  item_name: string;
  item_type: "product" | "material";
  location_name?: string;
  uom_code?: string;
  opening_balance: number;
  total_in: number;
  total_out: number;
  closing_balance: number;
  movements: Array<{
    date: string;
    txn_type: string;
    quantity: number;
    reference?: string;
    created_by?: string;
  }>;
}

export interface StockAdjustmentStats {
  totalAdjustments: number;
  totalItemsAdjusted: number;
  totalIncreaseValue: number;
  totalDecreaseValue: number;
}
