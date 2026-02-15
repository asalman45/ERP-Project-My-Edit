import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Download, FileText, CheckCircle, AlertCircle, Loader2, FileSpreadsheet, FileText as PdfIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// Helper function to convert JSON data to CSV
const convertJsonToCsv = (data: any[], filename: string): string => {
  if (!data || data.length === 0) {
    return 'No data available';
  }

  // Define CSV headers based on filename
  let headers: string[] = [];
  let csvRows: string[] = [];

  if (filename === 'suppliers') {
    headers = ['Supplier ID', 'Code', 'Name', 'Contact', 'Phone', 'Email', 'Address', 'Lead Time (Days)', 'Created At'];
    csvRows = data.map(item => [
      item.supplier_id || '',
      item.code || '',
      item.name || '',
      item.contact || '',
      item.phone || '',
      item.email || '',
      item.address || '',
      item.lead_time_days || '',
      item.created_at || ''
    ].map(field => `"${field}"`).join(','));
  } else if (filename === 'inventory') {
    headers = ['Inventory ID', 'Product/Material', 'Code', 'Name', 'Quantity', 'Location', 'Status', 'UOM', 'Unit Cost', 'Total Value', 'Created At'];
    csvRows = data.map(item => {
      const itemName = item.product_name || item.material_name || 'N/A';
      const itemCode = item.product_code || item.material_code || 'N/A';
      const totalValue = (item.quantity * (item.unit_cost || 0)).toFixed(2);
      
      return [
        item.inventory_id || '',
        itemName,
        itemCode,
        itemName,
        item.quantity || 0,
        item.location_name || 'N/A',
        item.status || '',
        item.uom_code || 'N/A',
        item.unit_cost || 0,
        totalValue,
        item.created_at || ''
      ].map(field => `"${field}"`).join(',');
    });
  } else if (filename === 'products') {
    headers = ['Product ID', 'Product Code', 'Part Name', 'Description', 'OEM', 'Model', 'UOM', 'Standard Cost', 'Category', 'Min Stock', 'Max Stock', 'Reorder Qty', 'Created At'];
    csvRows = data.map(item => [
      item.product_id || '',
      item.product_code || '',
      item.part_name || '',
      item.description || '',
      item.oem_name || '',
      item.model_name || '',
      item.uom_code || '',
      item.standard_cost || 0,
      item.category || '',
      item.min_stock || 0,
      item.max_stock || 0,
      item.reorder_qty || 0,
      item.created_at || ''
    ].map(field => `"${field}"`).join(','));
  } else if (filename === 'raw-materials') {
    headers = ['Raw Material ID', 'Material Code', 'Name', 'Description', 'UOM Code', 'UOM Name', 'Created At'];
    csvRows = data.map(item => [
      item.raw_material_id || '',
      item.material_code || '',
      item.name || '',
      item.description || '',
      item.uom_code || '',
      item.uom_name || '',
      item.created_at || ''
    ].map(field => `"${field}"`).join(','));
  } else if (filename === 'procurement') {
    headers = ['Request ID', 'Material Code', 'Material Name', 'Quantity', 'UOM Code', 'Status', 'Requested By', 'Approved By', 'Received By', 'Notes', 'Reference PO', 'Created At', 'Updated At'];
    csvRows = data.map(item => [
      item.id || '',
      item.material?.material_code || '',
      item.material?.name || '',
      item.quantity || '',
      item.material?.uom?.code || '',
      item.status || '',
      item.requested_by || '',
      item.approved_by || '',
      item.received_by || '',
      (item.notes || '').replace(/"/g, '""'),
      item.reference_po || '',
      item.created_at || '',
      item.updated_at || ''
    ].map(field => `"${field}"`).join(','));
  } else if (filename === 'finished-goods') {
    headers = ['Inventory ID', 'Product Code', 'Product Name', 'OEM', 'Model', 'Quantity', 'Location', 'Status', 'UOM', 'Unit Cost', 'Total Value', 'Received At'];
    csvRows = data.map(item => {
      const productName = item.product?.part_name || item.product_name || 'N/A';
      const productCode = item.product?.product_code || item.product_code || 'N/A';
      const oemName = item.product?.oem?.oem_name || item.oem_name || 'N/A';
      const modelName = item.product?.model?.model_name || item.model_name || 'N/A';
      const locationName = item.location?.name || item.location_name || 'N/A';
      const uomCode = item.uom?.code || item.uom_code || 'N/A';
      const unitCost = item.product?.standard_cost || item.unit_cost || 0;
      const totalValue = (item.quantity * unitCost).toFixed(2);
      const receivedAt = item.updated_at || item.received_at || item.created_at || 'N/A';
      const receivedAtFormatted = receivedAt !== 'N/A' ? new Date(receivedAt).toISOString().split('T')[0] : 'N/A';

      return [
        item.inventory_id || '',
        productCode,
        productName,
        oemName,
        modelName,
        item.quantity || 0,
        locationName,
        item.status || '',
        uomCode,
        unitCost,
        totalValue,
        receivedAtFormatted
      ].map(field => `"${field}"`).join(',');
    });
  } else if (filename === 'qa-history') {
    headers = ['Inventory ID', 'Product Code', 'Product Name', 'OEM', 'Model', 'Quantity', 'Approved Qty', 'Rejected Qty', 'Rework Qty', 'Scrap Qty', 'Disposal Qty', 'QA Status', 'Disposition', 'Rejection Reason', 'Rework WO', 'Work Order', 'UOM', 'Received At', 'Created At'];
    csvRows = data.map(item => [
      item.inventory_id || '',
      item.product_code || '',
      item.product_name || '',
      item.oem || '',
      item.model || '',
      item.quantity || 0,
      item.quantity_approved || 0,
      item.quantity_rejected || 0,
      item.quantity_rework || 0,
      item.quantity_scrap || 0,
      item.quantity_disposal || 0,
      item.qa_status || '',
      item.disposition || '',
      (item.rejection_reason || '').replace(/"/g, '""'),
      item.rework_wo_no || '',
      item.wo_no || '',
      item.uom_code || '',
      item.received_at ? new Date(item.received_at).toISOString().split('T')[0] : '',
      item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : ''
    ].map(field => `"${field}"`).join(','));
  } else if (filename === 'sales-orders') {
    headers = ['SO No', 'Customer Name', 'Order Date', 'Required Date', 'Delivery Date', 'Status', 'Priority', 'Subtotal', 'Tax Amount', 'Total Amount', 'Reference Number', 'Created At'];
    csvRows = data.map(item => [
      item.so_no || '',
      item.customer_name || '',
      item.order_date || '',
      item.required_date || '',
      item.delivery_date || '',
      item.status || '',
      item.priority || '',
      item.subtotal || 0,
      item.tax_amount || 0,
      item.total_amount || 0,
      item.reference_number || '',
      item.created_at || ''
    ].map(field => `"${field}"`).join(','));
  } else if (filename === 'work-orders') {
    headers = ['WO No', 'Product Code', 'Product Name', 'OEM', 'Model', 'Quantity', 'UOM', 'Status', 'Operation', 'Priority', 'Customer', 'SO Ref', 'PO Ref', 'Scheduled Start', 'Scheduled End', 'Created At'];
    csvRows = data.map(item => [
      item.wo_no || '',
      item.product_code || '',
      item.product_name || '',
      item.oem || '',
      item.model || '',
      item.quantity || 0,
      item.uom || '',
      item.status || '',
      item.operation_type || '',
      item.priority || '',
      item.customer || '',
      item.sales_order_ref || '',
      item.purchase_order_ref || '',
      item.scheduled_start || '',
      item.scheduled_end || '',
      item.created_at || ''
    ].map(field => `"${field}"`).join(','));
  } else {
    // Generic CSV generation for other data types
    const firstItem = data[0];
    headers = Object.keys(firstItem);
    csvRows = data.map(item => 
      headers.map(header => `"${item[header] || ''}"`).join(',')
    );
  }

  return headers.join(',') + '\n' + csvRows.join('\n');
};

interface GenericExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title: string;
  exportFunction: (queryParams: string) => Promise<any>;
  filename: string;
  availableFormats?: ('pdf' | 'csv' | 'excel')[];
  showDateRange?: boolean;
  showFilters?: boolean;
  filterOptions?: {
    location?: string[];
    category?: string[];
    status?: string[];
  };
}

interface ExportOptions {
  format: 'pdf' | 'csv' | 'excel';
  includeImages: boolean;
  includeCharts: boolean;
  dateRange: 'all' | 'last30' | 'last90' | 'custom';
  customStartDate?: string;
  customEndDate?: string;
  openInNewTab?: boolean;
  filters: {
    location?: string;
    category?: string;
    status?: string;
  };
}

const formatDescriptions: Record<
  'pdf' | 'csv' | 'excel',
  { title: string; description: string; accent: string; icon: React.ReactNode }
> = {
  pdf: {
    title: 'PDF Report',
    description: 'Beautifully formatted report ideal for printing and sharing.',
    accent: 'from-purple-500/10 to-purple-600/10 text-purple-700 border-purple-200',
    icon: <PdfIcon className="h-5 w-5 text-purple-500" />,
  },
  csv: {
    title: 'CSV File',
    description: 'Raw tabular data ready for Excel, Sheets, or BI tools.',
    accent: 'from-blue-500/10 to-blue-600/10 text-blue-700 border-blue-200',
    icon: <FileSpreadsheet className="h-5 w-5 text-blue-500" />,
  },
  excel: {
    title: 'Excel File',
    description: 'Native spreadsheet format (coming soon).',
    accent: 'from-emerald-500/10 to-emerald-600/10 text-emerald-700 border-emerald-200',
    icon: <FileSpreadsheet className="h-5 w-5 text-emerald-500" />,
  },
};

const GenericExportModal: React.FC<GenericExportModalProps> = ({
  isOpen, 
  onClose, 
  onSuccess, 
  title,
  exportFunction,
  filename,
  availableFormats = ['pdf', 'csv', 'excel'],
  showDateRange = true,
  showFilters = false,
  filterOptions = {}
}) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: availableFormats[0] || 'pdf',
    includeImages: true,
    includeCharts: true,
    dateRange: 'all',
    openInNewTab: true,
    filters: {}
  });

  const availableFormatCards = useMemo(() => availableFormats.filter(Boolean), [availableFormats]);
  const formatGridClass = useMemo(() => {
    const len = availableFormatCards.length;
    if (len >= 3) return 'sm:grid-cols-2 lg:grid-cols-3';
    if (len === 2) return 'sm:grid-cols-2';
    return 'sm:grid-cols-1';
  }, [availableFormatCards.length]);

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 300);

      // Build query parameters
      const params = new URLSearchParams();
      params.append('format', exportOptions.format);
      
      if (showFilters) {
        if (exportOptions.filters.location && exportOptions.filters.location !== 'all') {
          params.append('location_id', exportOptions.filters.location);
        }
        if (exportOptions.filters.category) {
          params.append('category', exportOptions.filters.category);
        }
        if (exportOptions.filters.status) {
          params.append('status', exportOptions.filters.status);
        }
      }

      // Handle date range
      if (showDateRange) {
        if (exportOptions.dateRange === 'custom' && exportOptions.customStartDate && exportOptions.customEndDate) {
          params.append('start_date', exportOptions.customStartDate);
          params.append('end_date', exportOptions.customEndDate);
        } else if (exportOptions.dateRange !== 'all') {
          const endDate = new Date();
          const startDate = new Date();
          
          switch (exportOptions.dateRange) {
            case 'last30':
              startDate.setDate(endDate.getDate() - 30);
              break;
            case 'last90':
              startDate.setDate(endDate.getDate() - 90);
              break;
          }
          
          params.append('start_date', startDate.toISOString().split('T')[0]);
          params.append('end_date', endDate.toISOString().split('T')[0]);
        }
      }

      let response;
      try {
        response = await exportFunction(params.toString());
      } catch (fetchError: any) {
        clearInterval(progressInterval);
        setExportProgress(0);
        throw fetchError;
      }
      
      clearInterval(progressInterval);
      setExportProgress(100);

      // Handle different response types
      if (exportOptions.format === 'pdf') {
        // Check if response is ArrayBuffer (actual PDF)
        if (response instanceof ArrayBuffer || response instanceof Uint8Array) {
          console.log('PDF ArrayBuffer received, size:', response.byteLength);
          
          // Create blob from PDF response
          const blob = new Blob([response], { type: 'application/pdf' });
          console.log('PDF Blob created, size:', blob.size);
          
          // Create download link
          const url = window.URL.createObjectURL(blob);
          const fileName = `${filename}-${new Date().toISOString().split('T')[0]}.pdf`;
          
          // Create download link
          const downloadLink = document.createElement('a');
          downloadLink.href = url;
          downloadLink.download = fileName;
          downloadLink.style.display = 'none';
          document.body.appendChild(downloadLink);
          
          if (exportOptions.openInNewTab) {
            // Try to open PDF in new tab first
            const newWindow = window.open(url, '_blank');
            
            if (newWindow) {
              // If new window opened successfully, also trigger download
              setTimeout(() => {
                downloadLink.click();
                document.body.removeChild(downloadLink);
                
                // Clean up URL after a delay
                setTimeout(() => {
                  window.URL.revokeObjectURL(url);
                }, 2000);
              }, 1000);
              
              toast({
                title: "PDF Generated Successfully",
                description: "The PDF has opened in a new tab and is being downloaded.",
                variant: "default",
              });
            } else {
              // Fallback to direct download if popup blocked
              downloadLink.click();
              document.body.removeChild(downloadLink);
              window.URL.revokeObjectURL(url);
              
              toast({
                title: "PDF Downloaded",
                description: "The PDF has been downloaded to your default download folder. Check your Downloads folder.",
                variant: "default",
              });
            }
          } else {
            // Direct download only
            downloadLink.click();
            document.body.removeChild(downloadLink);
            window.URL.revokeObjectURL(url);
            
            toast({
              title: "PDF Downloaded",
              description: "The PDF has been downloaded to your default download folder. Check your Downloads folder.",
              variant: "default",
            });
          }
        } else {
          // Handle JSON response (fallback)
          let jsonData;
          try {
            jsonData = typeof response === 'string' ? JSON.parse(response) : response;
          } catch (parseError) {
            console.error('Error parsing JSON response:', parseError);
            jsonData = { message: "PDF export is not yet implemented. Please use CSV export instead." };
          }
          
          toast({
            title: "PDF Export Not Available",
            description: jsonData.message || "PDF export is not yet implemented. Please use CSV export instead.",
            variant: "destructive",
          });
          return;
        }
      } else if (exportOptions.format === 'csv') {
        // Check if response is a string (CSV) or needs conversion from JSON
        if (typeof response === 'string') {
          // Handle actual CSV response (string)
          const blob = new Blob([response], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        } else if (typeof response === 'object' && response !== null) {
          // Check if it's already parsed JSON (shouldn't happen but handle it)
          try {
            // Convert JSON data to CSV
            const jsonData = response;
            const csvContent = convertJsonToCsv(jsonData.data || jsonData, filename);
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          } catch (parseError) {
            console.error('Error converting JSON to CSV:', parseError);
            toast({
              title: "Export Error",
              description: "Failed to convert response data to CSV. Please try again.",
              variant: "destructive",
            });
            return;
          }
        } else {
          // Unknown response type
          console.error('Unexpected CSV response type:', typeof response);
          toast({
            title: "Export Error",
            description: "Unexpected response format. Please try again.",
            variant: "destructive",
          });
          return;
        }
      } else {
        // Handle Excel response
        if (typeof response === 'object' || (typeof response === 'string' && response.startsWith('{'))) {
          let jsonData;
          try {
            jsonData = typeof response === 'string' ? JSON.parse(response) : response;
          } catch (parseError) {
            console.error('Error parsing JSON response:', parseError);
            jsonData = { message: "Excel export is not yet implemented. Please use CSV export instead." };
          }
          
          toast({
            title: "Excel Export Not Available",
            description: jsonData.message || "Excel export is not yet implemented. Please use CSV export instead.",
            variant: "destructive",
          });
          return;
        }
        
        const blob = new Blob([response], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}-${new Date().toISOString().split('T')[0]}.${exportOptions.format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }

      toast({
        title: "Export Successful",
        description: `${title} exported successfully as ${exportOptions.format.toUpperCase()}`,
      });

      onSuccess();
    } catch (error: any) {
      console.error('Export error:', error);
      
      toast({
        title: "Export Failed",
        description: error.message || `Failed to export ${title.toLowerCase()} data`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const handleClose = () => {
    setExportProgress(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-white z-10 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="rounded-2xl border border-primary/10 bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-purple-600/10 p-4">
            <div className="flex flex-col gap-1.5 text-sm text-primary">
              <p className="font-semibold text-base">Enterprising Manufacturing Co Pvt. Ltd.</p>
              <p className="text-xs text-gray-600 leading-tight">Factory: Plot #9, Sector 26, Korangi Industrial Area, Karachi - Pakistan - 74900</p>
              <p className="text-xs text-gray-600 leading-tight">Tel: (+9221) 3507 5579 &nbsp;•&nbsp; (+92300) 9279500</p>
              <p className="text-xs text-gray-600 leading-tight">NTN: 7268945-5 &nbsp;•&nbsp; Sales Tax: 3277-87612-9785</p>
              <div className="mt-2 rounded-lg border border-white/60 bg-white/80 px-3 py-1.5 text-xs text-gray-700 shadow-sm">
                Exporting: <span className="font-semibold text-gray-900">{title}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">Choose Export Format</Label>
            <div className={cn("grid gap-3", formatGridClass)}>
              {availableFormatCards.map((format) => {
                const formatInfo = formatDescriptions[format];
                if (!formatInfo) return null;
                const isActive = exportOptions.format === format;
                return (
                  <button
                    key={format}
                    type="button"
                    disabled={format === 'excel'}
                    onClick={() => setExportOptions((prev) => ({ ...prev, format }))}
                    className={cn(
                      "flex flex-col gap-2 rounded-xl border bg-white/60 p-4 text-left transition-all",
                      "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/30",
                      isActive ? "border-primary shadow-sm" : "border-gray-200",
                      formatInfo.accent,
                      format === 'excel' && "opacity-60 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-white/70 p-2 shadow-sm">
                        {formatInfo.icon}
                      </div>
                      <div>
                        <p className="font-semibold leading-tight">{formatInfo.title}</p>
                        <p className="text-xs text-gray-500">
                          {format === 'excel' ? 'Coming soon' : isActive ? 'Selected format' : 'Click to select'}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">{formatInfo.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Range */}
          {showDateRange && (
            <>
              <div className="space-y-2">
                <Label htmlFor="dateRange" className="text-sm font-medium text-gray-700">Date Range</Label>
                <div className="grid grid-cols-2 gap-2 text-sm font-medium">
                  {(['all', 'last30', 'last90', 'custom'] as const).map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => setExportOptions((prev) => ({ ...prev, dateRange: range }))}
                      className={cn(
                        "rounded-lg border px-3 py-2 capitalize transition-all",
                        exportOptions.dateRange === range
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-gray-200 bg-white text-gray-600 hover:border-primary/40"
                      )}
                    >
                      {range === 'all' ? 'All Data' : range === 'last30' ? 'Last 30 Days' : range === 'last90' ? 'Last 90 Days' : 'Custom Range'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Range */}
              {exportOptions.dateRange === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <input
                      type="date"
                      id="startDate"
                      value={exportOptions.customStartDate || ''}
                      onChange={(e) =>
                        setExportOptions(prev => ({ ...prev, customStartDate: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <input
                      type="date"
                      id="endDate"
                      value={exportOptions.customEndDate || ''}
                      onChange={(e) =>
                        setExportOptions(prev => ({ ...prev, customEndDate: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Filters */}
          {showFilters && (
            <div className="space-y-3">
              <Label>Filters</Label>
              {filterOptions.location && (
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Select
                    value={exportOptions.filters.location || ''}
                    onValueChange={(value) =>
                      setExportOptions(prev => ({ 
                        ...prev, 
                        filters: { ...prev.filters, location: value } 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {filterOptions.location.map((loc) => (
                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* PDF Options */}
          {exportOptions.format === 'pdf' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">PDF Options</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeImages"
                    checked={exportOptions.includeImages}
                    onCheckedChange={(checked) =>
                      setExportOptions(prev => ({ ...prev, includeImages: !!checked }))
                    }
                  />
                  <Label htmlFor="includeImages" className="text-sm">
                    Include images
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="openInNewTab"
                    checked={exportOptions.openInNewTab}
                    onCheckedChange={(checked) =>
                      setExportOptions(prev => ({ ...prev, openInNewTab: !!checked }))
                    }
                  />
                  <Label htmlFor="openInNewTab" className="text-sm">
                    Open PDF in new tab (also downloads)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeCharts"
                    checked={exportOptions.includeCharts}
                    onCheckedChange={(checked) =>
                      setExportOptions(prev => ({ ...prev, includeCharts: !!checked }))
                    }
                  />
                  <Label htmlFor="includeCharts" className="text-sm">
                    Include charts and graphs
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* Export Progress */}
          {isExporting && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Generating export...</span>
                <span className="text-sm text-gray-500">{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} className="w-full" />
            </div>
          )}

          {/* Info Alert */}
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-primary" />
              <span>
                {exportOptions.format === 'pdf'
                  ? 'PDF export includes company letterhead, summary, and formatted tables.'
                  : 'CSV export includes raw data that can be opened in Excel or BI tools.'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose} disabled={isExporting}>
              Cancel
            </Button>
            <Button 
              onClick={handleExport} 
              disabled={isExporting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GenericExportModal;
