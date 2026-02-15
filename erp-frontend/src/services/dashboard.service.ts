// src/services/dashboard.service.ts
import { api } from './api';

export interface DashboardStats {
  totalProducts: number;
  totalMaterials: number;
  totalWorkOrders: number;
  financials: {
    totalRevenue: number;
    totalExpense: number;
    accountsReceivable: number;
    accountsPayable: number;
    netProfit: number;
  };
}

export interface InventorySummary {
  totalValue: number;
  totalItems: number;
  lowStockCount: number;
  zeroStockCount: number;
  topProducts: Array<{
    product_code: string;
    part_name: string;
    available_quantity: number;
    standard_cost: number;
  }>;
}

export interface RecentActivity {
  id: string;
  type: 'stock_in' | 'stock_out' | 'work_order' | 'purchase_order';
  description: string;
  timestamp: string;
  user: string;
  status: string;
}

export interface WorkOrderStatus {
  pending: number;
  in_progress: number;
  completed: number;
  cancelled: number;
}

export interface MonthlyTrend {
  month: string;
  stockIn: number;
  stockOut: number;
  workOrders: number;
}

class DashboardService {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      console.log('Fetching dashboard stats...');
      const response = await api.get('/dashboard/stats');
      console.log('Dashboard stats response:', response);
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return default values if API fails
      return {
        totalProducts: 0,
        totalMaterials: 0,
        totalWorkOrders: 0,
        financials: {
          totalRevenue: 0,
          totalExpense: 0,
          accountsReceivable: 0,
          accountsPayable: 0,
          netProfit: 0
        }
      };
    }
  }

  /**
   * Get inventory summary
   */
  async getInventorySummary(): Promise<InventorySummary> {
    try {
      console.log('Fetching inventory summary...');
      const response = await api.get('/dashboard/inventory-summary');
      console.log('Inventory summary response:', response);
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory summary:', error);
      return {
        totalValue: 0,
        totalItems: 0,
        lowStockCount: 0,
        zeroStockCount: 0,
        topProducts: []
      };
    }
  }

  /**
   * Get work order status summary
   */
  async getWorkOrderStatus(): Promise<WorkOrderStatus> {
    try {
      console.log('Fetching work order status...');
      const response = await api.get('/dashboard/work-order-status');
      console.log('Work order status response:', response);
      return response.data;
    } catch (error) {
      console.error('Error fetching work order status:', error);
      return {
        pending: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0
      };
    }
  }

  /**
   * Get recent activities
   */
  async getRecentActivities(): Promise<RecentActivity[]> {
    try {
      const response = await api.get('/dashboard/recent-activities');
      return response.data;
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  }

  /**
   * Get monthly trends (mock data for now)
   */
  async getMonthlyTrends(): Promise<MonthlyTrend[]> {
    // Mock data for monthly trends
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      stockIn: Math.floor(Math.random() * 100) + 50,
      stockOut: Math.floor(Math.random() * 80) + 40,
      workOrders: Math.floor(Math.random() * 20) + 10
    }));
  }
}

export const dashboardService = new DashboardService();
