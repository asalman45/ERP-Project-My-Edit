import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle, AlertCircle, Download, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { inventoryApi } from '@/services/api';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportResult {
  imported: number;
  total: number;
  errors: number;
  errorDetails: string[];
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (file: File) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please select a CSV or Excel file (.csv, .xls, .xlsx)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File Too Large",
        description: "File size must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setImportResult(null);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await inventoryApi.importInventory(formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      setImportResult({
        imported: response.data.imported,
        total: response.data.total,
        errors: response.data.errors,
        errorDetails: response.data.errorDetails || []
      });

      toast({
        title: "Import Successful",
        description: `Successfully imported ${response.data.imported} out of ${response.data.total} items`,
      });

      onSuccess();
    } catch (error: any) {
      console.error('Import error:', error);
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to import inventory data';
      const errorDetails = error.response?.data?.details || [];
      
      setImportResult({
        imported: 0,
        total: 0,
        errors: errorDetails.length,
        errorDetails: errorDetails
      });

      toast({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setImportResult(null);
    setUploadProgress(0);
    onClose();
  };

  const downloadTemplate = () => {
    const csvContent = `product_id,material_id,location_id,quantity,min_stock_level,max_stock_level,unit_cost,notes
PROD001,,LOC001,100,10,200,25.50,Initial stock
,MAT001,LOC002,50,5,100,15.75,Raw material stock
PROD002,,LOC001,75,15,150,45.00,Finished goods`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory-import-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Inventory Data
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-900">Need a template?</h4>
                <p className="text-sm text-blue-700">Download our CSV template to get started</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="border-blue-200 text-blue-700 hover:bg-blue-100"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>
          </div>

          {/* File Upload Area */}
          {!selectedFile && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Upload your inventory file</h3>
              <p className="text-gray-500 mb-4">
                Drag and drop your CSV or Excel file here, or click to browse
              </p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="mb-2"
              >
                Choose File
              </Button>
              <p className="text-xs text-gray-400">
                Supported formats: CSV, XLS, XLSX (Max 10MB)
              </p>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          )}

          {/* Selected File */}
          {selectedFile && !importResult && (
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Uploading and processing...</span>
                <span className="text-sm text-gray-500">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Import Results */}
          {importResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {importResult.errors === 0 ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                <h4 className="font-medium">
                  Import {importResult.errors === 0 ? 'Completed Successfully' : 'Completed with Issues'}
                </h4>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{importResult.imported}</p>
                  <p className="text-sm text-green-700">Imported</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{importResult.total}</p>
                  <p className="text-sm text-blue-700">Total</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{importResult.errors}</p>
                  <p className="text-sm text-red-700">Errors</p>
                </div>
              </div>

              {importResult.errorDetails.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Error Details:</p>
                      <ul className="text-sm space-y-1 max-h-32 overflow-y-auto">
                        {importResult.errorDetails.map((error, index) => (
                          <li key={index} className="text-red-600">• {error}</li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose}>
              {importResult ? 'Close' : 'Cancel'}
            </Button>
            {selectedFile && !importResult && !isUploading && (
              <Button onClick={handleImport} className="bg-blue-600 hover:bg-blue-700">
                <Upload className="h-4 w-4 mr-2" />
                Import Data
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportModal;

