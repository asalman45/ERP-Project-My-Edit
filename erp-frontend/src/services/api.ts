// API service for connecting frontend with backend
// Use relative URL since Vite proxy will handle routing to backend
const API_BASE_URL = '/api';

// Debug logging to help identify URL issues
console.log('🌐 API Service initialized with base URL:', API_BASE_URL);

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

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Debug logging to track actual URLs being used
  console.log('🌐 API Request:', {
    url,
    method: options.method || 'GET',
    endpoint,
    apiBaseUrl: API_BASE_URL
  });
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const authToken = (typeof window !== 'undefined') ? localStorage.getItem('empclerp_token') : null;

  if (authToken) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${authToken}`,
    };
  }

  try {
    const response = await fetch(url, config);
    
    // Debug logging for response
    console.log('📡 API Response:', {
      url: response.url,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
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
    console.error('❌ API Request Failed:', {
      url,
      error: error.message,
      errorType: error.constructor.name
    });
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle network errors specifically
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError(
        'NetworkError when attempting to fetch resource. Please check if the backend server is running.',
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

export const authApi = {
  login: (credentials: { username: string; password: string }) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  me: () => apiRequest('/auth/me'),
};

// OEM API functions
export const oemApi = {
  // Get all OEMs
  getAll: (): Promise<any[]> => apiRequest('/oems'),
  
  // Get OEM by ID
  getById: (id: string): Promise<any> => apiRequest(`/oems/${id}`),
  
  // Create new OEM
  create: (data: { oem_name: string; country?: string }): Promise<any> =>
    apiRequest('/oems', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Update OEM
  update: (id: string, data: Partial<{ oem_name: string; country: string }>): Promise<any> =>
    apiRequest(`/oems/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  // Delete OEM
  delete: (id: string): Promise<void> =>
    apiRequest(`/oems/${id}`, {
      method: 'DELETE',
    }),
};

// Model API functions
export const modelApi = {
  // Get all models
  getAll: (): Promise<any[]> => apiRequest('/models'),
  
  // Get model by ID
  getById: (id: string): Promise<any> => apiRequest(`/models/${id}`),
  
  // Get models by OEM
  getByOEM: (oemId: string): Promise<any[]> => apiRequest(`/models/oem/${oemId}`),
  
  // Create new model
  create: (data: { model_name: string; oem_id: string; year?: string }): Promise<any> =>
    apiRequest('/models', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Update model
  update: (id: string, data: Partial<{ model_name: string; oem_id: string; year: string }>): Promise<any> =>
    apiRequest(`/models/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  // Delete model
  delete: (id: string): Promise<void> =>
    apiRequest(`/models/${id}`, {
      method: 'DELETE',
    }),
};

// UOM API functions
export const uomApi = {
  // Get all UOMs
  getAll: (): Promise<any[]> => apiRequest('/uoms'),
  
  // Get UOM by ID
  getById: (id: string): Promise<any> => apiRequest(`/uoms/${id}`),
  
  // Create new UOM
  create: (data: { code: string; name: string }): Promise<any> =>
    apiRequest('/uoms', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Update UOM
  update: (id: string, data: Partial<{ code: string; name: string }>): Promise<any> =>
    apiRequest(`/uoms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  // Delete UOM
  delete: (id: string): Promise<void> =>
    apiRequest(`/uoms/${id}`, {
      method: 'DELETE',
    }),
};

// Product API functions
export const productApi = {
  // Get all products with pagination
  getAll: (params?: { limit?: number; offset?: number }): Promise<any[]> => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    
    const queryString = searchParams.toString();
    return apiRequest(`/products${queryString ? `?${queryString}` : ''}`);
  },
  
  // Get product by ID
  getById: (id: string): Promise<any> => apiRequest(`/products/${id}`),
  
  // Create new product
  create: (data: {
    product_code: string;
    part_name: string;
    oem_id: string;
    model_id: string;
    uom_id: string;
    standard_cost?: number;
    category: string;
  }): Promise<any> =>
    apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Update product
  update: (id: string, data: Partial<{
    product_code: string;
    part_name: string;
    oem_id: string;
    model_id: string;
    uom_id: string;
    standard_cost: number;
    category: string;
  }>): Promise<any> =>
    apiRequest(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  // Delete product
  delete: (id: string): Promise<void> =>
    apiRequest(`/products/${id}`, {
      method: 'DELETE',
    }),

  // Export products data
  exportProducts: (queryParams: string): Promise<any> => {
    return fetch(`${API_BASE_URL}/products/export?${queryParams}`, {
      method: 'GET',
    }).then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }
      
      // Check if response is PDF
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/pdf')) {
        return response.arrayBuffer();
      }
      
      // For other formats, return as JSON
      return response.json();
    });
  },
};

// Data transformation functions to convert backend data to frontend format
export const dataTransformers = {
  // Transform OEM data from backend to frontend format
  oem: (backendOem: any) => ({
    id: backendOem.oem_id,
    name: backendOem.oem_name,
    createdAt: backendOem.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
  }),

  // Transform Model data from backend to frontend format
  model: (backendModel: any) => ({
    id: backendModel.model_id,
    name: backendModel.model_name,
    year: backendModel.year,
    oemId: backendModel.oem_id,
    oemName: backendModel.oem_name || '',
    createdAt: backendModel.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
  }),

  // Transform UOM data from backend to frontend format
  uom: (backendUom: any) => ({
    id: backendUom.uom_id,
    code: backendUom.code,
    name: backendUom.name,
    createdAt: backendUom.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
  }),

  // Transform Product data from backend to frontend format
  product: (backendProduct: any) => ({
    id: backendProduct.product_id,
    code: backendProduct.product_code,
    partName: backendProduct.part_name,
    oemId: backendProduct.oem_id,
    oemName: backendProduct.oem_name || '',
    modelId: backendProduct.model_id,
    modelName: backendProduct.model_name || '',
    uomId: backendProduct.uom_id,
    uomCode: backendProduct.uom_code || '',
    standardCost: backendProduct.standard_cost,
    category: backendProduct.category,
    createdAt: backendProduct.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
  }),
};

// Transform data for sending to backend
export const dataTransformersToBackend = {
  // Transform OEM data from frontend to backend format
  oem: (frontendOem: any) => ({
    oem_name: frontendOem.name,
    country: frontendOem.country,
  }),

  // Transform Model data from frontend to backend format
  model: (frontendModel: any) => ({
    model_name: frontendModel.name,
    oem_id: frontendModel.oemId,
    year: frontendModel.year,
  }),

  // Transform UOM data from frontend to backend format
  uom: (frontendUom: any) => ({
    code: frontendUom.code,
    name: frontendUom.name,
  }),

  // Transform Product data from frontend to backend format
  product: (frontendProduct: any) => ({
    product_code: frontendProduct.code,
    part_name: frontendProduct.partName,
    oem_id: frontendProduct.oemId,
    model_id: frontendProduct.modelId,
    uom_id: frontendProduct.uomId,
    standard_cost: frontendProduct.standardCost,
    category: frontendProduct.category,
  }),
};

