import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Calendar, 
  Settings, 
  Phone,
  BarChart3,
  FileText,
  Receipt,
  Users,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Hexagon
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const location = useLocation();

  const mainMenuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      path: "/",
      active: location.pathname === "/"
    },
    {
      title: "Tasks",
      icon: ClipboardList,
      path: "/tasks",
      active: location.pathname === "/tasks"
    },
    {
      title: "Calendar",
      icon: Calendar,
      path: "/calendar",
      active: location.pathname === "/calendar"
    },
    {
      title: "Settings",
      icon: Settings,
      path: "/settings",
      active: location.pathname === "/settings"
    },
    {
      title: "Support",
      icon: Phone,
      path: "/support",
      active: location.pathname === "/support"
    }
  ];

  const teamManagementItems = [
    {
      title: "Performance",
      icon: BarChart3,
      path: "/performance",
      active: location.pathname === "/performance"
    },
    {
      title: "Payrolls",
      icon: FileText,
      path: "/payrolls",
      active: location.pathname === "/payrolls"
    },
    {
      title: "Invoice",
      icon: Receipt,
      path: "/invoice",
      active: location.pathname === "/invoice"
    },
    {
      title: "Employees",
      icon: Users,
      path: "/employees",
      active: location.pathname === "/employees"
    },
    {
      title: "Meeting",
      icon: CalendarIcon,
      path: "/meeting",
      active: location.pathname === "/meeting"
    }
  ];

  return (
    <div className={cn(
      "fixed left-0 top-0 z-40 h-full bg-white/80 backdrop-blur-md border-r border-white/20 transition-all duration-300 ease-in-out",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header with Logo */}
      <div className="flex items-center justify-between p-4 border-b border-white/20">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg flex items-center justify-center">
              <Hexagon className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-800">HReazec</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="p-2 hover:bg-white/20"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Main Menu Section */}
      <div className="p-4">
        {!isCollapsed && (
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Main Menu
          </h3>
        )}
        <nav className="space-y-1">
          {mainMenuItems.map((item, index) => (
            <Link key={index} to={item.path}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  item.active 
                    ? "bg-orange-100 text-orange-700 border-l-2 border-orange-500" 
                    : "text-gray-600 hover:bg-white/20 hover:text-gray-800"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="ml-3">{item.title}</span>}
              </Button>
            </Link>
          ))}
        </nav>
      </div>

      {/* Team Management Section */}
      <div className="p-4 border-t border-white/20">
        {!isCollapsed && (
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Team Management
          </h3>
        )}
        <nav className="space-y-1">
          {teamManagementItems.map((item, index) => (
            <Link key={index} to={item.path}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  item.active 
                    ? "bg-orange-100 text-orange-700 border-l-2 border-orange-500" 
                    : "text-gray-600 hover:bg-white/20 hover:text-gray-800"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="ml-3">{item.title}</span>}
              </Button>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
export { Sidebar };