import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Download, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { inventoryApi } from '@/services/api';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ExportOptions {
  format: 'pdf' | 'csv' | 'excel';
  includeImages: boolean;
  includeCharts: boolean;
  dateRange: 'all' | 'last30' | 'last90' | 'custom';
  customStartDate?: string;
  customEndDate?: string;
  filters: {
    location?: string;
    category?: string;
    status?: string;
  };
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeImages: true,
    includeCharts: true,
    dateRange: 'all',
    filters: {}
  });

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
      
      if (exportOptions.filters.location) {
        params.append('location_id', exportOptions.filters.location);
      }
      if (exportOptions.filters.category) {
        params.append('category', exportOptions.filters.category);
      }
      if (exportOptions.filters.status) {
        params.append('status', exportOptions.filters.status);
      }

      // Handle date range
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

      const response = await inventoryApi.exportInventory(params.toString());
      
      clearInterval(progressInterval);
      setExportProgress(100);

      // Handle different response types
      if (exportOptions.format === 'pdf') {
        // Create blob from PDF response
        const blob = new Blob([response], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory-report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        // Handle CSV/Excel response
        const blob = new Blob([response], { 
          type: exportOptions.format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory-export-${new Date().toISOString().split('T')[0]}.${exportOptions.format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }

      toast({
        title: "Export Successful",
        description: `Inventory data exported successfully as ${exportOptions.format.toUpperCase()}`,
      });

      onSuccess();
    } catch (error: any) {
      console.error('Export error:', error);
      
      toast({
        title: "Export Failed",
        description: error.message || 'Failed to export inventory data',
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Inventory Data
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label htmlFor="format">Export Format</Label>
            <Select
              value={exportOptions.format}
              onValueChange={(value: 'pdf' | 'csv' | 'excel') =>
                setExportOptions(prev => ({ ...prev, format: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    PDF Report
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    CSV File
                  </div>
                </SelectItem>
                <SelectItem value="excel">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Excel File
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label htmlFor="dateRange">Date Range</Label>
            <Select
              value={exportOptions.dateRange}
              onValueChange={(value: 'all' | 'last30' | 'last90' | 'custom') =>
                setExportOptions(prev => ({ ...prev, dateRange: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Data</SelectItem>
                <SelectItem value="last30">Last 30 Days</SelectItem>
                <SelectItem value="last90">Last 90 Days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
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

          {/* PDF Options */}
          {exportOptions.format === 'pdf' && (
            <div className="space-y-3">
              <Label>PDF Options</Label>
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
                    Include product images
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
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {exportOptions.format === 'pdf' 
                ? 'PDF export includes formatted tables, charts, and summary statistics.'
                : `${exportOptions.format.toUpperCase()} export includes raw data in tabular format.`
              }
            </AlertDescription>
          </Alert>

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

export default ExportModal;

