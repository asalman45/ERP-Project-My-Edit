// Work Order Detail page specific types

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

export interface WorkOrderStep {
  id: string;
  workOrderId: string;
  stepName: string;
  sequence: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  startTime?: string;
  endTime?: string;
  completedBy?: string;
  remarks?: string;
}

export interface WorkOrderDetailData {
  workOrder: WorkOrder;
  steps: WorkOrderStep[];
}
