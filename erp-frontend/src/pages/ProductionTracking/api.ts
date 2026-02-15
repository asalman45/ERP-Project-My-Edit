import { toast } from "@/hooks/use-toast";
import { 
  ProductionOrder, 
  ProductionStep, 
  ProductionProgress, 
  ProductionMaterialUsage,
  RecordMaterialUsageRequest,
  UpdateProductionStepRequest,
  ProductionOrderFilters,
  ProductionEfficiency,
  ProductionTrackingStats
} from "./types";

// API service for connecting frontend with backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Generic API request function with error handling
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json();
    
    // Handle backend response format { success, data, message }
    if (data.success === false) {
      throw new ApiError(
        data.message || 'Request failed',
        response.status,
        data
      );
    }
    
    return data.data || data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      0
    );
  }
}

// Helper function to show error toast
const handleApiError = (error: any, defaultMessage: string) => {
  console.error('API Error:', error);
  toast({
    title: "Error",
    description: error.message || defaultMessage,
    variant: "destructive",
  });
  throw error;
};

// Helper function to show success toast
const showSuccessToast = (message: string) => {
  toast({
    title: "Success",
    description: message,
  });
};

export const productionTrackingApi = {
  // Record material usage
  recordMaterialUsage: async (data: RecordMaterialUsageRequest): Promise<ProductionMaterialUsage> => {
    try {
      const result = await apiRequest<ProductionMaterialUsage>('/production-tracking/material-usage', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      showSuccessToast("Material usage recorded successfully");
      return result;
    } catch (error) {
      return handleApiError(error, "Failed to record material usage");
    }
  },

  // Update production step
  updateStep: async (stepId: string, data: UpdateProductionStepRequest): Promise<ProductionStep> => {
    try {
      const result = await apiRequest<ProductionStep>(`/production-tracking/steps/${stepId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      showSuccessToast("Production step updated successfully");
      return result;
    } catch (error) {
      return handleApiError(error, "Failed to update production step");
    }
  },

  // Get production progress
  getProgress: async (productionId: string): Promise<ProductionProgress> => {
    try {
      return await apiRequest<ProductionProgress>(`/production-tracking/${productionId}/progress`);
    } catch (error) {
      return handleApiError(error, "Failed to load production progress");
    }
  },

  // Get production orders
  getOrders: async (params?: ProductionOrderFilters): Promise<ProductionOrder[]> => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set('status', params.status);
      if (params?.product_id) searchParams.set('product_id', params.product_id);
      if (params?.start_date) searchParams.set('start_date', params.start_date);
      if (params?.end_date) searchParams.set('end_date', params.end_date);
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.offset) searchParams.set('offset', params.offset.toString());
      
      const queryString = searchParams.toString();
      const endpoint = `/production-tracking/orders${queryString ? `?${queryString}` : ''}`;
      
      return await apiRequest<ProductionOrder[]>(endpoint);
    } catch (error) {
      return handleApiError(error, "Failed to load production orders");
    }
  },

  // Get production order by ID
  getOrderById: async (id: string): Promise<ProductionOrder> => {
    try {
      return await apiRequest<ProductionOrder>(`/production-tracking/orders/${id}`);
    } catch (error) {
      return handleApiError(error, "Failed to load production order details");
    }
  },

  // Get production efficiency
  getEfficiency: async (params?: {
    start_date?: string;
    end_date?: string;
    product_id?: string;
  }): Promise<ProductionEfficiency[]> => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.start_date) searchParams.set('start_date', params.start_date);
      if (params?.end_date) searchParams.set('end_date', params.end_date);
      if (params?.product_id) searchParams.set('product_id', params.product_id);
      
      const queryString = searchParams.toString();
      const endpoint = `/production-tracking/efficiency${queryString ? `?${queryString}` : ''}`;
      
      return await apiRequest<ProductionEfficiency[]>(endpoint);
    } catch (error) {
      return handleApiError(error, "Failed to load production efficiency data");
    }
  },

  // Get production tracking statistics
  getStats: async (): Promise<ProductionTrackingStats> => {
    try {
      const orders = await productionTrackingApi.getOrders();
      
      const totalOrders = orders.length;
      const inProgressOrders = orders.filter(order => order.status === "IN_PROGRESS").length;
      const completedOrders = orders.filter(order => order.status === "COMPLETED").length;
      
      const totalOrdered = orders.reduce((sum, order) => sum + order.qty_ordered, 0);
      const totalCompleted = orders.reduce((sum, order) => sum + order.qty_completed, 0);
      const totalEfficiency = totalOrdered > 0 ? (totalCompleted / totalOrdered) * 100 : 0;
      
      return {
        totalOrders,
        inProgressOrders,
        completedOrders,
        totalEfficiency
      };
    } catch (error) {
      return handleApiError(error, "Failed to load production tracking statistics");
    }
  }
};

export { ApiError };
