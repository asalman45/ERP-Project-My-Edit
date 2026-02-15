import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { inventoryApi } from "@/services/api";
import { InventoryTransaction } from "@/types";

// Inventory Transactions API types
export interface TransactionFilters {
  type: string;
  dateFrom: string;
  dateTo: string;
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

// Inventory Transactions API functions
export const inventoryTransactionsPageApi = {
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

  // Export transactions to CSV
  exportToCSV: async (transactions: InventoryTransaction[]): Promise<void> => {
    try {
      // Create CSV content
      const headers = [
        'Transaction ID',
        'Date',
        'Type',
        'Product Code',
        'Product Name',
        'Quantity',
        'Location',
        'Work Order',
        'Step',
        'User'
      ];
      
      const csvContent = [
        headers.join(','),
        ...transactions.map(txn => [
          txn.id,
          txn.date,
          txn.type,
          txn.productCode || '',
          txn.productName || '',
          txn.quantity,
          txn.location || '',
          txn.workOrderNumber || '',
          txn.step || '',
          txn.userName || ''
        ].join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `inventory-transactions-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      throw error;
    }
  },
};

// Hook for inventory transactions data with error handling and loading states
export const useInventoryTransactionsApi = (initialFilters: TransactionFilters) => {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Load transactions data
  const loadTransactionsData = useCallback(async (filters?: TransactionFilters) => {
    try {
      setLoading(true);
      
      // Convert filters to API params
      const apiParams: any = {};
      if (filters?.type && filters.type !== "all") apiParams.txn_type = filters.type;
      if (filters?.dateFrom) apiParams.start_date = filters.dateFrom;
      if (filters?.dateTo) apiParams.end_date = filters.dateTo;
      
      const data = await inventoryTransactionsPageApi.getTransactions(apiParams);
      setTransactions(data);
      setFilteredTransactions(data);
    } catch (error) {
      handleApiError(error, toast);
      console.error('Error loading transactions data:', error);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Apply filters to transactions
  const applyFilters = useCallback((filters: TransactionFilters) => {
    const filtered = transactions.filter(transaction => {
      if (filters.type && filters.type !== "all" && transaction.type !== filters.type) return false;
      if (filters.dateFrom && transaction.date < filters.dateFrom) return false;
      if (filters.dateTo && transaction.date > filters.dateTo) return false;
      return true;
    });
    
    setFilteredTransactions(filtered);
  }, [transactions]);

  // Export transactions
  const exportTransactions = useCallback(async () => {
    try {
      await inventoryTransactionsPageApi.exportToCSV(filteredTransactions);
      toast({
        title: "Success",
        description: "Transactions exported successfully",
      });
    } catch (error) {
      handleApiError(error, toast);
      console.error('Error exporting transactions:', error);
    }
  }, [filteredTransactions, toast]);

  // Load data on mount
  useEffect(() => {
    loadTransactionsData(initialFilters);
  }, [loadTransactionsData, initialFilters]);

  return {
    transactions,
    filteredTransactions,
    loading,
    applyFilters,
    exportTransactions,
    refreshData: loadTransactionsData,
  };
};
