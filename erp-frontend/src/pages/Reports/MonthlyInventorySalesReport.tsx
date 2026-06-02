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
  oem_name: string;
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

  // Default to August 2025 (the seeded period)
  const [selectedMonth, setSelectedMonth] = useState<string>('8');
  const [selectedYear, setSelectedYear] = useState<string>('2025');
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [selectedOEM, setSelectedOEM] = useState<string>('all');
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

  // Unique OEMs from loaded models
  const oemOptions = [...new Set(models.map(m => m.oem_name))].sort();

  const generateReport = async () => {
    if (!selectedMonth || !selectedYear) {
      toast({ title: 'Validation Error', description: 'Please select both month and year', variant: 'destructive' });
      return;
    }
    // Find model_id if OEM+model selected
    const modelId = selectedModel !== 'all' ? selectedModel : null;
    try {
      setGenerating(true);
      const response = await api.post('/reports/monthly-inventory-sales', {
        month: parseInt(selectedMonth),
        year: parseInt(selectedYear),
        model_id: modelId,
        oem_name: selectedOEM !== 'all' ? selectedOEM : undefined,
        format: 'json',
        opening_stock_data: openingStockData
      });
      if (response.data) {
        setReportData(response.data);
        toast({ title: 'Report Generated', description: `${response.data.products?.length || 0} products loaded` });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate report', variant: 'destructive' });
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
      const token = localStorage.getItem('empclerp_token');
      const response = await fetch('/api/reports/monthly-inventory-sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          month: parseInt(selectedMonth),
          year: parseInt(selectedYear),
          model_id: selectedModel === 'all' ? null : selectedModel,
          format: format,
          opening_stock_data: openingStockData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to download report');
      }

      // Read actual binary blob from the response
      const blob = await response.blob();
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                <SelectContent>
                  {monthOptions.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                <SelectContent>
                  {yearOptions.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>OEM Company</Label>
              <Select value={selectedOEM} onValueChange={v => { setSelectedOEM(v); setSelectedModel('all'); }}>
                <SelectTrigger><SelectValue placeholder="All OEMs" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All OEMs</SelectItem>
                  {oemOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger><SelectValue placeholder="All Models" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Models</SelectItem>
                  {models
                    .filter(m => selectedOEM === 'all' || m.oem_name === selectedOEM)
                    .map(m => <SelectItem key={m.model_id} value={m.model_id}>{m.oem_name} – {m.model_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={generateReport} disabled={generating || loading} className="w-full">
                {generating ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Generating…</> : <><RefreshCw className="h-4 w-4 mr-2" />Generate</>}
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
                    <TableRow className="bg-slate-800 text-white">
                      <TableHead className="text-white w-8">#</TableHead>
                      <TableHead className="text-white">OEM</TableHead>
                      <TableHead className="text-white">Model</TableHead>
                      <TableHead className="text-white">Part Number</TableHead>
                      <TableHead className="text-white">Part Name</TableHead>
                      <TableHead className="text-right text-white">Opening</TableHead>
                      <TableHead className="text-right text-white">Produced</TableHead>
                      <TableHead className="text-right text-white">Total Inv.</TableHead>
                      {reportData.sale_dates.map(date => (
                        <TableHead key={date} className="text-right text-white text-xs">{formatDate(date)}</TableHead>
                      ))}
                      <TableHead className="text-right text-white">Total Sold</TableHead>
                      <TableHead className="text-right text-white">Closing</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.products.map((product, index) => {
                      const openingQty = openingStockData[product.product_id] ?? product.opening_stock;
                      const closingQty = openingQty + product.produced_quantity - product.total_sales;
                      return (
                        <TableRow key={product.product_id} className={index % 2 === 0 ? '' : 'bg-slate-50'}>
                          <TableCell className="text-center text-xs text-slate-400">{index + 1}</TableCell>
                          <TableCell className="text-xs font-medium text-slate-600">{product.oem_name ?? '—'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{product.model_name}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{product.product_code}</TableCell>
                          <TableCell className="text-sm">{product.part_name}</TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              value={openingQty}
                              onChange={(e) => handleOpeningStockChange(product.product_id, e.target.value)}
                              className="w-20 text-right h-7 text-sm"
                              min="0"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={product.produced_quantity > 0 ? 'bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-sm font-medium' : 'text-slate-400'}>
                              {product.produced_quantity || '—'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-medium">{openingQty + product.produced_quantity}</TableCell>
                          {reportData.sale_dates.map(date => (
                            <TableCell key={date} className="text-right text-sm">{product.daily_sales[date] || '—'}</TableCell>
                          ))}
                          <TableCell className="text-right font-medium text-red-600">{product.total_sales || '—'}</TableCell>
                          <TableCell className="text-right font-bold">
                            <span className={closingQty < 0 ? 'text-red-700 bg-red-100 px-1 rounded' : closingQty === 0 ? 'text-slate-400' : 'text-green-700'}>
                              {closingQty}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">{reportData.products.length}</div>
                  <div className="text-xs text-slate-500">SKUs</div>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <div className="text-2xl font-bold text-slate-700">
                    {reportData.products.reduce((s, p) => s + (openingStockData[p.product_id] ?? p.opening_stock), 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500">Opening Stock</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-700">
                    {reportData.products.reduce((s, p) => s + p.produced_quantity, 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500">Total Produced</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-700">
                    {reportData.products.reduce((s, p) => s + p.total_sales, 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500">Total Sold</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">
                    {reportData.products.reduce((s, p) => s + (openingStockData[p.product_id] ?? p.opening_stock) + p.produced_quantity - p.total_sales, 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500">Closing Stock</div>
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
