import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Plus, 
  Search, 
  Filter, 
  Package,
  List,
  Route,
  Eye,
  Edit,
  Trash2,
  Copy,
  Play,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Factory,
  Wrench,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Mock data for production recipes
const mockRecipes = [
  {
    recipe_id: '1',
    part_number: '54410-EDG50',
    part_description: 'TANK S/A AIR',
    model: 'FMBJ',
    recipe_name: 'TANK S/A AIR Production Recipe',
    version: '1.0',
    is_active: true,
    created_at: '2024-01-10',
    bom_items_count: 11,
    routing_steps_count: 7,
    bom_items: [
      {
        bom_id: '1',
        part_number: 'S4411-EDE60',
        part_description: 'PLATE, MAIN',
        sub_assembly_name: 'Main',
        manufacturing_facility: 'IN_HOUSE',
        quantity_required: 1,
        blank_thickness: 3.0,
        specification: 'THICKNESS 3.0',
        sequence_order: 1
      },
      {
        bom_id: '2',
        part_number: 'S4412-E0570',
        part_description: 'PLATE, END',
        sub_assembly_name: 'End Plate',
        manufacturing_facility: 'IN_HOUSE',
        quantity_required: 2,
        blank_thickness: 3.0,
        specification: 'THICKNESS 3.0',
        sequence_order: 2
      },
      {
        bom_id: '3',
        part_number: 'S4480-2218F',
        part_description: 'BOSS',
        sub_assembly_name: 'Boss',
        manufacturing_facility: 'IN_HOUSE',
        quantity_required: 1,
        specification: 'PT 1/2',
        sequence_order: 3
      }
    ],
    routing_steps: [
      {
        routing_id: '1',
        operation_code: 'CUT001',
        operation_name: 'Cutting/Shearing',
        operation_type: 'PROCESS',
        sequence_order: 1,
        work_center: 'WC001',
        setup_time_minutes: 30,
        run_time_per_piece_minutes: 5
      },
      {
        routing_id: '2',
        operation_code: 'FORM001',
        operation_name: 'Forming/Bending',
        operation_type: 'PROCESS',
        sequence_order: 2,
        work_center: 'WC002',
        setup_time_minutes: 45,
        run_time_per_piece_minutes: 8
      },
      {
        routing_id: '3',
        operation_code: 'WELD001',
        operation_name: 'Welding - Tacking',
        operation_type: 'CRITICAL_PROCESS',
        sequence_order: 3,
        work_center: 'WC003',
        setup_time_minutes: 20,
        run_time_per_piece_minutes: 15
      },
      {
        routing_id: '4',
        operation_code: 'WELD002',
        operation_name: 'Welding - Main Seams',
        operation_type: 'CRITICAL_PROCESS',
        sequence_order: 4,
        work_center: 'WC003',
        setup_time_minutes: 30,
        run_time_per_piece_minutes: 25
      },
      {
        routing_id: '5',
        operation_code: 'INSP001',
        operation_name: 'Leakage Testing',
        operation_type: 'INSPECTION',
        sequence_order: 5,
        work_center: 'WC007',
        setup_time_minutes: 15,
        run_time_per_piece_minutes: 10,
        quality_check_required: true
      },
      {
        routing_id: '6',
        operation_code: 'PAINT001',
        operation_name: 'Painting',
        operation_type: 'PROCESS',
        sequence_order: 6,
        work_center: 'WC005',
        setup_time_minutes: 60,
        run_time_per_piece_minutes: 20
      },
      {
        routing_id: '7',
        operation_code: 'FINAL001',
        operation_name: 'Final Inspection',
        operation_type: 'INSPECTION',
        sequence_order: 7,
        work_center: 'WC007',
        setup_time_minutes: 10,
        run_time_per_piece_minutes: 5,
        quality_check_required: true
      }
    ]
  },
  {
    recipe_id: '2',
    part_number: '89738406',
    part_description: 'Bkt Fuel Tank',
    model: 'NMR',
    recipe_name: 'Bkt Fuel Tank Production Recipe',
    version: '1.0',
    is_active: true,
    created_at: '2024-01-05',
    bom_items_count: 6,
    routing_steps_count: 6,
    bom_items: [
      {
        bom_id: '4',
        part_number: 'MAIN-001',
        part_description: 'Main Component',
        sub_assembly_name: 'Main',
        manufacturing_facility: 'IN_HOUSE',
        quantity_required: 1,
        blank_width: 170,
        blank_length: 760,
        blank_thickness: 2.5,
        sequence_order: 1
      }
    ],
    routing_steps: [
      {
        routing_id: '8',
        operation_code: 'CUT001',
        operation_name: 'Cutting/Shearing',
        operation_type: 'PROCESS',
        sequence_order: 1,
        work_center: 'WC001'
      },
      {
        routing_id: '9',
        operation_code: 'FORM001',
        operation_name: 'Forming',
        operation_type: 'PROCESS',
        sequence_order: 2,
        work_center: 'WC002'
      },
      {
        routing_id: '10',
        operation_code: 'PIERCE001',
        operation_name: 'Piercing 1',
        operation_type: 'PROCESS',
        sequence_order: 3,
        work_center: 'WC004'
      }
    ]
  }
];

