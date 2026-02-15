import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Layers, 
  Download,
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Calculator,
  Scale,
  Eye,
  Plus,
  Save,
  X,
  Square,
  Circle,
  Trash2
} from 'lucide-react';
import { bomApi, productApi, blankSpecApi, sheetOptimizationApi } from '@/services/api';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import SheetLayoutVisualization from '@/components/BOM/SheetLayoutVisualization';
import CircularLayoutVisualization from '@/components/BOM/CircularLayoutVisualization';
import { generateAllLayouts } from '@/utils/sheetLayoutGenerator';
import { generateAllCircularLayouts } from '@/utils/circularLayoutGenerator';

interface StandardBOMData {
  partNo: string;
  partDescription: string;
  mode: string;
  subAssemblies: {
    name: string;
    blankSize: {
      width: number | string;
      length: number | string;
      thickness: number | string;
      quantity: number | string;
    };
    weightPerBlank: number | string;
    materialConsumption: {
      sheetConsumptionPercent: number | string;
      sheetWeight: number | string;
      piecesPerSheet: number | string;
      totalBlanks: number | string;
    };
  }[];
  picture?: string | null;
  totalWeight: number;
}


const BOMStandardDisplay: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [bomData, setBomData] = useState<StandardBOMData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showOptimizationDialog, setShowOptimizationDialog] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [optimizingBlank, setOptimizingBlank] = useState<any>(null);
  const [compareAllSizes, setCompareAllSizes] = useState(true);
  const [showLayoutPreview, setShowLayoutPreview] = useState(true);
  const [layoutData, setLayoutData] = useState<any>(null);
  const [selectedCuttingMode, setSelectedCuttingMode] = useState('smart'); // 'horizontal', 'vertical', 'smart'
  const [cuttingType, setCuttingType] = useState<'rectangular' | 'circular'>('rectangular');
  const [optimizationMethod, setOptimizationMethod] = useState<'horizontal' | 'vertical' | 'smart' | 'square_grid' | 'hexagonal'>('smart');
  const [autoOptimize, setAutoOptimize] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [lastCalculationTime, setLastCalculationTime] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [subAssemblyToDelete, setSubAssemblyToDelete] = useState<{id: string, name: string} | null>(null);

  // Type guard functions
  const isCircular = (type: string): type is 'circular' => type === 'circular';
  const isRectangular = (type: string): type is 'rectangular' => type === 'rectangular';

  // Memoized layout visualization to prevent unnecessary re-renders
  const memoizedLayoutVisualization = useMemo(() => {
    if (!layoutData) return null;
    
    if (isCircular(cuttingType)) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Square Grid Layout */}
          <div
            className={`cursor-pointer transition-all duration-200 ${
              optimizationMethod === 'square_grid' ? 'ring-4 ring-blue-500 rounded-lg shadow-xl' : 'hover:ring-2 hover:ring-blue-300 rounded-lg'
            }`}
            onClick={() => setOptimizationMethod('square_grid')}
          >
            <div className="w-full overflow-hidden">
              <CircularLayoutVisualization
                layout={layoutData.squareGrid}
                title="Square Grid Cutting"
                width={400}
                height={320}
              />
            </div>
          </div>

          {/* Hexagonal Layout */}
          <div
            className={`cursor-pointer transition-all duration-200 ${
              optimizationMethod === 'hexagonal' ? 'ring-4 ring-purple-500 rounded-lg shadow-xl' : 'hover:ring-2 hover:ring-purple-300 rounded-lg'
            }`}
            onClick={() => setOptimizationMethod('hexagonal')}
          >
            <div className="w-full overflow-hidden">
              <CircularLayoutVisualization
                layout={layoutData.hexagonal}
                title="Hexagonal/Staggered Cutting"
                width={400}
                height={320}
              />
            </div>
          </div>

          {/* Smart Layout */}
          <div
            className={`cursor-pointer transition-all duration-200 ${
              optimizationMethod === 'smart' ? 'ring-4 ring-green-500 rounded-lg shadow-xl' : 'hover:ring-2 hover:ring-green-300 rounded-lg'
            }`}
            onClick={() => setOptimizationMethod('smart')}
          >
            <div className="w-full overflow-hidden">
              <CircularLayoutVisualization
                layout={layoutData.smart}
                title="Smart Circular Cutting"
                width={400}
                height={320}
              />
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Horizontal Layout */}
          <div
            className={`cursor-pointer transition-all duration-200 ${
              selectedCuttingMode === 'horizontal' ? 'ring-4 ring-blue-500 rounded-lg shadow-xl' : 'hover:ring-2 hover:ring-blue-300 rounded-lg'
            }`}
            onClick={() => setSelectedCuttingMode('horizontal')}
          >
            <div className="w-full overflow-hidden">
              <SheetLayoutVisualization
                layout={layoutData.horizontal}
                title="Horizontal Cutting"
                width={400}
                height={320}
              />
            </div>
          </div>

          {/* Vertical Layout */}
          <div
            className={`cursor-pointer transition-all duration-200 ${
              selectedCuttingMode === 'vertical' ? 'ring-4 ring-purple-500 rounded-lg shadow-xl' : 'hover:ring-2 hover:ring-purple-300 rounded-lg'
            }`}
            onClick={() => setSelectedCuttingMode('vertical')}
          >
            <div className="w-full overflow-hidden">
              <SheetLayoutVisualization
                layout={layoutData.vertical}
                title="Vertical Cutting"
                width={400}
                height={320}
              />
            </div>
          </div>

          {/* Smart Layout */}
          <div
            className={`cursor-pointer transition-all duration-200 ${
              selectedCuttingMode === 'smart' ? 'ring-4 ring-green-500 rounded-lg shadow-xl' : 'hover:ring-2 hover:ring-green-300 rounded-lg'
            }`}
            onClick={() => setSelectedCuttingMode('smart')}
          >
            <div className="w-full overflow-hidden">
              <SheetLayoutVisualization
                layout={layoutData.smart}
                title="Smart Mixed Cutting"
                width={400}
                height={320}
              />
            </div>
          </div>
        </div>
      );
    }
  }, [layoutData, cuttingType, optimizationMethod, selectedCuttingMode]);
  const [formData, setFormData] = useState({
    sub_assembly_name: '',
    width_mm: '',
    length_mm: '',
    thickness_mm: '',
    diameter_mm: '', // For circular cutting
    quantity: '',
    blank_weight_kg: '',
    pcs_per_sheet: '',
    sheet_util_pct: '',
    sheet_weight_kg: '',
    total_blanks: '',
    consumption_pct: '',
    // Sheet dimensions
    sheet_width_mm: '1220',
    sheet_length_mm: '2440'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  // Load cutting type preference
  useEffect(() => {
    const savedCuttingType = localStorage.getItem('bom-cutting-type-preference');
    if (savedCuttingType && (savedCuttingType === 'rectangular' || savedCuttingType === 'circular')) {
      setCuttingType(savedCuttingType);
    }
  }, []);

  // Save cutting type preference
  useEffect(() => {
    localStorage.setItem('bom-cutting-type-preference', cuttingType);
  }, [cuttingType]);

  // Real-time optimization calculation
  const calculateOptimization = useCallback(async () => {
    if (isCalculating) return; // Prevent multiple simultaneous calculations
    
    // Add cooldown period to prevent excessive API calls
    const now = Date.now();
    const timeSinceLastCalculation = now - lastCalculationTime;
    const COOLDOWN_PERIOD = 3000; // 3 seconds cooldown
    
    if (timeSinceLastCalculation < COOLDOWN_PERIOD) {
      console.log(`⏳ Calculation cooldown active. Waiting ${COOLDOWN_PERIOD - timeSinceLastCalculation}ms more...`);
      return;
    }
    
    // Validate required fields before making API call
    const hasRequiredFields = cuttingType === 'rectangular' 
      ? (formData.width_mm && formData.length_mm && formData.thickness_mm && formData.sheet_width_mm && formData.sheet_length_mm)
      : (formData.diameter_mm && formData.thickness_mm && formData.sheet_width_mm && formData.sheet_length_mm);
    
    if (!hasRequiredFields) {
      console.log('❌ Missing required fields for optimization calculation');
      toast({
        title: "Missing Required Fields",
        description: `Please fill in all required fields for ${cuttingType} cutting before calculating optimization.`,
        variant: "destructive",
      });
      return;
    }
    
    setIsCalculating(true);
    try {
      console.log('🔄 Starting optimization calculation...', {
        cuttingType,
        optimizationMethod,
        formData: {
          diameter_mm: formData.diameter_mm,
          width_mm: formData.width_mm,
          length_mm: formData.length_mm,
          thickness_mm: formData.thickness_mm,
          sheet_width_mm: formData.sheet_width_mm,
          sheet_length_mm: formData.sheet_length_mm
        }
      });

      if (cuttingType === 'rectangular') {
        // Use existing rectangular optimization
        const result = await sheetOptimizationApi.calculateOptimization({
          sheet_width_mm: parseFloat(formData.sheet_width_mm),
          sheet_length_mm: parseFloat(formData.sheet_length_mm),
          sheet_thickness_mm: parseFloat(formData.thickness_mm),
          width_mm: parseFloat(formData.width_mm),
          length_mm: parseFloat(formData.length_mm),
          thickness_mm: parseFloat(formData.thickness_mm),
          quantity: 1, // Required field for API
          method: optimizationMethod === 'smart' ? 'smart' : optimizationMethod
        });
        
        console.log('📊 Rectangular optimization result:', result);
        
        // Update form data with results
        setFormData(prev => ({
          ...prev,
          pcs_per_sheet: result.pcs_per_sheet || '',
          sheet_util_pct: result.sheet_util_pct || '',
          consumption_pct: result.consumption_pct || ''
        }));
      } else {
        // Use circular optimization
        const requestData = {
          sheet_width_mm: parseFloat(formData.sheet_width_mm),
          sheet_length_mm: parseFloat(formData.sheet_length_mm),
          sheet_thickness_mm: parseFloat(formData.thickness_mm),
          diameter_mm: parseFloat(formData.diameter_mm),
          thickness_mm: parseFloat(formData.thickness_mm),
          quantity: 1, // Required field for API
          method: optimizationMethod === 'smart' ? 'smart' : optimizationMethod
        };
        
        console.log('🔵 Circular optimization request:', requestData);
        
        const result = await sheetOptimizationApi.calculateCircleOptimization(requestData);
        
        console.log('📊 Circular optimization result:', result);
        
        // Calculate sheet weight (same formula as rectangular - weight of entire sheet)
        const sheetWeight = (
          parseFloat(formData.sheet_width_mm) * 
          parseFloat(formData.sheet_length_mm) * 
          parseFloat(formData.thickness_mm) * 
          0.00000785 // Steel density conversion factor (kg/m³ to kg)
        );
        
        // Update form data with results for circular cutting
        setFormData(prev => ({
          ...prev,
          pcs_per_sheet: result.total_circles_per_sheet || '',
          sheet_util_pct: result.efficiency_percentage || '',
          consumption_pct: result.efficiency_percentage || '',
          // Calculate weight per blank for circular
          blank_weight_kg: result.circle_weight_kg || '',
          // Sheet weight - weight of the entire sheet (not just the blanks)
          sheet_weight_kg: sheetWeight.toFixed(2),
          // Calculate total blanks weight
          total_blanks: result.total_circle_weight_kg || ''
        }));

        // Generate circular layout visualization data
        try {
          const layouts = generateAllCircularLayouts(
            parseFloat(formData.sheet_width_mm),
            parseFloat(formData.sheet_length_mm),
            parseFloat(formData.diameter_mm)
          );
          setLayoutData(layouts);
          console.log('🔵 Generated circular layouts:', layouts);
        } catch (error) {
          console.error('Error generating circular layout:', error);
          setLayoutData(null);
        }
      }
    } catch (error) {
      console.error('❌ Error calculating optimization:', error);
    } finally {
      setIsCalculating(false);
      setLastCalculationTime(Date.now()); // Update last calculation time
    }
  }, [cuttingType, optimizationMethod, formData, sheetOptimizationApi, isCalculating, lastCalculationTime]);

  // Real-time optimization calculation when form data changes
  useEffect(() => {
    const hasRequiredFields = cuttingType === 'rectangular' 
      ? (formData.width_mm && formData.length_mm && formData.thickness_mm && formData.sheet_width_mm && formData.sheet_length_mm)
      : (formData.diameter_mm && formData.thickness_mm && formData.sheet_width_mm && formData.sheet_length_mm);
    
    if (autoOptimize && hasRequiredFields && !isCalculating) {
      console.log('🔄 Auto-calculation triggered:', {
        cuttingType,
        optimizationMethod,
        hasRequiredFields,
        isCalculating
      });
      
      const timeoutId = setTimeout(() => {
        // Double-check conditions before calling
        if (autoOptimize && hasRequiredFields && !isCalculating) {
          calculateOptimization();
        }
      }, 5000); // Increased to 5 seconds debounce to prevent excessive API calls
      
      return () => clearTimeout(timeoutId);
    }
  }, [formData.width_mm, formData.length_mm, formData.thickness_mm, formData.diameter_mm, 
      formData.sheet_width_mm, formData.sheet_length_mm, cuttingType, optimizationMethod, autoOptimize, isCalculating, calculateOptimization]);

  // Generate layout data when dimensions change (for immediate visualization) - with debouncing
  useEffect(() => {
    if (cuttingType === 'circular' && formData.diameter_mm && formData.sheet_width_mm && formData.sheet_length_mm) {
      const timeoutId = setTimeout(() => {
        try {
          const layouts = generateAllCircularLayouts(
            parseFloat(formData.sheet_width_mm),
            parseFloat(formData.sheet_length_mm),
            parseFloat(formData.diameter_mm)
          );
          setLayoutData(layouts);
          console.log('🔵 Generated circular layouts on dimension change:', layouts);
        } catch (error) {
          console.error('Error generating circular layout on dimension change:', error);
          setLayoutData(null);
        }
      }, 2000); // Increased to 2 seconds debounce to prevent excessive API calls
      
      return () => clearTimeout(timeoutId);
    }
  }, [formData.diameter_mm, formData.sheet_width_mm, formData.sheet_length_mm, cuttingType]);

  // Auto-calculate optimization parameters when dimensions change
  // NOTE: Quantity is separate (for production recipe) and NOT used in material consumption calculations
  const calculateOptimizationDefaults = (formData: any) => {
    const { width_mm, length_mm, thickness_mm, sheet_width_mm, sheet_length_mm } = formData;
    
    if (!width_mm || !length_mm || !thickness_mm || !sheet_width_mm || !sheet_length_mm) {
      return {};
    }

    const width = parseFloat(width_mm);
    const length = parseFloat(length_mm);
    const thickness = parseFloat(thickness_mm);
    const sheetWidth = parseFloat(sheet_width_mm);
    const sheetLength = parseFloat(sheet_length_mm);

    if (isNaN(width) || isNaN(length) || isNaN(thickness) || isNaN(sheetWidth) || isNaN(sheetLength)) {
      return {};
    }

    // Auto-calculate weight per blank (steel density: 7850 kg/m³)
    const weightOfBlank = (width * length * thickness * 0.00000785);
    
    // Calculate sheet weight using user-entered sheet dimensions: sheetWidth*sheetLength*thickness*0.00000785
    const sheetWeight = (sheetWidth * sheetLength * thickness * 0.00000785);
    
    // Calculate blanks per direction
    const blanksHorizontal = Math.floor(sheetWidth / width) * Math.floor(sheetLength / length);
    const blanksVertical = Math.floor(sheetWidth / length) * Math.floor(sheetLength / width);
    
    // Choose the best direction
    const bestBlanks = Math.max(blanksHorizontal, blanksVertical);
    const bestDirection = blanksHorizontal > blanksVertical ? 'HORIZONTAL' : 'VERTICAL';
    
    // Calculate efficiency (material consumption per sheet)
    const usedArea = bestBlanks * width * length;
    const totalSheetArea = sheetWidth * sheetLength;
    const efficiency = (usedArea / totalSheetArea) * 100;
    
    // Calculate total blanks weight: Pcs/Sheet × Weight per Blank
    const totalBlanksWeight = bestBlanks * weightOfBlank;
    
    // Generate layout visualization data
    try {
      if (cuttingType === 'circular' && formData.diameter_mm) {
        // Generate circular layouts
        const layouts = generateAllCircularLayouts(sheetWidth, sheetLength, parseFloat(formData.diameter_mm));
        setLayoutData(layouts);
      } else {
        // Generate rectangular layouts
        const layouts = generateAllLayouts(sheetWidth, sheetLength, width, length);
        setLayoutData(layouts);
      }
    } catch (error) {
      console.error('Error generating layout:', error);
      setLayoutData(null);
    }
    
    return {
      blank_weight_kg: weightOfBlank.toFixed(3),
      pcs_per_sheet: bestBlanks.toString(),
      sheet_util_pct: Math.round(efficiency).toString(),
      sheet_type: 'Custom',
      sheet_weight_kg: sheetWeight.toFixed(2),
      total_blanks: totalBlanksWeight.toFixed(2),
      consumption_pct: Math.round(efficiency).toString(),
      material_density: '7850'
    };
  };


  const fetchProducts = async () => {
    try {
      const data = await productApi.getAll();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      });
    }
  };

  const fetchBOMData = async () => {
    if (!selectedProduct) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching BOM data for product:', selectedProduct);
      const bomResponse = await bomApi.getStandardFormat(selectedProduct);
      console.log('BOM Response:', bomResponse);
      console.log('BOM Data:', bomResponse.data);
      console.log('Sub Assemblies:', bomResponse.data?.subAssemblies);
      // Fix: Use bomResponse directly since data is not wrapped in a 'data' property
      setBomData(bomResponse.data || bomResponse);
    } catch (error) {
      console.error('Error fetching BOM data:', error);
      setError('Failed to load BOM data');
      toast({
        title: "Error",
        description: "Failed to load BOM data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportBOMData = async () => {
    if (!selectedProduct) {
      toast({
        title: "Error",
        description: "Please select a product first",
        variant: "destructive",
      });
      return;
    }

    try {
      const blob = await bomApi.exportBOM(selectedProduct, 'csv');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bom_${bomData?.partNo}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "BOM data exported successfully",
      });
    } catch (error) {
      console.error('Error exporting BOM data:', error);
      toast({
        title: "Error",
        description: "Failed to export BOM data",
        variant: "destructive",
      });
    }
  };


  const filteredSubAssemblies = (bomData?.subAssemblies || []).filter(subAssembly => 
    subAssembly.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedProductData = products.find(p => p.product_id === selectedProduct);

  const isMissing = (value: any) => {
    return value === null || value === undefined || value === '' || value === 'MISSING';
  };

  const renderValue = (value: any, unit: string = '') => {
    if (isMissing(value)) {
      return <Badge variant="destructive">MISSING</Badge>;
    }
    return `${value}${unit}`;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      toast({
        title: "Error",
        description: "Please select a product first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Validate that all required fields are filled and are valid numbers
      const requiredFields = cuttingType === 'rectangular' 
        ? ['sub_assembly_name', 'width_mm', 'length_mm', 'thickness_mm', 'sheet_width_mm', 'sheet_length_mm']
        : ['sub_assembly_name', 'diameter_mm', 'thickness_mm', 'sheet_width_mm', 'sheet_length_mm'];
      
      for (const field of requiredFields) {
        if (!formData[field] || formData[field] === '') {
          toast({
            title: "Validation Error",
            description: `Please fill in ${field.replace('_', ' ')}`,
            variant: "destructive",
          });
          return;
        }
      }

      // Auto-calculate missing optimization parameters if not provided
      if (!formData.blank_weight_kg || !formData.pcs_per_sheet) {
        const calculatedDefaults = calculateOptimizationDefaults(formData);
        if (Object.keys(calculatedDefaults).length > 0) {
          Object.assign(formData, calculatedDefaults);
        }
      }

      const payload = {
        product_id: selectedProduct,
        sub_assembly_name: formData.sub_assembly_name,
        // For blankSpecApi.create, we need to provide width_mm and length_mm
        // For circular cutting, we'll use diameter as both width and length
        width_mm: cuttingType === 'rectangular' 
          ? parseFloat(formData.width_mm) 
          : parseFloat(formData.diameter_mm),
        length_mm: cuttingType === 'rectangular' 
          ? parseFloat(formData.length_mm) 
          : parseFloat(formData.diameter_mm),
        thickness_mm: parseFloat(formData.thickness_mm),
        quantity: parseInt(formData.quantity) || 1, // Default to 1
        blank_weight_kg: parseFloat(formData.blank_weight_kg || '0'),
        pcs_per_sheet: formData.pcs_per_sheet ? parseInt(formData.pcs_per_sheet) : null,
        sheet_util_pct: formData.sheet_util_pct ? parseFloat(formData.sheet_util_pct) : null,
        sheet_type: 'Custom',
        sheet_weight_kg: formData.sheet_weight_kg ? parseFloat(formData.sheet_weight_kg) : null,
        total_blanks: formData.total_blanks ? parseInt(formData.total_blanks) : null,
        consumption_pct: formData.consumption_pct ? parseFloat(formData.consumption_pct) : null,
        material_density: 7850, // Steel density in kg/m³
        // Add sheet dimensions
        sheet_width_mm: parseFloat(formData.sheet_width_mm),
        sheet_length_mm: parseFloat(formData.sheet_length_mm),
        // Store cutting type and optimization method as metadata
        cutting_type: cuttingType,
        optimization_method: optimizationMethod,
        // Store additional optimization data
        created_by: 'current_user',
        // Store original diameter for circular cutting
        ...(cuttingType === 'circular' && { diameter_mm: parseFloat(formData.diameter_mm) })
      };

      // Validate that numeric fields are not NaN
      const numericFields = ['width_mm', 'length_mm', 'thickness_mm', 'quantity', 'blank_weight_kg'];
      for (const field of numericFields) {
        if (isNaN(payload[field])) {
          toast({
            title: "Validation Error",
            description: `${field.replace('_', ' ')} must be a valid number`,
            variant: "destructive",
          });
          return;
        }
      }

      console.log('Creating blank spec with payload:', payload);
      const createdBlank = await blankSpecApi.create(payload);
      toast({
        title: "Success",
        description: "Sub-assembly added successfully",
      });

      // If auto-optimize is enabled, run optimization
      if (autoOptimize && createdBlank?.blank_id) {
        try {
        const optimizationData = await sheetOptimizationApi.calculate({
            blank_id: createdBlank.blank_id,
            width_mm: parseFloat(formData.width_mm),
            length_mm: parseFloat(formData.length_mm),
            thickness_mm: parseFloat(formData.thickness_mm),
            quantity: parseInt(formData.quantity) || 1, // Default to 1
            compare_all_sizes: compareAllSizes,
          save_result: true,
          create_scrap_entry: false,
            calculated_by: 'current_user'
          });

          if (optimizationData?.data) {
            toast({
              title: "Optimization Complete",
              description: `Best: ${optimizationData.data.bestDirection} cutting on ${optimizationData.data.bestSheetWidth}×${optimizationData.data.bestSheetLength}mm sheet (${optimizationData.data.efficiency.toFixed(1)}% efficiency)`,
            });
          }
        } catch (optError) {
          console.error('Auto-optimization failed:', optError);
          // Show a simple success message with basic optimization info
          toast({
            title: "Sub-assembly Added",
            description: `Basic optimization calculated: ${formData.pcs_per_sheet} pcs/sheet, ${formData.sheet_util_pct}% efficiency`,
          });
        }
      }

      // Reset form and refresh BOM data
      setFormData({
        sub_assembly_name: '',
        width_mm: '',
        length_mm: '',
        thickness_mm: '',
        diameter_mm: '',
        quantity: '',
        blank_weight_kg: '',
        pcs_per_sheet: '',
        sheet_util_pct: '',
        sheet_weight_kg: '',
        total_blanks: '',
        consumption_pct: '',
        sheet_width_mm: '1220',
        sheet_length_mm: '2440'
      });
      setShowAddForm(false);
      fetchBOMData(); // Refresh the BOM data
    } catch (error) {
      console.error('Error creating blank specification:', error);
      toast({
        title: "Error",
        description: "Failed to add sub-assembly",
        variant: "destructive",
      });
    }
  };

  const runOptimization = async (blankData: any) => {
    try {
      setOptimizingBlank(blankData);
      
      const optimizationData = await sheetOptimizationApi.calculate({
        blank_id: blankData.blank_id,
        width_mm: parseFloat(blankData.blankSize.width),
        length_mm: parseFloat(blankData.blankSize.length),
        thickness_mm: parseFloat(blankData.blankSize.thickness),
        quantity: parseInt(blankData.blankSize.quantity),
        compare_all_sizes: compareAllSizes,
        debug: true,
        save_result: false,
        create_scrap_entry: false,
        calculated_by: 'current_user'
      });

      console.log('Optimization result:', optimizationData);
      setOptimizationResult(optimizationData.data);
      setShowOptimizationDialog(true);
    } catch (error) {
      console.error('Error running optimization:', error);
      toast({
        title: "Error",
        description: "Failed to run optimization",
        variant: "destructive",
      });
    }
  };

  const applyOptimization = async () => {
    if (!optimizationResult || !optimizingBlank) return;

    try {
      // Save the optimization result
      await sheetOptimizationApi.calculate({
        blank_id: optimizingBlank.blank_id,
        width_mm: parseFloat(optimizingBlank.blankSize.width),
        length_mm: parseFloat(optimizingBlank.blankSize.length),
        thickness_mm: parseFloat(optimizingBlank.blankSize.thickness),
        quantity: parseInt(optimizingBlank.blankSize.quantity),
        compare_all_sizes: compareAllSizes,
        save_result: true,
        create_scrap_entry: false,
        calculated_by: 'current_user'
      });

      toast({
        title: "Success",
        description: "Optimization applied successfully",
      });

      setShowOptimizationDialog(false);
      setOptimizationResult(null);
      setOptimizingBlank(null);
      fetchBOMData();
    } catch (error) {
      console.error('Error applying optimization:', error);
      toast({
        title: "Error",
        description: "Failed to apply optimization",
        variant: "destructive",
      });
    }
  };

  const batchOptimizeProduct = async () => {
    if (!selectedProduct) {
      toast({
        title: "Error",
        description: "Please select a product first",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const result = await sheetOptimizationApi.batchOptimizeProduct(selectedProduct, {
        save_results: true,
        create_scrap_entries: false
      });

      toast({
        title: "Batch Optimization Complete",
        description: `Optimized ${result.summary.successful} of ${result.summary.total_blanks} blanks`,
      });

      fetchBOMData();
    } catch (error) {
      console.error('Error batch optimizing:', error);
      toast({
        title: "Batch Optimization Unavailable",
        description: "Advanced optimization is not available. Basic calculations are still working.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show delete confirmation dialog
  const showDeleteConfirmation = (subAssemblyId: string, subAssemblyName: string) => {
    console.log('🔍 Sub-assembly data:', { subAssemblyId, subAssemblyName });
    setSubAssemblyToDelete({ id: subAssemblyId, name: subAssemblyName });
    setShowDeleteDialog(true);
  };

  // Delete sub-assembly function (with backend API)
  const deleteSubAssembly = async () => {
    if (!selectedProduct || !subAssemblyToDelete) {
      toast({
        title: "Error",
        description: "Please select a product first",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      console.log('🗑️ Frontend: Deleting sub-assembly:', { 
        productId: selectedProduct, 
        subAssemblyName: subAssemblyToDelete.name,
        subAssemblyId: subAssemblyToDelete.id
      });
      
      // Call the backend API to delete the sub-assembly
      await bomApi.deleteSubAssembly(selectedProduct, subAssemblyToDelete.name);
      
      // Refresh the BOM data to get the updated list from the backend
      await fetchBOMData();
      
      toast({
        title: "Success",
        description: `Sub-assembly "${subAssemblyToDelete.name}" has been deleted successfully`,
      });
      
      // Close dialog
      setShowDeleteDialog(false);
      setSubAssemblyToDelete(null);
    } catch (error) {
      console.error('Error deleting sub-assembly:', error);
      toast({
        title: "Error",
        description: "Failed to delete sub-assembly",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    const newFormData = {
      ...formData,
      [field]: value
    };
    
    setFormData(newFormData);
    
    // Auto-calculate optimization parameters when dimensions change (excluding quantity)
    if (['width_mm', 'length_mm', 'thickness_mm', 'sheet_width_mm', 'sheet_length_mm'].includes(field)) {
      const calculatedDefaults = calculateOptimizationDefaults(newFormData);
      if (Object.keys(calculatedDefaults).length > 0) {
        setFormData(prev => ({
          ...prev,
          ...calculatedDefaults
        }));
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">BOM & Sheet Optimization Calculator</h1>
          <p className="text-gray-600 mt-1">Calculate optimal sheet cutting and material consumption for your BOM components</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={batchOptimizeProduct} 
            disabled={!selectedProduct || loading}
          >
            <Calculator className="w-4 h-4 mr-2" />
            Batch Optimize
          </Button>
          <Button variant="outline" size="sm" onClick={exportBOMData} disabled={!bomData}>
            <Download className="w-4 h-4 mr-2" />
            Export BOM CSV
          </Button>
        </div>
      </div>

      {/* Product Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Product Selection
          </CardTitle>
          <CardDescription>
            Select a product to calculate material consumption and optimize sheet cutting patterns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product-select">Product</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
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
            <div className="flex items-end">
              <Button onClick={fetchBOMData} disabled={!selectedProduct || loading}>
                {loading ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Load BOM
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {selectedProductData && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900">{selectedProductData.part_name}</h3>
              <p className="text-blue-700 text-sm">
                Code: {selectedProductData.product_code} | 
                Category: {selectedProductData.category} | 
                Cost: ${selectedProductData.standard_cost || 0}
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

      {/* Always show Sub-Assemblies Management section when a product is selected */}
      {selectedProduct && (
        <div className="space-y-6">
          {/* Search and Add Sub-Assemblies */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Sub-Assemblies Management
                </CardTitle>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="auto-optimize"
                      checked={autoOptimize}
                      onCheckedChange={setAutoOptimize}
                    />
                    <Label htmlFor="auto-optimize" className="text-sm font-normal cursor-pointer">
                      Auto-optimize on add
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="compare-all-sizes"
                      checked={compareAllSizes}
                      onCheckedChange={setCompareAllSizes}
                    />
                    <Label htmlFor="compare-all-sizes" className="text-sm font-normal cursor-pointer">
                      Compare all sheet sizes
                    </Label>
                  </div>
                  <Button 
                    onClick={() => setShowAddForm(!showAddForm)}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Sub-Assembly
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Search sub-assemblies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </CardContent>
          </Card>

          {/* Add Sub-Assembly Form */}
          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add New Sub-Assembly
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>💡 Smart Calculator:</strong> Enter blank dimensions (Width, Length, Thickness) and sheet size, and the system will automatically calculate material consumption, pieces per sheet, and efficiency!
                  </p>
                </div>
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Sub Assembly Name */}
                    <div className="space-y-2">
                      <Label htmlFor="sub_assembly_name">Sub Assembly Name</Label>
                      <Input
                        id="sub_assembly_name"
                        value={formData.sub_assembly_name}
                        onChange={(e) => handleInputChange('sub_assembly_name', e.target.value)}
                        placeholder="e.g., Main, Side, Base"
                        required
                      />
                    </div>

                    {/* Cutting Type Selection */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <Label className="text-base font-semibold text-gray-800">Cutting Type</Label>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div 
                          className={`p-5 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 ${
                            cuttingType === 'rectangular' 
                              ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg' 
                              : 'border-gray-200 hover:border-blue-300 bg-white hover:shadow-md'
                          }`}
                          onClick={() => setCuttingType('rectangular')}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${cuttingType === 'rectangular' ? 'bg-blue-500' : 'bg-gray-100'}`}>
                              <Square className={`w-6 h-6 ${cuttingType === 'rectangular' ? 'text-white' : 'text-gray-600'}`} />
                            </div>
                            <div>
                              <span className="font-semibold text-gray-800">Rectangular</span>
                              <p className="text-sm text-gray-600 mt-1">Standard rectangular blanks</p>
                            </div>
                          </div>
                        </div>
                        
                        <div 
                          className={`p-5 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 ${
                            cuttingType === 'circular' 
                              ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg' 
                              : 'border-gray-200 hover:border-purple-300 bg-white hover:shadow-md'
                          }`}
                          onClick={() => setCuttingType('circular')}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${cuttingType === 'circular' ? 'bg-purple-500' : 'bg-gray-100'}`}>
                              <Circle className={`w-6 h-6 ${cuttingType === 'circular' ? 'text-white' : 'text-gray-600'}`} />
                            </div>
                            <div>
                              <span className="font-semibold text-gray-800">Circular</span>
                              <p className="text-sm text-gray-600 mt-1">Round/circular blanks</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Width - Only for rectangular */}
                    {cuttingType === 'rectangular' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <Label htmlFor="width_mm" className="text-sm font-medium text-gray-700">Width (mm)</Label>
                        </div>
                        <Input
                          id="width_mm"
                          type="number"
                          step="0.1"
                          value={formData.width_mm}
                          onChange={(e) => handleInputChange('width_mm', e.target.value)}
                          placeholder="e.g., 170"
                          required
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    {/* Length - Only for rectangular */}
                    {cuttingType === 'rectangular' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <Label htmlFor="length_mm" className="text-sm font-medium text-gray-700">Length (mm)</Label>
                        </div>
                        <Input
                          id="length_mm"
                          type="number"
                          step="0.1"
                          value={formData.length_mm}
                          onChange={(e) => handleInputChange('length_mm', e.target.value)}
                          placeholder="e.g., 760"
                          required
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    {/* Diameter - Only for circular */}
                    {cuttingType === 'circular' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <Label htmlFor="diameter_mm" className="text-sm font-medium text-gray-700">Diameter (mm)</Label>
                        </div>
                        <Input
                          id="diameter_mm"
                          type="number"
                          step="0.1"
                          value={formData.diameter_mm}
                          onChange={(e) => handleInputChange('diameter_mm', e.target.value)}
                          placeholder="e.g., 200"
                          required
                          className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                        />
                      </div>
                    )}

                    {/* Thickness */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <Label htmlFor="thickness_mm" className="text-sm font-medium text-gray-700">Thickness (mm)</Label>
                      </div>
                      <Input
                        id="thickness_mm"
                        type="number"
                        step="0.1"
                        value={formData.thickness_mm}
                        onChange={(e) => handleInputChange('thickness_mm', e.target.value)}
                        placeholder="e.g., 2.5"
                        required
                        className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>

                    {/* Optimization Method */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                        <Label htmlFor="optimization_method" className="text-sm font-medium text-gray-700">Optimization Method</Label>
                      </div>
                      <Select value={optimizationMethod} onValueChange={(value: any) => setOptimizationMethod(value)}>
                        <SelectTrigger className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">
                          <SelectValue placeholder="Select optimization method" />
                        </SelectTrigger>
                        <SelectContent>
                          {cuttingType === 'rectangular' ? (
                            <>
                              <SelectItem value="horizontal">Horizontal</SelectItem>
                              <SelectItem value="vertical">Vertical</SelectItem>
                              <SelectItem value="smart">Smart (Best of Both)</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="square_grid">Square Grid</SelectItem>
                              <SelectItem value="hexagonal">Hexagonal/Staggered</SelectItem>
                              <SelectItem value="smart">Smart (Best of Both)</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sheet Width */}
                    <div className="space-y-2">
                      <Label htmlFor="sheet_width_mm">Sheet Width (mm)</Label>
                      <Input
                        id="sheet_width_mm"
                        type="number"
                        step="1"
                        value={formData.sheet_width_mm}
                        onChange={(e) => handleInputChange('sheet_width_mm', e.target.value)}
                        placeholder="e.g., 1220"
                        required
                      />
                    </div>

                    {/* Sheet Length */}
                    <div className="space-y-2">
                      <Label htmlFor="sheet_length_mm">Sheet Length (mm)</Label>
                      <Input
                        id="sheet_length_mm"
                        type="number"
                        step="1"
                        value={formData.sheet_length_mm}
                        onChange={(e) => handleInputChange('sheet_length_mm', e.target.value)}
                        placeholder="e.g., 2440"
                        required
                      />
                    </div>

                    {/* Weight per blank - Auto-calculated */}
                    <div className="space-y-2">
                      <Label htmlFor="blank_weight_kg">Weight per blank (kg)</Label>
                      <Input
                        id="blank_weight_kg"
                        type="number"
                        step="0.01"
                        value={formData.blank_weight_kg}
                        onChange={(e) => handleInputChange('blank_weight_kg', e.target.value)}
                        placeholder="Auto-calculated"
                        className={formData.blank_weight_kg ? "bg-gray-50" : ""}
                        readOnly={!!formData.blank_weight_kg}
                      />
                      {formData.blank_weight_kg && (
                        <p className="text-xs text-gray-500">Auto-calculated from dimensions</p>
                      )}
                    </div>

                    {/* Pieces per sheet - Auto-calculated */}
                    <div className="space-y-2">
                      <Label htmlFor="pcs_per_sheet">No. of Pcs/Sheet</Label>
                      <Input
                        id="pcs_per_sheet"
                        type="number"
                        value={formData.pcs_per_sheet}
                        onChange={(e) => handleInputChange('pcs_per_sheet', e.target.value)}
                        placeholder="Auto-calculated"
                        className={formData.pcs_per_sheet ? "bg-gray-50" : ""}
                        readOnly={!!formData.pcs_per_sheet}
                      />
                      {formData.pcs_per_sheet && (
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-500">Auto-calculated from sheet optimization</p>
                          {layoutData && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                selectedCuttingMode === 'horizontal' ? 'border-blue-300 text-blue-700' :
                                selectedCuttingMode === 'vertical' ? 'border-purple-300 text-purple-700' :
                                'border-green-300 text-green-700'
                              }`}
                            >
                              {selectedCuttingMode === 'horizontal' ? 'H' : selectedCuttingMode === 'vertical' ? 'V' : 'S'} Mode
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Sheet utilization % - Auto-calculated */}
                    <div className="space-y-2">
                      <Label htmlFor="sheet_util_pct">4x8 Sheet Consumption (%)</Label>
                      <Input
                        id="sheet_util_pct"
                        type="number"
                        step="0.1"
                        value={formData.sheet_util_pct}
                        onChange={(e) => handleInputChange('sheet_util_pct', e.target.value)}
                        placeholder="Auto-calculated"
                        className={formData.sheet_util_pct ? "bg-gray-50" : ""}
                        readOnly={!!formData.sheet_util_pct}
                      />
                      {formData.sheet_util_pct && (
                        <p className="text-xs text-gray-500">Auto-calculated efficiency</p>
                      )}
                    </div>

                    {/* Sheet weight - Auto-calculated */}
                    <div className="space-y-2">
                      <Label htmlFor="sheet_weight_kg">4x8 Sheet Weight (kg)</Label>
                      <Input
                        id="sheet_weight_kg"
                        type="number"
                        step="0.01"
                        value={formData.sheet_weight_kg}
                        onChange={(e) => handleInputChange('sheet_weight_kg', e.target.value)}
                        placeholder="Auto-calculated"
                        className={formData.sheet_weight_kg ? "bg-gray-50" : ""}
                        readOnly={!!formData.sheet_weight_kg}
                      />
                      {formData.sheet_weight_kg && (
                        <p className="text-xs text-gray-500">Standard 4x8 sheet weight</p>
                      )}
                    </div>

                    {/* Total blanks weight - Auto-calculated */}
                    <div className="space-y-2">
                      <Label htmlFor="total_blanks">Total Blanks Weight (kg)</Label>
                      <Input
                        id="total_blanks"
                        type="number"
                        step="0.01"
                        value={formData.total_blanks}
                        onChange={(e) => handleInputChange('total_blanks', e.target.value)}
                        placeholder="Auto-calculated"
                        className={formData.total_blanks ? "bg-gray-50" : ""}
                        readOnly={!!formData.total_blanks}
                      />
                      {formData.total_blanks && (
                        <p className="text-xs text-gray-500">Pcs/Sheet × Weight per Blank</p>
                      )}
                    </div>

                    {/* Consumption % - Auto-calculated */}
                    <div className="space-y-2">
                      <Label htmlFor="consumption_pct">Material Consumption (%)</Label>
                      <Input
                        id="consumption_pct"
                        type="number"
                        step="0.1"
                        value={formData.consumption_pct}
                        onChange={(e) => handleInputChange('consumption_pct', e.target.value)}
                        placeholder="Auto-calculated"
                        className={formData.consumption_pct ? "bg-gray-50" : ""}
                        readOnly={!!formData.consumption_pct}
                      />
                      {formData.consumption_pct && (
                        <p className="text-xs text-gray-500">Same as sheet utilization</p>
                      )}
                    </div>
                  </div>

                  {/* Auto-calculation Summary */}
                  {formData.blank_weight_kg && formData.pcs_per_sheet && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <Calculator className="w-4 h-4" />
                        Auto-Calculated Material Consumption (Per Sheet)
                        {layoutData && (
                          <Badge 
                            variant="outline" 
                            className={`ml-2 ${
                              selectedCuttingMode === 'horizontal' ? 'border-blue-300 text-blue-700' :
                              selectedCuttingMode === 'vertical' ? 'border-purple-300 text-purple-700' :
                              'border-green-300 text-green-700'
                            }`}
                          >
                            {selectedCuttingMode === 'horizontal' ? 'Horizontal' : 
                             selectedCuttingMode === 'vertical' ? 'Vertical' : 'Smart Mixed'} Mode
                          </Badge>
                        )}
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <Label className="text-blue-700">Weight per Blank</Label>
                          <p className="font-medium">{formData.blank_weight_kg} kg</p>
                        </div>
                        <div>
                          <Label className="text-blue-700">Pcs per Sheet</Label>
                          <p className="font-medium">{formData.pcs_per_sheet}</p>
                        </div>
                        <div>
                          <Label className="text-blue-700">Total Blanks Weight</Label>
                          <p className="font-medium">{formData.total_blanks} kg</p>
                        </div>
                        <div>
                          <Label className="text-blue-700">Sheet Efficiency</Label>
                          <p className="font-medium">{formData.sheet_util_pct}%</p>
                        </div>
                      </div>
                      <p className="text-xs text-blue-600 mt-2">
                        💡 Material consumption calculated per sheet for optimal cutting efficiency.
                      </p>
                      
                      {/* Layout Preview Toggle */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-blue-200">
                        <Label htmlFor="show-layout" className="text-sm text-blue-700 flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          Show Cutting Layout Preview
                        </Label>
                        <Switch
                          id="show-layout"
                          checked={showLayoutPreview}
                          onCheckedChange={setShowLayoutPreview}
                        />
                      </div>
                    </div>
                  )}

                  {/* Sheet Layout Visualization */}
                  {formData.blank_weight_kg && layoutData && showLayoutPreview && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        {cuttingType === 'circular' ? 'Circular' : 'Sheet'} Cutting Layout Visualization
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        💡 <strong>Click on any visualization or comparison card below</strong> to select your preferred cutting method. 
                        The selected option will be highlighted with a colored border and "Selected" badge.
                      </p>
                      
                      {/* Use memoized layout visualization for better performance */}
                      {memoizedLayoutVisualization}
                      
                      <div className="mt-4 grid md:grid-cols-3 gap-4">
                        {cuttingType === 'circular' ? (
                          // Circular cutting comparison cards
                          <>
                            <div 
                              className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 ${
                                optimizationMethod === 'square_grid' 
                                  ? 'bg-blue-100 border-2 border-blue-400 shadow-lg' 
                                  : 'bg-blue-50 border border-blue-200 hover:bg-blue-100'
                              }`}
                              onClick={() => setOptimizationMethod('square_grid')}
                            >
                              <h5 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                Square Grid
                                {optimizationMethod === 'square_grid' && <Badge variant="default" className="bg-blue-600">Selected</Badge>}
                              </h5>
                              <p className="text-sm text-blue-800">
                                <strong>{layoutData.squareGrid?.totalCircles || 0}</strong> circles<br/>
                                <strong>{layoutData.squareGrid?.efficiency || 0}%</strong> efficiency
                              </p>
                            </div>
                            
                            <div 
                              className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 ${
                                optimizationMethod === 'hexagonal' 
                                  ? 'bg-purple-100 border-2 border-purple-400 shadow-lg' 
                                  : 'bg-purple-50 border border-purple-200 hover:bg-purple-100'
                              }`}
                              onClick={() => setOptimizationMethod('hexagonal')}
                            >
                              <h5 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                                Hexagonal
                                {optimizationMethod === 'hexagonal' && <Badge variant="default" className="bg-purple-600">Selected</Badge>}
                              </h5>
                              <p className="text-sm text-purple-800">
                                <strong>{layoutData.hexagonal?.totalCircles || 0}</strong> circles<br/>
                                <strong>{layoutData.hexagonal?.efficiency || 0}%</strong> efficiency
                              </p>
                            </div>
                            
                            <div 
                              className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 ${
                                optimizationMethod === 'smart' 
                                  ? 'bg-green-100 border-2 border-green-400 shadow-lg' 
                                  : 'bg-green-50 border border-green-200 hover:bg-green-100'
                              }`}
                              onClick={() => setOptimizationMethod('smart')}
                            >
                              <h5 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                                Smart
                                {optimizationMethod === 'smart' && <Badge variant="default" className="bg-green-600">Selected</Badge>}
                              </h5>
                              <p className="text-sm text-green-800">
                                <strong>{layoutData.smart?.totalCircles || 0}</strong> circles<br/>
                                <strong>{layoutData.smart?.efficiency || 0}%</strong> efficiency
                              </p>
                            </div>
                          </>
                        ) : (
                          // Rectangular cutting comparison cards
                          <div 
                            className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 ${
                              selectedCuttingMode === 'horizontal' 
                                ? 'bg-blue-100 border-2 border-blue-400 shadow-lg' 
                                : 'bg-blue-50 border border-blue-200 hover:bg-blue-100'
                            }`}
                            onClick={() => setSelectedCuttingMode('horizontal')}
                          >
                            <h5 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                              Horizontal
                              {selectedCuttingMode === 'horizontal' && <Badge variant="default" className="bg-blue-600">Selected</Badge>}
                            </h5>
                            <p className="text-sm text-blue-800">
                              <strong>
                                {isRectangular(cuttingType) 
                                  ? layoutData.horizontal?.stats?.totalBlanks || 0
                                  : layoutData.squareGrid?.totalCircles || 0
                                }
                              </strong> {isRectangular(cuttingType) ? 'blanks' : 'circles'}<br/>
                              <strong>
                                {isRectangular(cuttingType) 
                                  ? (layoutData.horizontal?.stats?.efficiency || 0).toFixed(1)
                                  : (layoutData.squareGrid?.efficiency || 0).toFixed(1)
                                }%
                              </strong> efficiency<br/>
                              {isRectangular(cuttingType) && (layoutData.horizontal?.stats?.extraBlanks || 0) > 0 && (
                                <span className="text-blue-600">+{layoutData.horizontal.stats.extraBlanks} from leftover</span>
                              )}
                            </p>
                          </div>
                        )}
                        
                        {cuttingType === 'rectangular' && (
                          <>
                            <div 
                              className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 ${
                                selectedCuttingMode === 'vertical' 
                                  ? 'bg-purple-100 border-2 border-purple-400 shadow-lg' 
                                  : 'bg-purple-50 border border-purple-200 hover:bg-purple-100'
                              }`}
                              onClick={() => setSelectedCuttingMode('vertical')}
                            >
                              <h5 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                                Vertical
                                {selectedCuttingMode === 'vertical' && <Badge variant="default" className="bg-purple-600">Selected</Badge>}
                              </h5>
                              <p className="text-sm text-purple-800">
                                <strong>{layoutData.vertical.stats.totalBlanks}</strong> blanks<br/>
                                <strong>{layoutData.vertical.stats.efficiency.toFixed(1)}%</strong> efficiency<br/>
                                {layoutData.vertical.stats.extraBlanks > 0 && (
                                  <span className="text-purple-600">+{layoutData.vertical.stats.extraBlanks} from leftover</span>
                                )}
                              </p>
                            </div>
                            
                            <div 
                              className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 ${
                                selectedCuttingMode === 'smart' 
                                  ? 'bg-green-100 border-2 border-green-400 shadow-lg' 
                                  : 'bg-green-50 border border-green-200 hover:bg-green-100'
                              }`}
                              onClick={() => setSelectedCuttingMode('smart')}
                            >
                          <h5 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                            Smart Mixed
                            {selectedCuttingMode === 'smart' && <Badge variant="default" className="bg-green-600">Selected</Badge>}
                          </h5>
                          <p className="text-sm text-green-800">
                            <strong>
                              {isCircular(cuttingType)
                                ? layoutData.smart?.totalCircles || 0
                                : layoutData.smart?.stats?.totalBlanks || 0
                              }
                            </strong> {isCircular(cuttingType) ? 'circles' : 'blanks'}<br/>
                            <strong>
                              {isCircular(cuttingType)
                                ? (layoutData.smart?.efficiency || 0).toFixed(1)
                                : (layoutData.smart?.stats?.efficiency || 0).toFixed(1)
                              }%
                            </strong> efficiency<br/>
                            {isRectangular(cuttingType) && (layoutData.smart?.stats?.extraBlanks || 0) > 0 && (
                              <span className="text-green-600">
                                +{layoutData.smart.stats.extraBlanks} from leftover
                                {isRectangular(cuttingType) && (layoutData.smart?.stats?.extraBlanks || 0) > (layoutData.bestDirection === 'HORIZONTAL' ? (layoutData.horizontal?.stats?.extraBlanks || 0) : (layoutData.vertical?.stats?.extraBlanks || 0)) && (
                                  <span className="ml-1 text-green-700 font-semibold">✨ With rotation!</span>
                                )}
                              </span>
                            )}
                            {isCircular(cuttingType) && layoutData.smart?.selectedMethod && (
                              <span className="text-green-600">
                                Selected: {layoutData.smart.selectedMethod}
                              </span>
                            )}
                          </p>
                        </div>
                          </>
                        )}
                      </div>
                      
                      {/* Selected Option Section */}
                      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Selected Cutting Option
                        </h5>
                        
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-sm text-gray-700">
                              <strong className="capitalize">
                                {cuttingType === 'circular' 
                                  ? (optimizationMethod === 'square_grid' ? 'Square Grid' : 
                                     optimizationMethod === 'hexagonal' ? 'Hexagonal' : 'Smart')
                                  : selectedCuttingMode
                                }
                              </strong> cutting selected
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {cuttingType === 'circular' ? (
                                <>
                                  {optimizationMethod === 'square_grid' && (
                                    <>Produces <strong>{layoutData.squareGrid?.totalCircles || 0}</strong> circles with <strong>{layoutData.squareGrid?.efficiency || 0}%</strong> efficiency</>
                                  )}
                                  {optimizationMethod === 'hexagonal' && (
                                    <>Produces <strong>{layoutData.hexagonal?.totalCircles || 0}</strong> circles with <strong>{layoutData.hexagonal?.efficiency || 0}%</strong> efficiency</>
                                  )}
                                  {optimizationMethod === 'smart' && (
                                    <>Produces <strong>{layoutData.smart?.totalCircles || 0}</strong> circles with <strong>{layoutData.smart?.efficiency || 0}%</strong> efficiency (best method)</>
                                  )}
                                </>
                              ) : (
                                <>
                                  {selectedCuttingMode === 'horizontal' && (
                                    <>Produces <strong>
                                      {isRectangular(cuttingType) 
                                        ? layoutData.horizontal?.stats?.totalBlanks || 0
                                        : layoutData.squareGrid?.totalCircles || 0
                                      }
                                    </strong> {isRectangular(cuttingType) ? 'blanks' : 'circles'} with <strong>
                                      {isRectangular(cuttingType) 
                                        ? (layoutData.horizontal?.stats?.efficiency || 0).toFixed(1)
                                        : (layoutData.squareGrid?.efficiency || 0).toFixed(1)
                                      }%
                                    </strong> efficiency</>
                                  )}
                                  {selectedCuttingMode === 'vertical' && (
                                    <>Produces <strong>
                                      {isRectangular(cuttingType) 
                                        ? layoutData.vertical?.stats?.totalBlanks || 0
                                        : layoutData.hexagonal?.totalCircles || 0
                                      }
                                    </strong> {isRectangular(cuttingType) ? 'blanks' : 'circles'} with <strong>
                                      {isRectangular(cuttingType) 
                                        ? (layoutData.vertical?.stats?.efficiency || 0).toFixed(1)
                                        : (layoutData.hexagonal?.efficiency || 0).toFixed(1)
                                      }%
                                    </strong> efficiency</>
                                  )}
                                  {selectedCuttingMode === 'smart' && (
                                    <>Produces <strong>
                                      {isCircular(cuttingType)
                                        ? layoutData.smart?.totalCircles || 0
                                        : layoutData.smart?.stats?.totalBlanks || 0
                                      }
                                    </strong> {isCircular(cuttingType) ? 'circles' : 'blanks'} with <strong>
                                      {isCircular(cuttingType)
                                        ? (layoutData.smart?.efficiency || 0).toFixed(1)
                                        : (layoutData.smart?.stats?.efficiency || 0).toFixed(1)
                                      }%
                                    </strong> efficiency{isRectangular(cuttingType) && (layoutData.smart?.stats?.extraBlanks || 0) > 0 && ' (includes rotation)'}</>
                                  )}
                                </>
                              )}
                            </p>
                          </div>
                          
                          <Button 
                            size="sm" 
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => {
                              // Apply the selected cutting mode to form data
                              let selectedLayout;
                              let totalBlanks, efficiency;
                              
                              if (isCircular(cuttingType)) {
                                // For circular layouts, use the optimization method
                                selectedLayout = optimizationMethod === 'square_grid' ? layoutData.squareGrid : 
                                               optimizationMethod === 'hexagonal' ? layoutData.hexagonal : 
                                               layoutData.smart;
                                totalBlanks = selectedLayout.totalCircles;
                                efficiency = selectedLayout.efficiency;
                              } else {
                                // For rectangular layouts, use the selected cutting mode
                                selectedLayout = selectedCuttingMode === 'horizontal' ? layoutData.horizontal : 
                                               selectedCuttingMode === 'vertical' ? layoutData.vertical : 
                                               layoutData.smart;
                                totalBlanks = selectedLayout.stats.totalBlanks;
                                efficiency = selectedLayout.stats.efficiency;
                              }
                              
                              // Calculate blank weight based on dimensions and density
                              const { width_mm, length_mm, thickness_mm, diameter_mm } = formData;
                              const MATERIAL_DENSITY = 0.00000785; // kg/mm³ for steel
                              
                              let blankWeight;
                              if (isCircular(cuttingType)) {
                                // For circular blanks: π * (diameter/2)² * thickness * density
                                const radius = parseFloat(diameter_mm) / 2;
                                blankWeight = Math.PI * radius * radius * parseFloat(thickness_mm) * MATERIAL_DENSITY;
                              } else {
                                // For rectangular blanks: width * length * thickness * density
                                blankWeight = parseFloat(width_mm) * parseFloat(length_mm) * parseFloat(thickness_mm) * MATERIAL_DENSITY;
                              }
                              
                              setFormData(prev => ({
                                ...prev,
                                pcs_per_sheet: totalBlanks.toString(),
                                sheet_util_pct: efficiency.toFixed(1),
                                blank_weight_kg: blankWeight.toFixed(3)
                              }));
                              
                              toast({
                                title: "Cutting Mode Applied",
                                description: `${isCircular(cuttingType) ? optimizationMethod : selectedCuttingMode} cutting mode has been applied to the form.`,
                              });
                            }}
                          >
                            Apply Selection
                          </Button>
                        </div>
                        
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <strong>Best Option:</strong> <span className="font-semibold">{layoutData.bestDirection}</span> cutting produces{' '}
                            <strong>
                              {isCircular(cuttingType)
                                ? (optimizationMethod === 'square_grid' 
                                    ? layoutData.squareGrid?.totalCircles || 0
                                    : optimizationMethod === 'hexagonal'
                                    ? layoutData.hexagonal?.totalCircles || 0
                                    : layoutData.smart?.totalCircles || 0)
                                : (isRectangular(cuttingType) && layoutData.bestDirection === 'HORIZONTAL' 
                                    ? layoutData.horizontal?.stats?.totalBlanks || 0
                                    : isRectangular(cuttingType) && layoutData.bestDirection === 'VERTICAL'
                                    ? layoutData.vertical?.stats?.totalBlanks || 0
                                    : isRectangular(cuttingType) 
                                    ? layoutData.smart?.stats?.totalBlanks || 0
                                    : 0)
                              }
                            </strong> {isCircular(cuttingType) ? 'circles' : 'blanks'} per sheet at{' '}
                            <strong>
                              {isCircular(cuttingType)
                                ? (optimizationMethod === 'square_grid' 
                                    ? (layoutData.squareGrid?.efficiency || 0).toFixed(1)
                                    : optimizationMethod === 'hexagonal'
                                    ? (layoutData.hexagonal?.efficiency || 0).toFixed(1)
                                    : (layoutData.smart?.efficiency || 0).toFixed(1))
                                : (isRectangular(cuttingType) && layoutData.bestDirection === 'HORIZONTAL'
                                    ? (layoutData.horizontal?.stats?.efficiency || 0).toFixed(1)
                                    : isRectangular(cuttingType) && layoutData.bestDirection === 'VERTICAL'
                                    ? (layoutData.vertical?.stats?.efficiency || 0).toFixed(1)
                                    : isRectangular(cuttingType) 
                                    ? (layoutData.smart?.stats?.efficiency || 0).toFixed(1)
                                    : '0')}%
                            </strong> efficiency.
                            {isRectangular(cuttingType) && layoutData.bestDirection === 'SMART_MIXED' && (layoutData.smart?.stats?.extraBlanks || 0) > 0 && (
                              <span className="ml-1">
                                Smart Mixed uses <strong>rotation</strong> in leftover zones to maximize material usage!
                              </span>
                            )}
                            {isCircular(cuttingType) && optimizationMethod === 'smart' && layoutData.smart?.selectedMethod && (
                              <span className="ml-1">
                                Smart method selected <strong>{layoutData.smart.selectedMethod}</strong> for optimal efficiency!
                              </span>
                            )}
                            {isRectangular(cuttingType) && layoutData.bestDirection !== selectedCuttingMode.toUpperCase() && (
                              <span className="ml-2 text-yellow-700 font-medium">
                                (Click on the best option above to select it)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Optimization Controls */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Calculator className="w-5 h-5 text-blue-600" />
                          <span className="font-medium text-gray-800">Auto-Optimization</span>
                        </div>
                        <Switch
                          checked={autoOptimize}
                          onCheckedChange={setAutoOptimize}
                          className="data-[state=checked]:bg-blue-600"
                        />
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {/* Cooldown indicator */}
                        {lastCalculationTime > 0 && (Date.now() - lastCalculationTime) < 3000 && (
                          <div className="flex items-center gap-2 text-sm text-orange-600">
                            <div className="animate-pulse w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span>Cooldown active</span>
                          </div>
                        )}
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={calculateOptimization}
                          disabled={isCalculating || (lastCalculationTime > 0 && (Date.now() - lastCalculationTime) < 3000)}
                          className="bg-white hover:bg-blue-50 border-blue-300 text-blue-700 disabled:opacity-50"
                        >
                          {isCalculating ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                              Calculating...
                            </>
                          ) : (
                            <>
                              <Calculator className="w-4 h-4 mr-2" />
                              Calculate Now
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Add Sub-Assembly
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => {
                        setFormData({
                          sub_assembly_name: '',
                          width_mm: '',
                          length_mm: '',
                          thickness_mm: '',
                          diameter_mm: '',
                          quantity: '',
                          blank_weight_kg: '',
                          pcs_per_sheet: '',
                          sheet_util_pct: '',
                          sheet_weight_kg: '',
                          total_blanks: '',
                          consumption_pct: '',
                          sheet_width_mm: '1220',
                          sheet_length_mm: '2440'
                        });
                      }}
                      className="flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Clear Form
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setShowAddForm(false)}
                      className="flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Enhanced BOM Table with improved styling */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    BOM & Material Consumption {bomData ? `- ${renderValue(bomData.partDescription)}` : ''}
                  </CardTitle>
                  {bomData && (
                    <CardDescription className="mt-2 text-base">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <strong>Part No:</strong> {renderValue(bomData.partNo)}
                        </span>
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <strong>Mode:</strong> {renderValue(bomData.mode)}
                        </span>
                      </div>
                    </CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-white">
                    {filteredSubAssemblies.length} Items
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <th className="p-2 md:p-4 text-left font-bold text-gray-800 border-r border-gray-200 text-xs md:text-sm">Part No</th>
                      <th className="p-2 md:p-4 text-left font-bold text-gray-800 border-r border-gray-200 text-xs md:text-sm hidden md:table-cell">Part Description</th>
                      <th className="p-2 md:p-4 text-left font-bold text-gray-800 border-r border-gray-200 text-xs md:text-sm">Model</th>
                      <th className="p-2 md:p-4 text-left font-bold text-gray-800 border-r border-gray-200 text-xs md:text-sm">Sub Assembly</th>
                      <th className="p-2 md:p-4 text-center font-bold text-gray-800 border-r border-gray-200 text-xs md:text-sm">Blank Size</th>
                      <th className="p-2 md:p-4 text-center font-bold text-gray-800 border-r border-gray-200 text-xs md:text-sm hidden lg:table-cell">Weight of Blank</th>
                      <th className="p-2 md:p-4 text-center font-bold text-gray-800 text-xs md:text-sm hidden xl:table-cell">Material Consumption</th>
                      <th className="p-2 md:p-4 text-center font-bold text-gray-800 text-xs md:text-sm">Actions</th>
                    </tr>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="p-1 md:p-2 text-xs text-gray-500 border-r border-gray-200"></th>
                      <th className="p-1 md:p-2 text-xs text-gray-500 border-r border-gray-200 hidden md:table-cell"></th>
                      <th className="p-1 md:p-2 text-xs text-gray-500 border-r border-gray-200">(Model Type)</th>
                      <th className="p-1 md:p-2 text-xs text-gray-500 border-r border-gray-200"></th>
                      <th className="p-1 md:p-2 text-xs text-center border-r border-gray-200">
                        <div className="grid grid-cols-4 gap-1 md:gap-2">
                          <span className="bg-blue-100 text-blue-700 px-1 md:px-2 py-1 rounded font-medium text-xs">W</span>
                          <span className="bg-green-100 text-green-700 px-1 md:px-2 py-1 rounded font-medium text-xs">L</span>
                          <span className="bg-orange-100 text-orange-700 px-1 md:px-2 py-1 rounded font-medium text-xs">t</span>
                          <span className="bg-purple-100 text-purple-700 px-1 md:px-2 py-1 rounded font-medium text-xs">Qty</span>
                        </div>
                      </th>
                      <th className="p-1 md:p-2 text-xs text-gray-500 border-r border-gray-200 hidden lg:table-cell">(kg)</th>
                      <th className="p-1 md:p-2 text-xs text-center hidden xl:table-cell">
                        <div className="grid grid-cols-4 gap-1">
                          <span className="bg-indigo-100 text-indigo-700 px-1 py-1 rounded text-xs">Consumption %</span>
                          <span className="bg-cyan-100 text-cyan-700 px-1 py-1 rounded text-xs">Sheet Weight</span>
                          <span className="bg-pink-100 text-pink-700 px-1 py-1 rounded text-xs">Pcs/Sheet</span>
                          <span className="bg-yellow-100 text-yellow-700 px-1 py-1 rounded text-xs">Total Weight</span>
                        </div>
                      </th>
                      <th className="p-1 md:p-2 text-xs text-gray-500 border-r border-gray-200"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {!bomData || filteredSubAssemblies.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-12 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="p-4 bg-gray-100 rounded-full">
                              <FileText className="w-12 h-12 text-gray-400" />
                            </div>
                            <div className="text-gray-600">
                              <h3 className="text-lg font-semibold mb-2">No sub-assemblies found</h3>
                              <p className="text-sm">Click "Add Sub-Assembly" above to start adding data</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredSubAssemblies.map((subAssembly, index) => (
                      <tr key={index} className="hover:bg-blue-50 transition-colors duration-200 border-b border-gray-100">
                        {/* Part No */}
                        <td className="p-2 md:p-4 border-r border-gray-200 font-medium text-gray-800 text-xs md:text-sm">
                          {index === 0 ? (
                            <div className="flex items-center gap-1 md:gap-2">
                              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-500 rounded-full"></div>
                              <span className="font-semibold truncate">{renderValue(bomData.partNo)}</span>
                            </div>
                          ) : ''}
                        </td>
                        
                        {/* Part Description */}
                        <td className="p-2 md:p-4 border-r border-gray-200 text-gray-700 text-xs md:text-sm hidden md:table-cell">
                          {index === 0 ? (
                            <div className="flex items-center gap-1 md:gap-2">
                              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full"></div>
                              <span className="truncate">{renderValue(bomData.partDescription)}</span>
                            </div>
                          ) : ''}
                        </td>
                        
                        {/* Model */}
                        <td className="p-2 md:p-4 border-r border-gray-200 text-xs md:text-sm">
                          {index === 0 ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                              {renderValue(bomData.mode)}
                            </Badge>
                          ) : ''}
                        </td>
                        
                        {/* Sub Assembly */}
                        <td className="p-2 md:p-4 border-r border-gray-200 text-xs md:text-sm">
                          <div className="flex items-center gap-1 md:gap-2">
                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-purple-500 rounded-full"></div>
                            <span className="font-semibold text-gray-800 truncate">{renderValue(subAssembly.name)}</span>
                          </div>
                        </td>
                        
                        {/* Blank Size */}
                        <td className="p-2 md:p-4 border-r border-gray-200">
                          <div className="grid grid-cols-4 gap-1 md:gap-2 text-center">
                            <div className="bg-blue-50 p-1 md:p-2 rounded-lg">
                              <span className="text-blue-700 font-bold text-xs md:text-sm">{renderValue(subAssembly.blankSize.width)}</span>
                            </div>
                            <div className="bg-green-50 p-1 md:p-2 rounded-lg">
                              <span className="text-green-700 font-bold text-xs md:text-sm">{renderValue(subAssembly.blankSize.length)}</span>
                            </div>
                            <div className="bg-orange-50 p-1 md:p-2 rounded-lg">
                              <span className="text-orange-700 font-bold text-xs md:text-sm">{renderValue(subAssembly.blankSize.thickness)}</span>
                            </div>
                            <div className="bg-purple-50 p-1 md:p-2 rounded-lg">
                              <span className="text-purple-700 font-bold text-xs md:text-sm">{renderValue(subAssembly.blankSize.quantity)}</span>
                            </div>
                          </div>
                        </td>
                        
                        {/* Weight of the blank */}
                        <td className="p-2 md:p-4 border-r border-gray-200 text-center hidden lg:table-cell">
                          <div className="bg-gray-50 p-2 md:p-3 rounded-lg">
                            <span className="font-bold text-gray-800 text-sm md:text-lg">{renderValue(subAssembly.weightPerBlank)}</span>
                            <span className="text-gray-500 text-xs md:text-sm ml-1">kg</span>
                          </div>
                        </td>
                        
                        {/* Material Consumption Details */}
                        <td className="p-2 md:p-4 hidden xl:table-cell">
                          <div className="grid grid-cols-4 gap-1 md:gap-2 text-center">
                            {/* Consumption Percentage with Progress Bar */}
                            <div className="bg-indigo-50 p-1 md:p-2 rounded-lg">
                              <div className="text-indigo-700 font-bold text-xs md:text-sm mb-1">
                                {renderValue(subAssembly.materialConsumption.sheetConsumptionPercent)}%
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1 md:h-2">
                                <div 
                                  className="bg-indigo-500 h-1 md:h-2 rounded-full transition-all duration-300" 
                                  style={{ width: `${Math.min(parseFloat(String(renderValue(subAssembly.materialConsumption.sheetConsumptionPercent))) || 0, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                            
                            {/* Sheet Weight */}
                            <div className="bg-cyan-50 p-1 md:p-2 rounded-lg">
                              <span className="text-cyan-700 font-bold text-xs md:text-sm">{renderValue(subAssembly.materialConsumption.sheetWeight)}</span>
                              <div className="text-cyan-600 text-xs">kg</div>
                            </div>
                            
                            {/* Pieces per Sheet */}
                            <div className="bg-pink-50 p-1 md:p-2 rounded-lg">
                              <span className="text-pink-700 font-bold text-xs md:text-sm">{renderValue(subAssembly.materialConsumption.piecesPerSheet)}</span>
                              <div className="text-pink-600 text-xs">pcs</div>
                            </div>
                            
                            {/* Total Weight */}
                            <div className="bg-yellow-50 p-1 md:p-2 rounded-lg">
                              <span className="text-yellow-700 font-bold text-xs md:text-sm">
                                {typeof subAssembly.weightPerBlank === 'number' && typeof subAssembly.blankSize.quantity === 'number' 
                                  ? (subAssembly.weightPerBlank * subAssembly.blankSize.quantity).toFixed(2)
                                  : 'MISSING'}
                              </span>
                              <div className="text-yellow-600 text-xs">kg</div>
                            </div>
                          </div>
                        </td>
                        
                        {/* Actions Column */}
                        <td className="p-2 md:p-4 text-center">
                          <div className="flex items-center justify-center gap-1 md:gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                console.log('🔍 Full sub-assembly object:', subAssembly);
                                showDeleteConfirmation(subAssembly.name, subAssembly.name);
                              }}
                              disabled={loading}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 text-xs md:text-sm px-2 md:px-3"
                            >
                              <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Table Summary Footer */}
              {bomData && filteredSubAssemblies.length > 0 && (
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 p-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{filteredSubAssemblies.length}</div>
                      <div className="text-sm text-gray-600">Total Items</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {filteredSubAssemblies.reduce((sum, item) => {
                          const weight = parseFloat(String(renderValue(item.weightPerBlank))) || 0;
                          const qty = parseFloat(String(renderValue(item.blankSize.quantity))) || 0;
                          return sum + (weight * qty);
                        }, 0).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">Total Weight (kg)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {filteredSubAssemblies.reduce((sum, item) => {
                          const qty = parseFloat(String(renderValue(item.blankSize.quantity))) || 0;
                          return sum + qty;
                        }, 0)}
                      </div>
                      <div className="text-sm text-gray-600">Total Quantity</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {(filteredSubAssemblies.reduce((sum, item) => {
                          const consumption = parseFloat(String(renderValue(item.materialConsumption.sheetConsumptionPercent))) || 0;
                          return sum + consumption;
                        }, 0) / filteredSubAssemblies.length).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">Avg Consumption</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Optimization Dialog */}
      <Dialog open={showOptimizationDialog} onOpenChange={setShowOptimizationDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Sheet Cutting Optimization Results
            </DialogTitle>
            <DialogDescription>
              Optimal cutting direction and sheet size for{' '}
              {optimizingBlank?.name || 'selected sub-assembly'}
            </DialogDescription>
          </DialogHeader>

          {optimizationResult && (
            <div className="space-y-6">
              {/* Best Result Summary */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Recommended Configuration</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm text-green-700">Best Direction</Label>
                    <p className="font-bold text-lg">{optimizationResult.bestDirection}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-green-700">Sheet Size</Label>
                    <p className="font-bold text-lg">
                      {optimizationResult.bestSheetWidth} × {optimizationResult.bestSheetLength} mm
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-green-700">Total Blanks/Sheet</Label>
                    <p className="font-bold text-lg text-blue-600">
                      {optimizationResult.totalBlanksPerSheet}
                    </p>
                    <p className="text-xs text-gray-600">
                      ({optimizationResult.primaryBlanksPerSheet} + {optimizationResult.extraBlanksFromLeftover} extra)
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-green-700">Efficiency</Label>
                    <p className="font-bold text-lg text-green-600">
                      {optimizationResult.efficiency.toFixed(2)}%
                    </p>
                    <p className="text-xs text-gray-600">
                      Scrap: {optimizationResult.scrap.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="leftover">Leftover Analysis</TabsTrigger>
                  <TabsTrigger value="comparison">All Options</TabsTrigger>
                </TabsList>

                {/* Details Tab */}
                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Blank Specifications</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Dimensions:</span>
                          <span className="font-medium">
                            {optimizationResult.blankWidth} × {optimizationResult.blankLength} × {optimizationResult.blankThickness} mm
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Quantity needed:</span>
                          <span className="font-medium">{optimizationResult.blankQuantity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Weight per blank:</span>
                          <span className="font-medium">{optimizationResult.weightOfBlank.toFixed(3)} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total blank weight:</span>
                          <span className="font-medium">{optimizationResult.totalBlankWeight.toFixed(2)} kg</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Production Planning</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Sheets needed:</span>
                          <span className="font-medium text-blue-600">{optimizationResult.sheetsNeeded}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Blanks per sheet:</span>
                          <span className="font-medium">{optimizationResult.totalBlanksPerSheet}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Weight per sheet:</span>
                          <span className="font-medium">{optimizationResult.totalBlanksWeightPerSheet.toFixed(2)} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total production weight:</span>
                          <span className="font-medium">{optimizationResult.totalWeight.toFixed(2)} kg</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Leftover Analysis Tab */}
                <TabsContent value="leftover" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Leftover Material</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <Label className="text-gray-600">Leftover Area</Label>
                          <p className="font-medium">{optimizationResult.leftoverArea.toFixed(0)} mm²</p>
                        </div>
                        <div>
                          <Label className="text-gray-600">Leftover Width</Label>
                          <p className="font-medium">{optimizationResult.leftoverWidth.toFixed(1)} mm</p>
                        </div>
                        <div>
                          <Label className="text-gray-600">Leftover Length</Label>
                          <p className="font-medium">{optimizationResult.leftoverLength.toFixed(1)} mm</p>
                        </div>
                      </div>

                      {optimizationResult.leftoverDetails && optimizationResult.leftoverDetails.length > 0 && (
                        <div className="mt-4">
                          <Label className="text-sm font-semibold mb-2 block">Extra Blanks from Leftover:</Label>
                          <div className="space-y-2">
                            {optimizationResult.leftoverDetails.map((detail: any, index: number) => (
                              <div key={index} className="p-3 bg-blue-50 rounded border border-blue-200 text-sm">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium capitalize">{detail.type.replace('_', ' ')}</span>
                                  <Badge variant="outline">{detail.blanks} extra blanks</Badge>
                                </div>
                                <p className="text-xs text-gray-600 mt-1">
                                  {detail.width.toFixed(1)} × {detail.length.toFixed(1)} mm ({detail.orientation})
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Comparison Tab */}
                <TabsContent value="comparison" className="space-y-4">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full border-collapse border border-gray-300 text-sm">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="border border-gray-300 p-2 text-left">Sheet Size</th>
                          <th className="border border-gray-300 p-2 text-center">Direction</th>
                          <th className="border border-gray-300 p-2 text-center">Primary</th>
                          <th className="border border-gray-300 p-2 text-center">Extra</th>
                          <th className="border border-gray-300 p-2 text-center">Total</th>
                          <th className="border border-gray-300 p-2 text-center">Efficiency</th>
                        </tr>
                      </thead>
                      <tbody>
                        {optimizationResult.allSheetComparisons?.map((option: any, index: number) => (
                          <tr 
                            key={index}
                            className={option.totalBlanks === optimizationResult.totalBlanksPerSheet ? 'bg-green-50 font-semibold' : ''}
                          >
                            <td className="border border-gray-300 p-2">
                              {option.sheetWidth} × {option.sheetLength}
                              {option.totalBlanks === optimizationResult.totalBlanksPerSheet && (
                                <Badge variant="default" className="ml-2">Best</Badge>
                              )}
                            </td>
                            <td className="border border-gray-300 p-2 text-center">{option.direction}</td>
                            <td className="border border-gray-300 p-2 text-center">{option.primaryBlanks}</td>
                            <td className="border border-gray-300 p-2 text-center text-blue-600">{option.extraBlanksFromLeftover}</td>
                            <td className="border border-gray-300 p-2 text-center font-bold">{option.totalBlanks}</td>
                            <td className="border border-gray-300 p-2 text-center">{option.efficiency.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOptimizationDialog(false)}>
              Cancel
            </Button>
            <Button onClick={applyOptimization}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Apply Optimization
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              Delete Sub-Assembly
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the sub-assembly "{subAssemblyToDelete?.name}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setSubAssemblyToDelete(null);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteSubAssembly}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BOMStandardDisplay;

