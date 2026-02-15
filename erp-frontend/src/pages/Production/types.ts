// Production page specific types

export interface WorkOrder {
  id: string;
  number: string;
  productId: string;
  productName: string;
  quantity: number;
  priority: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  currentStep: string;
  progress: number;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductionStats {
  activeOrders: number;
  pendingOrders: number;
  completedToday: number;
  totalOrders: number;
}

export interface ProductionFilters {
  status?: string;
  product_id?: string;
  start_date?: string;
  end_date?: string;
}
