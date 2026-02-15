import React from 'react';
import RealisticDashboard from '../../components/dashboard/RealisticDashboard';
import SmartInventoryDashboard from '../../components/dashboard/SmartInventoryDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useAuth } from '@/context/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <Tabs defaultValue="overview" className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Welcome, {user?.name ?? 'Administrator'} 👋</h1>
        <p className="text-sm text-slate-500 mt-2">
          Here is the latest snapshot of EmpclERP operations. Stay awesome, {user?.name ?? 'team'}!
        </p>
      </div>
      <TabsList className="grid w-full grid-cols-2 mb-8">
        <TabsTrigger value="overview" className="flex items-center gap-2">
          📊 Overview
        </TabsTrigger>
        <TabsTrigger value="smart" className="flex items-center gap-2">
          🧠 Smart Analytics
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview">
        <RealisticDashboard />
      </TabsContent>
      
      <TabsContent value="smart">
        <SmartInventoryDashboard />
      </TabsContent>
    </Tabs>
  );
};

export default Dashboard;