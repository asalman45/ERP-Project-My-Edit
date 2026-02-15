import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { workOrderApi } from "@/services/api";
import { WorkOrder, WorkOrderStep } from "@/types";

// Work Order Detail API types
export interface WorkOrderDetailData {
  workOrder: WorkOrder | null;
  steps: WorkOrderStep[];
}

// Generic API error handler
const handleApiError = (error: any, toast: any) => {
  const errorMessage = error?.response?.data?.message || error?.message || 'An unexpected error occurred';
  toast({
    title: "Error",
    description: errorMessage,
    variant: "destructive",
  });
};

// Work Order Detail API functions
export const workOrderDetailPageApi = {
  // Get work order by ID
  getById: async (id: string): Promise<WorkOrder> => {
    try {
      return await workOrderApi.getById(id);
    } catch (error) {
      throw error;
    }
  },

  // Update work order
  update: async (id: string, data: Partial<{
    wo_no: string;
    product_id: string;
    quantity: number;
    priority: number;
    scheduled_start: string;
    scheduled_end: string;
    status: string;
  }>): Promise<WorkOrder> => {
    try {
      return await workOrderApi.update(id, data);
    } catch (error) {
      throw error;
    }
  },

  // Complete a work order step (placeholder - would need backend implementation)
  completeStep: async (stepId: string, remarks?: string): Promise<WorkOrderStep> => {
    try {
      // This would be a new API endpoint for completing steps
      // For now, we'll simulate the API call
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            id: stepId,
            workOrderId: '',
            stepName: '',
            sequence: 0,
            status: 'COMPLETED',
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            completedBy: 'Current User',
            remarks: remarks || '',
          });
        }, 1000);
      });
    } catch (error) {
      throw error;
    }
  },
};

// Hook for work order detail data with error handling and loading states
export const useWorkOrderDetailApi = (workOrderId?: string) => {
  const { toast } = useToast();
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [steps, setSteps] = useState<WorkOrderStep[]>([]);
  const [loading, setLoading] = useState(true);

  // Load work order detail data
  const loadWorkOrderDetailData = async () => {
    if (!workOrderId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await workOrderDetailPageApi.getById(workOrderId);
      setWorkOrder(data);
      
      // TODO: Load actual steps from API when available
      // For now, using sample data structure
      setSteps([]);
    } catch (error) {
      handleApiError(error, toast);
      console.error('Error loading work order detail data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update work order
  const updateWorkOrder = async (data: Partial<{
    wo_no: string;
    product_id: string;
    quantity: number;
    priority: number;
    scheduled_start: string;
    scheduled_end: string;
    status: string;
  }>) => {
    if (!workOrder) return;

    try {
      const result = await workOrderDetailPageApi.update(workOrder.id, data);
      setWorkOrder(result);
      toast({
        title: "Success",
        description: "Work order updated successfully",
      });
      return result;
    } catch (error) {
      handleApiError(error, toast);
      throw error;
    }
  };

  // Complete step
  const completeStep = async (stepId: string, remarks?: string) => {
    try {
      const result = await workOrderDetailPageApi.completeStep(stepId, remarks);
      
      // Update the steps state
      setSteps(prevSteps =>
        prevSteps.map(step =>
          step.id === stepId
            ? {
                ...step,
                status: "COMPLETED" as const,
                endTime: new Date().toISOString(),
                completedBy: "Current User",
                remarks: remarks || step.remarks
              }
            : step
        )
      );

      toast({
        title: "Success",
        description: "Step completed successfully",
      });
      
      return result;
    } catch (error) {
      handleApiError(error, toast);
      throw error;
    }
  };

  // Load data on mount
  useEffect(() => {
    loadWorkOrderDetailData();
  }, [workOrderId]);

  return {
    workOrder,
    steps,
    loading,
    updateWorkOrder,
    completeStep,
    refreshData: loadWorkOrderDetailData,
  };
};
