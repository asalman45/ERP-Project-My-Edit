// Sales Order API Service

import { apiRequest } from '@/services/api';
import type {
  SalesOrder,
  Customer,
  SalesOrderStats,
  CreateSalesOrderRequest,
  UpdateSalesOrderStatusRequest,
  SalesOrderFilters
} from './types';

const BASE_URL = '/sales-orders';

export const salesOrderApi = {
  // Sales Order CRUD operations
  create: async (data: CreateSalesOrderRequest): Promise<SalesOrder> => {
    return apiRequest<SalesOrder>(`${BASE_URL}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getAll: async (filters?: SalesOrderFilters): Promise<SalesOrder[]> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    const url = params.toString() ? `${BASE_URL}?${params.toString()}` : BASE_URL;
    return apiRequest<SalesOrder[]>(url);
  },

  getById: async (id: string): Promise<SalesOrder> => {
    return apiRequest<SalesOrder>(`${BASE_URL}/${id}`);
  },

  getByNumber: async (orderNumber: string): Promise<SalesOrder> => {
    return apiRequest<SalesOrder>(`${BASE_URL}/number/${orderNumber}`);
  },

  updateStatus: async (
    id: string,
    data: UpdateSalesOrderStatusRequest
  ): Promise<SalesOrder> => {
    return apiRequest<SalesOrder>(`${BASE_URL}/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  convertToWorkOrders: async (id: string, createdBy?: string): Promise<any> => {
    return apiRequest<any>(`${BASE_URL}/${id}/convert-to-work-orders`, {
      method: 'POST',
      body: JSON.stringify({ created_by: createdBy || 'system' }),
    });
  },

  delete: async (id: string): Promise<SalesOrder> => {
    return apiRequest<SalesOrder>(`${BASE_URL}/${id}`, {
      method: 'DELETE',
    });
  },

  // Statistics
  getStats: async (): Promise<SalesOrderStats> => {
    return apiRequest<SalesOrderStats>(`${BASE_URL}/stats`);
  },

  // Customer operations (OEMs from products)
  getCustomers: async (): Promise<Customer[]> => {
    // Get OEMs from products table and map them to customer format
    const response: any = await apiRequest<any>('/products');
    const products = response.data || response;
    
    // Extract unique OEMs from products and map to customer format
    const oemMap = new Map();
    products.forEach((product: any) => {
      if (product.oem_id && product.oem_name) {
        oemMap.set(product.oem_id, {
          customer_id: product.oem_id, // Use oem_id as customer_id
          customer_code: product.oem_id,
          company_name: product.oem_name,
          oem_name: product.oem_name,
          // Add a mapping to actual customer IDs for database compatibility
          mapped_customer_id: product.oem_name === 'Ghandhara Industries Ltd' ? 'CUST-000001' : 
                            product.oem_name === 'Hinopak' ? 'CUST-000002' : 'CUST-000003'
        });
      }
    });
    
    return Array.from(oemMap.values());
  },

  // Get products by OEM ID
  getProductsByOEM: async (oemId: string): Promise<any[]> => {
    const response: any = await apiRequest<any>('/products');
    const products = response.data || response;
    
    // Filter products by OEM ID
    const oemProducts = products.filter((p: any) => p.oem_id === oemId);
    
    // Map the product fields to match the expected format
    return oemProducts.map((p: any) => ({
      product_id: p.product_id,
      product_code: p.product_code,
      product_name: p.part_name,
      description: p.description,
      unit_price: p.standard_cost,
      unit_code: p.uom_code,
      unit_name: p.uom_name,
      model_name: p.model_name,
      oem_name: p.oem_name
    }));
  },

  createCustomer: async (data: Omit<Customer, 'customer_id' | 'customer_code' | 'created_at'>): Promise<Customer> => {
    return apiRequest<Customer>(`${BASE_URL}/customers`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Export sales orders
  exportSalesOrders: (queryParams: string): Promise<any> => {
    return fetch(`/api${BASE_URL}/export?${queryParams}`, {
      method: 'GET',
    }).then(async (response) => {
      if (!response.ok) {
        // Only try to parse JSON if content-type is JSON
        const contentType = response.headers.get('content-type');
        let errorData = {};
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json().catch(() => ({}));
        }
        throw new Error(
          errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/pdf')) {
        return response.arrayBuffer();
      }
      if (contentType && contentType.includes('text/csv')) {
        return response.text();
      }
      // Only parse as JSON if content-type indicates JSON
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      }
      // Fallback: return text for unknown content types
      return response.text();
    });
  },
};
