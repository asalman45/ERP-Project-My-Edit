// Inventory Transactions page specific types

export interface InventoryTransaction {
  id: string;
  date: string;
  type: 'ISSUE' | 'RECEIVE' | 'ADJUSTMENT' | 'TRANSFER';
  productCode?: string;
  productName?: string;
  quantity: number;
  location: string;
  workOrderNumber?: string;
  step?: string;
  userName: string;
  reference?: string;
  notes?: string;
  createdAt: string;
}

export interface TransactionFilters {
  type: string;
  dateFrom: string;
  dateTo: string;
  product_id?: string;
  material_id?: string;
  location_id?: string;
}

export interface TransactionStats {
  totalTransactions: number;
  issueTransactions: number;
  receiveTransactions: number;
  adjustmentTransactions: number;
}
