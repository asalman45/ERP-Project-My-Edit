import { toast } from "@/hooks/use-toast";
import { 
  StockAdjustment, 
  StockLevel, 
  CreateStockAdjustmentRequest, 
  StockAdjustmentFilters,
  StockMovementReport,
  StockAdjustmentStats
} from "./types";

// API service for connecting frontend with backend
// Always use relative path for Vite proxy - ignore VITE_API_URL if it's absolute
const API_BASE_URL = '/api';

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
  // Ensure endpoint starts with / if API_BASE_URL is relative
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Construct URL - always use relative path for Vite proxy
  // Relative paths starting with / will use current origin (localhost:8081)
  // Vite proxy will then forward to backend (localhost:4000)
  const base = API_BASE_URL.startsWith('/') ? API_BASE_URL : `/${API_BASE_URL}`;
  const url = `${base}${cleanEndpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    // Debug: Log the URL being requested
    console.log('API Request:', {
      url,
      method: options.method || 'GET',
      currentOrigin: window.location.origin,
      apiBaseUrl: API_BASE_URL
    });
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

export const stockAdjustmentApi = {
  // Adjust stock
  adjust: async (data: CreateStockAdjustmentRequest): Promise<StockAdjustment> => {
    try {
      const result = await apiRequest<StockAdjustment>('/stock-adjustment/adjust', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      showSuccessToast("Stock adjustment completed successfully");
      return result;
    } catch (error) {
      return handleApiError(error, "Failed to adjust stock");
    }
  },

  // Get adjustment history
  getHistory: async (params?: StockAdjustmentFilters): Promise<StockAdjustment[]> => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.product_id) searchParams.set('product_id', params.product_id);
      if (params?.material_id) searchParams.set('material_id', params.material_id);
      if (params?.location_id) searchParams.set('location_id', params.location_id);
      if (params?.start_date) searchParams.set('start_date', params.start_date);
      if (params?.end_date) searchParams.set('end_date', params.end_date);
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.offset) searchParams.set('offset', params.offset.toString());
      
      const queryString = searchParams.toString();
      const endpoint = `/stock-adjustment/history${queryString ? `?${queryString}` : ''}`;
      
      return await apiRequest<StockAdjustment[]>(endpoint);
    } catch (error) {
      return handleApiError(error, "Failed to load adjustment history");
    }
  },

  // Get stock levels
  getLevels: async (params?: {
    product_id?: string;
    material_id?: string;
    location_id?: string;
    low_stock_only?: boolean;
  }): Promise<StockLevel[]> => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.product_id) searchParams.set('product_id', params.product_id);
      if (params?.material_id) searchParams.set('material_id', params.material_id);
      if (params?.location_id) searchParams.set('location_id', params.location_id);
      if (params?.low_stock_only) searchParams.set('low_stock_only', params.low_stock_only.toString());
      
      const queryString = searchParams.toString();
      const endpoint = `/stock-adjustment/levels${queryString ? `?${queryString}` : ''}`;
      
      return await apiRequest<StockLevel[]>(endpoint);
    } catch (error) {
      return handleApiError(error, "Failed to load stock levels");
    }
  },

  // Get stock movement report
  getMovementReport: async (params?: {
    product_id?: string;
    material_id?: string;
    location_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<StockMovementReport[]> => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.product_id) searchParams.set('product_id', params.product_id);
      if (params?.material_id) searchParams.set('material_id', params.material_id);
      if (params?.location_id) searchParams.set('location_id', params.location_id);
      if (params?.start_date) searchParams.set('start_date', params.start_date);
      if (params?.end_date) searchParams.set('end_date', params.end_date);
      
      const queryString = searchParams.toString();
      const endpoint = `/stock-adjustment/movement-report${queryString ? `?${queryString}` : ''}`;
      
      return await apiRequest<StockMovementReport[]>(endpoint);
    } catch (error) {
      return handleApiError(error, "Failed to load stock movement report");
    }
  },

  // Get stock adjustment statistics
  getStats: async (): Promise<StockAdjustmentStats> => {
    try {
      const adjustments = await stockAdjustmentApi.getHistory();
      const stockLevels = await stockAdjustmentApi.getLevels();
      
      const totalAdjustments = adjustments.length;
      const totalItemsAdjusted = new Set(adjustments.map(a => a.product_id || a.material_id)).size;
      
      const increaseAdjustments = adjustments.filter(a => a.adjustment_type === "INCREASE");
      const decreaseAdjustments = adjustments.filter(a => a.adjustment_type === "DECREASE");
      
      const totalIncreaseValue = increaseAdjustments.reduce((sum, adj) => sum + adj.quantity, 0);
      const totalDecreaseValue = decreaseAdjustments.reduce((sum, adj) => sum + adj.quantity, 0);
      
      return {
        totalAdjustments,
        totalItemsAdjusted,
        totalIncreaseValue,
        totalDecreaseValue
      };
    } catch (error) {
      return handleApiError(error, "Failed to load stock adjustment statistics");
    }
  }
};

export { ApiError };
