export type ScrapStatus = "AVAILABLE" | "CONSUMED" | "SOLD" | "QUARANTINED";
export type ScrapTransactionType = "GENERATED" | "REUSED" | "ADJUSTED" | "CONSUMED" | "SOLD";

export interface ScrapInventory {
  id: string;
  blank_id?: string;
  material_id?: string;
  material_name?: string;
  sub_assembly_name?: string; // Keep for backward compatibility
  sub_assembly_names?: string; // New: comma-separated list of sub-assemblies
  sub_assembly_count?: number; // New: count of sub-assemblies
  work_order_no?: string; // New: Work Order Number
  work_order_id?: string; // New: Work Order ID
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

export interface CreateScrapRequest {
  blank_id?: string;
  material_id?: string;
  width_mm?: number;
  length_mm?: number;
  thickness_mm?: number;
  weight_kg: number;
  location_id?: string;
  status?: ScrapStatus;
  reference?: string;
  consumed_by_po?: string;
}

export interface UpdateScrapRequest {
  width_mm?: number;
  length_mm?: number;
  thickness_mm?: number;
  weight_kg?: number;
  location_id?: string;
  status?: ScrapStatus;
  reference?: string;
  consumed_by_po?: string;
}

export interface ScrapFilters {
  status?: string;
  location_id?: string;
  material_id?: string;
  limit?: number;
  offset?: number;
}

export interface CreateScrapTransactionRequest {
  scrap_id: string;
  txn_type: ScrapTransactionType;
  qty_used?: number;
  weight_kg?: number;
  reference?: string;
}

export interface ScrapTransactionFilters {
  scrap_id?: string;
  txn_type?: string;
  limit?: number;
  offset?: number;
}

export interface ScrapStats {
  totalScrap: number;
  availableScrap: number;
  consumedScrap: number;
  totalWeight: number;
}
