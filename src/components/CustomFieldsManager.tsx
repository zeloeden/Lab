import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Settings, ChevronRight, ChevronDown, Package, TestTube, Tag, FileText, Building2, CheckSquare } from 'lucide-react';

interface CustomField {
  id: string;
  name: string;
  section: string; // New field for section (Samples, Tests, etc.)
  fieldType: string; // The actual field name within the section
  value: string;
  order: number;
  active: boolean;
}

interface FieldDefinition {
  name: string;
  label: string;
  description?: string;
}

interface SectionDefinition {
  name: string;
  label: string;
  icon?: string;
  fields: FieldDefinition[];
}

// Define the hierarchical structure of sections and their fields
const FIELD_STRUCTURE: SectionDefinition[] = [
  {
    name: 'samples',
    label: 'Samples',
    icon: 'Package',
    fields: [
      { name: 'item-group', label: 'Item Group', description: 'Product categories and types' },
      { name: 'status', label: 'Sample Status', description: 'Current state of the sample' },
      { name: 'category', label: 'Category', description: 'Sample classification' },
      { name: 'priority-shipping', label: 'Shipping Priority', description: 'Urgency of shipment' },
      { name: 'carrier', label: 'Shipping Carrier', description: 'Delivery service provider' },
      { name: 'unit-measure', label: 'Unit of Measure', description: 'Measurement units' },
      { name: 'currency', label: 'Currency', description: 'Pricing currency' },
      { name: 'purpose-tag', label: 'Purpose Tag', description: 'Sample purpose' },
      { name: 'request-status', label: 'Request Status', description: 'Status of sample request' },
      { name: 'brand', label: 'Brand', description: 'Sample brand name' },
    ]
  },
  {
    name: 'tests',
    label: 'Tests',
    icon: 'TestTube',
    fields: [
      { name: 'test-type', label: 'Test Type', description: 'Personal Use or Industrial' },
      { name: 'test-result', label: 'Test Result', description: 'Test outcome status' },
      { name: 'test-priority', label: 'Test Priority', description: 'Urgency level of test' },
      { name: 'test-status', label: 'Test Status', description: 'Current state of test' },
      { name: 'formula-status', label: 'Formula Status', description: 'Formula approval status' },
    ]
  },
  {
    name: 'ledger',
    label: 'Sample Ledger',
    icon: 'FileText',
    fields: [
      { name: 'ledger-priority', label: 'Priority', description: 'Importance level' },
      { name: 'ledger-concept', label: 'Concept', description: 'Product concept type' },
      { name: 'ledger-season', label: 'Season', description: 'Seasonal classification' },
      { name: 'main-brand', label: 'Main Brand', description: 'Primary brand name' },
      { name: 'branded-as', label: 'Branded As', description: 'Secondary branding' },
    ]
  },
  {
    name: 'suppliers',
    label: 'Suppliers',
    icon: 'Building2',
    fields: [
      { name: 'supplier-status', label: 'Supplier Status', description: 'Active/Inactive status' },
    ]
  },
  {
    name: 'tasks',
    label: 'Tasks',
    icon: 'CheckSquare',
    fields: [
      { name: 'task-priority', label: 'Task Priority', description: 'Task urgency level' },
      { name: 'task-status', label: 'Task Status', description: 'Current task state' },
    ]
  }
];

interface CustomFieldsManagerProps {
  onFieldsChange?: (fields: CustomField[]) => void;
}

