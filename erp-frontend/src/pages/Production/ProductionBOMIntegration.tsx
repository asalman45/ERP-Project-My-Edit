import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Factory,
  Package,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  Download,
  Eye,
  RefreshCw,
  Calculator,
  Scale
} from 'lucide-react';
import { productionMaterialConsumptionApi, scrapManagementApi, bomApi, productApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface ProductionOrder {
  production_order_id: string;
  production_order_number: string;
  product_id: string;
  product_name: string;
  product_code: string;
  qty_ordered: number;
  qty_completed: number;
  status: string;
  planned_start?: string;
  planned_end?: string;
}

interface MaterialConsumption {
  consumption_id: string;
  sub_assembly_name: string;
  material_name: string;
  material_code: string;
  planned_quantity: number;
  consumed_quantity: number;
  scrap_quantity: number;
  consumption_type: string;
  blank_dimensions: {
    width: number;
    length: number;
    thickness: number;
  };
  efficiency_ratio: number;
}

interface ScrapRecommendation {
  scrap_id: string;
  material_name: string;
  available_quantity: number;
  scrap_dimensions: {
    width: number;
    length: number;
    thickness: number;
  };
  bom_requirement: {
    sub_assembly: string;
    required_dimensions: {
      width: number;
      length: number;
      thickness: number;
    };
  };
  potential_savings: number;
  recommendation_score: number;
}

const ProductionBOMIntegration: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedProductionOrder, setSelectedProductionOrder] = useState<string>('');
  const [consumptionData, setConsumptionData] = useState<MaterialConsumption[]>([]);
  const [scrapRecommendations, setScrapRecommendations] = useState<ScrapRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('consumption');
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
    fetchProductionOrders();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await productApi.getAll();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchProductionOrders = async () => {
    try {
      // Mock production orders - in real implementation, this would come from production API
      const mockOrders: ProductionOrder[] = [
        {
          production_order_id: 'po-001',
          production_order_number: 'PO-2024-001',
          product_id: '5cdef655-4cf2-400f-8609-189236cc9a8c',
          product_name: 'Base Plate',
          product_code: '89806273NM',
          qty_ordered: 100,
          qty_completed: 0,
          status: 'PLANNED',
          planned_start: '2024-01-15',
          planned_end: '2024-01-20'
        }
      ];
      setProductionOrders(mockOrders);
    } catch (error) {
      console.error('Error fetching production orders:', error);
    }
  };

  const processBOMForProduction = async () => {
    if (!selectedProduct || !selectedProductionOrder) {
      toast({
        title: "Error",
        description: "Please select both a product and production order",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await productionMaterialConsumptionApi.processBOMForProduction(
        selectedProductionOrder,
        selectedProduct
      );
      
      toast({
        title: "Success",
        description: result.message || "BOM processed for production order",
      });

      // Refresh consumption data
      fetchConsumptionData();
      fetchScrapRecommendations();
    } catch (error) {
      console.error('Error processing BOM for production:', error);
      setError('Failed to process BOM for production');
      toast({
        title: "Error",
        description: "Failed to process BOM for production",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchConsumptionData = async () => {
    if (!selectedProductionOrder) return;

    try {
      const data = await productionMaterialConsumptionApi.getByProductionOrder(selectedProductionOrder);
      setConsumptionData(data.data || []);
    } catch (error) {
      console.error('Error fetching consumption data:', error);
    }
  };

  const fetchScrapRecommendations = async () => {
    if (!selectedProduct) return;

    try {
      const data = await scrapManagementApi.getRecommendations({ productId: selectedProduct });
      setScrapRecommendations(data.data || []);
    } catch (error) {
      console.error('Error fetching scrap recommendations:', error);
    }
  };

  const updateConsumption = async (consumptionId: string, consumedQuantity: number) => {
    try {
      await productionMaterialConsumptionApi.update(consumptionId, {
        consumed_quantity: consumedQuantity,
        updated_by: 'current_user'
      });

      toast({
        title: "Success",
        description: "Consumption updated successfully",
      });

      fetchConsumptionData();
    } catch (error) {
      console.error('Error updating consumption:', error);
      toast({
        title: "Error",
        description: "Failed to update consumption",
        variant: "destructive",
      });
    }
  };

  const reuseScrap = async (scrapId: string, quantityToReuse: number) => {
    if (!selectedProductionOrder || !selectedProduct) {
      toast({
        title: "Error",
        description: "Please select production order and product",
        variant: "destructive",
      });
      return;
    }

    try {
      await scrapManagementApi.reuseInProduction(scrapId, {
        production_order_id: selectedProductionOrder,
        product_id: selectedProduct,
        quantity_to_reuse: quantityToReuse,
        reason: 'Production consumption',
        reused_by: 'current_user'
      });

      toast({
        title: "Success",
        description: `Successfully reused ${quantityToReuse} kg of scrap material`,
      });

      fetchScrapRecommendations();
      fetchConsumptionData();
    } catch (error) {
      console.error('Error reusing scrap:', error);
      toast({
        title: "Error",
        description: "Failed to reuse scrap material",
        variant: "destructive",
      });
    }
  };

  const exportConsumptionReport = async () => {
    if (!selectedProductionOrder) return;

    try {
      const data = await productionMaterialConsumptionApi.getByProductionOrder(selectedProductionOrder);
      
      // Create CSV content
      let csvContent = 'Sub Assembly,Material,Planned Qty,Consumed Qty,Scrap Qty,Efficiency %,Type\n';
      (data.data || []).forEach((consumption: MaterialConsumption) => {
        const efficiency = consumption.planned_quantity > 0 
          ? ((consumption.consumed_quantity / consumption.planned_quantity) * 100).toFixed(2)
          : '0.00';
        csvContent += `"${consumption.sub_assembly_name}","${consumption.material_name}","${consumption.planned_quantity}","${consumption.consumed_quantity}","${consumption.scrap_quantity}","${efficiency}","${consumption.consumption_type}"\n`;
      });

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `production_consumption_${selectedProductionOrder}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Consumption report exported successfully",
      });
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: "Error",
        description: "Failed to export consumption report",
        variant: "destructive",
      });
    }
  };

  const selectedProductData = products.find(p => p.product_id === selectedProduct);
  const selectedOrderData = productionOrders.find(po => po.production_order_id === selectedProductionOrder);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Production BOM Integration</h1>
          <p className="text-gray-600 mt-1">Link BOM data with production orders and track material consumption</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportConsumptionReport} disabled={!selectedProductionOrder}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Selection Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className="w-5 h-5" />
            Production Setup
          </CardTitle>
          <CardDescription>
            Select a product and production order to link BOM with production
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product-select">Product</Label>
              <Select onValueChange={setSelectedProduct} value={selectedProduct}>
                <SelectTrigger id="product-select">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.product_id} value={product.product_id}>
                      {product.product_code} - {product.part_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="production-order-select">Production Order</Label>
              <Select onValueChange={setSelectedProductionOrder} value={selectedProductionOrder}>
                <SelectTrigger id="production-order-select">
                  <SelectValue placeholder="Select production order" />
                </SelectTrigger>
                <SelectContent>
                  {productionOrders.map((order) => (
                    <SelectItem key={order.production_order_id} value={order.production_order_id}>
                      {order.production_order_number} - {order.product_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={processBOMForProduction} 
                disabled={!selectedProduct || !selectedProductionOrder || loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Link BOM to Production
                  </>
                )}
              </Button>
            </div>
          </div>

          {selectedProductData && selectedOrderData && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900">{selectedProductData.part_name}</h3>
              <p className="text-blue-700 text-sm">
                Product: {selectedProductData.product_code} | 
                Order: {selectedOrderData.production_order_number} | 
                Quantity: {selectedOrderData.qty_ordered} | 
                Status: {selectedOrderData.status}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="consumption">Material Consumption</TabsTrigger>
          <TabsTrigger value="scrap-recommendations">Scrap Recommendations</TabsTrigger>
          <TabsTrigger value="efficiency">Efficiency Analysis</TabsTrigger>
        </TabsList>

        {/* Material Consumption Tab */}
        <TabsContent value="consumption" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Material Consumption Tracking
              </CardTitle>
              <CardDescription>
                Track actual material consumption against BOM requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {consumptionData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No consumption data found</p>
                  <p className="text-sm">Link BOM to production order to start tracking</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2 text-left">Sub Assembly</th>
                        <th className="border border-gray-300 p-2 text-left">Material</th>
                        <th className="border border-gray-300 p-2 text-center">Planned Qty</th>
                        <th className="border border-gray-300 p-2 text-center">Consumed Qty</th>
                        <th className="border border-gray-300 p-2 text-center">Scrap Qty</th>
                        <th className="border border-gray-300 p-2 text-center">Efficiency</th>
                        <th className="border border-gray-300 p-2 text-center">Type</th>
                        <th className="border border-gray-300 p-2 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {consumptionData.map((consumption) => (
                        <tr key={consumption.consumption_id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-2 font-medium">
                            {consumption.sub_assembly_name}
                          </td>
                          <td className="border border-gray-300 p-2">
                            <div>
                              <div className="font-medium">{consumption.material_name}</div>
                              <div className="text-sm text-gray-500">{consumption.material_code}</div>
                            </div>
                          </td>
                          <td className="border border-gray-300 p-2 text-center">
                            {consumption.planned_quantity}
                          </td>
                          <td className="border border-gray-300 p-2 text-center">
                            <Input
                              type="number"
                              value={consumption.consumed_quantity}
                              onChange={(e) => {
                                const newValue = parseFloat(e.target.value) || 0;
                                updateConsumption(consumption.consumption_id, newValue);
                              }}
                              className="w-20 text-center"
                            />
                          </td>
                          <td className="border border-gray-300 p-2 text-center">
                            {consumption.scrap_quantity}
                          </td>
                          <td className="border border-gray-300 p-2 text-center">
                            <Badge 
                              variant={consumption.efficiency_ratio > 90 ? "default" : "destructive"}
                            >
                              {consumption.efficiency_ratio.toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="border border-gray-300 p-2 text-center">
                            <Badge variant="outline">{consumption.consumption_type}</Badge>
                          </td>
                          <td className="border border-gray-300 p-2 text-center">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scrap Recommendations Tab */}
        <TabsContent value="scrap-recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="w-5 h-5" />
                Scrap Reuse Recommendations
              </CardTitle>
              <CardDescription>
                Available scrap materials that can be reused in production
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scrapRecommendations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Scale className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No scrap recommendations found</p>
                  <p className="text-sm">Select a product to see available scrap materials</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {scrapRecommendations.map((recommendation) => (
                    <Card key={recommendation.scrap_id} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <Label className="text-sm font-medium">Material</Label>
                            <p className="text-sm text-gray-600">{recommendation.material_name}</p>
                            <p className="text-xs text-gray-500">Available: {recommendation.available_quantity} kg</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Scrap Dimensions</Label>
                            <p className="text-sm text-gray-600">
                              {recommendation.scrap_dimensions.width} × {recommendation.scrap_dimensions.length} × {recommendation.scrap_dimensions.thickness} mm
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">BOM Requirement</Label>
                            <p className="text-sm text-gray-600">{recommendation.bom_requirement.sub_assembly}</p>
                            <p className="text-xs text-gray-500">
                              {recommendation.bom_requirement.required_dimensions.width} × {recommendation.bom_requirement.required_dimensions.length} × {recommendation.bom_requirement.required_dimensions.thickness} mm
                            </p>
                          </div>
                          <div className="flex flex-col justify-between">
                            <div>
                              <Label className="text-sm font-medium">Score & Savings</Label>
                              <p className="text-sm font-bold text-green-600">
                                Score: {recommendation.recommendation_score}/100
                              </p>
                              <p className="text-sm text-green-600">
                                Save: ${recommendation.potential_savings.toFixed(2)}
                              </p>
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => reuseScrap(recommendation.scrap_id, recommendation.available_quantity)}
                              className="mt-2"
                            >
                              Reuse in Production
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Efficiency Analysis Tab */}
        <TabsContent value="efficiency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Production Efficiency Analysis
              </CardTitle>
              <CardDescription>
                Analyze material consumption efficiency and identify improvement opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Calculator className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Efficiency analysis coming soon</p>
                <p className="text-sm">This will show detailed efficiency metrics and optimization suggestions</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductionBOMIntegration;

