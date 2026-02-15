import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { workOrderApi } from "@/services/api";
import { WorkOrder } from "@/types";

// Work Orders API types
export interface WorkOrderStats {
  pendingOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  totalOrders: number;
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

// Work Orders API functions
export const workOrdersPageApi = {
  // Get all work orders
  getAll: async (params?: { limit?: number; offset?: number }): Promise<WorkOrder[]> => {
    try {
      return await workOrderApi.getAll(params);
    } catch (error) {
      throw error;
    }
  },

  // Get work order by ID
  getById: async (id: string): Promise<WorkOrder> => {
    try {
      return await workOrderApi.getById(id);
    } catch (error) {
      throw error;
    }
  },

  // Create new work order
  create: async (data: {
    wo_no: string;
    product_id: string;
    quantity: number;
    priority: number;
    scheduled_start?: string;
    scheduled_end?: string;
    status: string;
  }): Promise<WorkOrder> => {
    try {
      return await workOrderApi.create(data);
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

  // Delete work order
  delete: async (id: string): Promise<void> => {
    try {
      await workOrderApi.delete(id);
    } catch (error) {
      throw error;
    }
  },
};

// Hook for work orders data with error handling and loading states
export const useWorkOrdersApi = () => {
  const { toast } = useToast();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<WorkOrderStats>({
    pendingOrders: 0,
    inProgressOrders: 0,
    completedOrders: 0,
    totalOrders: 0,
  });

  // Load work orders data
  const loadWorkOrdersData = async () => {
    try {
      setLoading(true);
      const data = await workOrdersPageApi.getAll();
      setWorkOrders(data);
      
      // Calculate stats
      const pendingOrders = data.filter(wo => wo.status === "PENDING").length;
      const inProgressOrders = data.filter(wo => wo.status === "IN_PROGRESS").length;
      const completedOrders = data.filter(wo => wo.status === "COMPLETED").length;
      const totalOrders = data.length;
      
      setStats({
        pendingOrders,
        inProgressOrders,
        completedOrders,
        totalOrders,
      });
    } catch (error) {
      handleApiError(error, toast);
      console.error('Error loading work orders data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create work order
  const createWorkOrder = async (data: {
    wo_no: string;
    product_id: string;
    quantity: number;
    priority: number;
    scheduled_start?: string;
    scheduled_end?: string;
    status: string;
  }) => {
    try {
      const result = await workOrdersPageApi.create(data);
      toast({
        title: "Success",
        description: "Work order created successfully",
      });
      
      // Reload data to reflect changes
      await loadWorkOrdersData();
      
      return result;
    } catch (error) {
      handleApiError(error, toast);
      throw error;
    }
  };

  // Update work order
  const updateWorkOrder = async (id: string, data: Partial<{
    wo_no: string;
    product_id: string;
    quantity: number;
    priority: number;
    scheduled_start: string;
    scheduled_end: string;
    status: string;
  }>) => {
    try {
      const result = await workOrdersPageApi.update(id, data);
      toast({
        title: "Success",
        description: "Work order updated successfully",
      });
      
      // Reload data to reflect changes
      await loadWorkOrdersData();
      
      return result;
    } catch (error) {
      handleApiError(error, toast);
      throw error;
    }
  };

  // Delete work order
  const deleteWorkOrder = async (id: string) => {
    try {
      await workOrdersPageApi.delete(id);
      toast({
        title: "Success",
        description: "Work order deleted successfully",
      });
      
      // Reload data to reflect changes
      await loadWorkOrdersData();
    } catch (error) {
      handleApiError(error, toast);
      throw error;
    }
  };

  // Load data on mount
  useEffect(() => {
    loadWorkOrdersData();
  }, []);

  return {
    workOrders,
    loading,
    stats,
    pendingOrders: stats.pendingOrders,
    inProgressOrders: stats.inProgressOrders,
    completedOrders: stats.completedOrders,
    totalOrders: stats.totalOrders,
    createWorkOrder,
    updateWorkOrder,
    deleteWorkOrder,
    refreshData: loadWorkOrdersData,
  };
};
