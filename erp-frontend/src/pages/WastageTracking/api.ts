import { toast } from "@/hooks/use-toast";
import { 
  Wastage, 
  CreateWastageRequest, 
  UpdateWastageRequest,
  WastageFilters,
  WastageReport,
  WastageStats
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

export const wastageApi = {
  // Get all wastage records
  getAll: async (params?: WastageFilters): Promise<Wastage[]> => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.wo_id) searchParams.set('wo_id', params.wo_id);
      if (params?.material_id) searchParams.set('material_id', params.material_id);
      if (params?.location_id) searchParams.set('location_id', params.location_id);
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.offset) searchParams.set('offset', params.offset.toString());
      
      const queryString = searchParams.toString();
      const endpoint = `/wastage${queryString ? `?${queryString}` : ''}`;
      
      const rawData = await apiRequest<any[]>(endpoint);
      
      // Transform the backend response to match frontend interface
      const transformedData: Wastage[] = rawData.map((item: any) => ({
        id: item.wastage_id,
        wo_id: item.wo_id,
        work_order_number: item.workOrder?.wo_no,
        step_id: item.step_id,
        step_name: item.step?.operation,
        material_id: item.material_id,
        material_name: item.material?.name,
        quantity: item.quantity,
        uom_id: item.uom_id,
        uom_code: item.uom?.code,
        location_id: item.location_id,
        location_name: item.location?.name,
        reason: item.reason,
        created_at: item.created_at,
      }));
      
      return transformedData;
    } catch (error) {
      return handleApiError(error, "Failed to load wastage records");
    }
  },

  // Get wastage by ID
  getById: async (id: string): Promise<Wastage> => {
    try {
      const rawData = await apiRequest<any>(`/wastage/${id}`);
      
      // Transform the backend response to match frontend interface
      return {
        id: rawData.wastage_id,
        wo_id: rawData.wo_id,
        work_order_number: rawData.workOrder?.wo_no,
        step_id: rawData.step_id,
        step_name: rawData.step?.operation,
        material_id: rawData.material_id,
        material_name: rawData.material?.name,
        quantity: rawData.quantity,
        uom_id: rawData.uom_id,
        uom_code: rawData.uom?.code,
        location_id: rawData.location_id,
        location_name: rawData.location?.name,
        reason: rawData.reason,
        created_at: rawData.created_at,
      };
    } catch (error) {
      return handleApiError(error, "Failed to load wastage details");
    }
  },

  // Create wastage record
  create: async (data: CreateWastageRequest): Promise<Wastage> => {
    try {
      const result = await apiRequest<Wastage>('/wastage', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      showSuccessToast("Wastage record created successfully");
      return result;
    } catch (error) {
      return handleApiError(error, "Failed to create wastage record");
    }
  },

  // Update wastage record
  update: async (id: string, data: UpdateWastageRequest): Promise<Wastage> => {
    try {
      const result = await apiRequest<Wastage>(`/wastage/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      showSuccessToast("Wastage record updated successfully");
      return result;
    } catch (error) {
      return handleApiError(error, "Failed to update wastage record");
    }
  },

  // Delete wastage record
  delete: async (id: string): Promise<void> => {
    try {
      await apiRequest<void>(`/wastage/${id}`, {
        method: 'DELETE',
      });
      showSuccessToast("Wastage record deleted successfully");
    } catch (error) {
      return handleApiError(error, "Failed to delete wastage record");
    }
  },

  // Get wastage by work order
  getByWorkOrder: async (woId: string): Promise<Wastage[]> => {
    try {
      return await apiRequest<Wastage[]>(`/wastage/work-order/${woId}`);
    } catch (error) {
      return handleApiError(error, "Failed to load wastage by work order");
    }
  },

  // Get wastage by material
  getByMaterial: async (materialId: string): Promise<Wastage[]> => {
    try {
      return await apiRequest<Wastage[]>(`/wastage/material/${materialId}`);
    } catch (error) {
      return handleApiError(error, "Failed to load wastage by material");
    }
  },

  // Get wastage summary
  getSummary: async (params?: {
    start_date?: string;
    end_date?: string;
    material_id?: string;
    wo_id?: string;
  }): Promise<WastageReport> => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.start_date) searchParams.set('start_date', params.start_date);
      if (params?.end_date) searchParams.set('end_date', params.end_date);
      if (params?.material_id) searchParams.set('material_id', params.material_id);
      if (params?.wo_id) searchParams.set('wo_id', params.wo_id);
      
      const queryString = searchParams.toString();
      const endpoint = `/wastage/summary${queryString ? `?${queryString}` : ''}`;
      
      return await apiRequest<WastageReport>(endpoint);
    } catch (error) {
      return handleApiError(error, "Failed to load wastage summary");
    }
  },

  // Get wastage statistics
  getStats: async (): Promise<WastageStats> => {
    try {
      const wastageRecords = await wastageApi.getAll();
      
      const totalWastage = wastageRecords.reduce((sum, wastage) => sum + wastage.quantity, 0);
      const totalIncidents = wastageRecords.length;
      const totalMaterials = new Set(wastageRecords.map(w => w.material_id)).size;
      const avgWastagePerIncident = totalIncidents > 0 ? totalWastage / totalIncidents : 0;
      
      return {
        totalWastage,
        totalIncidents,
        totalMaterials,
        avgWastagePerIncident
      };
    } catch (error) {
      return handleApiError(error, "Failed to load wastage statistics");
    }
  }
};

export { ApiError };