export const CustomFieldsManager: React.FC<CustomFieldsManagerProps> = ({ onFieldsChange }) => {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<CustomField | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    section: 'samples',
    fieldType: '',
    value: ''
  });

  // Load custom fields from localStorage
  useEffect(() => {
    const storedFields = localStorage.getItem('nbslims_custom_fields');
    if (storedFields) {
      const parsedFields = JSON.parse(storedFields);
      // Migrate old data if necessary
      const migratedFields = parsedFields.map((field: any) => ({
        ...field,
        section: field.section || getSectionFromFieldType(field.fieldType),
      }));
      setFields(migratedFields);
      localStorage.setItem('nbslims_custom_fields', JSON.stringify(migratedFields));
    } else {
      // Initialize with default fields
      const defaultFields: CustomField[] = [
        // Samples - Item Groups
        { id: 'ig-1', name: 'Detergent', section: 'samples', fieldType: 'item-group', value: 'detergent', order: 1, active: true },
        { id: 'ig-2', name: 'Sky Project', section: 'samples', fieldType: 'item-group', value: 'sky-project', order: 2, active: true },
        { id: 'ig-3', name: 'Reed Diffuser', section: 'samples', fieldType: 'item-group', value: 'reed-diffuser', order: 3, active: true },
        { id: 'ig-4', name: 'Personal', section: 'samples', fieldType: 'item-group', value: 'personal', order: 4, active: true },
        
        // Samples - Status
        { id: 'ss-1', name: 'Untested', section: 'samples', fieldType: 'status', value: 'Untested', order: 1, active: true },
        { id: 'ss-2', name: 'Pending', section: 'samples', fieldType: 'status', value: 'Pending', order: 2, active: true },
        { id: 'ss-3', name: 'Testing', section: 'samples', fieldType: 'status', value: 'Testing', order: 3, active: true },
        { id: 'ss-4', name: 'Accepted', section: 'samples', fieldType: 'status', value: 'Accepted', order: 4, active: true },
        { id: 'ss-5', name: 'Rejected', section: 'samples', fieldType: 'status', value: 'Rejected', order: 5, active: true },
        
        // Tests - Test Types
        { id: 'tt-1', name: 'Personal Use', section: 'tests', fieldType: 'test-type', value: 'Personal Use', order: 1, active: true },
        { id: 'tt-2', name: 'Industrial', section: 'tests', fieldType: 'test-type', value: 'Industrial', order: 2, active: true },
        
        // Tests - Test Results
        { id: 'tr-1', name: 'Accepted', section: 'tests', fieldType: 'test-result', value: 'Accepted', order: 1, active: true },
        { id: 'tr-2', name: 'Rejected', section: 'tests', fieldType: 'test-result', value: 'Rejected', order: 2, active: true },
        { id: 'tr-3', name: 'Rework', section: 'tests', fieldType: 'test-result', value: 'Rework', order: 3, active: true },
        { id: 'tr-4', name: 'Retest', section: 'tests', fieldType: 'test-result', value: 'Retest', order: 4, active: true },
        
        // Tests - Priority
        { id: 'tp-1', name: 'Low', section: 'tests', fieldType: 'test-priority', value: 'Low', order: 1, active: true },
        { id: 'tp-2', name: 'Medium', section: 'tests', fieldType: 'test-priority', value: 'Medium', order: 2, active: true },
        { id: 'tp-3', name: 'High', section: 'tests', fieldType: 'test-priority', value: 'High', order: 3, active: true },
        
        // Tests - Formula Status
        { id: 'fs-1', name: 'Approved', section: 'tests', fieldType: 'formula-status', value: 'Approved', order: 1, active: true },
        { id: 'fs-2', name: 'Rejected', section: 'tests', fieldType: 'formula-status', value: 'Rejected', order: 2, active: true },
        { id: 'fs-3', name: 'Retest', section: 'tests', fieldType: 'formula-status', value: 'Retest', order: 3, active: true },
        
        // Samples - Currencies
        { id: 'cur-1', name: 'USD', section: 'samples', fieldType: 'currency', value: 'USD', order: 1, active: true },
        { id: 'cur-2', name: 'EUR', section: 'samples', fieldType: 'currency', value: 'EUR', order: 2, active: true },
        { id: 'cur-3', name: 'GBP', section: 'samples', fieldType: 'currency', value: 'GBP', order: 3, active: true },
        { id: 'cur-4', name: 'AED', section: 'samples', fieldType: 'currency', value: 'AED', order: 4, active: true },
        
        // Samples - Carriers
        { id: 'car-1', name: 'DHL Express', section: 'samples', fieldType: 'carrier', value: 'dhl', order: 1, active: true },
        { id: 'car-2', name: 'FedEx', section: 'samples', fieldType: 'carrier', value: 'fedex', order: 2, active: true },
        { id: 'car-3', name: 'UPS', section: 'samples', fieldType: 'carrier', value: 'ups', order: 3, active: true },
        { id: 'car-4', name: 'Aramex', section: 'samples', fieldType: 'carrier', value: 'aramex', order: 4, active: true },
        { id: 'car-5', name: 'Emirates Post', section: 'samples', fieldType: 'carrier', value: 'emirates-post', order: 5, active: true },
        
        // Labels - Label Sizes
        { id: 'ls-1', name: 'Small (25mm x 13mm)', section: 'labels', fieldType: 'label-size', value: 'small', order: 1, active: true },
        { id: 'ls-2', name: 'Standard (38mm x 25mm)', section: 'labels', fieldType: 'label-size', value: 'standard', order: 2, active: true },
        { id: 'ls-3', name: 'Large (50mm x 30mm)', section: 'labels', fieldType: 'label-size', value: 'large', order: 3, active: true },
        
        // Labels - Label Formats
        { id: 'lf-1', name: 'QR Code + Text', section: 'labels', fieldType: 'label-format', value: 'qr-code', order: 1, active: true },
        { id: 'lf-2', name: 'Barcode + Text', section: 'labels', fieldType: 'label-format', value: 'barcode', order: 2, active: true },
        { id: 'lf-3', name: 'Text Only', section: 'labels', fieldType: 'label-format', value: 'text-only', order: 3, active: true },
        
        // Tasks - Priority
        { id: 'tkp-1', name: 'Low', section: 'tasks', fieldType: 'task-priority', value: 'low', order: 1, active: true },
        { id: 'tkp-2', name: 'Medium', section: 'tasks', fieldType: 'task-priority', value: 'medium', order: 2, active: true },
        { id: 'tkp-3', name: 'High', section: 'tasks', fieldType: 'task-priority', value: 'high', order: 3, active: true },
        
        // Tasks - Status
        { id: 'tks-1', name: 'Pending', section: 'tasks', fieldType: 'task-status', value: 'pending', order: 1, active: true },
        { id: 'tks-2', name: 'In Progress', section: 'tasks', fieldType: 'task-status', value: 'in-progress', order: 2, active: true },
        { id: 'tks-3', name: 'Completed', section: 'tasks', fieldType: 'task-status', value: 'completed', order: 3, active: true },
        { id: 'tks-4', name: 'Overdue', section: 'tasks', fieldType: 'task-status', value: 'overdue', order: 4, active: true },
        
        // Samples - Unit of Measure
        { id: 'um-1', name: 'Units', section: 'samples', fieldType: 'unit-measure', value: 'units', order: 1, active: true },
        { id: 'um-2', name: 'Kilogram', section: 'samples', fieldType: 'unit-measure', value: 'kg', order: 2, active: true },
        { id: 'um-3', name: 'Liter', section: 'samples', fieldType: 'unit-measure', value: 'L', order: 3, active: true },
        
        // Samples - Priority Shipping
        { id: 'ps-1', name: 'Air', section: 'samples', fieldType: 'priority-shipping', value: 'Air', order: 1, active: true },
        { id: 'ps-2', name: 'Sea', section: 'samples', fieldType: 'priority-shipping', value: 'Sea', order: 2, active: true },
        { id: 'ps-3', name: 'Land', section: 'samples', fieldType: 'priority-shipping', value: 'Land', order: 3, active: true },
        
        // Samples - Purpose Tags
        { id: 'pt-1', name: 'Requested', section: 'samples', fieldType: 'purpose-tag', value: 'Requested', order: 1, active: true },
        { id: 'pt-2', name: 'To fill the container with', section: 'samples', fieldType: 'purpose-tag', value: 'To fill the container with', order: 2, active: true },
        
        // Samples - Request Status
        { id: 'rs-1', name: 'Requested', section: 'samples', fieldType: 'request-status', value: 'Requested', order: 1, active: true },
        { id: 'rs-2', name: 'Sent to Ordering', section: 'samples', fieldType: 'request-status', value: 'Sent to Ordering', order: 2, active: true },
        { id: 'rs-3', name: 'Ordered', section: 'samples', fieldType: 'request-status', value: 'Ordered', order: 3, active: true },
        
        // Labels - Font Families
        { id: 'ff-1', name: 'Arial', section: 'labels', fieldType: 'font-family', value: 'Arial', order: 1, active: true },
        { id: 'ff-2', name: 'Helvetica', section: 'labels', fieldType: 'font-family', value: 'Helvetica', order: 2, active: true },
        { id: 'ff-3', name: 'Times New Roman', section: 'labels', fieldType: 'font-family', value: 'Times New Roman', order: 3, active: true },
        { id: 'ff-4', name: 'Courier New', section: 'labels', fieldType: 'font-family', value: 'Courier New', order: 4, active: true },
        { id: 'ff-5', name: 'Georgia', section: 'labels', fieldType: 'font-family', value: 'Georgia', order: 5, active: true },
        
        // Ledger - Priority
        { id: 'lp-1', name: 'Low', section: 'ledger', fieldType: 'ledger-priority', value: 'Low', order: 1, active: true },
        { id: 'lp-2', name: 'Medium', section: 'ledger', fieldType: 'ledger-priority', value: 'Medium', order: 2, active: true },
        { id: 'lp-3', name: 'High', section: 'ledger', fieldType: 'ledger-priority', value: 'High', order: 3, active: true },
        { id: 'lp-4', name: 'Critical', section: 'ledger', fieldType: 'ledger-priority', value: 'Critical', order: 4, active: true },
        
        // Ledger - Concept
        { id: 'lc-1', name: 'Signature Scent', section: 'ledger', fieldType: 'ledger-concept', value: 'Signature Scent', order: 1, active: true },
        { id: 'lc-2', name: 'Seasonal Launch', section: 'ledger', fieldType: 'ledger-concept', value: 'Seasonal Launch', order: 2, active: true },
        { id: 'lc-3', name: 'Limited Edition', section: 'ledger', fieldType: 'ledger-concept', value: 'Limited Edition', order: 3, active: true },
        { id: 'lc-4', name: 'Mass Market', section: 'ledger', fieldType: 'ledger-concept', value: 'Mass Market', order: 4, active: true },
        { id: 'lc-5', name: 'Premium Line', section: 'ledger', fieldType: 'ledger-concept', value: 'Premium Line', order: 5, active: true },
        { id: 'lc-6', name: 'Niche Collection', section: 'ledger', fieldType: 'ledger-concept', value: 'Niche Collection', order: 6, active: true },
        
        // Ledger - Season
        { id: 'lse-1', name: 'Spring', section: 'ledger', fieldType: 'ledger-season', value: 'spring', order: 1, active: true },
        { id: 'lse-2', name: 'Summer', section: 'ledger', fieldType: 'ledger-season', value: 'summer', order: 2, active: true },
        { id: 'lse-3', name: 'Fall/Autumn', section: 'ledger', fieldType: 'ledger-season', value: 'fall', order: 3, active: true },
        { id: 'lse-4', name: 'Winter', section: 'ledger', fieldType: 'ledger-season', value: 'winter', order: 4, active: true },
        { id: 'lse-5', name: 'Year-round', section: 'ledger', fieldType: 'ledger-season', value: 'year-round', order: 5, active: true },
        
        // Ledger - Main Brand
        { id: 'mb-1', name: 'Chanel', section: 'ledger', fieldType: 'main-brand', value: 'Chanel', order: 1, active: true },
        { id: 'mb-2', name: 'Dior', section: 'ledger', fieldType: 'main-brand', value: 'Dior', order: 2, active: true },
        { id: 'mb-3', name: 'Tom Ford', section: 'ledger', fieldType: 'main-brand', value: 'Tom Ford', order: 3, active: true },
        { id: 'mb-4', name: 'Yves Saint Laurent', section: 'ledger', fieldType: 'main-brand', value: 'Yves Saint Laurent', order: 4, active: true },
        { id: 'mb-5', name: 'Versace', section: 'ledger', fieldType: 'main-brand', value: 'Versace', order: 5, active: true },
        { id: 'mb-6', name: 'Gucci', section: 'ledger', fieldType: 'main-brand', value: 'Gucci', order: 6, active: true },
        { id: 'mb-7', name: 'Prada', section: 'ledger', fieldType: 'main-brand', value: 'Prada', order: 7, active: true },
        { id: 'mb-8', name: 'Armani', section: 'ledger', fieldType: 'main-brand', value: 'Armani', order: 8, active: true },
        
        // Ledger - Branded As
        { id: 'ba-1', name: 'ADF', section: 'ledger', fieldType: 'branded-as', value: 'ADF', order: 1, active: true },
        { id: 'ba-2', name: 'Givaudan', section: 'ledger', fieldType: 'branded-as', value: 'Givaudan', order: 2, active: true },
        { id: 'ba-3', name: 'Royal', section: 'ledger', fieldType: 'branded-as', value: 'Royal', order: 3, active: true }
      ];
      setFields(defaultFields);
      localStorage.setItem('nbslims_custom_fields', JSON.stringify(defaultFields));
    }
  }, []);

  // Helper function to get icon component
  const getIconComponent = (iconName?: string) => {
    switch (iconName) {
      case 'Package': return Package;
      case 'TestTube': return TestTube;
      case 'Tag': return Tag;
      case 'FileText': return FileText;
      case 'Building2': return Building2;
      case 'CheckSquare': return CheckSquare;
      default: return Settings;
    }
  };

  // Toggle section expansion
  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionName) 
        ? prev.filter(s => s !== sectionName)
        : [...prev, sectionName]
    );
  };

  // Helper function for migration
  const getSectionFromFieldType = (fieldType: string): string => {
    if (['item-group', 'status', 'category', 'priority-shipping', 'carrier', 'unit-measure', 'currency', 'purpose-tag', 'request-status'].includes(fieldType)) {
      return 'samples';
    }
    if (['test-type', 'test-result', 'test-priority', 'test-status', 'formula-status'].includes(fieldType)) {
      return 'tests';
    }
    if (['label-size', 'label-format', 'font-family'].includes(fieldType)) {
      return 'labels';
    }
    if (['ledger-priority', 'ledger-concept', 'ledger-season', 'main-brand', 'branded-as'].includes(fieldType)) {
      return 'ledger';
    }
    if (['supplier-status'].includes(fieldType)) {
      return 'suppliers';
    }
    if (['task-priority', 'task-status'].includes(fieldType)) {
      return 'tasks';
    }
    return 'samples'; // Default
  };

  // Save fields to localStorage and notify parent
  const saveFields = (updatedFields: CustomField[]) => {
    setFields(updatedFields);
    localStorage.setItem('nbslims_custom_fields', JSON.stringify(updatedFields));
    if (onFieldsChange) {
      onFieldsChange(updatedFields);
    }
  };

  const handleAddField = () => {
    if (!formData.name.trim() || !formData.value.trim() || !formData.fieldType) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newField: CustomField = {
      id: `field-${Date.now()}`,
      name: formData.name.trim(),
      section: formData.section,
      fieldType: formData.fieldType,
      value: formData.value.trim().toLowerCase().replace(/\s+/g, '-'),
      order: fields.filter(f => f.section === formData.section && f.fieldType === formData.fieldType).length + 1,
      active: true
    };

    const updatedFields = [...fields, newField];
    saveFields(updatedFields);
    setIsAddDialogOpen(false);
    resetForm();
    toast.success(`Field added to ${getSectionLabel(formData.section)} > ${getFieldLabel(formData.fieldType)}`);
  };

  const handleEditField = () => {
    if (!selectedField || !formData.name.trim() || !formData.value.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const updatedFields = fields.map(field =>
      field.id === selectedField.id
        ? {
            ...field,
            name: formData.name.trim(),
            value: formData.value.trim().toLowerCase().replace(/\s+/g, '-')
          }
        : field
    );

    saveFields(updatedFields);
    setIsEditDialogOpen(false);
    setSelectedField(null);
    resetForm();
    toast.success('Field updated successfully');
  };

  const handleDeleteField = (fieldId: string) => {
    const updatedFields = fields.filter(field => field.id !== fieldId);
    saveFields(updatedFields);
    toast.success('Field deleted successfully');
  };

  const handleToggleActive = (fieldId: string) => {
    const updatedFields = fields.map(field =>
      field.id === fieldId ? { ...field, active: !field.active } : field
    );
    saveFields(updatedFields);
    toast.success('Field status updated');
  };

  const resetForm = () => {
    setFormData({
      name: '',
      section: 'samples',
      fieldType: '',
      value: ''
    });
  };

  const openEditDialog = (field: CustomField) => {
    setSelectedField(field);
    setFormData({
      name: field.name,
      section: field.section,
      fieldType: field.fieldType,
      value: field.value
    });
    setIsEditDialogOpen(true);
  };

  const getSectionLabel = (sectionName: string): string => {
    const section = FIELD_STRUCTURE.find(s => s.name === sectionName);
    return section?.label || sectionName;
  };

  const getFieldLabel = (fieldType: string): string => {
    for (const section of FIELD_STRUCTURE) {
      if (section.fields && Array.isArray(section.fields)) {
        const field = section.fields.find(f => f.name === fieldType);
        if (field) return field.label;
      }
    }
    return fieldType;
  };

  const getFieldsBySection = (sectionName: string) => {
    return fields.filter(field => field.section === sectionName);
  };

  const getFieldsBySectionAndType = (sectionName: string, fieldType: string) => {
    return fields
      .filter(field => field.section === sectionName && field.fieldType === fieldType)
      .sort((a, b) => a.order - b.order);
  };

  const getAvailableFields = (sectionName: string): FieldDefinition[] => {
    const section = FIELD_STRUCTURE.find(s => s.name === sectionName);
    return section?.fields || [];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Custom Fields Manager
        </CardTitle>
        <CardDescription>
          Manage custom field options for forms throughout the application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">Field Options</h3>
            <p className="text-sm text-gray-600">Add, edit, or remove options for dropdown fields in different sections</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Define New Option
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Field Option</DialogTitle>
                <DialogDescription>
                  Choose the section and field where you want to add a new option
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="section">Section *</Label>
                  <Select
                    value={formData.section}
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, section: value, fieldType: '' }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_STRUCTURE.map(section => (
                        <SelectItem key={section.name} value={section.name}>
                          {section.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {formData.section && (
                  <div>
                    <Label htmlFor="fieldType">Field *</Label>
                    <Select
                      value={formData.fieldType}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, fieldType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableFields(formData.section).map(field => (
                          <SelectItem key={field.name} value={field.name}>
                            <div>
                              <div>{field.label}</div>
                              {field.description && (
                                <div className="text-xs text-gray-500">{field.description}</div>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.fieldType && (
                  <>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-900">
                        Adding to: <strong>{getSectionLabel(formData.section)}</strong> <ChevronRight className="inline h-3 w-3" /> <strong>{getFieldLabel(formData.fieldType)}</strong>
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="name">Display Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter display name (e.g., New Option)"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="value">Value *</Label>
                      <Input
                        id="value"
                        value={formData.value}
                        onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                        placeholder="Enter value (e.g., new-option)"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This will be automatically formatted (lowercase, spaces replaced with dashes)
                      </p>
                    </div>
                  </>
                )}

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsAddDialogOpen(false);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddField}
                    disabled={!formData.name || !formData.value || !formData.fieldType}
                  >
                    Add Field Option
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Sections with Fields */}
        {FIELD_STRUCTURE.map(section => {
          const sectionFields = getFieldsBySection(section.name);
          if (sectionFields.length === 0) return null;
          const isExpanded = expandedSections.includes(section.name);
          const IconComponent = getIconComponent(section.icon);

          return (
            <Collapsible 
              key={section.name} 
              open={isExpanded}
              onOpenChange={() => toggleSection(section.name)}
            >
              <CollapsibleTrigger className="w-full">
                <div className="bg-gray-50 hover:bg-gray-100 p-4 rounded-lg transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <IconComponent className="h-5 w-5 text-gray-600" />
                      <h3 className="text-lg font-semibold">{section.label}</h3>
                      <Badge variant="secondary">{sectionFields.length} options</Badge>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-4 pt-2">
              
              {section.fields.map(fieldDef => {
                const fieldOptions = getFieldsBySectionAndType(section.name, fieldDef.name);
                if (fieldOptions.length === 0) return null;

                return (
                  <div key={fieldDef.name} className="ml-4">
                    <h4 className="font-medium text-base mb-2 flex items-center gap-2">
                      {fieldDef.label}
                      <Badge variant="outline" className="text-xs">{fieldOptions.length}</Badge>
                    </h4>
                    {fieldDef.description && (
                      <p className="text-sm text-gray-600 mb-2">{fieldDef.description}</p>
                    )}
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Display Name</TableHead>
                            <TableHead>Value</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fieldOptions.map(field => (
                            <TableRow key={field.id}>
                              <TableCell className="font-medium">{field.name}</TableCell>
                              <TableCell>
                                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                                  {field.value}
                                </code>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={field.active ? "default" : "secondary"}
                                  className="cursor-pointer"
                                  onClick={() => handleToggleActive(field.id)}
                                >
                                  {field.active ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditDialog(field)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteField(field.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                );
              })}
              </CollapsibleContent>
            </Collapsible>
          );
        })}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Field Option</DialogTitle>
              <DialogDescription>
                Update the field option details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Editing option in: <strong>{getSectionLabel(formData.section)}</strong> <ChevronRight className="inline h-3 w-3" /> <strong>{getFieldLabel(formData.fieldType)}</strong>
                </p>
              </div>
              
              <div>
                <Label htmlFor="editName">Display Name *</Label>
                <Input
                  id="editName"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter display name"
                />
              </div>
              
              <div>
                <Label htmlFor="editValue">Value *</Label>
                <Input
                  id="editValue"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="Enter value"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedField(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleEditField}>
                  Update Field Option
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};