// Inventory page specific types

export interface InventoryItem {
  id: string;
  productId?: string;
  productCode?: string;
  productName?: string;
  materialId?: string;
  materialCode?: string;
  materialName?: string;
  batchNo: string;
  location: string;
  locationId?: string;
  quantityOnHand: number;
  availableQuantity: number;
  uomCode: string;
  uomId?: string;
  status: 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'RESERVED';
  createdAt: string;
  updatedAt: string;
}

export interface InventoryTransaction {
  id: string;
  productId?: string;
  materialId?: string;
  txnType: string;
  quantity: number;
  locationId?: string;
  reference?: string;
  notes?: string;
  createdAt: string;
}

export interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
}

export interface InventoryFilters {
  product_id?: string;
  material_id?: string;
  location_id?: string;
  status?: string;
}
