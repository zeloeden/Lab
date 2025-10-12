/**
 * Print dialog for batch printing with dataset picker and field mapping
 */

import React, { useState, useEffect } from 'react';
import { EnhancedLabelTemplate, PrintJob, PrintSettings } from '@/lib/label-model';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Printer, 
  Download, 
  Upload, 
  Settings, 
  Play,
  Pause,
  Square,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Database,
  MapPin,
  Filter,
  Search
} from 'lucide-react';

interface PrintDialogProps {
  template: EnhancedLabelTemplate;
  isOpen: boolean;
  onClose: () => void;
  onPrint: (printJob: PrintJob) => void;
}

export const PrintDialog: React.FC<PrintDialogProps> = ({
  template,
  isOpen,
  onClose,
  onPrint
}) => {
  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    dpi: 300,
    colorMode: 'color',
    paperSize: 'A4',
    orientation: 'portrait',
    margins: { top: 10, right: 10, bottom: 10, left: 10 },
    scaling: 1,
    quality: 'normal'
  });

  const [copies, setCopies] = useState(1);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  const [previewData, setPreviewData] = useState<Record<string, any>[]>([]);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);

  // Load available datasets
  useEffect(() => {
    loadDatasets();
  }, []);

  // Load field mappings when dataset changes
  useEffect(() => {
    if (selectedDataset) {
      loadFieldMappings(selectedDataset);
    }
  }, [selectedDataset]);

  const loadDatasets = async () => {
    // This would load available datasets from your data source
    // For now, we'll use mock data
    const mockDatasets = [
      { id: 'products', name: 'Products', count: 150 },
      { id: 'customers', name: 'Customers', count: 75 },
      { id: 'inventory', name: 'Inventory', count: 200 }
    ];
    // Set first dataset as default
    if (mockDatasets.length > 0) {
      setSelectedDataset(mockDatasets[0].id);
    }
  };

  const loadFieldMappings = async (datasetId: string) => {
    // This would load field mappings for the selected dataset
    // For now, we'll use mock data
    const mockMappings = {
      products: {
        'productName': 'name',
        'productCode': 'sku',
        'price': 'price',
        'barcode': 'barcode'
      },
      customers: {
        'customerName': 'name',
        'address': 'address',
        'phone': 'phone'
      },
      inventory: {
        'itemName': 'name',
        'quantity': 'qty',
        'location': 'location'
      }
    };

    setFieldMappings(mockMappings[datasetId] || {});
  };

  const generatePreview = async () => {
    if (!selectedDataset) return;

    setIsGeneratingPreview(true);
    
    try {
      // This would generate preview data based on the selected dataset and field mappings
      // For now, we'll use mock data
      const mockPreviewData = [
        { name: 'Product 1', sku: 'SKU001', price: '$19.99', barcode: '123456789012' },
        { name: 'Product 2', sku: 'SKU002', price: '$29.99', barcode: '123456789013' },
        { name: 'Product 3', sku: 'SKU003', price: '$39.99', barcode: '123456789014' }
      ];

      setPreviewData(mockPreviewData);
    } catch (error) {
      console.error('Failed to generate preview:', error);
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handlePrint = () => {
    if (!selectedDataset || previewData.length === 0) return;

    const printJob: PrintJob = {
      id: `job_${Date.now()}`,
      templateId: template.id,
      data: previewData,
      copies,
      settings: printSettings,
      status: 'pending',
      createdAt: new Date()
    };

    setPrintJobs(prev => [...prev, printJob]);
    onPrint(printJob);
  };

  const updatePrintSettings = (updates: Partial<PrintSettings>) => {
    setPrintSettings(prev => ({ ...prev, ...updates }));
  };

  const updateFieldMapping = (templateField: string, dataField: string) => {
    setFieldMappings(prev => ({ ...prev, [templateField]: dataField }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Print Labels</h2>
              <p className="text-sm text-gray-600">{template.name}</p>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <XCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Settings */}
          <div className="w-80 border-r border-gray-200 flex flex-col">
            <Tabs defaultValue="data" className="flex-1">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="data">Data</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="data" className="p-4 space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Data Source</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label htmlFor="dataset" className="text-xs">Dataset</Label>
                      <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Select dataset" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="products">Products (150 items)</SelectItem>
                          <SelectItem value="customers">Customers (75 items)</SelectItem>
                          <SelectItem value="inventory">Inventory (200 items)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="copies" className="text-xs">Copies per Item</Label>
                      <Input
                        id="copies"
                        type="number"
                        min="1"
                        value={copies}
                        onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
                        className="text-xs"
                      />
                    </div>
                    <Button
                      onClick={generatePreview}
                      disabled={!selectedDataset || isGeneratingPreview}
                      className="w-full"
                      size="sm"
                    >
                      {isGeneratingPreview ? (
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4 mr-2" />
                      )}
                      Generate Preview
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Field Mapping</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {template.variables?.map((variable) => (
                      <div key={variable}>
                        <Label htmlFor={variable} className="text-xs">{variable}</Label>
                        <Select
                          value={fieldMappings[variable] || ''}
                          onValueChange={(value) => updateFieldMapping(variable, value)}
                        >
                          <SelectTrigger className="text-xs">
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="name">Name</SelectItem>
                            <SelectItem value="sku">SKU</SelectItem>
                            <SelectItem value="price">Price</SelectItem>
                            <SelectItem value="barcode">Barcode</SelectItem>
                            <SelectItem value="address">Address</SelectItem>
                            <SelectItem value="phone">Phone</SelectItem>
                            <SelectItem value="qty">Quantity</SelectItem>
                            <SelectItem value="location">Location</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="p-4 space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Print Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label htmlFor="dpi" className="text-xs">DPI</Label>
                      <Select
                        value={printSettings.dpi.toString()}
                        onValueChange={(value) => updatePrintSettings({ dpi: parseInt(value) as any })}
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="203">203 DPI</SelectItem>
                          <SelectItem value="300">300 DPI</SelectItem>
                          <SelectItem value="600">600 DPI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="colorMode" className="text-xs">Color Mode</Label>
                      <Select
                        value={printSettings.colorMode}
                        onValueChange={(value) => updatePrintSettings({ colorMode: value as any })}
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monochrome">Monochrome</SelectItem>
                          <SelectItem value="color">Color</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="quality" className="text-xs">Quality</Label>
                      <Select
                        value={printSettings.quality}
                        onValueChange={(value) => updatePrintSettings({ quality: value as any })}
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="scaling" className="text-xs">Scaling</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[printSettings.scaling]}
                          onValueChange={([value]) => updatePrintSettings({ scaling: value })}
                          min={0.5}
                          max={2}
                          step={0.1}
                          className="flex-1"
                        />
                        <span className="text-xs w-12">{Math.round(printSettings.scaling * 100)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Main Content - Preview */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Preview</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {previewData.length} items
                  </Badge>
                  <Badge variant="outline">
                    {copies} copies each
                  </Badge>
                  <Badge variant="outline">
                    {previewData.length * copies} total labels
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              {previewData.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No preview data available</p>
                  <p className="text-sm text-gray-500">Select a dataset and generate preview</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {previewData.map((item, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-2">
                        <div className="text-sm font-medium">{item.name || 'Sample Item'}</div>
                        <div className="text-xs text-gray-500 space-y-1">
                          {Object.entries(item).map(([key, value]) => (
                            <div key={key}>
                              <span className="font-medium">{key}:</span> {String(value)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Total: {previewData.length * copies} labels
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePrint}
                    disabled={previewData.length === 0}
                    className="flex items-center gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Print Labels
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
