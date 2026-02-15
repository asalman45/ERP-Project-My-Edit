import { useToast } from "@/hooks/use-toast";

// Dashboard-specific API functions
// Currently using sample data, but can be extended for real API calls

export interface DashboardStats {
  totalOEMs: number;
  activeModels: number;
  products: number;
  activeWorkOrders: number;
}

export interface RecentActivity {
  id: string;
  description: string;
  timestamp: string;
  type: 'oem' | 'work_order' | 'product' | 'model';
}

export interface SystemStatus {
  databaseConnection: 'connected' | 'disconnected';
  lastBackup: string;
  activeUsers: number;
  systemUptime: string;
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

// Dashboard API functions
export const dashboardApi = {
  // Get dashboard statistics
  getStats: async (): Promise<DashboardStats> => {
    // TODO: Replace with actual API call when backend is ready
    return {
      totalOEMs: 0,
      activeModels: 0,
      products: 0,
      activeWorkOrders: 0,
    };
  },

  // Get recent activities
  getRecentActivities: async (): Promise<RecentActivity[]> => {
    // TODO: Replace with actual API call when backend is ready
    return [];
  },

  // Get system status
  getSystemStatus: async (): Promise<SystemStatus> => {
    // TODO: Replace with actual API call when backend is ready
    return {
      databaseConnection: 'connected',
      lastBackup: new Date().toISOString(),
      activeUsers: 0,
      systemUptime: '99.8%',
    };
  },
};

// Hook for dashboard data with error handling
export const useDashboardApi = () => {
  const { toast } = useToast();

  const getStats = async () => {
    try {
      return await dashboardApi.getStats();
    } catch (error) {
      handleApiError(error, toast);
      throw error;
    }
  };

  const getRecentActivities = async () => {
    try {
      return await dashboardApi.getRecentActivities();
    } catch (error) {
      handleApiError(error, toast);
      throw error;
    }
  };

  const getSystemStatus = async () => {
    try {
      return await dashboardApi.getSystemStatus();
    } catch (error) {
      handleApiError(error, toast);
      throw error;
    }
  };

  return {
    getStats,
    getRecentActivities,
    getSystemStatus,
  };
};
