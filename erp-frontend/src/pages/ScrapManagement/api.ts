import { toast } from "@/hooks/use-toast";
import { 
  ScrapInventory, 
  ScrapTransaction, 
  CreateScrapRequest, 
  UpdateScrapRequest,
  ScrapFilters,
  CreateScrapTransactionRequest,
  ScrapTransactionFilters,
  ScrapStats
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

export const scrapApi = {
  // Get all scrap inventory
  getAll: async (params?: ScrapFilters): Promise<ScrapInventory[]> => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set('status', params.status);
      if (params?.location_id) searchParams.set('location_id', params.location_id);
      if (params?.material_id) searchParams.set('material_id', params.material_id);
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.offset) searchParams.set('offset', params.offset.toString());
      
      const queryString = searchParams.toString();
      const endpoint = `/scrap${queryString ? `?${queryString}` : ''}`;
      
      return await apiRequest<ScrapInventory[]>(endpoint);
    } catch (error) {
      return handleApiError(error, "Failed to load scrap inventory");
    }
  },

  // Get scrap by ID
  getById: async (id: string): Promise<ScrapInventory> => {
    try {
      return await apiRequest<ScrapInventory>(`/scrap/${id}`);
    } catch (error) {
      return handleApiError(error, "Failed to load scrap details");
    }
  },

  // Create new scrap
  create: async (data: CreateScrapRequest): Promise<ScrapInventory> => {
    try {
      const result = await apiRequest<ScrapInventory>('/scrap', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      showSuccessToast("Scrap record created successfully");
      return result;
    } catch (error) {
      return handleApiError(error, "Failed to create scrap record");
    }
  },

  // Update scrap status
  updateStatus: async (id: string, status: string): Promise<ScrapInventory> => {
    try {
      const result = await apiRequest<ScrapInventory>(`/scrap/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      showSuccessToast("Scrap status updated successfully");
      return result;
    } catch (error) {
      return handleApiError(error, "Failed to update scrap status");
    }
  },

  // Update scrap record
  update: async (id: string, data: UpdateScrapRequest): Promise<ScrapInventory> => {
    try {
      const result = await apiRequest<ScrapInventory>(`/scrap/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      showSuccessToast("Scrap record updated successfully");
      return result;
    } catch (error) {
      return handleApiError(error, "Failed to update scrap record");
    }
  },

  // Delete scrap record
  delete: async (id: string): Promise<void> => {
    try {
      await apiRequest<void>(`/scrap/${id}`, {
        method: 'DELETE',
      });
      showSuccessToast("Scrap record deleted successfully");
    } catch (error) {
      return handleApiError(error, "Failed to delete scrap record");
    }
  },

  // Create scrap transaction
  createTransaction: async (data: CreateScrapTransactionRequest): Promise<ScrapTransaction> => {
    try {
      const result = await apiRequest<ScrapTransaction>('/scrap/transactions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      showSuccessToast("Scrap transaction recorded successfully");
      return result;
    } catch (error) {
      return handleApiError(error, "Failed to create scrap transaction");
    }
  },

  // Get scrap transactions
  getTransactions: async (params?: ScrapTransactionFilters): Promise<ScrapTransaction[]> => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.scrap_id) searchParams.set('scrap_id', params.scrap_id);
      if (params?.txn_type) searchParams.set('txn_type', params.txn_type);
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.offset) searchParams.set('offset', params.offset.toString());
      
      const queryString = searchParams.toString();
      const endpoint = `/scrap/transactions/list${queryString ? `?${queryString}` : ''}`;
      
      return await apiRequest<ScrapTransaction[]>(endpoint);
    } catch (error) {
      return handleApiError(error, "Failed to load scrap transactions");
    }
  },

  // Get scrap by location
  getByLocation: async (locationId: string): Promise<ScrapInventory[]> => {
    try {
      return await apiRequest<ScrapInventory[]>(`/scrap/location/${locationId}`);
    } catch (error) {
      return handleApiError(error, "Failed to load scrap by location");
    }
  },

  // Get scrap by material
  getByMaterial: async (materialId: string): Promise<ScrapInventory[]> => {
    try {
      return await apiRequest<ScrapInventory[]>(`/scrap/material/${materialId}`);
    } catch (error) {
      return handleApiError(error, "Failed to load scrap by material");
    }
  },

  // Get scrap statistics
  getStats: async (): Promise<ScrapStats> => {
    try {
      const scrapInventory = await scrapApi.getAll();
      
      const totalScrap = scrapInventory.length;
      const availableScrap = scrapInventory.filter(scrap => scrap.status === "AVAILABLE").length;
      const consumedScrap = scrapInventory.filter(scrap => scrap.status === "CONSUMED").length;
      const totalWeight = scrapInventory.reduce((sum, scrap) => sum + scrap.weight_kg, 0);
      
      return {
        totalScrap,
        availableScrap,
        consumedScrap,
        totalWeight
      };
    } catch (error) {
      return handleApiError(error, "Failed to load scrap statistics");
    }
  }
};

export { ApiError };