const ProductionRecipes: React.FC = () => {
  const { toast } = useToast();
  const [recipes, setRecipes] = useState(mockRecipes);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    model: '',
    is_active: 'true',
    search: ''
  });

  const operationTypeConfig = {
    PROCESS: { label: 'Process', color: 'bg-blue-100 text-blue-800', icon: Settings },
    CRITICAL_PROCESS: { label: 'Critical Process', color: 'bg-red-100 text-red-800', icon: AlertCircle },
    INSPECTION: { label: 'Inspection', color: 'bg-green-100 text-green-800', icon: CheckCircle }
  };

  const filteredRecipes = recipes.filter(recipe => {
    const matchesModel = !filters.model || recipe.model === filters.model;
    const matchesActive = !filters.is_active || recipe.is_active.toString() === filters.is_active;
    const matchesSearch = !filters.search || 
      recipe.part_number.toLowerCase().includes(filters.search.toLowerCase()) ||
      recipe.part_description.toLowerCase().includes(filters.search.toLowerCase()) ||
      recipe.recipe_name.toLowerCase().includes(filters.search.toLowerCase());

    return matchesModel && matchesActive && matchesSearch;
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? '' : value
    }));
  };

  const handleCreateWorkOrder = (recipe: any) => {
    toast({
      title: "Work Order Created",
      description: `Work order created from recipe ${recipe.recipe_name}`,
    });
  };

  const getTotalSetupTime = (routingSteps: any[]) => {
    return routingSteps.reduce((total, step) => total + (step.setup_time_minutes || 0), 0);
  };

  const getTotalRunTime = (routingSteps: any[]) => {
    return routingSteps.reduce((total, step) => total + (step.run_time_per_piece_minutes || 0), 0);
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-700">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-indigo-600/10 to-blue-600/10 rounded-2xl blur-3xl"></div>
        <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 via-purple-800 to-indigo-800 bg-clip-text text-transparent mb-3">
                Production Recipes
              </h1>
              <p className="text-gray-600 text-lg">
                Manage manufacturing recipes, Bill of Materials (BOM), and production routing for automotive parts
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                <Plus className="w-5 h-5 mr-2" />
                Create Recipe
              </Button>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center">
                <Settings className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative bg-white/70 backdrop-blur-xl border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Recipes</CardTitle>
            <Settings className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">{recipes.length}</div>
            <p className="text-xs text-gray-500 mt-1">Production recipes</p>
          </CardContent>
        </Card>

        <Card className="relative bg-white/70 backdrop-blur-xl border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Recipes</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {recipes.filter(r => r.is_active).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Currently in use</p>
          </CardContent>
        </Card>

        <Card className="relative bg-white/70 backdrop-blur-xl border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total BOM Items</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {recipes.reduce((total, recipe) => total + recipe.bom_items_count, 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Components across all recipes</p>
          </CardContent>
        </Card>

        <Card className="relative bg-white/70 backdrop-blur-xl border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Operations</CardTitle>
            <Route className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              {recipes.reduce((total, recipe) => total + recipe.routing_steps_count, 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Manufacturing steps</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white/70 backdrop-blur-xl border border-white/30 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Search recipes..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Model</Label>
              <Select value={filters.model || 'all'} onValueChange={(value) => handleFilterChange('model', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Models" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Models</SelectItem>
                  <SelectItem value="FMBJ">FMBJ</SelectItem>
                  <SelectItem value="NMR">NMR</SelectItem>
                  <SelectItem value="NLR">NLR</SelectItem>
                  <SelectItem value="NPR">NPR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filters.is_active || 'all'} onValueChange={(value) => handleFilterChange('is_active', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recipes List */}
      <div className="grid gap-6">
        {filteredRecipes.map((recipe) => (
          <Card key={recipe.recipe_id} className="bg-white/70 backdrop-blur-xl border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold text-gray-800">{recipe.part_number}</h3>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                      {recipe.model}
                    </Badge>
                    <Badge className={recipe.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                      {recipe.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="text-gray-600">
                    <p className="font-medium">{recipe.part_description}</p>
                    <p className="text-sm">{recipe.recipe_name}</p>
                    <p className="text-sm">Version: {recipe.version}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleCreateWorkOrder(recipe)}
                    className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Create WO
                  </Button>
                  <Button variant="outline" size="sm">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="bom">
                    <Package className="w-4 h-4 mr-2" />
                    BOM ({recipe.bom_items_count})
                  </TabsTrigger>
                  <TabsTrigger value="routing">
                    <Route className="w-4 h-4 mr-2" />
                    Routing ({recipe.routing_steps_count})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <Package className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">BOM Items</p>
                        <p className="text-2xl font-bold text-blue-900">{recipe.bom_items_count}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <Route className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Operations</p>
                        <p className="text-2xl font-bold text-green-900">{recipe.routing_steps_count}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                      <Clock className="w-8 h-8 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium text-purple-800">Total Time</p>
                        <p className="text-2xl font-bold text-purple-900">
                          {Math.round(getTotalSetupTime(recipe.routing_steps) + getTotalRunTime(recipe.routing_steps))}m
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="bom" className="space-y-4">
                  <div className="space-y-3">
                    {recipe.bom_items.map((item: any, index: number) => (
                      <div key={item.bom_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-700">
                            {item.sequence_order}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{item.part_description}</p>
                            <p className="text-sm text-gray-600">
                              {item.part_number} | Qty: {item.quantity_required} | {item.manufacturing_facility}
                            </p>
                            {item.specification && (
                              <p className="text-xs text-gray-500">{item.specification}</p>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {item.sub_assembly_name}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="routing" className="space-y-4">
                  <div className="space-y-3">
                    {recipe.routing_steps.map((step: any, index: number) => {
                      const OperationIcon = operationTypeConfig[step.operation_type as keyof typeof operationTypeConfig]?.icon || Settings;
                      return (
                        <div key={step.routing_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-semibold text-green-700">
                              {step.sequence_order}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <OperationIcon className="w-4 h-4 text-gray-600" />
                                <p className="font-medium text-gray-800">{step.operation_name}</p>
                                <Badge className={operationTypeConfig[step.operation_type as keyof typeof operationTypeConfig]?.color}>
                                  {operationTypeConfig[step.operation_type as keyof typeof operationTypeConfig]?.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">
                                {step.operation_code} | {step.work_center}
                              </p>
                              <p className="text-xs text-gray-500">
                                Setup: {step.setup_time_minutes}m | Run: {step.run_time_per_piece_minutes}m/piece
                              </p>
                            </div>
                          </div>
                          {step.quality_check_required && (
                            <Badge className="bg-orange-100 text-orange-800">
                              QC Required
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRecipes.length === 0 && (
        <Card className="bg-white/70 backdrop-blur-xl border border-white/30 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Settings className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Production Recipes Found</h3>
            <p className="text-gray-500 text-center mb-4">
              No recipes match your current filters. Try adjusting your search criteria.
            </p>
            <Button variant="outline" onClick={() => setFilters({ model: '', is_active: 'true', search: '' })}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductionRecipes;