// Scrap Management API functions
export const scrapApi = {
  // Get all scrap inventory
  getAll: (params?: { 
    status?: string; 
    location_id?: string; 
    material_id?: string; 
    limit?: number; 
    offset?: number 
  }): Promise<any[]> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.location_id) searchParams.set('location_id', params.location_id);
    if (params?.material_id) searchParams.set('material_id', params.material_id);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    
    const queryString = searchParams.toString();
    return apiRequest(`/scrap${queryString ? `?${queryString}` : ''}`);
  },
  
  // Get scrap by ID
  getById: (id: string): Promise<any> => apiRequest(`/scrap/${id}`),
  
  // Create new scrap
  create: (data: {
    blank_id?: string;
    material_id?: string;
    width_mm?: number;
    length_mm?: number;
    thickness_mm?: number;
    weight_kg: number;
    location_id?: string;
    status?: string;
    reference?: string;
    consumed_by_po?: string;
  }): Promise<any> =>
    apiRequest('/scrap', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Update scrap status
  updateStatus: (id: string, status: string): Promise<any> =>
    apiRequest(`/scrap/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  
  // Create scrap transaction
  createTransaction: (data: {
    scrap_id: string;
    txn_type: string;
    qty_used?: number;
    weight_kg?: number;
    reference?: string;
  }): Promise<any> =>
    apiRequest('/scrap/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Get scrap transactions
  getTransactions: (params?: {
    scrap_id?: string;
    txn_type?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> => {
    const searchParams = new URLSearchParams();
    if (params?.scrap_id) searchParams.set('scrap_id', params.scrap_id);
    if (params?.txn_type) searchParams.set('txn_type', params.txn_type);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    
    const queryString = searchParams.toString();
    return apiRequest(`/scrap/transactions/list${queryString ? `?${queryString}` : ''}`);
  },
  
  // Get scrap by location
  getByLocation: (locationId: string): Promise<any[]> => 
    apiRequest(`/scrap/location/${locationId}`),
  
  // Get scrap by material
  getByMaterial: (materialId: string): Promise<any[]> => 
    apiRequest(`/scrap/material/${materialId}`),
};

// Wastage Tracking API functions
export const wastageApi = {
  // Get all wastage records
  getAll: (params?: {
    wo_id?: string;
    material_id?: string;
    location_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> => {
    const searchParams = new URLSearchParams();
    if (params?.wo_id) searchParams.set('wo_id', params.wo_id);
    if (params?.material_id) searchParams.set('material_id', params.material_id);
    if (params?.location_id) searchParams.set('location_id', params.location_id);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    
    const queryString = searchParams.toString();
    return apiRequest(`/wastage${queryString ? `?${queryString}` : ''}`);
  },
  
  // Get wastage by ID
  getById: (id: string): Promise<any> => apiRequest(`/wastage/${id}`),
  
  // Create wastage record
  create: (data: {
    wo_id: string;
    step_id?: string;
    material_id: string;
    quantity: number;
    uom_id?: string;
    location_id?: string;
    reason?: string;
  }): Promise<any> =>
    apiRequest('/wastage', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Update wastage record
  update: (id: string, data: {
    quantity?: number;
    uom_id?: string;
    location_id?: string;
    reason?: string;
  }): Promise<any> =>
    apiRequest(`/wastage/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  
  // Get wastage by work order
  getByWorkOrder: (woId: string): Promise<any[]> => 
    apiRequest(`/wastage/work-order/${woId}`),
  
  // Get wastage by material
  getByMaterial: (materialId: string): Promise<any[]> => 
    apiRequest(`/wastage/material/${materialId}`),
  
  // Get wastage summary
  getSummary: (params?: {
    start_date?: string;
    end_date?: string;
    material_id?: string;
    wo_id?: string;
  }): Promise<any[]> => {
    const searchParams = new URLSearchParams();
    if (params?.start_date) searchParams.set('start_date', params.start_date);
    if (params?.end_date) searchParams.set('end_date', params.end_date);
    if (params?.material_id) searchParams.set('material_id', params.material_id);
    if (params?.wo_id) searchParams.set('wo_id', params.wo_id);
    
    const queryString = searchParams.toString();
    return apiRequest(`/wastage/summary${queryString ? `?${queryString}` : ''}`);
  },
};

// Scrap Reuse API functions
export const scrapReuseApi = {
  // Reuse scrap into stock
  reuse: (data: {
    scrap_id: string;
    quantity_to_reuse: number;
    location_id?: string;
    reference?: string;
  }): Promise<any> =>
    apiRequest('/scrap-reuse/reuse', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Get reusable scrap
  getReusable: (materialId: string, locationId?: string): Promise<any[]> => {
    const endpoint = locationId 
      ? `/scrap-reuse/reusable/${materialId}/${locationId}`
      : `/scrap-reuse/reusable/${materialId}`;
    return apiRequest(endpoint);
  },
  
  // Get scrap reuse history
  getHistory: (params?: {
    material_id?: string;
    location_id?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> => {
    const searchParams = new URLSearchParams();
    if (params?.material_id) searchParams.set('material_id', params.material_id);
    if (params?.location_id) searchParams.set('location_id', params.location_id);
    if (params?.start_date) searchParams.set('start_date', params.start_date);
    if (params?.end_date) searchParams.set('end_date', params.end_date);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    
    const queryString = searchParams.toString();
    return apiRequest(`/scrap-reuse/history${queryString ? `?${queryString}` : ''}`);
  },
  
  // Get scrap reuse savings
  getSavings: (params?: {
    start_date?: string;
    end_date?: string;
    material_id?: string;
  }): Promise<any[]> => {
    const searchParams = new URLSearchParams();
    if (params?.start_date) searchParams.set('start_date', params.start_date);
    if (params?.end_date) searchParams.set('end_date', params.end_date);
    if (params?.material_id) searchParams.set('material_id', params.material_id);
    
    const queryString = searchParams.toString();
    return apiRequest(`/scrap-reuse/savings${queryString ? `?${queryString}` : ''}`);
  },
};

// Stock Adjustment API functions
export const stockAdjustmentApi = {
  // Adjust stock
  adjust: (data: {
    product_id?: string;
    material_id?: string;
    quantity: number;
    adjustment_type: 'INCREASE' | 'DECREASE' | 'SET';
    reason: string;
    location_id?: string;
    reference?: string;
  }): Promise<any> =>
    apiRequest('/stock-adjustment/adjust', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Get adjustment history
  getHistory: (params?: {
    product_id?: string;
    material_id?: string;
    location_id?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> => {
    const searchParams = new URLSearchParams();
    if (params?.product_id) searchParams.set('product_id', params.product_id);
    if (params?.material_id) searchParams.set('material_id', params.material_id);
    if (params?.location_id) searchParams.set('location_id', params.location_id);
    if (params?.start_date) searchParams.set('start_date', params.start_date);
    if (params?.end_date) searchParams.set('end_date', params.end_date);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    
    const queryString = searchParams.toString();
    return apiRequest(`/stock-adjustment/history${queryString ? `?${queryString}` : ''}`);
  },
  
  // Get stock levels
  getLevels: (params?: {
    product_id?: string;
    material_id?: string;
    location_id?: string;
    low_stock_only?: boolean;
  }): Promise<any[]> => {
    const searchParams = new URLSearchParams();
    if (params?.product_id) searchParams.set('product_id', params.product_id);
    if (params?.material_id) searchParams.set('material_id', params.material_id);
    if (params?.location_id) searchParams.set('location_id', params.location_id);
    if (params?.low_stock_only) searchParams.set('low_stock_only', params.low_stock_only.toString());
    
    const queryString = searchParams.toString();
    return apiRequest(`/stock-adjustment/levels${queryString ? `?${queryString}` : ''}`);
  },
  
  // Get stock movement report
  getMovementReport: (params?: {
    product_id?: string;
    material_id?: string;
    location_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<any[]> => {
    const searchParams = new URLSearchParams();
    if (params?.product_id) searchParams.set('product_id', params.product_id);
    if (params?.material_id) searchParams.set('material_id', params.material_id);
    if (params?.location_id) searchParams.set('location_id', params.location_id);
    if (params?.start_date) searchParams.set('start_date', params.start_date);
    if (params?.end_date) searchParams.set('end_date', params.end_date);
    
    const queryString = searchParams.toString();
    return apiRequest(`/stock-adjustment/movement-report${queryString ? `?${queryString}` : ''}`);
  },
};

// Production Tracking API functions
export const productionTrackingApi = {
  // Record material usage
  recordMaterialUsage: (data: {
    production_id: string;
    material_id?: string;
    scrap_id?: string;
    qty_issued: number;
    uom_id?: string;
  }): Promise<any> =>
    apiRequest('/production-tracking/material-usage', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Update production step
  updateStep: (stepId: string, data: {
    completed_qty?: number;
    status?: string;
    start_time?: string;
    end_time?: string;
    remarks?: string;
  }): Promise<any> =>
    apiRequest(`/production-tracking/steps/${stepId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  
  // Get production progress
  getProgress: (productionId: string): Promise<any> =>
    apiRequest(`/production-tracking/${productionId}/progress`),
  
  // Get production orders
  getOrders: (params?: {
    status?: string;
    product_id?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.product_id) searchParams.set('product_id', params.product_id);
    if (params?.start_date) searchParams.set('start_date', params.start_date);
    if (params?.end_date) searchParams.set('end_date', params.end_date);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    
    const queryString = searchParams.toString();
    return apiRequest(`/production-tracking/orders${queryString ? `?${queryString}` : ''}`);
  },
  
  // Get production efficiency
  getEfficiency: (params?: {
    start_date?: string;
    end_date?: string;
    product_id?: string;
  }): Promise<any[]> => {
    const searchParams = new URLSearchParams();
    if (params?.start_date) searchParams.set('start_date', params.start_date);
    if (params?.end_date) searchParams.set('end_date', params.end_date);
    if (params?.product_id) searchParams.set('product_id', params.product_id);
    
    const queryString = searchParams.toString();
    return apiRequest(`/production-tracking/efficiency${queryString ? `?${queryString}` : ''}`);
  },
};

// Legacy Reports API functions (kept for backward compatibility)
export const legacyReportsApi = {
  // Generate wastage report
  getWastageReport: (params?: {
    start_date?: string;
    end_date?: string;
    material_id?: string;
    wo_id?: string;
    location_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<any> => {
    const searchParams = new URLSearchParams();
    if (params?.start_date) searchParams.set('start_date', params.start_date);
    if (params?.end_date) searchParams.set('end_date', params.end_date);
    if (params?.material_id) searchParams.set('material_id', params.material_id);
    if (params?.wo_id) searchParams.set('wo_id', params.wo_id);
    if (params?.location_id) searchParams.set('location_id', params.location_id);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    
    const queryString = searchParams.toString();
    return apiRequest(`/reports/wastage${queryString ? `?${queryString}` : ''}`);
  },
  
  // Generate scrap report
  getScrapReport: (params?: {
    start_date?: string;
    end_date?: string;
    material_id?: string;
    location_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<any> => {
    const searchParams = new URLSearchParams();
    if (params?.start_date) searchParams.set('start_date', params.start_date);
    if (params?.end_date) searchParams.set('end_date', params.end_date);
    if (params?.material_id) searchParams.set('material_id', params.material_id);
    if (params?.location_id) searchParams.set('location_id', params.location_id);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    
    const queryString = searchParams.toString();
    return apiRequest(`/reports/scrap${queryString ? `?${queryString}` : ''}`);
  },
  
  // Generate inventory report
  getInventoryReport: (params?: {
    product_id?: string;
    material_id?: string;
    location_id?: string;
    low_stock_only?: boolean;
  }): Promise<any> => {
    const searchParams = new URLSearchParams();
    if (params?.product_id) searchParams.set('product_id', params.product_id);
    if (params?.material_id) searchParams.set('material_id', params.material_id);
    if (params?.location_id) searchParams.set('location_id', params.location_id);
    if (params?.low_stock_only) searchParams.set('low_stock_only', params.low_stock_only.toString());
    
    const queryString = searchParams.toString();
    return apiRequest(`/reports/inventory${queryString ? `?${queryString}` : ''}`);
  },
  
  // Generate production report
  getProductionReport: (params?: {
    start_date?: string;
    end_date?: string;
    product_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<any> => {
    const searchParams = new URLSearchParams();
    if (params?.start_date) searchParams.set('start_date', params.start_date);
    if (params?.end_date) searchParams.set('end_date', params.end_date);
    if (params?.product_id) searchParams.set('product_id', params.product_id);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    
    const queryString = searchParams.toString();
    return apiRequest(`/reports/production${queryString ? `?${queryString}` : ''}`);
  },
  
  // Generate cost analysis report
  getCostAnalysisReport: (params?: {
    start_date?: string;
    end_date?: string;
    product_id?: string;
    material_id?: string;
  }): Promise<any> => {
    const searchParams = new URLSearchParams();
    if (params?.start_date) searchParams.set('start_date', params.start_date);
    if (params?.end_date) searchParams.set('end_date', params.end_date);
    if (params?.product_id) searchParams.set('product_id', params.product_id);
    if (params?.material_id) searchParams.set('material_id', params.material_id);
    
    const queryString = searchParams.toString();
    return apiRequest(`/reports/cost-analysis${queryString ? `?${queryString}` : ''}`);
  },
};

// Material API functions
export const materialApi = {
  // Get all materials
  getAll: (): Promise<any[]> => apiRequest('/materials'),
  
  // Get material by ID
  getById: (id: string): Promise<any> => apiRequest(`/materials/${id}`),
  
  // Create new material
  create: (data: { name: string; code: string; category: string }): Promise<any> =>
    apiRequest('/materials', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Update material
  update: (id: string, data: Partial<{ name: string; code: string; category: string }>): Promise<any> =>
    apiRequest(`/materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  // Delete material
  delete: (id: string): Promise<void> =>
    apiRequest(`/materials/${id}`, {
      method: 'DELETE',
    }),
};

// Raw Material API functions
export const rawMaterialApi = {
  // Get all raw materials
  getAll: (): Promise<any[]> => apiRequest('/raw-materials'),
  
  // Get raw material by ID
  getById: (id: string): Promise<any> => apiRequest(`/raw-materials/${id}`),
  
  // Create new raw material
  create: (data: { 
    material_code: string; 
    name: string; 
    description?: string;
    uom_id?: string;
  }): Promise<any> =>
    apiRequest('/raw-materials', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Update raw material
  update: (id: string, data: Partial<{ 
    name: string; 
    description?: string;
    uom_id?: string;
  }>): Promise<any> =>
    apiRequest(`/raw-materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  // Delete raw material
  delete: (id: string): Promise<void> =>
    apiRequest(`/raw-materials/${id}`, {
      method: 'DELETE',
    }),

  // Export raw materials data
  exportRawMaterials: (queryParams: string): Promise<any> => {
    return fetch(`${API_BASE_URL}/raw-materials/export?${queryParams}`, {
      method: 'GET',
    }).then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }
      
      // Always return as JSON since backend returns JSON
      return response.json();
    });
  },

  // Import raw materials from CSV/Excel
  importRawMaterials: (formData: FormData): Promise<any> => {
    return fetch(`${API_BASE_URL}/raw-materials/import`, {
      method: 'POST',
      body: formData,
    }).then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }
      return response.json();
    });
  },
};

// Location API functions
export const locationApi = {
  // Get all locations
  getAll: (): Promise<any[]> => apiRequest('/locations'),
  
  // Get location by ID
  getById: (id: string): Promise<any> => apiRequest(`/locations/${id}`),
  
  // Create new location
  create: (data: { code: string; name: string; type: string }): Promise<any> =>
    apiRequest('/locations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Update location
  update: (id: string, data: Partial<{ code: string; name: string; type: string }>): Promise<any> =>
    apiRequest(`/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  // Delete location
  delete: (id: string): Promise<void> =>
    apiRequest(`/locations/${id}`, {
      method: 'DELETE',
    }),
};

// Work Order API functions
export const workOrderApi = {
  // Get all work orders
  getAll: (params?: { limit?: number; offset?: number }): Promise<any[]> => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    
    const queryString = searchParams.toString();
    return apiRequest(`/work-orders${queryString ? `?${queryString}` : ''}`);
  },
  
  // Get work order by ID
  getById: (id: string): Promise<any> => apiRequest(`/work-orders/${id}`),
  
  // Create new work order
  create: (data: {
    wo_no: string;
    product_id: string;
    quantity: number;
    priority: number;
    scheduled_start?: string;
    scheduled_end?: string;
    status: string;
  }): Promise<any> =>
    apiRequest('/work-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Update work order
  update: (id: string, data: Partial<{
    wo_no: string;
    product_id: string;
    quantity: number;
    priority: number;
    scheduled_start: string;
    scheduled_end: string;
    status: string;
  }>): Promise<any> =>
    apiRequest(`/work-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  // Delete work order
  delete: (id: string): Promise<void> =>
    apiRequest(`/work-orders/${id}`, {
      method: 'DELETE',
    }),

  // Export work orders
  exportWorkOrders: (queryParams: string): Promise<any> => {
    return fetch(`${API_BASE_URL}/hierarchical-work-order/export?${queryParams}`, {
      method: 'GET',
    }).then(async (response) => {
      if (!response.ok) {
        // Only try to parse JSON if content-type is JSON
        const contentType = response.headers.get('content-type');
        let errorData = {};
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json().catch(() => ({}));
        }
        throw new ApiError(
          errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
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

// Purchase Order API functions
export const purchaseOrderApi = {
  // Get all purchase orders
  getAll: (params?: { 
    limit?: number; 
    offset?: number; 
    supplier_id?: string; 
    status?: string 
  }): Promise<any[]> => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    if (params?.supplier_id) searchParams.set('supplier_id', params.supplier_id);
    if (params?.status) searchParams.set('status', params.status);
    
    const queryString = searchParams.toString();
    return apiRequest(`/purchase-orders${queryString ? `?${queryString}` : ''}`);
  },
  
  // Get purchase order by ID
  getById: (id: string): Promise<any> => apiRequest(`/purchase-orders/${id}`),
  
  // Create new purchase order
  create: (data: {
    po_no: string;
    supplier_id: string;
    pr_id?: string;
    status: string;
    order_date: string;
    expected_delivery?: string;
    total_amount?: number;
    notes?: string;
  }): Promise<any> =>
    apiRequest('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Update purchase order
  update: (id: string, data: Partial<{
    po_no: string;
    supplier_id: string;
    pr_id: string;
    status: string;
    order_date: string;
    expected_delivery: string;
    total_amount: number;
    notes: string;
  }>): Promise<any> =>
    apiRequest(`/purchase-orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  
  // Update purchase order status
  updateStatus: (id: string, status: string): Promise<any> =>
    apiRequest(`/purchase-orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  
  // Delete purchase order
  delete: (id: string): Promise<void> =>
    apiRequest(`/purchase-orders/${id}`, {
      method: 'DELETE',
    }),
  
  // Get PO items
  getItems: (poId: string): Promise<any[]> => 
    apiRequest(`/purchase-orders/${poId}/items`),
  
  // Add PO item
  addItem: (poId: string, data: {
    product_id?: string;
    material_id?: string;
    quantity: number;
    unit_price: number;
    uom_id?: string;
    notes?: string;
  }): Promise<any> =>
    apiRequest(`/purchase-orders/${poId}/items`, {
      method: 'POST',
      body: JSON.stringify({ ...data, po_id: poId }),
    }),
  
  // Update PO item
  updateItem: (itemId: string, data: {
    quantity?: number;
    unit_price?: number;
    notes?: string;
  }): Promise<any> =>
    apiRequest(`/purchase-orders/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  
  // Delete PO item
  deleteItem: (itemId: string): Promise<void> =>
    apiRequest(`/purchase-orders/items/${itemId}`, {
      method: 'DELETE',
    }),
};

// Supplier API functions
export const supplierApi = {
  // Get all suppliers
  getAll: (): Promise<any[]> => apiRequest('/suppliers'),
  
  // Get supplier by ID
  getById: (id: string): Promise<any> => apiRequest(`/suppliers/${id}`),
  
  // Create new supplier
  create: (data: {
    code: string;
    name: string;
    contact?: string;
    phone?: string;
    email?: string;
    address?: string;
    lead_time_days?: number;
  }): Promise<any> =>
    apiRequest('/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Update supplier
  update: (id: string, data: Partial<{
    supplier_name: string;
    contact_person: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    gst_no: string;
    payment_terms: string;
  }>): Promise<any> =>
    apiRequest(`/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  // Delete supplier
  delete: (id: string): Promise<void> =>
    apiRequest(`/suppliers/${id}`, {
      method: 'DELETE',
    }),

  // Export suppliers data
  exportSuppliers: (queryParams: string): Promise<any> => {
    return fetch(`${API_BASE_URL}/suppliers/export?${queryParams}`, {
      method: 'GET',
    }).then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }
      
      // Check if response is PDF
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/pdf')) {
        return response.arrayBuffer();
      }
      
      // For other formats, return as JSON
      return response.json();
    });
  },

  // Import suppliers via CSV/Excel upload
  importSuppliers: (formData: FormData): Promise<any> =>
    fetch(`${API_BASE_URL}/suppliers/import`, {
      method: 'POST',
      body: formData,
    }).then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }
      return response.json();
    }),
};

// Inventory API functions
export const inventoryApi = {
  // Get all inventory items
  getAll: (params?: { 
    limit?: number; 
    offset?: number; 
    product_id?: string; 
    material_id?: string;
    location_id?: string;
  }): Promise<any[]> => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    if (params?.product_id) searchParams.set('product_id', params.product_id);
    if (params?.material_id) searchParams.set('material_id', params.material_id);
    if (params?.location_id) searchParams.set('location_id', params.location_id);
    
    const queryString = searchParams.toString();
    return apiRequest(`/inventory${queryString ? `?${queryString}` : ''}`);
  },
  
  // Get inventory by ID
  getById: (id: string): Promise<any> => apiRequest(`/inventory/${id}`),
  
  // Get inventory transactions
  getTransactions: (params?: {
    limit?: number;
    offset?: number;
    txn_type?: string;
    product_id?: string;
    material_id?: string;
    location_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<any[]> => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    if (params?.txn_type) searchParams.set('txn_type', params.txn_type);
    if (params?.product_id) searchParams.set('product_id', params.product_id);
    if (params?.material_id) searchParams.set('material_id', params.material_id);
    if (params?.location_id) searchParams.set('location_id', params.location_id);
    if (params?.start_date) searchParams.set('start_date', params.start_date);
    if (params?.end_date) searchParams.set('end_date', params.end_date);
    
    const queryString = searchParams.toString();
    return apiRequest(`/inventory/transactions${queryString ? `?${queryString}` : ''}`);
  },
  
  // Create inventory transaction
  createTransaction: (data: {
    product_id?: string;
    material_id?: string;
    txn_type: string;
    quantity: number;
    location_id?: string;
    reference?: string;
    notes?: string;
  }): Promise<any> =>
    apiRequest('/inventory/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Get inventory levels
  getLevels: (params?: {
    product_id?: string;
    material_id?: string;
    location_id?: string;
  }): Promise<any[]> => {
    const searchParams = new URLSearchParams();
    if (params?.product_id) searchParams.set('product_id', params.product_id);
    if (params?.material_id) searchParams.set('material_id', params.material_id);
    if (params?.location_id) searchParams.set('location_id', params.location_id);
    
    const queryString = searchParams.toString();
    return apiRequest(`/inventory/levels${queryString ? `?${queryString}` : ''}`);
  },

  // === NEW COMPREHENSIVE INVENTORY MANAGEMENT API ENDPOINTS ===
  
  // Stock In Operations
  stockIn: (data: {
    material_id: string;
    quantity: number;
    location_id: string;
    po_id?: string;
    batch_no?: string;
    unit_cost?: number;
    reference?: string;
    created_by?: string;
  }): Promise<any> => {
    return apiRequest('/inventory/stock-in', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getStockInHistory: (params?: {
    limit?: number;
    offset?: number;
    material_id?: string;
    location_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<any[]> => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    if (params?.material_id) searchParams.set('material_id', params.material_id);
    if (params?.location_id) searchParams.set('location_id', params.location_id);
    if (params?.start_date) searchParams.set('start_date', params.start_date);
    if (params?.end_date) searchParams.set('end_date', params.end_date);
    
    const queryString = searchParams.toString();
    return apiRequest(`/inventory/stock-in/history${queryString ? `?${queryString}` : ''}`);
  },

  // Stock Out Operations
  stockOut: (data: {
    material_id: string;
    quantity: number;
    location_id: string;
    wo_id?: string;
    reference?: string;
    notes?: string;
    created_by?: string;
  }): Promise<any> => {
    return apiRequest('/inventory/stock-out', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  bulkStockOut: (data: {
    items: Array<{
      material_id: string;
      quantity: number;
      location_id: string;
    }>;
    wo_id?: string;
    reference?: string;
    notes?: string;
    created_by?: string;
  }): Promise<any> => {
    return apiRequest('/inventory/stock-out/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getStockOutHistory: (params?: {
    limit?: number;
    offset?: number;
    material_id?: string;
    location_id?: string;
    wo_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<any[]> => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    if (params?.material_id) searchParams.set('material_id', params.material_id);
    if (params?.location_id) searchParams.set('location_id', params.location_id);
    if (params?.wo_id) searchParams.set('wo_id', params.wo_id);
    if (params?.start_date) searchParams.set('start_date', params.start_date);
    if (params?.end_date) searchParams.set('end_date', params.end_date);
    
    const queryString = searchParams.toString();
    return apiRequest(`/inventory/stock-out/history${queryString ? `?${queryString}` : ''}`);
  },

  // Wastage Management
  recordWastage: (data: {
    material_id: string;
    quantity: number;
    location_id: string;
    wo_id?: string;
    reason: string;
    reference?: string;
    notes?: string;
    created_by?: string;
  }): Promise<any> => {
    return apiRequest('/inventory/wastage', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  reentryWastage: (data: {
    wastage_id: string;
    quantity: number;
    location_id: string;
    reference?: string;
    notes?: string;
    created_by?: string;
  }): Promise<any> => {
    return apiRequest('/inventory/wastage/reentry', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getWastageRecords: (params?: {
    limit?: number;
    offset?: number;
    material_id?: string;
    location_id?: string;
    wo_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<any[]> => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    if (params?.material_id) searchParams.set('material_id', params.material_id);
    if (params?.location_id) searchParams.set('location_id', params.location_id);
    if (params?.wo_id) searchParams.set('wo_id', params.wo_id);
    if (params?.start_date) searchParams.set('start_date', params.start_date);
    if (params?.end_date) searchParams.set('end_date', params.end_date);
    
    const queryString = searchParams.toString();
    return apiRequest(`/inventory/wastage${queryString ? `?${queryString}` : ''}`);
  },

  getWastageSummary: (): Promise<any> => {
    return apiRequest('/inventory/wastage/summary');
  },

  // Finished Goods Management
  receiveFinishedGoods: (data: {
    product_id: string;
    quantity: number;
    location_id: string;
    wo_id?: string;
    batch_no?: string;
    reference?: string;
    notes?: string;
    created_by?: string;
  }): Promise<any> => {
    return apiRequest('/inventory/finished-goods', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  bulkReceiveFinishedGoods: (data: {
    items: Array<{
      product_id: string;
      quantity: number;
      location_id: string;
    }>;
    wo_id?: string;
    reference?: string;
    notes?: string;
    created_by?: string;
  }): Promise<any> => {
    return apiRequest('/inventory/finished-goods/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getFinishedGoods: (params?: {
    limit?: number;
    offset?: number;
    product_id?: string;
    location_id?: string;
    wo_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<any[]> => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    if (params?.product_id) searchParams.set('product_id', params.product_id);
    if (params?.location_id) searchParams.set('location_id', params.location_id);
    if (params?.wo_id) searchParams.set('wo_id', params.wo_id);
    if (params?.start_date) searchParams.set('start_date', params.start_date);
    if (params?.end_date) searchParams.set('end_date', params.end_date);
    
    const queryString = searchParams.toString();
    return apiRequest(`/inventory/finished-goods${queryString ? `?${queryString}` : ''}`);
  },

  getFinishedGoodsHistory: (params?: {
    limit?: number;
    offset?: number;
    product_id?: string;
    location_id?: string;
    wo_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<any[]> => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    if (params?.product_id) searchParams.set('product_id', params.product_id);
    if (params?.location_id) searchParams.set('location_id', params.location_id);
    if (params?.wo_id) searchParams.set('wo_id', params.wo_id);
    if (params?.start_date) searchParams.set('start_date', params.start_date);
    if (params?.end_date) searchParams.set('end_date', params.end_date);
    
    const queryString = searchParams.toString();
    return apiRequest(`/inventory/finished-goods/history${queryString ? `?${queryString}` : ''}`);
  },

  // Re-entry Operations
  reentryWastageFromReentry: (data: {
    wastage_id: string;
    quantity: number;
    location_id: string;
    reference?: string;
    notes?: string;
    created_by?: string;
  }): Promise<any> => {
    return apiRequest('/inventory/reentry', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  bulkReentryWastage: (data: {
    items: Array<{
      wastage_id: string;
      quantity: number;
      location_id: string;
    }>;
    reference?: string;
    notes?: string;
    created_by?: string;
  }): Promise<any> => {
    return apiRequest('/inventory/reentry/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getReentryHistory: (params?: {
    limit?: number;
    offset?: number;
    material_id?: string;
    location_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<any[]> => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    if (params?.material_id) searchParams.set('material_id', params.material_id);
    if (params?.location_id) searchParams.set('location_id', params.location_id);
    if (params?.start_date) searchParams.set('start_date', params.start_date);
    if (params?.end_date) searchParams.set('end_date', params.end_date);
    
    const queryString = searchParams.toString();
    return apiRequest(`/inventory/reentry/history${queryString ? `?${queryString}` : ''}`);
  },

  getAvailableWastageForReentry: (params?: {
    limit?: number;
    offset?: number;
    material_id?: string;
    location_id?: string;
  }): Promise<any[]> => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    if (params?.material_id) searchParams.set('material_id', params.material_id);
    if (params?.location_id) searchParams.set('location_id', params.location_id);
    
    const queryString = searchParams.toString();
    return apiRequest(`/inventory/reentry/available${queryString ? `?${queryString}` : ''}`);
  },

  // Current Stock Operations
  getCurrentStock: (materialId: string, locationId?: string): Promise<any> => {
    // Use the specific endpoint for getting current stock of a material
    const params = new URLSearchParams();
    params.set('item_id', materialId);
    params.set('item_type', 'material');
    if (locationId) {
      params.set('location_id', locationId);
    }
    return apiRequest(`/inventory/current-stock?${params.toString()}`);
  },

  getAllCurrentStock: (params?: {
    limit?: number;
    offset?: number;
    item_type?: string;
    location_id?: string;
    min_quantity?: number;
    max_quantity?: number;
  }): Promise<any[]> => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    if (params?.item_type) searchParams.set('item_type', params.item_type);
    if (params?.location_id) searchParams.set('location_id', params.location_id);
    if (params?.min_quantity) searchParams.set('min_quantity', params.min_quantity.toString());
    if (params?.max_quantity) searchParams.set('max_quantity', params.max_quantity.toString());
    
    const queryString = searchParams.toString();
    return apiRequest(`/inventory/current-stock/all${queryString ? `?${queryString}` : ''}`);
  },

  getInventorySummary: (): Promise<any> => {
    return apiRequest('/inventory/current-stock/summary');
  },

  getLowStockItems: (params?: {
    limit?: number;
    offset?: number;
  }): Promise<any[]> => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    
    const queryString = searchParams.toString();
    return apiRequest(`/inventory/current-stock/low-stock${queryString ? `?${queryString}` : ''}`);
  },

  getZeroStockItems: (params?: {
    limit?: number;
    offset?: number;
  }): Promise<any[]> => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    
    const queryString = searchParams.toString();
    return apiRequest(`/inventory/current-stock/zero-stock${queryString ? `?${queryString}` : ''}`);
  },

  getHealthStatus: (): Promise<any> => {
    return apiRequest('/inventory/health');
  },

  // Import inventory data from CSV/Excel
  importInventory: (formData: FormData): Promise<any> => {
    return fetch(`${API_BASE_URL}/inventory/import`, {
      method: 'POST',
      body: formData,
    }).then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }
      return response.json();
    });
  },

  // Export inventory data
  exportInventory: (queryParams: string): Promise<any> => {
    return fetch(`${API_BASE_URL}/inventory/export?${queryParams}`, {
      method: 'GET',
    }).then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }
      
      // Check if response is PDF
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/pdf')) {
        return response.arrayBuffer();
      }
      
      // For other formats, return as JSON
      return response.json();
    });
  },
};

// Finished Goods API
export const finishedGoodsApi = {
  // Export finished goods data
  exportFinishedGoods: (queryParams: string): Promise<any> => {
    return fetch(`${API_BASE_URL}/inventory/finished-goods/export?${queryParams}`, {
      method: 'GET',
    }).then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }
      
      // Check if response is CSV
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/csv')) {
        return response.text();
      }
      
      // For other formats, return as JSON
      return response.json();
    });
  },
};

// Procurement Request API
export const procurementRequestApi = {
  create: (data: {
    material_id: string;
    quantity: number;
    requested_by: string;
    notes?: string;
    reference_po?: string;
  }): Promise<any> => {
    return apiRequest('/procurement', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getAll: (params?: {
    status?: string;
    material_id?: string;
    requested_by?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.material_id) searchParams.set('material_id', params.material_id);
    if (params?.requested_by) searchParams.set('requested_by', params.requested_by);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    
    const queryString = searchParams.toString();
    return apiRequest(`/procurement${queryString ? `?${queryString}` : ''}`);
  },

  getById: (id: string): Promise<any> => {
    return apiRequest(`/procurement/${id}`);
  },

  updateStatus: (id: string, status: string, updatedBy: string, rejectionReason?: string): Promise<any> => {
    return apiRequest(`/procurement/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, updated_by: updatedBy, rejection_reason: rejectionReason }),
    });
  },

  getByStatus: (status: string): Promise<any[]> => {
    return apiRequest(`/procurement/status/${status}`);
  },

  getStats: (): Promise<any> => {
    return apiRequest('/procurement/stats');
  },

  // Export procurement data
  exportProcurement: (queryParams: string): Promise<any> => {
    return fetch(`${API_BASE_URL}/procurement/export?${queryParams}`, {
      method: 'GET',
    }).then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }
      
      // Check if response is PDF
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/pdf')) {
        return response.arrayBuffer();
      }
      
      // For other formats, return as blob
      return response.blob();
    });
  },
};

// Generic API client for dashboard and other services
export const api = {
  get: async <T = any>(endpoint: string): Promise<{ data: T }> => {
    const data = await apiRequest<T>(endpoint);
    return { data };
  },
  post: async <T = any>(endpoint: string, body?: any): Promise<{ data: T }> => {
    const data = await apiRequest<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
    return { data };
  },
  put: async <T = any>(endpoint: string, body?: any): Promise<{ data: T }> => {
    const data = await apiRequest<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
    return { data };
  },
  delete: async <T = any>(endpoint: string): Promise<{ data: T }> => {
    const data = await apiRequest<T>(endpoint, {
      method: 'DELETE',
    });
    return { data };
  },
};

// Comprehensive Reports API functions
export const reportsApi = {
  // Generate Production Report
  generateProductionReport: (params: any = {}): Promise<Blob> => {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = `/reports/production${queryParams ? `?${queryParams}` : ''}`;
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
    }).then(response => {
      if (!response.ok) {
        throw new Error(`Production report failed: ${response.statusText}`);
      }
      return response.blob();
    });
  },

  // Generate Scrap Management Report
  generateScrapReport: (params: any = {}): Promise<Blob> => {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = `/reports/scrap${queryParams ? `?${queryParams}` : ''}`;
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
    }).then(response => {
      if (!response.ok) {
        throw new Error(`Scrap report failed: ${response.statusText}`);
      }
      return response.blob();
    });
  },

  // Generate Inventory Report
  generateInventoryReport: (params: any = {}): Promise<Blob> => {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = `/reports/inventory${queryParams ? `?${queryParams}` : ''}`;
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
    }).then(response => {
      if (!response.ok) {
        throw new Error(`Inventory report failed: ${response.statusText}`);
      }
      return response.blob();
    });
  },

  // Generate Cost Analysis Report
  generateCostAnalysisReport: (params: any = {}): Promise<Blob> => {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = `/reports/cost-analysis${queryParams ? `?${queryParams}` : ''}`;
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
    }).then(response => {
      if (!response.ok) {
        throw new Error(`Cost analysis report failed: ${response.statusText}`);
      }
      return response.blob();
    });
  },

  // Download report as file
  downloadReport: async (reportType: string, format: 'pdf' | 'excel', params: any = {}) => {
    try {
      const queryParams = new URLSearchParams(params);
      if (queryParams.toString().length === 0) {
        queryParams.set('format', format);
      }
      const endpoint = `/reports/${reportType}?${queryParams}`;
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true };
    } catch (error) {
      console.error('Download failed:', error);
      throw new Error('Download failed');
    }
  }
};

