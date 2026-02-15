// Planned Production API Service

import { apiRequest } from '@/services/api';
import type {
  PlannedProduction,
  CreatePlannedProductionRequest,
  UpdatePlannedProductionRequest,
  PlannedProductionFilters,
  MaterialRequirement
} from './types';

const BASE_URL = '/planned-production';

export const plannedProductionApi = {
  // CRUD operations
  create: async (data: CreatePlannedProductionRequest): Promise<PlannedProduction> => {
    return apiRequest<PlannedProduction>(BASE_URL, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getAll: async (filters?: PlannedProductionFilters): Promise<PlannedProduction[]> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    const url = params.toString() ? `${BASE_URL}?${params.toString()}` : BASE_URL;
    return apiRequest<PlannedProduction[]>(url);
  },

  getById: async (id: string): Promise<PlannedProduction> => {
    return apiRequest<PlannedProduction>(`${BASE_URL}/${id}`);
  },

  update: async (
    id: string,
    data: UpdatePlannedProductionRequest
  ): Promise<PlannedProduction> => {
    return apiRequest<PlannedProduction>(`${BASE_URL}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<PlannedProduction> => {
    return apiRequest<PlannedProduction>(`${BASE_URL}/${id}`, {
      method: 'DELETE',
    });
  },

  // Actions
  runMRP: async (id: string, createdBy?: string): Promise<any> => {
    return apiRequest<any>(`${BASE_URL}/${id}/run-mrp`, {
      method: 'POST',
      body: JSON.stringify({ created_by: createdBy || 'system' }),
    });
  },
  
  convertToWorkOrders: async (id: string, createdBy?: string): Promise<any> => {
    return apiRequest<any>(`${BASE_URL}/${id}/convert-to-work-orders`, {
      method: 'POST',
      body: JSON.stringify({ created_by: createdBy || 'system' }),
    });
  },

  markCompleted: async (id: string): Promise<PlannedProduction> => {
    return apiRequest<PlannedProduction>(`${BASE_URL}/${id}/complete`, {
      method: 'POST',
    });
  },

  getMaterialRequirements: async (id: string): Promise<MaterialRequirement[]> => {
    return apiRequest<MaterialRequirement[]>(`${BASE_URL}/${id}/material-requirements`);
  },
};

