import { toast } from "@/hooks/use-toast";
import { 
  WastageReport, 
  ScrapReport, 
  InventoryReport, 
  ProductionReport, 
  CostAnalysisReport,
  ReportFilters,
  ReportStats
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

export const reportsApi = {
  // Generate wastage report
  getWastageReport: async (params?: ReportFilters): Promise<WastageReport> => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.start_date) searchParams.set('start_date', params.start_date);
      if (params?.end_date) searchParams.set('end_date', params.end_date);
      if (params?.material_id) searchParams.set('material_id', params.material_id);
      if (params?.wo_id) searchParams.set('wo_id', params.wo_id);
      if (params?.location_id) searchParams.set('location_id', params.location_id);
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.offset) searchParams.set('offset', params.offset.toString());
      
      const queryString = searchParams.toString();
      const endpoint = `/reports/wastage${queryString ? `?${queryString}` : ''}`;
      
      const result = await apiRequest<WastageReport>(endpoint);
      showSuccessToast("Wastage report generated successfully");
      return result;
    } catch (error) {
      return handleApiError(error, "Failed to generate wastage report");
    }
  },

  // Generate scrap report
  getScrapReport: async (params?: ReportFilters): Promise<ScrapReport> => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.start_date) searchParams.set('start_date', params.start_date);
      if (params?.end_date) searchParams.set('end_date', params.end_date);
      if (params?.material_id) searchParams.set('material_id', params.material_id);
      if (params?.location_id) searchParams.set('location_id', params.location_id);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.offset) searchParams.set('offset', params.offset.toString());
      
      const queryString = searchParams.toString();
      const endpoint = `/reports/scrap${queryString ? `?${queryString}` : ''}`;
      
      const result = await apiRequest<ScrapReport>(endpoint);
      showSuccessToast("Scrap report generated successfully");
      return result;
    } catch (error) {
      return handleApiError(error, "Failed to generate scrap report");
    }
  },

  // Generate inventory report
  getInventoryReport: async (params?: ReportFilters): Promise<InventoryReport> => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.product_id) searchParams.set('product_id', params.product_id);
      if (params?.material_id) searchParams.set('material_id', params.material_id);
      if (params?.location_id) searchParams.set('location_id', params.location_id);
      
      const queryString = searchParams.toString();
      const endpoint = `/reports/inventory${queryString ? `?${queryString}` : ''}`;
      
      const result = await apiRequest<InventoryReport>(endpoint);
      showSuccessToast("Inventory report generated successfully");
      return result;
    } catch (error) {
      return handleApiError(error, "Failed to generate inventory report");
    }
  },

  // Generate production report
  getProductionReport: async (params?: ReportFilters): Promise<ProductionReport> => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.start_date) searchParams.set('start_date', params.start_date);
      if (params?.end_date) searchParams.set('end_date', params.end_date);
      if (params?.product_id) searchParams.set('product_id', params.product_id);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.offset) searchParams.set('offset', params.offset.toString());
      
      const queryString = searchParams.toString();
      const endpoint = `/reports/production${queryString ? `?${queryString}` : ''}`;
      
      const result = await apiRequest<ProductionReport>(endpoint);
      showSuccessToast("Production report generated successfully");
      return result;
    } catch (error) {
      return handleApiError(error, "Failed to generate production report");
    }
  },

  // Generate cost analysis report
  getCostAnalysisReport: async (params?: ReportFilters): Promise<CostAnalysisReport> => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.start_date) searchParams.set('start_date', params.start_date);
      if (params?.end_date) searchParams.set('end_date', params.end_date);
      if (params?.product_id) searchParams.set('product_id', params.product_id);
      if (params?.material_id) searchParams.set('material_id', params.material_id);
      
      const queryString = searchParams.toString();
      const endpoint = `/reports/cost-analysis${queryString ? `?${queryString}` : ''}`;
      
      const result = await apiRequest<CostAnalysisReport>(endpoint);
      showSuccessToast("Cost analysis report generated successfully");
      return result;
    } catch (error) {
      return handleApiError(error, "Failed to generate cost analysis report");
    }
  },

  // Get report statistics
  getStats: async (): Promise<ReportStats> => {
    try {
      // This would typically come from the backend, but for now we'll simulate it
      const reportTypes = ["wastage", "scrap", "inventory", "production", "cost-analysis"];
      
      return {
        totalReports: reportTypes.length,
        lastGenerated: new Date().toISOString(),
        reportTypes
      };
    } catch (error) {
      return handleApiError(error, "Failed to load report statistics");
    }
  },

  // Export report to CSV/Excel
  exportReport: async (reportType: string, format: 'csv' | 'excel', params?: ReportFilters): Promise<Blob> => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.start_date) searchParams.set('start_date', params.start_date);
      if (params?.end_date) searchParams.set('end_date', params.end_date);
      if (params?.material_id) searchParams.set('material_id', params.material_id);
      if (params?.wo_id) searchParams.set('wo_id', params.wo_id);
      if (params?.location_id) searchParams.set('location_id', params.location_id);
      if (params?.product_id) searchParams.set('product_id', params.product_id);
      if (params?.status) searchParams.set('status', params.status);
      
      const queryString = searchParams.toString();
      const endpoint = `/reports/${reportType}/export?format=${format}${queryString ? `&${queryString}` : ''}`;
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Accept': format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      showSuccessToast(`Report exported as ${format.toUpperCase()} successfully`);
      return blob;
    } catch (error) {
      return handleApiError(error, `Failed to export report as ${format.toUpperCase()}`);
    }
  }
};

export { ApiError };
