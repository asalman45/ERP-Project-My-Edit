export interface PurchaseOrder {
  po_id: string;
  po_no: string;
  supplier_id: string;
  supplier_name: string;
  pr_id?: string;
  status: PurchaseOrderStatus;
  order_date: string;
  expected_date?: string;
  total_amount?: number | string | null;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export type PurchaseOrderStatus = "OPEN" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CLOSED";

export interface PurchaseOrderItem {
  item_id: string;
  po_id: string;
  product_id?: string;
  product_name?: string;
  material_id?: string;
  material_name?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  uom_id?: string;
  uom_code?: string;
  notes?: string;
  created_at: string;
}

export interface CreatePurchaseOrderRequest {
  po_no: string;
  supplier_id: string;
  pr_id?: string;
  status: PurchaseOrderStatus;
  order_date: string;
  expected_date?: string;
  // Note: total_amount and notes are not included in creation
  // total_amount is calculated from PO items
  // notes can be added later via updates
}

export interface UpdatePurchaseOrderRequest {
  po_no?: string;
  supplier_id?: string;
  pr_id?: string;
  status?: PurchaseOrderStatus;
  order_date?: string;
  expected_date?: string;
  total_amount?: number;
  notes?: string;
}

export interface PurchaseOrderFilters {
  status?: string;
  supplier_id?: string;
  limit?: number;
  offset?: number;
}

export interface PurchaseOrderStats {
  totalPOs: number;
  openPOs: number;
  receivedPOs: number;
  totalValue: number;
}
