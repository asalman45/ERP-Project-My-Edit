// API service for Internal Purchase Orders

import { toast } from "@/hooks/use-toast";
import { 
  InternalPurchaseOrder, 
  IPOItem, 
  CreateIPORequest, 
  UpdateIPOStatusRequest,
  IPOFilters,
  IPOStats,
  PDFGenerationResult,
  EmailResult,
  GenerateAndSendResult
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

export const ipoApi = {
  // Get all Internal Purchase Orders
  getAll: async (params?: IPOFilters): Promise<InternalPurchaseOrder[]> => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set('status', params.status);
      if (params?.supplier_id) searchParams.set('supplier_id', params.supplier_id);
      if (params?.start_date) searchParams.set('start_date', params.start_date);
      if (params?.end_date) searchParams.set('end_date', params.end_date);
      if (params?.search) searchParams.set('search', params.search);
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.offset) searchParams.set('offset', params.offset.toString());
      
      const queryString = searchParams.toString();
      const endpoint = `/internal-purchase-orders${queryString ? `?${queryString}` : ''}`;
      
      return await apiRequest<InternalPurchaseOrder[]>(endpoint);
    } catch (error) {
      return handleApiError(error, "Failed to load Internal Purchase Orders");
    }
  },

  // Get Internal Purchase Order by ID
  getById: async (id: string): Promise<InternalPurchaseOrder> => {
    try {
      return await apiRequest<InternalPurchaseOrder>(`/internal-purchase-orders/${id}`);
    } catch (error) {
      return handleApiError(error, "Failed to load Internal Purchase Order details");
    }
  },

  // Get Internal Purchase Order by PO Number
  getByNumber: async (poNumber: string): Promise<InternalPurchaseOrder> => {
    try {
      return await apiRequest<InternalPurchaseOrder>(`/internal-purchase-orders/number/${poNumber}`);
    } catch (error) {
      return handleApiError(error, "Failed to load Internal Purchase Order by number");
    }
  },

  // Create new Internal Purchase Order
  create: async (data: CreateIPORequest): Promise<InternalPurchaseOrder> => {
    try {
      const result = await apiRequest<InternalPurchaseOrder>('/internal-purchase-orders', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      showSuccessToast("Internal Purchase Order created successfully");
      return result;
    } catch (error) {
      return handleApiError(error, "Failed to create Internal Purchase Order");
    }
  },

  // Update Internal Purchase Order status
  updateStatus: async (id: string, data: UpdateIPOStatusRequest): Promise<InternalPurchaseOrder> => {
    try {
      const result = await apiRequest<InternalPurchaseOrder>(`/internal-purchase-orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      showSuccessToast("Internal Purchase Order status updated successfully");
      return result;
    } catch (error) {
      return handleApiError(error, "Failed to update Internal Purchase Order status");
    }
  },

  // Generate PDF for Internal Purchase Order
  generatePDF: async (id: string): Promise<void> => {
    try {
      const url = `${API_BASE_URL}/internal-purchase-orders/${id}/generate-pdf`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/pdf',
        },
      });
      
      if (!response.ok) {
        // Try to parse error as JSON
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      // Get the PDF blob
      const blob = await response.blob();
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'purchase-order.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      // Create download link and trigger download
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      showSuccessToast("Purchase Order PDF generated and downloaded successfully");
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Error",
        description: error instanceof ApiError ? error.message : "Failed to generate Purchase Order PDF",
        variant: "destructive",
      });
      throw error;
    }
  },

  // Send Internal Purchase Order via email
  sendEmail: async (id: string, supplierEmail: string): Promise<{ email_result: EmailResult; pdf_result: PDFGenerationResult }> => {
    try {
      const result = await apiRequest<{ email_result: EmailResult; pdf_result: PDFGenerationResult }>(`/internal-purchase-orders/${id}/send-email`, {
        method: 'POST',
        body: JSON.stringify({ supplier_email: supplierEmail }),
      });
      showSuccessToast("Purchase Order sent via email successfully");
      return result;
    } catch (error) {
      return handleApiError(error, "Failed to send Purchase Order email");
    }
  },

  // Generate PDF and send email in one action
  generateAndSend: async (id: string, supplierEmail: string): Promise<GenerateAndSendResult> => {
    try {
      const result = await apiRequest<GenerateAndSendResult>(`/internal-purchase-orders/${id}/generate-and-send`, {
        method: 'POST',
        body: JSON.stringify({ supplier_email: supplierEmail }),
      });
      showSuccessToast("Purchase Order PDF generated and sent successfully");
      return result;
    } catch (error) {
      return handleApiError(error, "Failed to generate and send Purchase Order");
    }
  },

  // Get Internal Purchase Order statistics
  getStats: async (): Promise<IPOStats> => {
    try {
      return await apiRequest<IPOStats>('/internal-purchase-orders/stats');
    } catch (error) {
      return handleApiError(error, "Failed to load Internal Purchase Order statistics");
    }
  },

  // Delete Internal Purchase Order
  delete: async (id: string): Promise<InternalPurchaseOrder> => {
    try {
      const result = await apiRequest<InternalPurchaseOrder>(`/internal-purchase-orders/${id}`, {
        method: 'DELETE',
      });
      showSuccessToast("Internal Purchase Order deleted successfully");
      return result;
    } catch (error) {
      return handleApiError(error, "Failed to delete Internal Purchase Order");
    }
  },

  // Test email configuration
  testEmail: async (testEmail: string): Promise<EmailResult> => {
    try {
      const result = await apiRequest<EmailResult>('/internal-purchase-orders/test-email', {
        method: 'POST',
        body: JSON.stringify({ test_email: testEmail }),
      });
      showSuccessToast("Test email sent successfully");
      return result;
    } catch (error) {
      return handleApiError(error, "Failed to send test email");
    }
  },

  // Verify email configuration
  verifyEmail: async (): Promise<{ success: boolean; message: string }> => {
    try {
      return await apiRequest<{ success: boolean; message: string }>('/internal-purchase-orders/verify-email');
    } catch (error) {
      return handleApiError(error, "Failed to verify email configuration");
    }
  }
};