// BOM API functions
export const bomApi = {
  // Get BOM with sub-assemblies
  getWithSubAssemblies: (productId: string): Promise<any> =>
    apiRequest(`/bom/${productId}/sub-assemblies`),
  
  // Add sub-assembly to BOM
  addSubAssembly: (productId: string, data: {
    material_id: string;
    quantity: number;
    sub_assembly_name: string;
    step_sequence?: number;
    is_optional?: boolean;
    uom_id?: string;
  }): Promise<any> =>
    apiRequest(`/bom/${productId}/sub-assemblies`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Calculate material consumption
  calculateConsumption: (productId: string, data: {
    sheetType: string;
    sheetWidth: number;
    sheetLength: number;
  }): Promise<any> =>
    apiRequest(`/bom/${productId}/calculate-consumption`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Get process flow
  getProcessFlow: (productId: string): Promise<any> =>
    apiRequest(`/bom/${productId}/process-flow`),
  
  // Get reusable materials
  getReusableMaterials: (productId: string): Promise<any> =>
    apiRequest(`/bom/${productId}/reusable-materials`),
  
  // Optimize material usage
  optimizeUsage: (productId: string, data: {
    quantity: number;
    priority?: 'cost' | 'waste' | 'speed';
  }): Promise<any> =>
    apiRequest(`/bom/${productId}/optimize-usage`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // New standardized BOM format functions
  getStandardFormat: (productId: string): Promise<any> =>
    apiRequest(`/bom/${productId}/standard-format`),

  getScrapManagement: (productId: string): Promise<any> =>
    apiRequest(`/bom/${productId}/scrap-management`),

  importFromSpreadsheet: (data: any[]): Promise<any> =>
    apiRequest('/bom/import/spreadsheet', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  exportBOM: (productId: string, format: string = 'csv'): Promise<any> => {
    const url = `/bom/export/bom?format=${format}&productId=${productId}`;
    return fetch(`${API_BASE_URL}${url}`, {
      method: 'GET',
    }).then(response => {
      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }
      return response.blob();
    });
  },

  exportScrap: (productId: string): Promise<any> => {
    const url = `/bom/export/scrap?productId=${productId}`;
    return fetch(`${API_BASE_URL}${url}`, {
      method: 'GET',
    }).then(response => {
      if (!response.ok) {
        throw new Error(`Scrap export failed: ${response.statusText}`);
      }
      return response.blob();
    });
  },

  // Delete sub-assembly
  deleteSubAssembly: (productId: string, subAssemblyName: string): Promise<any> =>
    apiRequest(`/bom/${productId}/sub-assemblies/${encodeURIComponent(subAssemblyName)}`, {
      method: 'DELETE',
    }),
};

// Blank Specification API functions
export const blankSpecApi = {
  // Get all blank specifications
  getAll: (params?: { 
    product_id?: string; 
    sub_assembly_name?: string; 
    limit?: number; 
    offset?: number 
  }): Promise<any[]> => {
    const searchParams = new URLSearchParams();
    if (params?.sub_assembly_name) searchParams.set('subAssemblyName', params.sub_assembly_name);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());

    if (params?.product_id) {
      const queryString = searchParams.toString();
      return apiRequest(`/blank-specs/product/${params.product_id}${queryString ? `?${queryString}` : ''}`);
    }

    if (params?.sub_assembly_name || params?.limit || params?.offset) {
      const queryString = searchParams.toString();
      return apiRequest(`/blank-specs${queryString ? `?${queryString}` : ''}`);
    }

    return apiRequest('/blank-specs');
  },
  
  // Get blank spec by ID
  getById: (id: string): Promise<any> => apiRequest(`/blank-specs/${id}`),
  
  // Create blank specification
  create: (data: {
    product_id: string;
    sub_assembly_name?: string;
    width_mm: number;
    length_mm: number;
    thickness_mm: number;
    quantity?: number;
    sheet_type?: string;
    created_by?: string;
  }): Promise<any> =>
    apiRequest('/blank-specs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Update blank specification
  update: (id: string, data: Partial<{
    width_mm: number;
    length_mm: number;
    thickness_mm: number;
    quantity: number;
    sheet_type: string;
  }>): Promise<any> =>
    apiRequest(`/blank-specs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  // Delete blank specification
  delete: (id: string): Promise<void> =>
    apiRequest(`/blank-specs/${id}`, {
      method: 'DELETE',
    }),
  
  // Calculate sheet utilization
  calculateUtilization: (productId: string, data: {
    sheetType: string;
    sheetWidth: number;
    sheetLength: number;
  }): Promise<any> =>
    apiRequest(`/blank-specs/${productId}/calculate-utilization`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Process Flow API functions
export const processFlowApi = {
  // Get all process flows
  getAll: (params?: { 
    product_id?: string; 
    limit?: number; 
    offset?: number 
  }): Promise<any[]> => {
    const searchParams = new URLSearchParams();
    if (params?.product_id) searchParams.set('product_id', params.product_id);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    
    const queryString = searchParams.toString();
    return apiRequest(`/process-flows${queryString ? `?${queryString}` : ''}`);
  },
  
  // Get process flow by ID
  getById: (id: string): Promise<any> => apiRequest(`/process-flows/${id}`),
  
  // Create process flow
  create: (data: {
    product_id: string;
    step_no: number;
    operation: string;
    work_center?: string;
    duration?: number;
    cost_rate?: number;
    is_primary_path?: boolean;
    alternative_path_id?: string;
    description?: string;
  }): Promise<any> =>
    apiRequest('/process-flows', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Update process flow
  update: (id: string, data: Partial<{
    step_no: number;
    operation: string;
    work_center: string;
    duration: number;
    cost_rate: number;
    is_primary_path: boolean;
    alternative_path_id: string;
    description: string;
  }>): Promise<any> =>
    apiRequest(`/process-flows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  // Delete process flow
  delete: (id: string): Promise<void> =>
    apiRequest(`/process-flows/${id}`, {
      method: 'DELETE',
    }),
};

// Enhanced Scrap Inventory API functions
export const enhancedScrapApi = {
  // Get all scrap inventory
  getAll: (params?: { 
    status?: string; 
    location_id?: string; 
    material_id?: string; 
    limit?: number; 
    offset?: number 
  }): Promise<any[]> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.location_id) searchParams.set('location_id', params.location_id);
    if (params?.material_id) searchParams.set('material_id', params.material_id);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    
    const queryString = searchParams.toString();
    return apiRequest(`/scrap-inventory${queryString ? `?${queryString}` : ''}`);
  },
  
  // Get scrap by ID
  getById: (id: string): Promise<any> => apiRequest(`/scrap-inventory/${id}`),
  
  // Create scrap item
  create: (data: {
    material_id: string;
    width_mm: number;
    length_mm: number;
    thickness_mm: number;
    weight_kg: number;
    location_id?: string;
    status?: string;
    reference?: string;
    created_by?: string;
  }): Promise<any> =>
    apiRequest('/scrap-inventory', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Update scrap item
  update: (id: string, data: Partial<{
    width_mm: number;
    length_mm: number;
    thickness_mm: number;
    weight_kg: number;
    location_id: string;
    status: string;
    reference: string;
  }>): Promise<any> =>
    apiRequest(`/scrap-inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  // Delete scrap item
  delete: (id: string): Promise<void> =>
    apiRequest(`/scrap-inventory/${id}`, {
      method: 'DELETE',
    }),
  
  // Find reusable scrap
  findReusable: (productId: string, params?: {
    material_id?: string;
    location_id?: string;
  }): Promise<any[]> => {
    const searchParams = new URLSearchParams();
    if (params?.material_id) searchParams.set('material_id', params.material_id);
    if (params?.location_id) searchParams.set('location_id', params.location_id);
    
    const queryString = searchParams.toString();
    return apiRequest(`/scrap-inventory/reusable/${productId}${queryString ? `?${queryString}` : ''}`);
  },
  
  // Record scrap consumption
  recordConsumption: (data: {
    scrap_id: string;
    product_id: string;
    quantity_used: number;
    reference?: string;
    created_by?: string;
  }): Promise<any> =>
    apiRequest('/scrap-inventory/consume', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Get available scrap
  getAvailable: (params?: {
    material_id?: string;
    location_id?: string;
    min_width?: number;
    min_length?: number;
    min_thickness?: number;
  }): Promise<any[]> => {
    const searchParams = new URLSearchParams();
    if (params?.material_id) searchParams.set('material_id', params.material_id);
    if (params?.location_id) searchParams.set('location_id', params.location_id);
    if (params?.min_width) searchParams.set('min_width', params.min_width.toString());
    if (params?.min_length) searchParams.set('min_length', params.min_length.toString());
    if (params?.min_thickness) searchParams.set('min_thickness', params.min_thickness.toString());
    
    const queryString = searchParams.toString();
    return apiRequest(`/scrap-inventory/available${queryString ? `?${queryString}` : ''}`);
  },
  
  // Get scrap summary
  getSummary: (): Promise<any> => apiRequest('/scrap-inventory/summary'),
};

// BOM Import API functions
export const bomImportApi = {
  // Import BOM from Excel
  importFromExcel: (formData: FormData): Promise<any> => {
    return fetch(`${API_BASE_URL}/bom-import/excel-import`, {
      method: 'POST',
      body: formData,
    }).then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }
      return response.json();
    });
  },
};

// Export functionality (legacy)
export const exportReport = async (reportType: string, params: any = {}) => {
  try {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = `/reports/${reportType}${queryParams ? `?${queryParams}` : ''}`;
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    // Handle different response types
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return await response.json();
    } else {
      // For file downloads
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return { success: true };
    }
  } catch (error) {
    console.error('Export failed:', error);
    throw new Error('Export failed');
  }
};

// Production Material Consumption API functions
export const productionMaterialConsumptionApi = {
  // Create production material consumption
  create: (data: {
    production_order_id: string;
    product_id: string;
    blank_spec_id?: string;
    sub_assembly_name?: string;
    material_id?: string;
    planned_quantity: number;
    consumed_quantity: number;
    scrap_quantity?: number;
    consumption_type?: string;
    created_by?: string;
  }): Promise<any> =>
    apiRequest('/production-material-consumption', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get consumption by production order
  getByProductionOrder: (productionOrderId: string): Promise<any> =>
    apiRequest(`/production-material-consumption/production-order/${productionOrderId}`),

  // Get consumption by product
  getByProduct: (productId: string): Promise<any> =>
    apiRequest(`/production-material-consumption/product/${productId}`),

  // Update consumption quantities
  update: (consumptionId: string, data: {
    consumed_quantity: number;
    scrap_quantity?: number;
    consumption_type?: string;
    updated_by?: string;
  }): Promise<any> =>
    apiRequest(`/production-material-consumption/${consumptionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Get consumption summary
  getSummary: (filters?: {
    start_date?: string;
    end_date?: string;
    product_id?: string;
  }): Promise<any> => {
    const searchParams = new URLSearchParams();
    if (filters?.start_date) searchParams.set('start_date', filters.start_date);
    if (filters?.end_date) searchParams.set('end_date', filters.end_date);
    if (filters?.product_id) searchParams.set('product_id', filters.product_id);

    const queryString = searchParams.toString();
    return apiRequest(`/production-material-consumption/summary${queryString ? `?${queryString}` : ''}`);
  },

  // Process BOM for production order
  processBOMForProduction: (productionOrderId: string, productId: string): Promise<any> =>
    apiRequest(`/production-material-consumption/process-bom/${productionOrderId}/product/${productId}`, {
      method: 'POST',
    }),
};

// Scrap Management API functions
export const scrapManagementApi = {
  // Restore scrap to inventory
  restoreToInventory: (scrapId: string, data: {
    quantity_to_restore: number;
    reason: string;
    restored_by?: string;
  }): Promise<any> =>
    apiRequest(`/scrap-management/${scrapId}/restore`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Reuse scrap in production
  reuseInProduction: (scrapId: string, data: {
    production_order_id: string;
    product_id: string;
    quantity_to_reuse: number;
    reason: string;
    reused_by?: string;
  }): Promise<any> =>
    apiRequest(`/scrap-management/${scrapId}/reuse`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get scrap movement history
  getMovementHistory: (scrapId: string): Promise<any> =>
    apiRequest(`/scrap-management/${scrapId}/movement-history`),

  // Get scrap management dashboard
  getDashboard: (): Promise<any> =>
    apiRequest('/scrap-management/dashboard'),

  // Get scrap recommendations for production
  getRecommendations: (params?: {
    productId?: string;
    productionOrderId?: string;
  }): Promise<any> => {
    const searchParams = new URLSearchParams();
    if (params?.productId) searchParams.set('productId', params.productId);
    if (params?.productionOrderId) searchParams.set('productionOrderId', params.productionOrderId);

    const queryString = searchParams.toString();
    return apiRequest(`/scrap-management/recommendations${queryString ? `?${queryString}` : ''}`);
  },

  // New: Get reuse opportunities for a scrap
  getReuseOpportunities: (scrapId: string): Promise<any> =>
    apiRequest(`/scrap-management/${scrapId}/reuse-opportunities`),

  // New: Get scrap origin details
  getScrapOrigin: (scrapId: string): Promise<any> =>
    apiRequest(`/scrap-management/${scrapId}/origin`),

  // New: Get scrap transaction log
  getTransactionLog: (scrapId: string): Promise<any> =>
    apiRequest(`/scrap-management/${scrapId}/transaction-log`),
};

// Sheet Optimization API functions
export const sheetOptimizationApi = {
  // Calculate optimal cutting
  calculate: (data: {
    blank_id?: string;
    width_mm: number;
    length_mm: number;
    thickness_mm: number;
    quantity: number;
    compare_all_sizes?: boolean;
    preferred_sheet_size_id?: string;
    debug?: boolean;
    save_result?: boolean;
    create_scrap_entry?: boolean;
    calculated_by?: string;
  }): Promise<any> =>
    apiRequest('/sheet-optimization/calculate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get optimization by blank ID
  getByBlankId: (blankId: string, latest: boolean = true): Promise<any> =>
    apiRequest(`/sheet-optimization/blank/${blankId}?latest=${latest}`),

  // Get optimizations by product
  getByProductId: (productId: string): Promise<any> =>
    apiRequest(`/sheet-optimization/product/${productId}`),

  // Batch optimize product
  batchOptimizeProduct: (productId: string, data: {
    save_results?: boolean;
    create_scrap_entries?: boolean;
  }): Promise<any> =>
    apiRequest(`/sheet-optimization/batch/product/${productId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get optimization statistics
  getStats: (filters?: {
    start_date?: string;
    end_date?: string;
  }): Promise<any> => {
    const searchParams = new URLSearchParams();
    if (filters?.start_date) searchParams.set('start_date', filters.start_date);
    if (filters?.end_date) searchParams.set('end_date', filters.end_date);

    const queryString = searchParams.toString();
    return apiRequest(`/sheet-optimization/stats${queryString ? `?${queryString}` : ''}`);
  },

  // Calculate rectangular optimization
  calculateOptimization: (data: {
    sheet_width_mm: number;
    sheet_length_mm: number;
    sheet_thickness_mm: number;
    width_mm: number;
    length_mm: number;
    thickness_mm: number;
    quantity: number;
    method: string;
  }): Promise<any> =>
    apiRequest('/sheet-optimization/calculate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Calculate circular optimization
  calculateCircleOptimization: (data: {
    sheet_width_mm: number;
    sheet_length_mm: number;
    sheet_thickness_mm: number;
    diameter_mm: number;
    thickness_mm: number;
    quantity: number;
    method: string;
  }): Promise<any> =>
    apiRequest('/sheet-optimization/circle/calculate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// MRP API functions
export const mrpApi = {
  // Get products for MRP planning
  getProducts: (): Promise<any> => apiRequest('/mrp-api/products'),
  
  // Get sales orders for MRP planning
  getSalesOrders: (): Promise<any> => apiRequest('/mrp-api/sales-orders'),
  
  // Get sales order items for a specific sales order
  getSalesOrderItems: (salesOrderId: string): Promise<any> => apiRequest(`/mrp-api/sales-orders/${salesOrderId}/items`),
  
  // Get suppliers for MRP planning
  getSuppliers: (): Promise<any> => apiRequest('/mrp-api/suppliers'),
  
  // Run MRP calculation
  runMRP: (data: {
    product_id: string;
    quantity: number;
  }): Promise<any> =>
    apiRequest('/mrp-api/run-mrp', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Generate purchase requisitions from MRP requirements
  generatePurchaseRequisitions: (data: {
    requirements: any[];
    selected_suppliers: {[prId: string]: string};
  }): Promise<any> =>
    apiRequest('/mrp-api/generate-prs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Convert purchase requisition to purchase order
  convertPRToPO: (data: {
    pr_data: any;
    supplier_id: string;
    unit_cost: number;
  }): Promise<any> =>
    apiRequest('/mrp-api/convert-pr-to-po', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Quality Assurance API
export const qualityAssuranceApi = {
  // Export QA history data
  exportQAHistory: (queryParams: string): Promise<any> => {
    return fetch(`${API_BASE_URL}/quality-assurance/export?${queryParams}`, {
      method: 'GET',
    }).then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      // Check if response is PDF
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/pdf')) {
        return response.arrayBuffer();
      }
      
      // Check if response is CSV
      if (contentType && contentType.includes('text/csv')) {
        return response.text();
      }
      
      // For other formats, return as JSON
      return response.json();
    });
  },
};

export { ApiError, apiRequest };
