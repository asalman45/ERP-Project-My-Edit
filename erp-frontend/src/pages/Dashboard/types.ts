// Dashboard page specific types

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

export interface DashboardData {
  stats: DashboardStats;
  recentActivities: RecentActivity[];
  systemStatus: SystemStatus;
}
