import { toast } from "@/hooks/use-toast";
import { 
  PurchaseOrder, 
  PurchaseOrderItem, 
  CreatePurchaseOrderRequest, 
  UpdatePurchaseOrderRequest,
  PurchaseOrderFilters,
  PurchaseOrderStats 
} from "./types";

// API service for connecting frontend with backend
// Use relative URL since Vite proxy will handle routing to backend
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
    
    // Handle network errors specifically
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError(
        'NetworkError when attempting to fetch resource. Please check if the backend server is running on port 4000.',
        0,
        { originalError: error.message }
      );
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

export const purchaseOrderApi = {
  // Get all purchase orders
  getAll: async (params?: PurchaseOrderFilters): Promise<PurchaseOrder[]> => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set('status', params.status);
      if (params?.supplier_id) searchParams.set('supplier_id', params.supplier_id);
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.offset) searchParams.set('offset', params.offset.toString());
      
      const queryString = searchParams.toString();
      const endpoint = `/purchase-orders${queryString ? `?${queryString}` : ''}`;
      
      return await apiRequest<PurchaseOrder[]>(endpoint);
    } catch (error) {
      return handleApiError(error, "Failed to load purchase orders");
    }
  },

  // Get purchase order by ID
  getById: async (id: string): Promise<PurchaseOrder> => {
    try {
      return await apiRequest<PurchaseOrder>(`/purchase-orders/${id}`);
    } catch (error) {
      return handleApiError(error, "Failed to load purchase order details");
    }
  },

  // Create new purchase order
  create: async (data: CreatePurchaseOrderRequest): Promise<PurchaseOrder> => {
    try {
      const result = await apiRequest<PurchaseOrder>('/purchase-orders', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      showSuccessToast("Purchase order created successfully");
      return result;
    } catch (error) {
      return handleApiError(error, "Failed to create purchase order");
    }
  },

  // Update purchase order
  update: async (id: string, data: UpdatePurchaseOrderRequest): Promise<PurchaseOrder> => {
    try {
      const result = await apiRequest<PurchaseOrder>(`/purchase-orders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      showSuccessToast("Purchase order updated successfully");
      return result;
    } catch (error) {
      return handleApiError(error, "Failed to update purchase order");
    }
  },

  // Update purchase order status
  updateStatus: async (id: string, status: string): Promise<PurchaseOrder> => {
    try {
      const result = await apiRequest<PurchaseOrder>(`/purchase-orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      showSuccessToast("Purchase order status updated successfully");
      return result;
    } catch (error) {
      return handleApiError(error, "Failed to update purchase order status");
    }
  },

  // Delete purchase order
  delete: async (id: string): Promise<void> => {
    try {
      const result = await apiRequest<{ success: boolean; message: string }>(`/purchase-orders/${id}`, {
        method: 'DELETE',
      });
      showSuccessToast(result?.message || "Purchase order deleted successfully");
    } catch (error) {
      handleApiError(error, "Failed to delete purchase order");
      throw error;
    }
  },

  // Get PO items
  getItems: async (poId: string): Promise<PurchaseOrderItem[]> => {
    try {
      return await apiRequest<PurchaseOrderItem[]>(`/purchase-orders/${poId}/items`);
    } catch (error) {
      return handleApiError(error, "Failed to load purchase order items");
    }
  },

  // Add PO item
  addItem: async (poId: string, data: {
    product_id?: string;
    material_id?: string;
    quantity: number;
    unit_price: number;
    uom_id?: string;
    notes?: string;
  }): Promise<PurchaseOrderItem> => {
    try {
      const result = await apiRequest<PurchaseOrderItem>(`/purchase-orders/${poId}/items`, {
        method: 'POST',
        body: JSON.stringify({ ...data, po_id: poId }),
      });
      showSuccessToast("Purchase order item added successfully");
      return result;
    } catch (error) {
      return handleApiError(error, "Failed to add purchase order item");
    }
  },

  // Update PO item
  updateItem: async (itemId: string, data: {
    quantity?: number;
    unit_price?: number;
    notes?: string;
  }): Promise<PurchaseOrderItem> => {
    try {
      const result = await apiRequest<PurchaseOrderItem>(`/purchase-orders/items/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      showSuccessToast("Purchase order item updated successfully");
      return result;
    } catch (error) {
      return handleApiError(error, "Failed to update purchase order item");
    }
  },

  // Delete PO item
  deleteItem: async (itemId: string): Promise<void> => {
    try {
      await apiRequest<void>(`/purchase-orders/items/${itemId}`, {
        method: 'DELETE',
      });
      showSuccessToast("Purchase order item deleted successfully");
    } catch (error) {
      return handleApiError(error, "Failed to delete purchase order item");
    }
  },

  // Get purchase order statistics
  getStats: async (): Promise<PurchaseOrderStats> => {
    try {
      const purchaseOrders = await purchaseOrderApi.getAll();
      
      const totalPOs = purchaseOrders.length;
      const openPOs = purchaseOrders.filter(po => po.status === "OPEN").length;
      const receivedPOs = purchaseOrders.filter(po => po.status === "RECEIVED").length;
      const totalValue = purchaseOrders.reduce((sum, po) => sum + (po.total_amount || 0), 0);
      
      return {
        totalPOs,
        openPOs,
        receivedPOs,
        totalValue
      };
    } catch (error) {
      return handleApiError(error, "Failed to load purchase order statistics");
    }
  }
};

export { ApiError };
