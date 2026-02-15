import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { materialApi, locationApi, productApi } from "@/services/api";

// Enhanced Reports API types
export interface ReportFilters {
  start_date: string;
  end_date: string;
  material_id: string;
  location_id: string;
  product_id: string;
  status: string;
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

// Enhanced Reports API functions
export const enhancedReportsPageApi = {
  // Get materials for filters
  getMaterials: async (): Promise<any[]> => {
    try {
      return await materialApi.getAll();
    } catch (error) {
      throw error;
    }
  },

  // Get locations for filters
  getLocations: async (): Promise<any[]> => {
    try {
      return await locationApi.getAll();
    } catch (error) {
      throw error;
    }
  },

  // Get products for filters
  getProducts: async (): Promise<any[]> => {
    try {
      return await productApi.getAll({ limit: 1000 });
    } catch (error) {
      throw error;
    }
  },

  // Export report to CSV
  exportToCSV: async (reportType: string, reportData: any): Promise<void> => {
    try {
      if (!reportData) {
        throw new Error('No data to export');
      }

      let headers: string[] = [];
      let csvContent = '';

      switch (reportType) {
        case 'wastage':
          headers = [
            'Material Name',
            'Quantity',
            'UOM',
            'Work Order Number',
            'Reason',
            'Created Date'
          ];
          csvContent = [
            headers.join(','),
            ...reportData.details.map((item: any) => [
              item.material_name || '',
              item.quantity || '',
              item.uom_code || '',
              item.work_order_number || '',
              item.reason || '',
              item.created_at || ''
            ].join(','))
          ].join('\n');
          break;

        case 'scrap':
          headers = [
            'Material Name',
            'Weight (kg)',
            'Location',
            'Reference',
            'Status',
            'Created Date'
          ];
          csvContent = [
            headers.join(','),
            ...reportData.details.map((item: any) => [
              item.material_name || '',
              item.weight_kg || '',
              item.location_name || '',
              item.reference || '',
              item.status || '',
              item.created_at || ''
            ].join(','))
          ].join('\n');
          break;

        case 'inventory':
          headers = [
            'Item Name',
            'Quantity',
            'UOM',
            'Location',
            'Status',
            'Reorder Level',
            'Last Updated'
          ];
          csvContent = [
            headers.join(','),
            ...reportData.details.map((item: any) => [
              item.product_name || item.material_name || 'Unknown',
              item.quantity || '',
              item.uom_code || '',
              item.location_name || '',
              item.is_low_stock ? 'Low Stock' : 'Normal',
              item.reorder_level || 'N/A',
              item.last_updated || ''
            ].join(','))
          ].join('\n');
          break;

        case 'production':
          headers = [
            'Order No',
            'Product Name',
            'Quantity Ordered',
            'Quantity Completed',
            'Status',
            'Created Date'
          ];
          csvContent = [
            headers.join(','),
            ...reportData.details.map((item: any) => [
              item.po_no || '',
              item.product_name || '',
              item.qty_ordered || '',
              item.qty_completed || '',
              item.status || '',
              item.created_at || ''
            ].join(','))
          ].join('\n');
          break;

        case 'cost-analysis':
          headers = [
            'Material Name',
            'Weight Reused (kg)',
            'Cost Savings',
            'Efficiency %',
            'Wastage %',
            'Reuse Count'
          ];
          csvContent = [
            headers.join(','),
            ...reportData.summary.map((item: any) => [
              item.material_name || '',
              item.total_weight_reused || '',
              item.estimated_cost_savings || '',
              item.efficiency_percentage || '',
              item.wastage_percentage || '',
              item.reuse_count || ''
            ].join(','))
          ].join('\n');
          break;

        default:
          throw new Error('Unknown report type');
      }

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      throw error;
    }
  },
};

// Hook for enhanced reports data with error handling and loading states
export const useEnhancedReportsApi = () => {
  const { toast } = useToast();

  // Fetch materials, locations, and products for filters
  const { data: materials = [] } = useQuery({
    queryKey: ["materials"],
    queryFn: () => enhancedReportsPageApi.getMaterials(),
    onError: (error) => {
      handleApiError(error, toast);
      console.error('Error loading materials:', error);
    },
  });

  const { data: locations = [] } = useQuery({
    queryKey: ["locations"],
    queryFn: () => enhancedReportsPageApi.getLocations(),
    onError: (error) => {
      handleApiError(error, toast);
      console.error('Error loading locations:', error);
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => enhancedReportsPageApi.getProducts(),
    onError: (error) => {
      handleApiError(error, toast);
      console.error('Error loading products:', error);
    },
  });

  // Export report
  const exportReport = async (reportType: string, reportData: any) => {
    try {
      await enhancedReportsPageApi.exportToCSV(reportType, reportData);
      toast({
        title: "Success",
        description: `${reportType} report exported successfully`,
      });
    } catch (error) {
      handleApiError(error, toast);
      console.error('Error exporting report:', error);
    }
  };

  return {
    materials,
    locations,
    products,
    exportReport,
  };
};
