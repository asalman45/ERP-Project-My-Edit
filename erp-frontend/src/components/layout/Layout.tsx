import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import ERPSidebar from './ERPSidebar';
import Header from './Header';

interface LayoutProps {
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
      
      {/* Sidebar */}
      <ERPSidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      
      {/* Main Content */}
      <div className={`transition-all duration-500 ease-out ${
        isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      }`}>
        {/* Header */}
        <Header onMenuToggle={toggleSidebar} />
        
        {/* Page Content */}
        <main className="p-6 lg:p-8 relative z-10">
          <div className="max-w-7xl mx-auto">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {!isSidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden transition-all duration-300"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
};