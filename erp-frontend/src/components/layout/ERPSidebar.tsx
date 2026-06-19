import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Hexagon,
  ShoppingCart,
  Factory,
  Warehouse,
  Database,
  Settings,
  FileText,
  Layers,
  Calculator,
  Workflow,
  Recycle,
  Calendar,
  Package2,
  Ship,
  Activity,
  Wrench,
  Users
} from 'lucide-react';

interface ERPSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const ERPSidebar: React.FC<ERPSidebarProps> = ({ isCollapsed, onToggle }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const handleSubmenuToggle = (menuKey: string) => {
    setOpenSubmenu(openSubmenu === menuKey ? null : menuKey);
  };

  const isActive = (path: string) => location.pathname === path;
  const isSubmenuActive = (paths: string[]) => paths.some(path => location.pathname.startsWith(path));

  const roleAuth = (allowedRoles: string[]) => {
    if (!user || !user.role) return false;
    if (user.role.toLowerCase() === 'admin') return true;
    return allowedRoles.includes(user.role.toLowerCase());
  };

  const allMenuItems = [
    {
      key: 'dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/',
      roles: ['admin', 'finance', 'production', 'procurement', 'sales']
    },
    {
      key: 'crm',
      icon: Activity,
      label: 'CRM & Sales',
      roles: ['admin', 'sales'],
      submenu: [
        { label: 'Sales Orders', path: '/sales-orders' },
        { label: 'Dispatch', path: '/sales/dispatch' },
        { label: 'Invoicing & Payments', path: '/sales/invoicing' },
        { label: 'Lead Center', path: '/crm/leads' },
        { label: 'CRM Pipeline', path: '/crm/pipeline' },
        { label: 'Quotation Center', path: '/crm/quotations' },
      ],
    },
    {
      key: 'master-data',
      icon: Database,
      label: 'Master Data',
      roles: ['admin', 'finance', 'production', 'procurement', 'sales'],
      submenu: [
        { label: 'Products', path: '/master-data' },
        { label: 'Customers', path: '/master-data/customers' },
        { label: 'Materials', path: '/raw-materials' },
        { label: 'Suppliers', path: '/suppliers' },
      ],
    },
    {
      key: 'procurement',
      icon: ShoppingCart,
      label: 'Procurement',
      roles: ['admin', 'procurement', 'finance'],
      submenu: [
        { label: 'Procurement Requests', path: '/procurement' },
        { label: 'Purchase Orders', path: '/purchase-orders' },
        { label: 'Internal Purchase Orders', path: '/internal-purchase-orders' },
      ],
    },
    {
      key: 'inventory',
      icon: Warehouse,
      label: 'Inventory',
      roles: ['admin', 'production', 'procurement', 'finance'],
      submenu: [
        { label: 'Current Stock', path: '/inventory' },
        { label: 'Stock In', path: '/inventory/stock-in' },
        { label: 'Stock Adjustment', path: '/stock-adjustment' },
      ],
    },
    {
      key: 'production',
      icon: Factory,
      label: 'Production',
      roles: ['admin', 'production'],
      submenu: [
        { label: 'Planned Production', path: '/planned-production' },
        { label: 'MRP Planning', path: '/planning/mrp-planning' },
        { label: 'Work Orders & Tracking', path: '/work-orders-management' },
        { label: 'Process Flow', path: '/process-flow' },
        { label: 'Quality Standards', path: '/qc/standards' },
        { label: 'QC Inspections', path: '/qc/inspections' },
        { label: 'Finished Goods', path: '/finished-goods' },
      ],
    },
    {
      key: 'bom',
      icon: Layers,
      label: 'BOM Management',
      roles: ['admin', 'production'],
      submenu: [
        { label: 'BOM Standard Display', path: '/bom/standard-display' },
        { label: 'Advanced Nesting', path: '/bom/advanced-nesting' },
        { label: 'Production Recipe BOM', path: '/bom/production-recipe' },
        { label: 'Scrap Management', path: '/bom/scrap-management' },
      ],
    },
    {
      key: 'hr',
      icon: Users,
      label: 'HR & Payroll',
      roles: ['admin', 'finance', 'hr'],
      submenu: [
        { label: 'Employee Registry', path: '/hr/employees' },
        { label: 'Payroll & Salary', path: '/hr/payroll' },
        { label: 'Leave Management', path: '/hr/leave' }
      ],
    },
    {
      key: 'assets',
      icon: Wrench,
      label: 'Asset Management',
      roles: ['admin', 'finance', 'production'],
      submenu: [
        { label: 'Maintenance Log', path: '/assets/maintenance' },
        { label: 'Fixed Assets', path: '/finance/fixed-assets' },
      ],
    },
    {
      key: 'finance',
      icon: Calculator,
      label: 'Finance',
      roles: ['admin', 'finance'],
      submenu: [
        { label: 'Finance Dashboard', path: '/finance' },
        { label: 'Vendor Payments', path: '/finance/vendor-payments' },
        { label: 'AR Collection', path: '/finance/collections' },
        { label: 'Customer Ledger', path: '/finance/customer-ledger' },
        { label: 'Bank Reconciliation', path: '/finance/bank' },
        { label: 'Financial Statements', path: '/finance/reporting' },
        { label: 'Budget Management', path: '/finance/budgets' },
        { label: 'Expense Management', path: '/finance/expenses' },
        { label: 'Tax Reports', path: '/finance/tax' },
        { label: 'NRE Costs', path: '/finance/nre' },
        { label: 'Fixed Assets', path: '/finance/assets' },
        { label: 'Cash Forecast', path: '/finance/cash-forecast' },
        { label: 'Currency Settings', path: '/finance/currencies' },
      ],
    },
    {
      key: 'reports',
      icon: BarChart3,
      label: 'Reports',
      roles: ['admin', 'finance', 'sales', 'production', 'procurement'],
      submenu: [
        { label: 'P&L Statement', path: '/reports/p-and-l' },
        { label: 'Overhead Analysis', path: '/reports/overheads' },
        { label: 'All Reports', path: '/reports' },
      ],
    },
    {
      key: 'settings',
      icon: Settings,
      label: 'Security & Settings',
      roles: ['admin'],
      submenu: [
        { label: 'System Audit Logs', path: '/settings/audit-logs' },
      ],
    },
  ];

  const menuItems = allMenuItems.filter(item => roleAuth(item.roles));

  return (
    <div className={cn(
      "fixed left-0 top-0 z-40 h-full flex flex-col bg-white/80 backdrop-blur-xl border-r border-white/20 shadow-2xl transition-all duration-500 ease-out",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-white/20 bg-gradient-to-r from-white/40 to-white/20 backdrop-blur-sm">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white/30">
              <Hexagon className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">EmpclERP</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="p-2 hover:bg-white/40 rounded-lg transition-all duration-300 hover:scale-110 hover:shadow-lg"
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5 text-gray-600" /> : <ChevronLeft className="w-5 h-5 text-gray-600" />}
        </Button>
      </div>

      {/* Main Menu - scrollable */}
      <div className="flex-1 overflow-y-auto py-4 scrollbar-thin" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}>
        <nav className="space-y-2">
          {menuItems.map((item, index) => (
            <div key={index}>
              {item.submenu ? (
                <div className="relative">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-left px-4 py-3 text-sm font-medium rounded-xl mx-2 transition-all duration-300 group",
                      isSubmenuActive(item.submenu.map(sub => sub.path))
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-lg border border-blue-200/50"
                        : "text-gray-600 hover:bg-white/50 hover:text-gray-800 hover:shadow-md hover:scale-[1.02]"
                    )}
                    onClick={() => handleSubmenuToggle(item.key)}
                  >
                    <item.icon className={cn("h-5 w-5 transition-colors duration-300", isCollapsed ? "mr-0" : "mr-3",
                      isSubmenuActive(item.submenu.map(sub => sub.path)) ? "text-blue-600" : "text-gray-500 group-hover:text-gray-700"
                    )} />
                    {!isCollapsed && (
                      <>
                        <span className="font-medium">{item.label}</span>
                        <ChevronLeft className={cn(
                          "ml-auto h-4 w-4 transition-all duration-300",
                          openSubmenu === item.key ? "-rotate-90 text-blue-600" : "text-gray-400"
                        )} />
                      </>
                    )}
                  </Button>

                  {/* Submenu */}
                  {!isCollapsed && openSubmenu === item.key && (
                    <div className="ml-6 mt-2 space-y-1 animate-in slide-in-from-top-2 duration-300">
                      {item.submenu.map((subItem, childIndex) => (
                        <Link to={subItem.path} key={childIndex}>
                          <Button
                            variant="ghost"
                            className={cn(
                              "w-full justify-start text-left px-4 py-2 text-sm font-medium rounded-lg mx-2 transition-all duration-300 group",
                              isActive(subItem.path)
                                ? "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 shadow-md border border-blue-200/50"
                                : "text-gray-500 hover:bg-white/40 hover:text-gray-700 hover:shadow-sm hover:scale-[1.01]"
                            )}
                          >
                            <div className={cn(
                              "w-2 h-2 rounded-full mr-3 transition-all duration-300",
                              isActive(subItem.path) ? "bg-blue-500 shadow-sm" : "bg-gray-300 group-hover:bg-gray-400"
                            )} />
                            {subItem.label}
                          </Button>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link to={item.path}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-left px-4 py-3 text-sm font-medium rounded-xl mx-2 transition-all duration-300 group",
                      isActive(item.path)
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-lg border border-blue-200/50"
                        : "text-gray-600 hover:bg-white/50 hover:text-gray-800 hover:shadow-md hover:scale-[1.02]"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5 transition-colors duration-300", isCollapsed ? "mr-0" : "mr-3",
                      isActive(item.path) ? "text-blue-600" : "text-gray-500 group-hover:text-gray-700"
                    )} />
                    {!isCollapsed && <span className="font-medium">{item.label}</span>}
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default ERPSidebar;
export { ERPSidebar };
