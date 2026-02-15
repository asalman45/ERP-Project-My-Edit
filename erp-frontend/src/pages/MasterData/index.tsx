import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Download, Search, Filter, BarChart3, Package, Users, Settings, TrendingUp, AlertCircle, Database, Eye, Edit, Trash2 } from "lucide-react";
import { DataTable, Column } from "@/components/ui/data-table";
import { OEMModal } from "@/components/modals/OEMModal";
import ProductModal from "@/components/modals/ProductModal";
import ModelModal from "@/components/modals/ModelModal";
import UOMModal from "@/components/modals/UOMModal";
import { OEM, Model, UOM, Product } from "@/types";
import { useOEMs, useModels, useUOMs, useProducts } from "@/hooks/useMasterData";
import { useToast } from "@/hooks/use-toast";
import ImportModal from "@/components/inventory/ImportModal";
import GenericExportModal from "@/components/common/GenericExportModal";
import { productApi } from "@/services/api";
import { cn } from "@/lib/utils";

const MasterData: React.FC = () => {
  const { toast } = useToast();
  
  // Use custom hooks for data management
  const { oems, loading: oemsLoading, createOEM, updateOEM, deleteOEM } = useOEMs();
  const { models, loading: modelsLoading, createModel, updateModel, deleteModel } = useModels();
  const { uoms, loading: uomsLoading, createUOM, updateUOM, deleteUOM } = useUOMs();
  const { products, loading: productsLoading, createProduct, updateProduct, deleteProduct } = useProducts();

  // Modal states
  const [oemModalOpen, setOEMModalOpen] = useState(false);
  const [editingOEM, setEditingOEM] = useState<OEM | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [modelModalOpen, setModelModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [uomModalOpen, setUOMModalOpen] = useState(false);
  const [editingUOM, setEditingUOM] = useState<UOM | null>(null);
  
  // Import/Export modal states
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [currentTab, setCurrentTab] = useState("oem");

  // OEM Table Columns
  const oemColumns: Column<OEM>[] = [
    { key: "name", header: "OEM Name", sortable: true },
    { key: "createdAt", header: "Created At", sortable: true },
  ];

  // Model Table Columns
  const modelColumns: Column<Model>[] = [
    { key: "name", header: "Model Name", sortable: true },
    { key: "year", header: "Year", sortable: true },
    { key: "oemName", header: "OEM", sortable: true },
    { key: "createdAt", header: "Created At", sortable: true },
  ];

  // UOM Table Columns
  const uomColumns: Column<UOM>[] = [
    { key: "code", header: "Code", sortable: true },
    { key: "name", header: "Name", sortable: true },
    { key: "createdAt", header: "Created At", sortable: true },
  ];

  // Product Table Columns
  const productColumns: Column<Product>[] = [
    { key: "code", header: "Product Code", sortable: true },
    { key: "partName", header: "Part Name", sortable: true },
    { key: "oemName", header: "OEM", sortable: true },
    { key: "modelName", header: "Model", sortable: true },
    { key: "uomCode", header: "UOM", sortable: true },
    { 
      key: "standardCost", 
      header: "Standard Cost", 
      sortable: true,
      render: (value) => value ? `$${value.toFixed(2)}` : "-"
    },
    { key: "category", header: "Category", sortable: true },
  ];

  // Handlers
  const handleSaveOEM = async (oemData: Omit<OEM, "id" | "createdAt">) => {
    try {
      if (editingOEM) {
        // Update existing OEM
        await updateOEM(editingOEM.id, oemData);
      } else {
        // Add new OEM
        await createOEM(oemData);
      }
      setEditingOEM(null);
    } catch (error) {
      // Error handling is done in the hook
      console.error('Error saving OEM:', error);
    }
  };

  const handleEditOEM = (oem: OEM) => {
    setEditingOEM(oem);
    setOEMModalOpen(true);
  };

  const handleDeleteOEM = async (oem: OEM) => {
    try {
      await deleteOEM(oem.id);
    } catch (error) {
      // Error handling is done in the hook
      console.error('Error deleting OEM:', error);
    }
  };

  // Product handlers
  const handleSaveProduct = async (productData: Omit<Product, "id" | "createdAt" | "oemName" | "modelName" | "uomCode">) => {
    try {
      if (editingProduct) {
        // Update existing product
        await updateProduct(editingProduct.id, productData);
      } else {
        // Add new product
        await createProduct(productData);
      }
      setEditingProduct(null);
    } catch (error) {
      // Error handling is done in the hook
      console.error('Error saving product:', error);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductModalOpen(true);
  };

  const handleDeleteProduct = async (product: Product) => {
    try {
      await deleteProduct(product.id);
    } catch (error) {
      // Error handling is done in the hook
      console.error('Error deleting product:', error);
    }
  };

  // Model handlers
  const handleSaveModel = async (modelData: Omit<Model, "id" | "createdAt" | "oemName">) => {
    try {
      if (editingModel) {
        // Update existing model
        await updateModel(editingModel.id, modelData);
      } else {
        // Add new model
        await createModel(modelData);
      }
      setEditingModel(null);
    } catch (error) {
      // Error handling is done in the hook
      console.error('Error saving model:', error);
    }
  };

  const handleEditModel = (model: Model) => {
    setEditingModel(model);
    setModelModalOpen(true);
  };

  const handleDeleteModel = async (model: Model) => {
    try {
      await deleteModel(model.id);
    } catch (error) {
      // Error handling is done in the hook
      console.error('Error deleting model:', error);
    }
  };

  // UOM handlers
  const handleSaveUOM = async (uomData: Omit<UOM, "id" | "createdAt">) => {
    try {
      if (editingUOM) {
        // Update existing UOM
        await updateUOM(editingUOM.id, uomData);
      } else {
        // Add new UOM
        await createUOM(uomData);
      }
      setEditingUOM(null);
    } catch (error) {
      // Error handling is done in the hook
      console.error('Error saving UOM:', error);
    }
  };

  const handleEditUOM = (uom: UOM) => {
    setEditingUOM(uom);
    setUOMModalOpen(true);
  };

  const handleDeleteUOM = async (uom: UOM) => {
    try {
      await deleteUOM(uom.id);
    } catch (error) {
      // Error handling is done in the hook
      console.error('Error deleting UOM:', error);
    }
  };

  // Statistics data
  const stats = [
    {
      title: "Total OEMs",
      value: oems.length,
      icon: Users,
      color: "blue",
      description: "Original Equipment Manufacturers"
    },
    {
      title: "Vehicle Models",
      value: models.length,
      icon: Package,
      color: "green",
      description: "Supported vehicle models"
    },
    {
      title: "Units of Measure",
      value: uoms.length,
      icon: Settings,
      color: "purple",
      description: "Measurement units"
    },
    {
      title: "Products",
      value: products.length,
      icon: Database,
      color: "orange",
      description: "Total product catalog"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-700">
      {/* Header Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 rounded-2xl blur-3xl"></div>
        <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-3">
                Master Data
              </h1>
              <p className="text-gray-600 text-lg">
                Manage your core business data including OEMs, Models, Units of Measure, and Products
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowImportModal(true)} 
                className="flex items-center gap-2 bg-white/50 hover:bg-white/70 border-white/30 transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <Upload className="h-4 w-4" />
                Import
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowExportModal(true)} 
                className="flex items-center gap-2 bg-white/50 hover:bg-white/70 border-white/30 transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div 
            key={stat.title}
            className={cn(
              "relative bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-2xl transition-all duration-500 ease-out group overflow-hidden",
              "hover:scale-[1.02] hover:bg-white/80 animate-in slide-in-from-bottom-4 duration-700",
              `delay-${(index + 1) * 100}`
            )}
          >
            {/* Background gradient overlay */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500",
              stat.color === "blue" && "from-blue-400/20 to-blue-500/20",
              stat.color === "green" && "from-green-400/20 to-green-500/20",
              stat.color === "purple" && "from-purple-400/20 to-purple-500/20",
              stat.color === "orange" && "from-orange-400/20 to-orange-500/20"
            )}></div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-2 group-hover:text-gray-700 transition-colors duration-300">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-gray-800 group-hover:text-gray-900 transition-colors duration-300">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                
                {/* Progress indicator */}
                <div className="mt-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      stat.color === "blue" && "bg-blue-500",
                      stat.color === "green" && "bg-green-500",
                      stat.color === "purple" && "bg-purple-500",
                      stat.color === "orange" && "bg-orange-500"
                    )}></div>
                    <span>Active</span>
                  </div>
                </div>
              </div>
              <div className={cn(
                "w-16 h-16 bg-gradient-to-br rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg",
                stat.color === "blue" && "from-blue-400/20 to-blue-500/20 hover:from-blue-400/30 hover:to-blue-500/30",
                stat.color === "green" && "from-green-400/20 to-green-500/20 hover:from-green-400/30 hover:to-green-500/30",
                stat.color === "purple" && "from-purple-400/20 to-purple-500/20 hover:from-purple-400/30 hover:to-purple-500/30",
                stat.color === "orange" && "from-orange-400/20 to-orange-500/20 hover:from-orange-400/30 hover:to-orange-500/30",
                "group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-xl"
              )}>
                <stat.icon className={cn(
                  "w-8 h-8 transition-transform duration-300 group-hover:scale-110",
                  stat.color === "blue" && "text-blue-600",
                  stat.color === "green" && "text-green-600",
                  stat.color === "purple" && "text-purple-600",
                  stat.color === "orange" && "text-orange-600"
                )} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Summary Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Quick Actions</h3>
              <p className="text-sm text-gray-600">Common tasks and shortcuts</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowImportModal(true)}
              className="bg-white/50 hover:bg-white/70 border-white/30 transition-all duration-300 hover:scale-105 justify-start"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import Data
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowExportModal(true)}
              className="bg-white/50 hover:bg-white/70 border-white/30 transition-all duration-300 hover:scale-105 justify-start"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>

        {/* System Status */}
        <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">System Status</h3>
              <p className="text-sm text-gray-600">Current system health</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database Connection</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-600">Connected</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Status</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-600">Healthy</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Updated</span>
              <span className="text-sm font-medium text-gray-700">
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Tabs Section */}
      <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl border border-white/30 shadow-lg overflow-hidden">
        <Tabs defaultValue="oem" className="w-full">
          <div className="p-6 border-b border-white/20 bg-gradient-to-r from-white/40 to-white/20">
            <TabsList className="grid w-full grid-cols-4 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl p-1">
              <TabsTrigger 
                value="oem" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-700 transition-all duration-300 hover:scale-105"
              >
                <Users className="w-4 h-4" />
                OEM
              </TabsTrigger>
              <TabsTrigger 
                value="model"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-green-700 transition-all duration-300 hover:scale-105"
              >
                <Package className="w-4 h-4" />
                Model
              </TabsTrigger>
              <TabsTrigger 
                value="uom"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-purple-700 transition-all duration-300 hover:scale-105"
              >
                <Settings className="w-4 h-4" />
                UOM
              </TabsTrigger>
              <TabsTrigger 
                value="product"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-orange-700 transition-all duration-300 hover:scale-105"
              >
                <Database className="w-4 h-4" />
                Product
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="oem" className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  Original Equipment Manufacturers
                </h2>
                <p className="text-gray-600 mt-2">Manage your OEM partners and suppliers</p>
              </div>
              <Button 
                onClick={() => setOEMModalOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add OEM
              </Button>
            </div>
            
            <DataTable
              data={oems}
              columns={oemColumns}
              onEdit={handleEditOEM}
              onDelete={handleDeleteOEM}
              searchPlaceholder="Search OEMs..."
              loading={oemsLoading}
            />
          </TabsContent>

          <TabsContent value="model" className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-green-600" />
                  </div>
                  Vehicle Models
                </h2>
                <p className="text-gray-600 mt-2">Manage vehicle models and their specifications</p>
              </div>
              <Button 
                onClick={() => setModelModalOpen(true)}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Model
              </Button>
            </div>
            
            <DataTable
              data={models}
              columns={modelColumns}
              onEdit={handleEditModel}
              onDelete={handleDeleteModel}
              searchPlaceholder="Search models..."
              loading={modelsLoading}
            />
          </TabsContent>

          <TabsContent value="uom" className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl flex items-center justify-center">
                    <Settings className="w-6 h-6 text-purple-600" />
                  </div>
                  Units of Measure
                </h2>
                <p className="text-gray-600 mt-2">Define measurement units for your products</p>
              </div>
              <Button 
                onClick={() => setUOMModalOpen(true)}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add UOM
              </Button>
            </div>
            
            <DataTable
              data={uoms}
              columns={uomColumns}
              onEdit={handleEditUOM}
              onDelete={handleDeleteUOM}
              searchPlaceholder="Search UOMs..."
              loading={uomsLoading}
            />
          </TabsContent>

          <TabsContent value="product" className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-xl flex items-center justify-center">
                    <Database className="w-6 h-6 text-orange-600" />
                  </div>
                  Products
                </h2>
                <p className="text-gray-600 mt-2">Manage your complete product catalog</p>
              </div>
              <Button 
                onClick={() => setProductModalOpen(true)}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>
            
            <DataTable
              data={products}
              columns={productColumns}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
              searchPlaceholder="Search products..."
              loading={productsLoading}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <OEMModal
        isOpen={oemModalOpen}
        onClose={() => {
          setOEMModalOpen(false);
          setEditingOEM(null);
        }}
        onSave={handleSaveOEM}
        editingOEM={editingOEM}
      />

      <ProductModal
        isOpen={productModalOpen}
        onClose={() => {
          setProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        editingProduct={editingProduct}
      />

      <ModelModal
        isOpen={modelModalOpen}
        onClose={() => {
          setModelModalOpen(false);
          setEditingModel(null);
        }}
        onSave={handleSaveModel}
        editingModel={editingModel}
      />

      <UOMModal
        isOpen={uomModalOpen}
        onClose={() => {
          setUOMModalOpen(false);
          setEditingUOM(null);
        }}
        onSave={handleSaveUOM}
        editingUOM={editingUOM}
      />

      {showImportModal && (
        <ImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false);
            // Refresh data based on current tab
            // The hooks will automatically refetch data
          }}
        />
      )}

      {showExportModal && (
        <GenericExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onSuccess={() => {
            setShowExportModal(false);
          }}
          title="Export Master Data"
          exportFunction={productApi.exportProducts}
          filename="products"
          availableFormats={['pdf', 'csv', 'excel']}
        />
      )}
    </div>
  );
};

export default MasterData;