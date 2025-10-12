/**
 * Variables Picker component for the Label Editor
 * Provides a list of available data variables for binding
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Copy, 
  Eye, 
  EyeOff, 
  Filter,
  Variable,
  Type,
  Hash,
  DollarSign,
  QrCode,
  BarChart3,
  Table,
  User,
  Building,
  Calendar,
  Tag
} from 'lucide-react';
import { SampleData } from '../types';

interface VariablesPickerProps {
  sampleData: SampleData | null;
  onVariableSelect: (variable: string) => void;
  onPreviewData: (data: SampleData) => void;
  className?: string;
}

interface VariableDefinition {
  key: string;
  label: string;
  description: string;
  category: 'text' | 'number' | 'currency' | 'code' | 'date' | 'system';
  icon: React.ReactNode;
  example: string;
}

export const VariablesPicker: React.FC<VariablesPickerProps> = ({
  sampleData,
  onVariableSelect,
  onPreviewData,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showPreview, setShowPreview] = useState(false);

  // Define available variables
  const variables: VariableDefinition[] = [
    // Text variables
    {
      key: '{{ArabicName}}',
      label: 'Arabic Name',
      description: 'Sample name in Arabic',
      category: 'text',
      icon: <Type className="h-4 w-4" />,
      example: 'اسم العينة'
    },
    {
      key: '{{EnglishName}}',
      label: 'English Name',
      description: 'Sample name in English',
      category: 'text',
      icon: <Type className="h-4 w-4" />,
      example: 'Sample Name'
    },
    {
      key: '{{SupplierCode}}',
      label: 'Supplier Code',
      description: 'Code provided by supplier',
      category: 'text',
      icon: <Tag className="h-4 w-4" />,
      example: 'SUP-001'
    },
    {
      key: '{{SupplierName}}',
      label: 'Supplier Name',
      description: 'Name of the supplier',
      category: 'text',
      icon: <Building className="h-4 w-4" />,
      example: 'ABC Company'
    },

    // Number variables
    {
      key: '{{SampleId}}',
      label: 'Sample ID',
      description: 'Unique sample identifier',
      category: 'number',
      icon: <Hash className="h-4 w-4" />,
      example: '12345'
    },
    {
      key: '{{BatchNumber}}',
      label: 'Batch Number',
      description: 'Production batch number',
      category: 'number',
      icon: <Hash className="h-4 w-4" />,
      example: 'B2024001'
    },

    // Currency variables
    {
      key: '{{Price25}}',
      label: 'Price (25g)',
      description: 'Price for 25g quantity',
      category: 'currency',
      icon: <DollarSign className="h-4 w-4" />,
      example: '$15.50'
    },
    {
      key: '{{Price50}}',
      label: 'Price (50g)',
      description: 'Price for 50g quantity',
      category: 'currency',
      icon: <DollarSign className="h-4 w-4" />,
      example: '$28.00'
    },
    {
      key: '{{Price100}}',
      label: 'Price (100g)',
      description: 'Price for 100g quantity',
      category: 'currency',
      icon: <DollarSign className="h-4 w-4" />,
      example: '$52.00'
    },

    // Code variables
    {
      key: '{{QRValue}}',
      label: 'QR Code Value',
      description: 'Value for QR code generation',
      category: 'code',
      icon: <QrCode className="h-4 w-4" />,
      example: 'QR123456'
    },
    {
      key: '{{BarcodeValue}}',
      label: 'Barcode Value',
      description: 'Value for barcode generation',
      category: 'code',
      icon: <BarChart3 className="h-4 w-4" />,
      example: '123456789012'
    },

    // Date variables
    {
      key: '{{CreatedDate}}',
      label: 'Created Date',
      description: 'Date when sample was created',
      category: 'date',
      icon: <Calendar className="h-4 w-4" />,
      example: '2024-01-15'
    },
    {
      key: '{{ExpiryDate}}',
      label: 'Expiry Date',
      description: 'Sample expiry date',
      category: 'date',
      icon: <Calendar className="h-4 w-4" />,
      example: '2025-01-15'
    },

    // System variables
    {
      key: '{{CurrentDate}}',
      label: 'Current Date',
      description: 'Current system date',
      category: 'system',
      icon: <Calendar className="h-4 w-4" />,
      example: new Date().toLocaleDateString()
    },
    {
      key: '{{CurrentTime}}',
      label: 'Current Time',
      description: 'Current system time',
      category: 'system',
      icon: <Calendar className="h-4 w-4" />,
      example: new Date().toLocaleTimeString()
    }
  ];

  const categories = [
    { key: 'all', label: 'All Variables', icon: <Variable className="h-4 w-4" /> },
    { key: 'text', label: 'Text', icon: <Type className="h-4 w-4" /> },
    { key: 'number', label: 'Numbers', icon: <Hash className="h-4 w-4" /> },
    { key: 'currency', label: 'Prices', icon: <DollarSign className="h-4 w-4" /> },
    { key: 'code', label: 'Codes', icon: <QrCode className="h-4 w-4" /> },
    { key: 'date', label: 'Dates', icon: <Calendar className="h-4 w-4" /> },
    { key: 'system', label: 'System', icon: <Tag className="h-4 w-4" /> }
  ];

  // Filter variables based on search and category
  const filteredVariables = variables.filter(variable => {
    const matchesSearch = variable.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         variable.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         variable.key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || variable.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleVariableClick = (variable: VariableDefinition) => {
    onVariableSelect(variable.key);
  };

  const handleCopyVariable = (variable: string) => {
    navigator.clipboard.writeText(variable);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'text':
        return 'bg-blue-100 text-blue-800';
      case 'number':
        return 'bg-green-100 text-green-800';
      case 'currency':
        return 'bg-yellow-100 text-yellow-800';
      case 'code':
        return 'bg-purple-100 text-purple-800';
      case 'date':
        return 'bg-orange-100 text-orange-800';
      case 'system':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderPreviewValue = (variable: VariableDefinition) => {
    if (!sampleData) return variable.example;

    switch (variable.key) {
      case '{{ArabicName}}':
        return sampleData.ArabicName || variable.example;
      case '{{EnglishName}}':
        return sampleData.EnglishName || variable.example;
      case '{{SupplierCode}}':
        return sampleData.SupplierCode || variable.example;
      case '{{Price25}}':
        return `$${sampleData.Price25 || '0.00'}`;
      case '{{Price50}}':
        return `$${sampleData.Price50 || '0.00'}`;
      case '{{Price100}}':
        return `$${sampleData.Price100 || '0.00'}`;
      case '{{QRValue}}':
        return sampleData.QRValue || variable.example;
      case '{{BarcodeValue}}':
        return sampleData.BarcodeValue || variable.example;
      case '{{CurrentDate}}':
        return new Date().toLocaleDateString();
      case '{{CurrentTime}}':
        return new Date().toLocaleTimeString();
      default:
        return variable.example;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            Data Variables
            <div className="flex gap-2">
              <Button
                variant={showPreview ? "default" : "outline"}
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="h-6 text-xs"
              >
                {showPreview ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                Preview
              </Button>
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
                placeholder="Search variables..."
                className="h-8 text-xs pr-8"
              />
              <Search className="absolute right-2 top-2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Categories</Label>
            <div className="flex flex-wrap gap-1">
              {categories.map(category => (
                <Button
                  key={category.key}
                  variant={selectedCategory === category.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.key)}
                  className="h-6 text-xs"
                >
                  {category.icon}
                  <span className="ml-1">{category.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Variables List */}
      <Card>
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            {filteredVariables.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No variables found
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredVariables.map((variable) => (
                  <div
                    key={variable.key}
                    className="group p-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleVariableClick(variable)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded flex items-center justify-center ${getCategoryColor(variable.category)}`}>
                        {variable.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{variable.label}</span>
                          <Badge variant="outline" className="text-xs">
                            {variable.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{variable.description}</p>
                        
                        {/* Variable Key */}
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                            {variable.key}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyVariable(variable.key);
                            }}
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Preview Value */}
                        {showPreview && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                            <div className="flex items-center gap-1 mb-1">
                              <Eye className="h-3 w-3 text-blue-600" />
                              <span className="text-blue-600 font-medium">Preview:</span>
                            </div>
                            <div className="text-blue-800 font-mono">
                              {renderPreviewValue(variable)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sample Data Preview */}
      {sampleData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Current Sample Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-medium">Arabic Name:</span>
                  <div className="text-gray-600">{sampleData.ArabicName}</div>
                </div>
                <div>
                  <span className="font-medium">English Name:</span>
                  <div className="text-gray-600">{sampleData.EnglishName}</div>
                </div>
                <div>
                  <span className="font-medium">Supplier Code:</span>
                  <div className="text-gray-600">{sampleData.SupplierCode}</div>
                </div>
                <div>
                  <span className="font-medium">Sample ID:</span>
                  <div className="text-gray-600">{sampleData.id}</div>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="font-medium">Price 25g:</span>
                  <div className="text-gray-600">${sampleData.Price25}</div>
                </div>
                <div>
                  <span className="font-medium">Price 50g:</span>
                  <div className="text-gray-600">${sampleData.Price50}</div>
                </div>
                <div>
                  <span className="font-medium">Price 100g:</span>
                  <div className="text-gray-600">${sampleData.Price100}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
