import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { inventoryApi } from "@/services/api";
import { InventoryItem } from "@/types";

// Inventory API types
export interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
}

export interface InventoryTransaction {
  id: string;
  productId?: string;
  materialId?: string;
  txnType: string;
  quantity: number;
  locationId?: string;
  reference?: string;
  notes?: string;
  createdAt: string;
}

// Generic API error handler
const handleApiError = (error: any, toast: any) => {
  const errorMessage = error?.response?.data?.message || error?.message || 'An unexpected error occurred';
  toast({
    title: "Error",
    description: errorMessage,
    variant: "destructive",
  });
};

// Inventory API functions
export const inventoryPageApi = {
  // Get all inventory items
  getAll: async (params?: { 
    limit?: number; 
    offset?: number; 
    product_id?: string; 
    material_id?: string;
    location_id?: string;
  }): Promise<InventoryItem[]> => {
    try {
      return await inventoryApi.getAll(params);
    } catch (error) {
      throw error;
    }
  },

  // Get inventory by ID
  getById: async (id: string): Promise<InventoryItem> => {
    try {
      return await inventoryApi.getById(id);
    } catch (error) {
      throw error;
    }
  },

  // Get inventory transactions
  getTransactions: async (params?: {
    limit?: number;
    offset?: number;
    txn_type?: string;
    product_id?: string;
    material_id?: string;
    location_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<InventoryTransaction[]> => {
    try {
      return await inventoryApi.getTransactions(params);
    } catch (error) {
      throw error;
    }
  },

  // Create inventory transaction
  createTransaction: async (data: {
    product_id?: string;
    material_id?: string;
    txn_type: string;
    quantity: number;
    location_id?: string;
    reference?: string;
    notes?: string;
  }): Promise<InventoryTransaction> => {
    try {
      return await inventoryApi.createTransaction(data);
    } catch (error) {
      throw error;
    }
  },

  // Get inventory levels
  getLevels: async (params?: {
    product_id?: string;
    material_id?: string;
    location_id?: string;
  }): Promise<InventoryItem[]> => {
    try {
      return await inventoryApi.getLevels(params);
    } catch (error) {
      throw error;
    }
  },
};

// Hook for inventory data with error handling and loading states
export const useInventoryApi = () => {
  const { toast } = useToast();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<InventoryStats>({
    totalItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalValue: 0,
  });

  // Load inventory data
  const loadInventoryData = async () => {
    try {
      setLoading(true);
      const data = await inventoryPageApi.getAll();
      setInventoryItems(data);
      
      // Calculate stats
      const totalItems = data.length;
      const lowStockItems = data.filter(item => item.status === "LOW_STOCK").length;
      const outOfStockItems = data.filter(item => item.status === "OUT_OF_STOCK").length;
      const totalValue = data.reduce((sum, item) => sum + (item.quantityOnHand * 10), 0); // Assuming $10 per unit
      
      setStats({
        totalItems,
        lowStockItems,
        outOfStockItems,
        totalValue,
      });
    } catch (error) {
      handleApiError(error, toast);
      console.error('Error loading inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create transaction
  const createTransaction = async (data: {
    product_id?: string;
    material_id?: string;
    txn_type: string;
    quantity: number;
    location_id?: string;
    reference?: string;
    notes?: string;
  }) => {
    try {
      const result = await inventoryPageApi.createTransaction(data);
      toast({
        title: "Success",
        description: "Inventory transaction created successfully",
      });
      
      // Reload data to reflect changes
      await loadInventoryData();
      
      return result;
    } catch (error) {
      handleApiError(error, toast);
      throw error;
    }
  };

  // Issue material
  const issueMaterial = async (itemId: string, quantity: number, reference?: string) => {
    try {
      const item = inventoryItems.find(i => i.id === itemId);
      if (!item) {
        throw new Error('Item not found');
      }

      await createTransaction({
        product_id: item.productId,
        material_id: item.productId, // Using productId as materialId for compatibility
        txn_type: 'ISSUE',
        quantity: -quantity, // Negative for issue
        location_id: item.location, // Using location string as locationId
        reference,
        notes: `Material issued from ${item.location}`,
      });
    } catch (error) {
      handleApiError(error, toast);
      throw error;
    }
  };

  // Receive material
  const receiveMaterial = async (itemId: string, quantity: number, reference?: string) => {
    try {
      const item = inventoryItems.find(i => i.id === itemId);
      if (!item) {
        throw new Error('Item not found');
      }

      await createTransaction({
        product_id: item.productId,
        material_id: item.productId, // Using productId as materialId for compatibility
        txn_type: 'RECEIVE',
        quantity,
        location_id: item.location, // Using location string as locationId
        reference,
        notes: `Material received at ${item.location}`,
      });
    } catch (error) {
      handleApiError(error, toast);
      throw error;
    }
  };

  // === NEW COMPREHENSIVE INVENTORY API FUNCTIONS ===

  // Stock In Operations
  const stockIn = async (data: {
    material_id: string;
    quantity: number;
    location_id: string;
    po_id?: string;
    batch_no?: string;
    unit_cost?: number;
    reference?: string;
    created_by?: string;
  }) => {
    try {
      const result = await inventoryApi.stockIn(data);
      toast({
        title: "Success",
        description: "Stock added successfully",
      });
      await loadInventoryData();
      return result;
    } catch (error) {
      handleApiError(error, toast);
      throw error;
    }
  };

  // Stock Out Operations
  const stockOut = async (data: {
    material_id: string;
    quantity: number;
    location_id: string;
    wo_id?: string;
    reference?: string;
    notes?: string;
    created_by?: string;
  }) => {
    try {
      const result = await inventoryApi.stockOut(data);
      toast({
        title: "Success",
        description: "Stock issued successfully",
      });
      await loadInventoryData();
      return result;
    } catch (error) {
      handleApiError(error, toast);
      throw error;
    }
  };

  // Wastage Management
  const recordWastage = async (data: {
    material_id: string;
    quantity: number;
    location_id: string;
    wo_id?: string;
    reason: string;
    reference?: string;
    notes?: string;
    created_by?: string;
  }) => {
    try {
      const result = await inventoryApi.recordWastage(data);
      toast({
        title: "Success",
        description: "Wastage recorded successfully",
      });
      await loadInventoryData();
      return result;
    } catch (error) {
      handleApiError(error, toast);
      throw error;
    }
  };

  // Re-entry Operations
  const reentryWastage = async (data: {
    wastage_id: string;
    quantity: number;
    location_id: string;
    reference?: string;
    notes?: string;
    created_by?: string;
  }) => {
    try {
      const result = await inventoryApi.reentryWastage(data);
      toast({
        title: "Success",
        description: "Wastage re-entered successfully",
      });
      await loadInventoryData();
      return result;
    } catch (error) {
      handleApiError(error, toast);
      throw error;
    }
  };

  // Finished Goods
  const receiveFinishedGoods = async (data: {
    product_id: string;
    quantity: number;
    location_id: string;
    wo_id?: string;
    batch_no?: string;
    reference?: string;
    notes?: string;
    created_by?: string;
  }) => {
    try {
      const result = await inventoryApi.receiveFinishedGoods(data);
      toast({
        title: "Success",
        description: "Finished goods received successfully",
      });
      await loadInventoryData();
      return result;
    } catch (error) {
      handleApiError(error, toast);
      throw error;
    }
  };

  // Current Stock Operations
  const getCurrentStock = async (materialId: string) => {
    try {
      return await inventoryApi.getCurrentStock(materialId);
    } catch (error) {
      handleApiError(error, toast);
      throw error;
    }
  };

  const getAllCurrentStock = async (params?: {
    limit?: number;
    offset?: number;
    item_type?: string;
    location_id?: string;
    min_quantity?: number;
    max_quantity?: number;
  }) => {
    try {
      return await inventoryApi.getAllCurrentStock(params);
    } catch (error) {
      handleApiError(error, toast);
      throw error;
    }
  };

  const getInventorySummary = async () => {
    try {
      return await inventoryApi.getInventorySummary();
    } catch (error) {
      handleApiError(error, toast);
      throw error;
    }
  };

  const getLowStockItems = async (params?: {
    limit?: number;
    offset?: number;
  }) => {
    try {
      return await inventoryApi.getLowStockItems(params);
    } catch (error) {
      handleApiError(error, toast);
      throw error;
    }
  };

  const getZeroStockItems = async (params?: {
    limit?: number;
    offset?: number;
  }) => {
    try {
      return await inventoryApi.getZeroStockItems(params);
    } catch (error) {
      handleApiError(error, toast);
      throw error;
    }
  };

  // Load data on mount
  useEffect(() => {
    loadInventoryData();
  }, []);

  return {
    inventoryItems,
    loading,
    stats,
    totalItems: stats.totalItems,
    lowStockItems: stats.lowStockItems,
    outOfStockItems: stats.outOfStockItems,
    totalValue: stats.totalValue,
    createTransaction,
    issueMaterial,
    receiveMaterial,
    refreshData: loadInventoryData,
    // New comprehensive inventory functions
    stockIn,
    stockOut,
    recordWastage,
    reentryWastage,
    receiveFinishedGoods,
    getCurrentStock,
    getAllCurrentStock,
    getInventorySummary,
    getLowStockItems,
    getZeroStockItems,
  };
};
