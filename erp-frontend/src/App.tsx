import React, { lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { CommandPalette } from "@/components/CommandPalette";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import RouteWrapper from "@/components/RouteWrapper";
import LoadingSpinner from "@/components/LoadingSpinner";
import ProcurementDashboard from "@/pages/Procurement";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthProvider } from "@/context/AuthContext";
import LoginPage from "@/pages/Auth/Login";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const MasterData = lazy(() => import("@/pages/MasterData"));
const Inventory = lazy(() => import("@/pages/Inventory"));
const RawMaterial = lazy(() => import("@/pages/RawMaterial"));
const StockInPage = lazy(() => import("@/pages/Inventory/StockIn"));
const InventoryTransactions = lazy(() => import("@/pages/InventoryTransactions"));
const PurchaseOrders = lazy(() => import("@/pages/PurchaseOrder"));
const Suppliers = lazy(() => import("@/pages/Suppliers"));
const WorkOrders = lazy(() => import("@/pages/WorkOrders"));
const WorkOrderDetail = lazy(() => import("@/pages/WorkOrderDetail"));
const ProductionRecipes = lazy(() => import("@/pages/ProductionRecipes"));
const ScrapManagement = lazy(() => import("@/pages/ScrapManagement"));
const WastageTracking = lazy(() => import("@/pages/WastageTracking"));
const StockAdjustment = lazy(() => import("@/pages/StockAdjustment"));
const ProductionTracking = lazy(() => import("@/pages/ProductionTracking"));
const EnhancedReports = lazy(() => import("@/pages/EnhancedReports"));
const Reports = lazy(() => import("@/pages/Reports"));
const MonthlyInventorySalesReport = lazy(() => import("@/pages/Reports/MonthlyInventorySalesReport"));
const RoutingTest = lazy(() => import("@/pages/RoutingTest"));
const BOMStandardDisplay = lazy(() => import("@/pages/BOM/BOMStandardDisplay"));
const BOMScrapManagement = lazy(() => import("@/pages/BOM/ScrapManagement"));
const ProductionRecipe = lazy(() => import("@/pages/BOM/ProductionRecipe"));
const MRPPlanning = lazy(() => import("@/pages/Planning/MRPPlanning"));
const WorkOrderManagement = lazy(() => import("@/pages/WorkOrders/WorkOrderManagement"));
const ProcessFlowPage = lazy(() => import("@/pages/ProcessFlow"));
const QualityAssurance = lazy(() => import("@/pages/QualityAssurance"));
const Dispatch = lazy(() => import("@/pages/Sales/Dispatch"));
const Invoicing = lazy(() => import("@/pages/Sales/Invoicing"));
const FinishedGoods = lazy(() => import("@/pages/FinishedGoods"));
const InternalPurchaseOrder = lazy(() => import("@/pages/InternalPurchaseOrder"));
const SalesOrder = lazy(() => import("@/pages/SalesOrder"));
const PlannedProduction = lazy(() => import("@/pages/PlannedProduction"));
const FinanceDashboard = lazy(() => import("@/pages/Finance/FinanceDashboard"));
const NREManagement = lazy(() => import("@/pages/Finance/NREManagement"));
const BankReconciliation = lazy(() => import("@/pages/Finance/BankReconciliation"));
const VendorPayments = lazy(() => import("@/pages/Finance/VendorPayments"));
const TaxReports = lazy(() => import("@/pages/Finance/TaxReports"));
const FinancialStatements = lazy(() => import("@/pages/Finance/FinancialStatements"));
const FixedAssets = lazy(() => import("@/pages/Finance/FixedAssets"));
const ArCollection = lazy(() => import("@/pages/Finance/ArCollection"));
const CashForecast = lazy(() => import("@/pages/Finance/CashForecast"));
const ExpenseManagement = lazy(() => import("@/pages/Finance/ExpenseManagement"));
const BudgetManagement = lazy(() => import("@/pages/Finance/BudgetManagement"));
const CurrencySettings = lazy(() => import("@/pages/Finance/CurrencySettings"));
const CrmPipeline = lazy(() => import("@/pages/CRM/CrmPipeline"));
const LeadCenter = lazy(() => import("@/pages/CRM/LeadCenter"));
const QuotationCenter = lazy(() => import("@/pages/CRM/QuotationCenter"));
const EmployeeRegistry = lazy(() => import("@/pages/HR/EmployeeRegistry"));
const PayrollPortal = lazy(() => import("@/pages/HR/PayrollPortal"));
const QCInspections = lazy(() => import("@/pages/QC/QCInspections"));
const QualityStandards = lazy(() => import("@/pages/QC/QualityStandards"));
const PandLStatement = lazy(() => import("@/pages/Reports/PandLStatement"));
const DepartmentalOverheads = lazy(() => import("@/pages/Reports/DepartmentalOverheads"));
const AssetMaintenance = lazy(() => import("@/pages/Assets/AssetMaintenance"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
});

