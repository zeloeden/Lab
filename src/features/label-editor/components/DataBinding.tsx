/**
 * Data Binding component for the Label Editor
 * Manages sample data binding and variable replacement
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Database, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Download, 
  Upload,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { SampleData, LabelElement } from '../types';
import { VariablesPicker } from './VariablesPicker';

interface DataBindingProps {
  elements: LabelElement[];
  sampleData: SampleData | null;
  availableSamples: SampleData[];
  onSampleDataChange: (data: SampleData | null) => void;
  onElementsUpdate: (elements: LabelElement[]) => void;
  className?: string;
}

export const DataBinding: React.FC<DataBindingProps> = ({
  elements,
  sampleData,
  availableSamples,
  onSampleDataChange,
  onElementsUpdate,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSampleId, setSelectedSampleId] = useState<string>('');
  const [previewMode, setPreviewMode] = useState(false);
  const [showVariables, setShowVariables] = useState(false);

  // Filter samples based on search term
  const filteredSamples = availableSamples.filter(sample =>
    sample.EnglishName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sample.ArabicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sample.SupplierCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle sample selection
  const handleSampleSelect = (sampleId: string) => {
    const sample = availableSamples.find(s => s.id === sampleId);
    setSelectedSampleId(sampleId);
    onSampleDataChange(sample || null);
  };

  // Handle variable selection from VariablesPicker
  const handleVariableSelect = (variable: string) => {
    // This would typically be handled by the parent component
    // to insert the variable into the currently selected element
    console.log('Variable selected:', variable);
  };

  // Replace variables in element content with actual data
  const replaceVariables = (content: string, data: SampleData | null): string => {
    if (!data) return content;

    return content
      .replace(/\{\{ArabicName\}\}/g, data.ArabicName || '')
      .replace(/\{\{EnglishName\}\}/g, data.EnglishName || '')
      .replace(/\{\{SupplierCode\}\}/g, data.SupplierCode || '')
      .replace(/\{\{Price25\}\}/g, `$${data.Price25 || '0.00'}`)
      .replace(/\{\{Price50\}\}/g, `$${data.Price50 || '0.00'}`)
      .replace(/\{\{Price100\}\}/g, `$${data.Price100 || '0.00'}`)
      .replace(/\{\{QRValue\}\}/g, data.QRValue || '')
      .replace(/\{\{BarcodeValue\}\}/g, data.BarcodeValue || '')
      .replace(/\{\{CurrentDate\}\}/g, new Date().toLocaleDateString())
      .replace(/\{\{CurrentTime\}\}/g, new Date().toLocaleTimeString())
      .replace(/\{\{CreatedDate\}\}/g, data.CreatedDate || new Date().toLocaleDateString())
      .replace(/\{\{ExpiryDate\}\}/g, data.ExpiryDate || '')
      .replace(/\{\{SampleId\}\}/g, data.id || '')
      .replace(/\{\{BatchNumber\}\}/g, data.BatchNumber || '');
  };

  // Get elements with variables
  const elementsWithVariables = elements.filter(element => 
    element.content.includes('{{') && element.content.includes('}}')
  );

  // Preview elements with data binding
  const previewElements = previewMode && sampleData 
    ? elements.map(element => ({
        ...element,
        content: replaceVariables(element.content, sampleData)
      }))
    : elements;

  // Handle preview toggle
  const togglePreview = () => {
    setPreviewMode(!previewMode);
  };

  // Handle refresh data
  const handleRefreshData = () => {
    // This would typically refresh the available samples from the server
    console.log('Refreshing sample data...');
  };

  // Handle export data
  const handleExportData = () => {
    const dataToExport = {
      sampleData,
      elements: previewElements,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `label-data-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle import data
  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.sampleData) {
          onSampleDataChange(data.sampleData);
        }
        if (data.elements) {
          onElementsUpdate(data.elements);
        }
      } catch (error) {
        console.error('Error importing data:', error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Sample Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            Sample Data
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshData}
                className="h-6 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
                className="h-6 text-xs"
              >
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('import-data')?.click()}
                className="h-6 text-xs"
              >
                <Upload className="h-3 w-3 mr-1" />
                Import
              </Button>
              <input
                id="import-data"
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Search */}
          <div className="space-y-2">
            <div className="relative">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search samples..."
                className="h-8 text-xs pr-8"
              />
              <Search className="absolute right-2 top-2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Sample Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Select Sample</Label>
            <Select value={selectedSampleId} onValueChange={handleSampleSelect}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Choose a sample..." />
              </SelectTrigger>
              <SelectContent>
                {filteredSamples.map(sample => (
                  <SelectItem key={sample.id} value={sample.id}>
                    <div className="flex items-center gap-2">
                      <span>{sample.EnglishName}</span>
                      <Badge variant="outline" className="text-xs">
                        {sample.SupplierCode}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Current Sample Info */}
          {sampleData && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Selected Sample</span>
              </div>
              <div className="text-xs text-blue-700 space-y-1">
                <div><strong>English:</strong> {sampleData.EnglishName}</div>
                <div><strong>Arabic:</strong> {sampleData.ArabicName}</div>
                <div><strong>Supplier Code:</strong> {sampleData.SupplierCode}</div>
                <div><strong>ID:</strong> {sampleData.id}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Variables */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            Variables
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVariables(!showVariables)}
              className="h-6 text-xs"
            >
              {showVariables ? 'Hide' : 'Show'} Variables
            </Button>
          </CardTitle>
        </CardHeader>
        {showVariables && (
          <CardContent>
            <VariablesPicker
              sampleData={sampleData}
              onVariableSelect={handleVariableSelect}
              onPreviewData={onSampleDataChange}
            />
          </CardContent>
        )}
      </Card>

      {/* Data Binding Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            Binding Status
            <Button
              variant={previewMode ? "default" : "outline"}
              size="sm"
              onClick={togglePreview}
              className="h-6 text-xs"
            >
              {previewMode ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
              {previewMode ? 'Hide' : 'Show'} Preview
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Elements with Variables */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Elements with Variables</span>
              <Badge variant="secondary" className="text-xs">
                {elementsWithVariables.length}
              </Badge>
            </div>
            
            {elementsWithVariables.length === 0 ? (
              <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
                No elements contain variables. Add variables using the Variables panel.
              </div>
            ) : (
              <div className="space-y-1">
                {elementsWithVariables.map(element => (
                  <div key={element.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
                    <Badge variant="outline">{element.type}</Badge>
                    <span className="flex-1 truncate">{element.content}</span>
                    <Badge variant="secondary">
                      {element.content.match(/\{\{[^}]+\}\}/g)?.length || 0} vars
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview Status */}
          {previewMode && sampleData && (
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Preview Mode Active</span>
              </div>
              <div className="text-xs text-green-700">
                Variables are being replaced with actual sample data. 
                This is how your label will look when printed.
              </div>
            </div>
          )}

          {previewMode && !sampleData && (
            <div className="p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">No Sample Selected</span>
              </div>
              <div className="text-xs text-yellow-700">
                Select a sample to see how variables will be replaced with actual data.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Binding Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Apply data binding to all elements
                const updatedElements = elements.map(element => ({
                  ...element,
                  content: replaceVariables(element.content, sampleData)
                }));
                onElementsUpdate(updatedElements);
              }}
              disabled={!sampleData}
              className="justify-start"
            >
              <CheckCircle className="h-3 w-3 mr-2" />
              Apply Binding
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Clear all data binding
                const clearedElements = elements.map(element => ({
                  ...element,
                  content: element.content.replace(/\$\{[^}]+\}/g, '{{Variable}}')
                }));
                onElementsUpdate(clearedElements);
              }}
              className="justify-start"
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              Clear Binding
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
