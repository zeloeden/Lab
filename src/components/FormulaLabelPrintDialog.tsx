import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Formula } from '@/lib/formula-types';
import { Printer, Download, Eye, QrCode, Barcode as BarcodeIcon } from 'lucide-react';
import { toast } from 'sonner';

interface FormulaLabelPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formula: Formula;
}

interface LabelField {
  id: string;
  label: string;
  value: string | undefined;
  category: 'basic' | 'codes' | 'technical' | 'pricing';
}

export const FormulaLabelPrintDialog: React.FC<FormulaLabelPrintDialogProps> = ({
  open,
  onOpenChange,
  formula,
}) => {
  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    new Set(['name', 'internalCode', 'qrCode', 'barcode', 'batchSize'])
  );

  // Define all available fields
  const availableFields: LabelField[] = [
    // Basic Info
    { id: 'name', label: 'Formula Name', value: formula.name, category: 'basic' },
    { id: 'internalCode', label: 'Internal Code', value: formula.internalCode, category: 'basic' },
    { id: 'externalCode', label: 'External Code', value: formula.externalCode, category: 'basic' },
    { id: 'purpose', label: 'Purpose', value: formula.purpose, category: 'basic' },
    { id: 'status', label: 'Status', value: formula.status, category: 'basic' },
    
    // Codes
    { id: 'qrCode', label: 'QR Code', value: formula.qrCode ? 'Available' : undefined, category: 'codes' },
    { id: 'barcode', label: 'Barcode', value: formula.barcode, category: 'codes' },
    
    // Technical
    { id: 'batchSize', label: 'Batch Size', value: `${formula.batchSize} ${formula.batchUnit}`, category: 'technical' },
    { id: 'totalPercentage', label: 'Total %', value: `${formula.totalPercentage}%`, category: 'technical' },
    { id: 'temperature', label: 'Temperature', value: formula.temperatureC ? `${formula.temperatureC}°C` : undefined, category: 'technical' },
    { id: 'mixtureSpeed', label: 'Mixture Speed', value: formula.mixtureSpeedRpm ? `${formula.mixtureSpeedRpm} RPM` : undefined, category: 'technical' },
    { id: 'colorCode', label: 'Color Code', value: formula.colorCode, category: 'technical' },
    
    // Pricing
    { id: 'totalCost', label: 'Total Cost', value: `$${formula.totalCost.toFixed(2)}`, category: 'pricing' },
    { id: 'costPerUnit', label: 'Cost per Unit', value: `$${formula.costPerUnit.toFixed(4)}/${formula.batchUnit}`, category: 'pricing' },
    { id: 'sellingPrice', label: 'Selling Price', value: formula.sellingPrice ? `$${formula.sellingPrice.toFixed(2)}` : undefined, category: 'pricing' },
    { id: 'profitMargin', label: 'Profit Margin', value: formula.profitMargin ? `${formula.profitMargin.toFixed(1)}%` : undefined, category: 'pricing' },
  ];

  // Filter out fields with no value
  const validFields = availableFields.filter(field => field.value !== undefined && field.value !== '');

  const groupedFields = {
    basic: validFields.filter(f => f.category === 'basic'),
    codes: validFields.filter(f => f.category === 'codes'),
    technical: validFields.filter(f => f.category === 'technical'),
    pricing: validFields.filter(f => f.category === 'pricing'),
  };

  const toggleField = (fieldId: string) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(fieldId)) {
      newSelected.delete(fieldId);
    } else {
      newSelected.add(fieldId);
    }
    setSelectedFields(newSelected);
  };

  const toggleCategory = (category: keyof typeof groupedFields) => {
    const categoryFields = groupedFields[category].map(f => f.id);
    const allSelected = categoryFields.every(id => selectedFields.has(id));
    
    const newSelected = new Set(selectedFields);
    if (allSelected) {
      categoryFields.forEach(id => newSelected.delete(id));
    } else {
      categoryFields.forEach(id => newSelected.add(id));
    }
    setSelectedFields(newSelected);
  };

  const handlePrint = () => {
    const selectedData = validFields
      .filter(f => selectedFields.has(f.id))
      .map(f => ({ label: f.label, value: f.value }));

    if (selectedData.length === 0) {
      toast.error('Please select at least one field to print');
      return;
    }

    // TODO: Integrate with label printing system
    console.log('Printing label with fields:', selectedData);
    toast.success(`Preparing label with ${selectedData.length} fields...`);
    
    // Close dialog
    onOpenChange(false);
  };

  const handlePreview = () => {
    toast.info('Label preview feature coming soon');
  };

  const handleDownload = () => {
    toast.info('Label download feature coming soon');
  };

  const categoryLabels = {
    basic: 'Basic Information',
    codes: 'QR & Barcode',
    technical: 'Technical Details',
    pricing: 'Pricing Information',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Print Formula Label
          </DialogTitle>
          <DialogDescription>
            Select the fields you want to include on the label for <strong>{formula.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* QR and Barcode Preview */}
          {(formula.qrCode || formula.barcodeImage) && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <h4 className="text-sm font-medium mb-3">Available Codes</h4>
              <div className="flex items-center justify-around gap-4">
                {formula.qrCode && (
                  <div className="text-center">
                    <img 
                      src={formula.qrCode} 
                      alt="QR Code" 
                      className="w-24 h-24 mx-auto border rounded"
                    />
                    <p className="text-xs text-gray-500 mt-1">QR Code</p>
                  </div>
                )}
                {formula.barcodeImage && (
                  <div className="text-center">
                    <img 
                      src={formula.barcodeImage} 
                      alt="Barcode" 
                      className="h-16 mx-auto border rounded px-2 bg-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">Barcode</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Field Selection by Category */}
          {Object.entries(groupedFields).map(([category, fields]) => {
            if (fields.length === 0) return null;
            
            const categoryKey = category as keyof typeof groupedFields;
            const allSelected = fields.every(f => selectedFields.has(f.id));
            const someSelected = fields.some(f => selectedFields.has(f.id));

            return (
              <div key={category} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">{categoryLabels[categoryKey]}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCategory(categoryKey)}
                    className="text-xs"
                  >
                    {allSelected ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {fields.map(field => (
                    <div key={field.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={field.id}
                        checked={selectedFields.has(field.id)}
                        onCheckedChange={() => toggleField(field.id)}
                      />
                      <div className="grid gap-1 leading-none">
                        <Label
                          htmlFor={field.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {field.label}
                        </Label>
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">
                          {field.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Separator />
              </div>
            );
          })}

          {/* Selected Count */}
          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 text-center">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>{selectedFields.size}</strong> field{selectedFields.size !== 1 ? 's' : ''} selected
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Label
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

