// Work Orders page specific types

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

export interface WorkOrderStats {
  pendingOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  totalOrders: number;
}

export interface WorkOrderFilters {
  status?: string;
  product_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface CreateWorkOrderData {
  wo_no: string;
  product_id: string;
  quantity: number;
  priority: number;
  scheduled_start?: string;
  scheduled_end?: string;
  status: string;
}
