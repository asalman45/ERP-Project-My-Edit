import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const RoutingTest: React.FC = () => {
  const routes = [
    { path: "/", name: "Dashboard", description: "Main dashboard" },
    { path: "/master-data", name: "Master Data", description: "Master data management" },
    { path: "/inventory", name: "Inventory", description: "Inventory management" },
    { path: "/inventory/transactions", name: "Inventory Transactions", description: "Inventory transactions" },
    { path: "/production", name: "Production", description: "Production management" },
    { path: "/purchase-orders", name: "Purchase Orders", description: "Purchase order management" },
    { path: "/work-orders", name: "Work Orders", description: "Work order management" },
    { path: "/scrap-management", name: "Scrap Management", description: "Scrap inventory management" },
    { path: "/wastage-tracking", name: "Wastage Tracking", description: "Material wastage tracking" },
    { path: "/stock-adjustment", name: "Stock Adjustment", description: "Stock level adjustments" },
    { path: "/production-tracking", name: "Production Tracking", description: "Production progress tracking" },
    { path: "/enhanced-reports", name: "Enhanced Reports", description: "Advanced reporting" },
    { path: "/reports", name: "Reports", description: "Standard reports" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Routing Test Page</h1>
        <p className="text-muted-foreground mt-2">
          Test all routes to ensure they load correctly without blank screens
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {routes.map((route) => (
          <Card key={route.path} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                {route.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {route.description}
              </p>
              <div className="space-y-2">
                <p className="text-xs font-mono bg-muted px-2 py-1 rounded">
                  {route.path}
                </p>
                <Link to={route.path}>
                  <Button size="sm" className="w-full">
                    Test Route
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Routing System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Error boundaries implemented</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Lazy loading enabled</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Loading spinners configured</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Toast notifications for errors</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Fallback to dashboard on errors</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoutingTest;
