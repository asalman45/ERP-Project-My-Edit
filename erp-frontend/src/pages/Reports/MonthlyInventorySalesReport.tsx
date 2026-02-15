import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, FileText, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';

interface Product {
  product_id: string;
  model_name: string;
  product_code: string;
  part_name: string;
  opening_stock: number;
  produced_quantity: number;
  total_inventory: number;
  daily_sales: Record<string, number>;
  total_sales: number;
  closing_stock: number;
  uom_code: string;
}

interface ReportData {
  title: string;
  company_name: string;
  month: string;
  year: string;
  start_date: string;
  end_date: string;
  generated_at: string;
  sale_dates: string[];
  products: Product[];
}

interface Model {
  model_id: string;
  model_name: string;
  model_year: string;
  oem_name: string;
}

const MonthlyInventorySalesReport: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  // Form state
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [openingStockData, setOpeningStockData] = useState<Record<string, number>>({});
  
  const { toast } = useToast();

  // Generate year options (current year and previous 5 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  // Month options
  const monthOptions = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  // Load available models
  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports/available-models');
      if (response.data.success) {
        setModels(response.data.data);
      }
    } catch (error) {
      console.error('Error loading models:', error);
      toast({
        title: 'Error',
        description: 'Failed to load available models',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!selectedMonth || !selectedYear) {
      toast({
        title: 'Validation Error',
        description: 'Please select both month and year',
        variant: 'destructive'
      });
      return;
    }

    try {
      setGenerating(true);
      const response = await api.post('/reports/monthly-inventory-sales', {
        month: parseInt(selectedMonth),
        year: parseInt(selectedYear),
        model_id: selectedModel === 'all' ? null : selectedModel,
        format: 'json',
        opening_stock_data: openingStockData
      });

      if (response.data.success) {
        setReportData(response.data.data);
        toast({
          title: 'Success',
          description: 'Report generated successfully'
        });
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };

  const exportReport = async (format: 'pdf' | 'excel') => {
    if (!selectedMonth || !selectedYear) {
      toast({
        title: 'Validation Error',
        description: 'Please select both month and year',
        variant: 'destructive'
      });
      return;
    }

    try {
      setGenerating(true);
      const response = await api.post('/reports/monthly-inventory-sales', {
        month: parseInt(selectedMonth),
        year: parseInt(selectedYear),
        model_id: selectedModel === 'all' ? null : selectedModel,
        format: format,
        opening_stock_data: openingStockData
      }, {
        responseType: 'blob'
      });

      // Create download link
      const blob = new Blob([response.data], {
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `monthly_inventory_sales_report_${selectedMonth}_${selectedYear}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: `Report exported as ${format.toUpperCase()} successfully`
      });
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: 'Error',
        description: `Failed to export report as ${format.toUpperCase()}`,
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleOpeningStockChange = (productId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setOpeningStockData(prev => ({
      ...prev,
      [productId]: numValue
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Monthly Inventory & Sales Report</h1>
          <p className="text-muted-foreground">
            Generate comprehensive monthly inventory and sales reports with manual opening stock input
          </p>
        </div>
      </div>

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Report Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map(month => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model (Optional)</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue placeholder="All models" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Models</SelectItem>
                  {models.map(model => (
                    <SelectItem key={model.model_id} value={model.model_id}>
                      {model.oem_name} - {model.model_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={generateReport} 
                disabled={generating || loading}
                className="w-full"
              >
                {generating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {reportData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{reportData.title}</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportReport('pdf')}
                  disabled={generating}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportReport('excel')}
                  disabled={generating}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Report Info */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Company: {reportData.company_name}</span>
                <span>Period: {reportData.start_date} to {reportData.end_date}</span>
                <span>Generated: {new Date(reportData.generated_at).toLocaleString()}</span>
              </div>

              {/* Manual Opening Stock Input */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Manual Opening Stock Input</Label>
                <p className="text-sm text-muted-foreground">
                  Enter opening stock quantities manually. Totals will be calculated automatically.
                </p>
              </div>

              {/* Report Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">Model</TableHead>
                      <TableHead>Part Number</TableHead>
                      <TableHead>Part Name</TableHead>
                      <TableHead className="text-right">Opening (Nos)</TableHead>
                      <TableHead className="text-right">Quantity Produced</TableHead>
                      <TableHead className="text-right">Total Inventory</TableHead>
                      {reportData.sale_dates.map(date => (
                        <TableHead key={date} className="text-right">
                          {formatDate(date)}
                        </TableHead>
                      ))}
                      <TableHead className="text-right">Total Sales</TableHead>
                      <TableHead className="text-right">Closing Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.products.map((product, index) => (
                      <TableRow key={product.product_id}>
                        <TableCell className="text-center font-medium">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {product.product_code}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className={product.part_name.includes('NMR') || product.part_name.includes('NLR') ? 'text-red-600 font-semibold' : ''}>
                              {product.part_name}
                            </div>
                            {product.model_name && (
                              <Badge variant="outline" className="text-xs">
                                {product.model_name}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={openingStockData[product.product_id] || product.opening_stock}
                            onChange={(e) => handleOpeningStockChange(product.product_id, e.target.value)}
                            className="w-20 text-right"
                            min="0"
                            step="0.01"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={product.produced_quantity > 0 ? 'bg-yellow-200 px-2 py-1 rounded text-sm font-medium' : ''}>
                            {product.produced_quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {(openingStockData[product.product_id] || product.opening_stock) + product.produced_quantity}
                        </TableCell>
                        {reportData.sale_dates.map(date => (
                          <TableCell key={date} className="text-right">
                            {product.daily_sales[date] || 0}
                          </TableCell>
                        ))}
                        <TableCell className="text-right font-medium">
                          {product.total_sales}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={product.closing_stock < 10 ? 'text-red-600 font-semibold' : 'font-medium'}>
                            {((openingStockData[product.product_id] || product.opening_stock) + product.produced_quantity) - product.total_sales}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {reportData.products.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Products</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {reportData.products.reduce((sum, p) => sum + (openingStockData[p.product_id] || p.opening_stock), 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Opening Stock</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {reportData.products.reduce((sum, p) => sum + p.produced_quantity, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Produced</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {reportData.products.reduce((sum, p) => sum + p.total_sales, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Sales</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MonthlyInventorySalesReport;