const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <CommandPalette />
      <TooltipProvider>
        <Toaster />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route
                path="/"
                element={
                  <RouteWrapper fallback={<LoadingSpinner text="Loading dashboard..." />}>
                    <Dashboard />
                  </RouteWrapper>
                }
              />
              <Route
                path="master-data"
                element={
                  <RouteWrapper>
                    <MasterData />
                  </RouteWrapper>
                }
              />
              <Route
                path="inventory"
                element={
                  <RouteWrapper>
                    <Inventory />
                  </RouteWrapper>
                }
              />
              <Route
                path="inventory/transactions"
                element={
                  <RouteWrapper>
                    <InventoryTransactions />
                  </RouteWrapper>
                }
              />
              <Route
                path="inventory/stock-in"
                element={
                  <RouteWrapper>
                    <StockInPage />
                  </RouteWrapper>
                }
              />
              <Route
                path="purchase-orders"
                element={
                  <RouteWrapper>
                    <PurchaseOrders />
                  </RouteWrapper>
                }
              />
              <Route
                path="suppliers"
                element={
                  <RouteWrapper>
                    <Suppliers />
                  </RouteWrapper>
                }
              />
              <Route
                path="work-orders"
                element={
                  <RouteWrapper>
                    <WorkOrders />
                  </RouteWrapper>
                }
              />
              <Route
                path="work-orders/:id"
                element={
                  <RouteWrapper>
                    <WorkOrderDetail />
                  </RouteWrapper>
                }
              />
              <Route
                path="production-recipes"
                element={
                  <RouteWrapper>
                    <ProductionRecipes />
                  </RouteWrapper>
                }
              />
              <Route
                path="scrap-management"
                element={
                  <RouteWrapper>
                    <ScrapManagement />
                  </RouteWrapper>
                }
              />
              <Route
                path="wastage-tracking"
                element={
                  <RouteWrapper>
                    <WastageTracking />
                  </RouteWrapper>
                }
              />
              <Route
                path="stock-adjustment"
                element={
                  <RouteWrapper>
                    <StockAdjustment />
                  </RouteWrapper>
                }
              />
              <Route
                path="procurement"
                element={
                  <RouteWrapper>
                    <ProcurementDashboard />
                  </RouteWrapper>
                }
              />
              <Route
                path="internal-purchase-orders"
                element={
                  <RouteWrapper>
                    <InternalPurchaseOrder />
                  </RouteWrapper>
                }
              />
              <Route
                path="sales-orders"
                element={
                  <RouteWrapper>
                    <SalesOrder />
                  </RouteWrapper>
                }
              />
              <Route
                path="planned-production"
                element={
                  <RouteWrapper>
                    <PlannedProduction />
                  </RouteWrapper>
                }
              />
              <Route
                path="production-tracking"
                element={
                  <RouteWrapper>
                    <ProductionTracking />
                  </RouteWrapper>
                }
              />
              <Route
                path="enhanced-reports"
                element={
                  <RouteWrapper>
                    <EnhancedReports />
                  </RouteWrapper>
                }
              />
              <Route
                path="reports"
                element={
                  <RouteWrapper>
                    <Reports />
                  </RouteWrapper>
                }
              />
              <Route
                path="reports/monthly-inventory-sales"
                element={
                  <RouteWrapper>
                    <MonthlyInventorySalesReport />
                  </RouteWrapper>
                }
              />
              <Route
                path="routing-test"
                element={
                  <RouteWrapper>
                    <RoutingTest />
                  </RouteWrapper>
                }
              />
              <Route
                path="bom"
                element={<Navigate to="bom/standard-display" replace />} />
              <Route
                path="bom/standard-display"
                element={
                  <RouteWrapper>
                    <BOMStandardDisplay />
                  </RouteWrapper>
                }
              />
              <Route
                path="bom/scrap"
                element={
                  <RouteWrapper>
                    <BOMScrapManagement />
                  </RouteWrapper>
                }
              />
              <Route
                path="bom/production-recipe"
                element={
                  <RouteWrapper>
                    <ProductionRecipe />
                  </RouteWrapper>
                }
              />
              <Route
                path="planning/mrp-planning"
                element={
                  <RouteWrapper>
                    <MRPPlanning />
                  </RouteWrapper>
                }
              />
              <Route
                path="work-orders-management"
                element={
                  <RouteWrapper>
                    <WorkOrderManagement />
                  </RouteWrapper>
                }
              />
              <Route
                path="process-flow"
                element={
                  <RouteWrapper>
                    <ProcessFlowPage />
                  </RouteWrapper>
                }
              />
              <Route
                path="quality-assurance"
                element={
                  <RouteWrapper>
                    <QualityAssurance />
                  </RouteWrapper>
                }
              />
              <Route
                path="finished-goods"
                element={
                  <RouteWrapper>
                    <FinishedGoods />
                  </RouteWrapper>
                }
              />
              <Route
                path="sales/dispatch"
                element={
                  <RouteWrapper>
                    <Dispatch />
                  </RouteWrapper>
                }
              />
              <Route
                path="sales/invoicing"
                element={
                  <RouteWrapper>
                    <Invoicing />
                  </RouteWrapper>
                }
              />
              <Route
                path="bom/scrap-management"
                element={
                  <RouteWrapper>
                    <BOMScrapManagement />
                  </RouteWrapper>
                }
              />
              <Route
                path="raw-materials"
                element={
                  <RouteWrapper>
                    <RawMaterial />
                  </RouteWrapper>
                }
              />
              <Route
                path="finance"
                element={
                  <RouteWrapper>
                    <FinanceDashboard />
                  </RouteWrapper>
                }
              />
              <Route
                path="finance/nre"
                element={
                  <RouteWrapper>
                    <NREManagement />
                  </RouteWrapper>
                }
              />
              <Route
                path="finance/bank"
                element={
                  <RouteWrapper>
                    <BankReconciliation />
                  </RouteWrapper>
                }
              />
              <Route
                path="finance/vendor-payments"
                element={
                  <RouteWrapper>
                    <VendorPayments />
                  </RouteWrapper>
                }
              />
              <Route
                path="finance/tax"
                element={
                  <RouteWrapper>
                    <TaxReports />
                  </RouteWrapper>
                }
              />
              <Route
                path="finance/reporting"
                element={
                  <RouteWrapper>
                    <FinancialStatements />
                  </RouteWrapper>
                }
              />
              <Route
                path="finance/assets"
                element={
                  <RouteWrapper>
                    <FixedAssets />
                  </RouteWrapper>
                }
              />
              <Route
                path="finance/collections"
                element={
                  <RouteWrapper>
                    <ArCollection />
                  </RouteWrapper>
                }
              />
              <Route
                path="finance/cash-forecast"
                element={
                  <RouteWrapper>
                    <CashForecast />
                  </RouteWrapper>
                }
              />
              <Route
                path="finance/expenses"
                element={
                  <RouteWrapper>
                    <ExpenseManagement />
                  </RouteWrapper>
                }
              />
              <Route
                path="finance/budgets"
                element={
                  <RouteWrapper>
                    <BudgetManagement />
                  </RouteWrapper>
                }
              />
              <Route
                path="finance/currencies"
                element={
                  <RouteWrapper>
                    <CurrencySettings />
                  </RouteWrapper>
                }
              />
              <Route
                path="crm/pipeline"
                element={
                  <RouteWrapper>
                    <CrmPipeline />
                  </RouteWrapper>
                }
              />
              <Route
                path="crm/leads"
                element={
                  <RouteWrapper>
                    <LeadCenter />
                  </RouteWrapper>
                }
              />
              <Route
                path="crm/quotations"
                element={
                  <RouteWrapper>
                    <QuotationCenter />
                  </RouteWrapper>
                }
              />
              <Route
                path="hr/employees"
                element={
                  <RouteWrapper>
                    <EmployeeRegistry />
                  </RouteWrapper>
                }
              />
              <Route
                path="hr/payroll"
                element={
                  <RouteWrapper>
                    <PayrollPortal />
                  </RouteWrapper>
                }
              />
              <Route
                path="qc/inspections"
                element={
                  <RouteWrapper>
                    <QCInspections />
                  </RouteWrapper>
                }
              />
              <Route
                path="qc/standards"
                element={
                  <RouteWrapper>
                    <QualityStandards />
                  </RouteWrapper>
                }
              />
              <Route
                path="reports/p-and-l"
                element={
                  <RouteWrapper>
                    <PandLStatement />
                  </RouteWrapper>
                }
              />
              <Route
                path="reports/overheads"
                element={
                  <RouteWrapper>
                    <DepartmentalOverheads />
                  </RouteWrapper>
                }
              />
              <Route
                path="assets/maintenance"
                element={
                  <RouteWrapper>
                    <AssetMaintenance />
                  </RouteWrapper>
                }
              />
              <Route
                path="*"
                element={
                  <RouteWrapper>
                    <NotFound />
                  </RouteWrapper>
                }
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </AuthProvider>
);

export default App;
