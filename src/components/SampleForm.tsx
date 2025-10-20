import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { QrCode, Package, Hash, Building2, DollarSign, Plus, X, Printer, Edit3, Upload, Paperclip, FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Sample, Purpose, SampleStatus, SampleAttachment } from '@/lib/types';
import { sampleService } from '@/services/sampleService';
import { barcodeGenerator } from '@/lib/barcodeUtils';
import { companyService } from '@/services/companyService';
import { customerService } from '@/services/customerService';
import { useFieldHighlight } from '@/hooks/useFieldHighlight';
import { qrGenerator } from '@/lib/qrGenerator';
import { useAutoGenerateQR } from '@/hooks/useAutoGenerateQR';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SampleLedgerAdvanced } from '@/components/SampleLedgerAdvanced';
import { getFieldOptions } from '@/lib/customFieldsUtils';

interface SampleFormProps {
  sample?: Sample;
  onSave: (sample: Sample) => void;
  onCancel: () => void;
  suppliers: Array<{ id: string; name: string; code?: string; country?: string }>;
}

export const SampleForm: React.FC<SampleFormProps> = ({
  sample,
  onSave,
  onCancel,
  suppliers
}) => {
  const [formData, setFormData] = useState({
    itemNameEN: sample?.itemNameEN || '',
    itemNameAR: sample?.itemNameAR || '',
    supplierId: sample?.supplierId || '',
    supplierCode: sample?.supplierCode || '',
    customerId: (sample as any)?.customerId || '',
    customerSampleNumber: (sample as any)?.customerSampleNumber || '',
    dateOfSample: sample?.dateOfSample ? new Date(sample.dateOfSample).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    itemGroup: sample?.itemGroup || '',
    status: (sample?.status || 'Untested') as SampleStatus,
    customIdNo: sample?.customIdNo || '',
    storageLocation: {
      rackNumber: sample?.storageLocation?.rackNumber || '',
      position: sample?.storageLocation?.position || 0,
      notes: sample?.storageLocation?.notes || ''
    },
    pricing: {
      basePrice: sample?.pricing?.basePrice || 0,
      currency: sample?.pricing?.currency || 'USD',
      scalingPrices: sample?.pricing?.scalingPrices || [
        { quantity: 25, price: 0, enabled: true },
        { quantity: 50, price: 0, enabled: true },
        { quantity: 100, price: 0, enabled: true },
        { quantity: 200, price: 0, enabled: true },
        { quantity: 250, price: 0, enabled: true },
        { quantity: 500, price: 0, enabled: true },
        { quantity: 1000, price: 0, enabled: true }
      ]
    },
    shipment: {
      carrier: sample?.shipment?.carrier || '',
      airWaybill: sample?.shipment?.airWaybill || '',
      shipmentNotes: sample?.shipment?.shipmentNotes || '',
      originCountry: sample?.shipment?.originCountry || ''
    },
    isRawMaterial: sample?.isRawMaterial || false,
    brandedAs: sample?.brandedAs || null
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [barcodePreview, setBarcodePreview] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string; initials: string }>>([]);
  const [customers, setCustomers] = useState<Array<{ id: string; name: string; code?: string }>>([]);
  const [availableRacks, setAvailableRacks] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [sampleIdValidation, setSampleIdValidation] = useState<{ isValid: boolean; message: string; suggestion?: string }>({ isValid: true, message: '' });
  const [ledgerData, setLedgerData] = useState<any>(sample?.ledger || null);
  const [attachments, setAttachments] = useState<SampleAttachment[]>(sample?.attachments || []);
  const [activeTab, setActiveTab] = useState<'basic' | 'ledger' | 'attachments'>('basic');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Field highlighting for validation
  const requiredFields = ['itemNameEN', 'itemNameAR', 'supplierId', 'dateOfSample'];
  const { scrollToFirstError, highlightMissingFields } = useFieldHighlight({
    errors,
    requiredFields,
    highlightColor: '#ef4444',
    pulseAnimation: true
  });

  // Auto-generate unified QR and barcode
  const qrMaterial = sample?.id ? {
    id: sample.id,
    code: formData.customIdNo || sample.customIdNo,
    name: formData.itemNameEN || sample.itemNameEN,
    itemNameEN: formData.itemNameEN,
    itemNameAR: formData.itemNameAR,
    type: 'sample' as const,
  } : null;
  
  const { qrData, isGenerating } = useAutoGenerateQR(qrMaterial);

  // Load companies, customers, available racks, and custom fields
  useEffect(() => {
    const loadData = async () => {
      try {
        const companiesData = await companyService.getCompanies();
        setCompanies(companiesData);
        
        const customersData = customerService.getCustomers();
        setCustomers(customersData);
        
        const racks = companyService.getAvailableRacks();
        setAvailableRacks(racks);

        // Initialize sample customers if empty
        if (customersData.length === 0) {
          customerService.initializeSampleData();
          setCustomers(customerService.getCustomers());
        }

        // Custom fields are now loaded dynamically using getFieldOptions utility
      } catch (error) {
        console.error('Error loading companies, customers and racks:', error);
      }
    };
    loadData();
  }, []);

  // Update form data when sample prop changes
  useEffect(() => {
    if (sample) {
      setFormData({
        itemNameEN: sample.itemNameEN || '',
        itemNameAR: sample.itemNameAR || '',
        supplierId: sample.supplierId || '',
        supplierCode: sample.supplierCode || '',
        customerId: (sample as any)?.customerId || '',
        customerSampleNumber: (sample as any)?.customerSampleNumber || '',
        dateOfSample: sample.dateOfSample ? new Date(sample.dateOfSample).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        itemGroup: sample.itemGroup || '',
        status: (sample.status || 'Untested') as SampleStatus,
        customIdNo: sample.customIdNo || '',
        storageLocation: {
          rackNumber: sample.storageLocation?.rackNumber || '',
          position: sample.storageLocation?.position || 0,
          notes: sample.storageLocation?.notes || ''
        },
        pricing: {
          basePrice: sample.pricing?.basePrice || 0,
          currency: sample.pricing?.currency || 'USD',
          scalingPrices: sample.pricing?.scalingPrices || [
            { quantity: 25, price: 0, enabled: true },
            { quantity: 50, price: 0, enabled: true },
            { quantity: 100, price: 0, enabled: true },
            { quantity: 200, price: 0, enabled: true },
            { quantity: 250, price: 0, enabled: true },
            { quantity: 500, price: 0, enabled: true },
            { quantity: 1000, price: 0, enabled: true }
          ]
        },
        shipment: {
          carrier: sample.shipment?.carrier || '',
          airWaybill: sample.shipment?.airWaybill || '',
          shipmentNotes: sample.shipment?.shipmentNotes || '',
          originCountry: sample.shipment?.originCountry || ''
        },
        isRawMaterial: sample.isRawMaterial || false,
        brandedAs: sample.brandedAs || null
      });
      setLedgerData(sample.ledger || null);
    }
  }, [sample]);

  // Validate sample ID uniqueness
  const validateSampleId = async (sampleId: string) => {
    if (!sampleId.trim()) {
      setSampleIdValidation({ isValid: true, message: '' });
      return;
    }

    try {
      const validation = await companyService.validateSampleNumberUniqueness(sampleId, sample?.id);
      
      if (validation.isUnique) {
        setSampleIdValidation({ isValid: true, message: '✓ Sample ID is available' });
      } else {
        setSampleIdValidation({ 
          isValid: false, 
          message: `Sample ID "${sampleId}" already exists`, 
          suggestion: validation.suggestion 
        });
      }
    } catch (error) {
      console.error('Error validating sample ID:', error);
      setSampleIdValidation({ isValid: false, message: 'Error validating sample ID' });
    }
  };

  // Generate sample ID from supplier index
  const generateSampleIdFromSupplier = async (supplierIndex: string) => {
    try {
      // Generate unique sample number using supplier index as prefix (e.g., EXP, G, CHEM)
      const uniqueSampleId = await companyService.generateUniqueSampleNumber(supplierIndex);
      
      setFormData(prev => ({
        ...prev,
        customIdNo: uniqueSampleId
      }));

      // Validate the generated ID
      await validateSampleId(uniqueSampleId);
    } catch (error) {
      console.error('Error generating sample ID from supplier:', error);
      toast.error('Error generating sample ID');
    }
  };

  // Auto-generate sample ID when company is selected (legacy - keeping for compatibility)
  const handleCompanySelection = async (companyId: string) => {
    setSelectedCompany(companyId);
    const company = companies.find(c => c.id === companyId);
    
    if (company) {
      try {
        // Generate unique sample number for this company
        const uniqueSampleId = await companyService.generateUniqueSampleNumber(company.initials);
        
        setFormData(prev => ({
          ...prev,
          customIdNo: uniqueSampleId
        }));

        // Validate the generated ID
        await validateSampleId(uniqueSampleId);

        // Update storage location if rack is selected
        if (formData.storageLocation.rackNumber) {
          const nextPosition = companyService.getNextPositionInRack(formData.storageLocation.rackNumber);
          setFormData(prev => ({
            ...prev,
            storageLocation: {
              ...prev.storageLocation,
              position: nextPosition
            }
          }));
        }
      } catch (error) {
        console.error('Error generating sample ID:', error);
        toast.error('Error generating sample ID');
      }
    }
  };


  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required field validations
    if (!formData.itemNameEN.trim()) {
      newErrors.itemNameEN = 'English item name is required';
    }
    if (!formData.itemNameAR.trim()) {
      newErrors.itemNameAR = 'Arabic item name is required';
    }
    if (!formData.supplierId) {
      newErrors.supplierId = 'Please select a supplier';
    }
    if (!formData.dateOfSample) {
      newErrors.dateOfSample = 'Sample date is required';
    }

    // Storage location validation
    if (formData.storageLocation.rackNumber && !formData.storageLocation.rackNumber.trim()) {
      newErrors.rackNumber = 'Rack number cannot be empty if specified';
    }

    // Pricing validation
    if (formData.pricing.basePrice && formData.pricing.basePrice <= 0) {
      newErrors.basePrice = 'Base price must be greater than 0';
    }

    // Scaling prices validation - only validate enabled tiers
    if (formData.pricing.scalingPrices && formData.pricing.scalingPrices.length > 0) {
      formData.pricing.scalingPrices.forEach((price, index) => {
        // Only validate enabled tiers
        if (price.enabled !== false) {
          if (!price.quantity || price.quantity <= 0) {
            newErrors[`scalingQuantity${index}`] = `Quantity for tier ${index + 1} must be greater than 0`;
          }
          if (!price.price || price.price <= 0) {
            newErrors[`scalingPrice${index}`] = `Price for tier ${index + 1} must be greater than 0`;
          }
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getValidationSummary = () => {
    const requiredFields = [];
    if (!formData.itemNameEN.trim()) requiredFields.push('English Item Name');
    if (!formData.itemNameAR.trim()) requiredFields.push('Arabic Item Name');
    if (!formData.supplierId) requiredFields.push('Supplier');
    if (!formData.dateOfSample) requiredFields.push('Sample Date');
    
    return requiredFields;
  };

  // Attachment handling functions
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: SampleAttachment[] = [];
    
    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const attachment: SampleAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileUrl: e.target?.result as string,
          uploadedAt: new Date(),
          uploadedBy: 'current-user', // TODO: Get from auth context
          description: ''
        };
        
        setAttachments(prev => [...prev, attachment]);
        toast.success(`File ${file.name} uploaded successfully`);
      };
      
      reader.readAsDataURL(file);
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
    toast.success('Attachment removed');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check sample ID uniqueness first
    if (formData.customIdNo && !sampleIdValidation.isValid) {
      toast.error('Please fix the sample ID issue before submitting');
      scrollToFirstError();
      return;
    }
    
    // Check if user is on ledger tab and hasn't saved ledger data
    if (activeTab === 'ledger') {
      toast.error('Please save the ledger data first before submitting the sample');
      return;
    }
    
    if (!validateForm()) {
      const missingFields = getValidationSummary();
      if (missingFields.length > 0) {
        // Highlight missing fields with animation
        highlightMissingFields(missingFields);
        toast.error(`Please fill in the highlighted required fields: ${missingFields.join(', ')}`);
        scrollToFirstError();
      }
      return;
    }

    setLoading(true);
    
    try {
      // Use unified QR/barcode system (auto-generated via hook)
      let barcode = sample?.barcode;
      let qrCode = sample?.qrCode;
      let qrImageBase64 = sample?.qrImageBase64 || '';
      let qrPayload = sample?.qrPayload || '';
      let scanAliases = sample?.scanAliases || [];
      
      // If QR data was auto-generated, use it
      if (qrData) {
        qrImageBase64 = qrData.qrImage;
        qrPayload = qrData.qrPayload;
        barcode = qrData.barcode;
        qrCode = qrData.qrPayload; // Store payload as qrCode for backwards compatibility
      } else {
        // Generate unified codes on-the-fly for new samples
        const tempId = sample?.id || `sample-${crypto.randomUUID()}`;
        const materialData = {
          id: tempId,
          code: formData.customIdNo || tempId,
          name: formData.itemNameEN || formData.itemNameAR || 'New Sample',
          type: 'sample' as const
        };
        
        const generated = await import('@/lib/qr/generator').then(m => 
          m.generateMaterialCodes(materialData)
        );
        
        qrCode = generated.qrPayload;
        qrImageBase64 = generated.qrImage;
        barcode = generated.barcode;
        qrPayload = generated.qrPayload;
      }
      
      // Build comprehensive scan aliases
      scanAliases = [
        qrPayload,
        barcode,
        `RM:sample-${sample?.id || formData.customIdNo || ''}`,
        `sample-${sample?.id || formData.customIdNo || ''}`,
        ...(formData.customIdNo ? [`S:${formData.customIdNo}`, formData.customIdNo] : []),
        ...(sample?.scanAliases || [])
      ].filter(Boolean);
      
      console.log('[SampleForm] Universal QR generated:', { qrPayload, barcode, aliasCount: scanAliases.length });

      
      const sampleData = {
        ...formData,
        dateOfSample: new Date(formData.dateOfSample),
        barcode,
        qrCode,
        qrImageBase64, // Store the QR image for printing
        qrPayload, // NEW: Store the unified QR payload
        scanAliases, // NEW: Store all scan aliases
        ledger: ledgerData, // Include ledger data if provided
        storageLocation: {
          rackNumber: formData.storageLocation.rackNumber,
          position: formData.storageLocation.position,
          notes: formData.storageLocation.notes
        },
        pricing: {
          ...formData.pricing,
          basePrice: Number(formData.pricing.basePrice),
          currency: formData.pricing.currency
        },
        approved: sample?.approved || false,
        createdBy: sample?.createdBy || 'current-user',
        updatedBy: 'current-user'
      };

      // Just return the sample data to the parent component
      // The parent component will handle the actual saving
      const savedSample: Sample = {
        ...sampleData,
        id: sample?.id || `sample-${Date.now()}`,
        sampleNo: sample?.sampleNo || 0,
        attachments: attachments,
        createdAt: sample?.createdAt || new Date(),
        updatedAt: new Date()
      };

      onSave(savedSample);
    } catch (error) {
      console.error('Error saving sample:', error);
      toast.error('Failed to save sample. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleStorageLocationChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      storageLocation: {
        ...prev.storageLocation,
        [field]: value
      }
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handlePricingChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [field]: value
      }
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleShipmentChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      shipment: {
        ...prev.shipment,
        [field]: value
      }
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validationSummary = getValidationSummary();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Information</TabsTrigger>
          <TabsTrigger value="ledger">
            Sample Ledger {ledgerData && <span className="ml-1 text-green-500">✓</span>}
          </TabsTrigger>
          <TabsTrigger value="attachments" className="flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            Attachments {attachments.length > 0 && <Badge variant="secondary" className="ml-1">{attachments.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
      {validationSummary.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">!</span>
            </div>
            <span className="font-semibold text-red-800">Required fields missing:</span>
          </div>
          <ul className="text-sm text-red-700 list-disc list-inside">
            {validationSummary.map((field, index) => (
              <li key={index}>{field}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="itemNameEN">Item Name (English) *</Label>
              <Input
                id="itemNameEN"
                value={formData.itemNameEN}
                onChange={(e) => handleInputChange('itemNameEN', e.target.value)}
                placeholder="Enter item name in English"
                className={errors.itemNameEN ? 'border-red-500' : ''}
              />
              {errors.itemNameEN && (
                <p className="text-red-500 text-sm mt-1">{errors.itemNameEN}</p>
              )}
            </div>

            <div>
              <Label htmlFor="itemNameAR">Item Name (Arabic) *</Label>
              <Input
                id="itemNameAR"
                value={formData.itemNameAR}
                onChange={(e) => handleInputChange('itemNameAR', e.target.value)}
                placeholder="أدخل اسم العنصر بالعربية"
                className={errors.itemNameAR ? 'border-red-500' : ''}
                dir="rtl"
              />
              {errors.itemNameAR && (
                <p className="text-red-500 text-sm mt-1">{errors.itemNameAR}</p>
              )}
            </div>

            <div>
              <Label htmlFor="supplierId">Supplier *</Label>
              <Select
                value={formData.supplierId}
                onValueChange={(value) => {
                  handleInputChange('supplierId', value);
                  // Automatically set supplier data when supplier is selected
                  const selectedSupplier = suppliers.find(s => s.id === value);
                  if (selectedSupplier) {
                    // Generate unique sample ID using supplier index (code)
                    if (selectedSupplier.code) {
                      generateSampleIdFromSupplier(selectedSupplier.code);
                    }
                    // Auto-populate origin country from supplier
                    if (selectedSupplier.country) {
                      handleShipmentChange('originCountry', selectedSupplier.country);
                    }
                    // Note: supplierCode (sales reference) is filled manually by user
                  }
                }}
              >
                <SelectTrigger className={errors.supplierId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name} {supplier.code && `[Index: ${supplier.code}]`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.supplierId && (
                <p className="text-red-500 text-sm mt-1">{errors.supplierId}</p>
              )}
            </div>

            <div>
              <Label htmlFor="customIdNo">Custom ID Number</Label>
              <Input
                id="customIdNo"
                value={formData.customIdNo}
                onChange={(e) => {
                  handleInputChange('customIdNo', e.target.value);
                  // Validate the manually entered ID
                  validateSampleId(e.target.value);
                }}
                placeholder="Enter custom ID number (e.g., EXP001, G001)"
                className={sampleIdValidation.isValid ? '' : 'border-red-500'}
              />
              {sampleIdValidation.message && (
                <div className={`text-sm mt-1 ${sampleIdValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                  {sampleIdValidation.message}
                  {!sampleIdValidation.isValid && sampleIdValidation.suggestion && (
                    <div className="mt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, customIdNo: sampleIdValidation.suggestion! }));
                          validateSampleId(sampleIdValidation.suggestion!);
                        }}
                      >
                        Use {sampleIdValidation.suggestion}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Customer Field */}
            <div>
              <Label htmlFor="customerId">Customer</Label>
              <Select
                value={formData.customerId}
                onValueChange={(value) => handleInputChange('customerId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} {customer.code && `[${customer.code}]`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Select the customer who submitted this sample
              </p>
            </div>

            {/* Customer Sample Number */}
            <div>
              <Label htmlFor="customerSampleNumber">Customer Sample Number</Label>
              <Input
                id="customerSampleNumber"
                value={formData.customerSampleNumber}
                onChange={(e) => handleInputChange('customerSampleNumber', e.target.value)}
                placeholder="Enter customer's sample number"
              />
            </div>

            {/* Storage: Rack Number */}
            <div>
              <Label htmlFor="rackNumber">Rack Number</Label>
              <Input
                id="rackNumber"
                value={formData.storageLocation.rackNumber}
                onChange={(e) => {
                  handleStorageLocationChange('rackNumber', e.target.value);
                  if (selectedCompany) {
                    const company = companies.find(c => c.id === selectedCompany);
                    if (company && e.target.value) {
                      const nextPosition = companyService.getNextPositionInRack(e.target.value);
                      const sampleNumber = companyService.generateSampleNumber(e.target.value, company.initials);
                      setFormData(prev => ({
                        ...prev,
                        customIdNo: sampleNumber,
                        storageLocation: {
                          ...prev.storageLocation,
                          position: nextPosition
                        }
                      }));
                    }
                  }
                }}
                placeholder="Enter rack number (e.g., A1, B2, C3)"
              />
            </div>

            {/* Storage: Notes */}
            <div>
              <Label htmlFor="storageNotes">Storage Notes</Label>
              <Textarea
                id="storageNotes"
                value={formData.storageLocation.notes}
                onChange={(e) => handleStorageLocationChange('notes', e.target.value)}
                placeholder="Additional storage notes..."
                rows={2}
              />
            </div>

            {/* Raw Material Checkbox */}
            <div className="flex items-center space-x-2 border rounded-lg p-3 bg-gray-50">
              <Switch
                id="isRawMaterial"
                checked={formData.isRawMaterial}
                onCheckedChange={(checked) => handleInputChange('isRawMaterial', checked)}
              />
              <Label 
                htmlFor="isRawMaterial" 
                className="cursor-pointer font-medium"
              >
                Mark as Raw Material
              </Label>
              <Badge variant={formData.isRawMaterial ? "default" : "outline"}>
                {formData.isRawMaterial ? "Raw Material" : "Finished Product"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Supplier Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Supplier Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <div>
              <Label htmlFor="supplierCode">Supplier Code (Sales Reference)</Label>
              <Input
                id="supplierCode"
                value={formData.supplierCode}
                onChange={(e) => handleInputChange('supplierCode', e.target.value)}
                placeholder="Enter supplier's sales reference number"
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                This is different from Supplier Index - it's the sales reference from the supplier
              </p>
            </div>

            <div>
              <Label htmlFor="dateOfSample">Date of Sample *</Label>
              <Input
                id="dateOfSample"
                type="date"
                value={formData.dateOfSample}
                onChange={(e) => handleInputChange('dateOfSample', e.target.value)}
                className={errors.dateOfSample ? 'border-red-500' : ''}
              />
            </div>

            <div>
              <Label htmlFor="itemGroup">Item Group</Label>
              <Select
                value={formData.itemGroup}
                onValueChange={(value) => handleInputChange('itemGroup', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select item group" />
                </SelectTrigger>
                <SelectContent>
                  {getFieldOptions('item-group').map((group) => (
                    <SelectItem key={group.value} value={group.value}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator className="my-4" />

            <div>
              <Label htmlFor="carrier">Carrier</Label>
              <Select
                value={formData.shipment.carrier}
                onValueChange={(value) => handleShipmentChange('carrier', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select carrier" />
                </SelectTrigger>
                <SelectContent>
                  {getFieldOptions('carrier').map((carrier) => (
                    <SelectItem key={carrier.value} value={carrier.value}>
                      {carrier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="airWaybill">Air Waybill Number</Label>
              <Input
                id="airWaybill"
                value={formData.shipment.airWaybill}
                onChange={(e) => handleShipmentChange('airWaybill', e.target.value)}
                placeholder="Enter air waybill number"
              />
            </div>

          </CardContent>
        </Card>
      </div>

      {/* QR Code & Barcode Display - Only for existing samples */}
      {sample?.id && (
        <Card className="border-2 border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code & Barcode
            </CardTitle>
            <CardDescription>
              Unified scanning codes for this sample
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isGenerating ? (
              <div className="flex items-center justify-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                Generating QR code and barcode...
              </div>
            ) : qrData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* QR Code */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">QR Code</Label>
                  <div className="border-2 border-gray-200 rounded-lg p-4 bg-white flex flex-col items-center">
                    <img 
                      src={qrData.qrImage} 
                      alt="Sample QR Code" 
                      className="w-48 h-48 border border-gray-300 rounded"
                    />
                    <p className="text-xs text-gray-500 mt-2 text-center break-all max-w-[200px]">
                      {qrData.qrPayload}
                    </p>
                  </div>
                </div>

                {/* Barcode */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Linear Barcode</Label>
                  <div className="border-2 border-gray-200 rounded-lg p-4 bg-white flex flex-col items-center justify-center">
                    <div className="text-3xl font-mono tracking-wider mb-2">
                      {qrData.barcode}
                    </div>
                    <div className="flex gap-1 mt-2">
                      {qrData.barcode.split('').map((char, i) => (
                        <div key={i} className={`h-24 ${i % 2 === 0 ? 'w-1 bg-black' : 'w-2 bg-gray-800'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-3">Code 128</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                QR code will be generated when you save this sample
              </div>
            )}

            {qrData && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✓ This sample can be scanned using the QR code or barcode in any workflow
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pricing Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pricing Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pricing Type Selection */}
          <div>
            <Label>Pricing Type *</Label>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="fixedPrice"
                  name="pricingType"
                  value="fixed"
                  checked={!formData.pricing.scalingPrices || formData.pricing.scalingPrices.length === 0}
                  onChange={() => {
                    handlePricingChange('scalingPrices', []);
                  }}
                  className="rounded"
                />
                <Label htmlFor="fixedPrice" className="text-sm font-normal cursor-pointer">
                  Fixed Price
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="scalingPrice"
                  name="pricingType"
                  value="scaling"
                  checked={formData.pricing.scalingPrices && formData.pricing.scalingPrices.length > 0}
                  onChange={() => {
                    if (!formData.pricing.scalingPrices || formData.pricing.scalingPrices.length === 0) {
                      // Automatically create all standard pricing tiers
                      handlePricingChange('scalingPrices', [
                        { quantity: 25, price: 0, enabled: true },
                        { quantity: 50, price: 0, enabled: true },
                        { quantity: 100, price: 0, enabled: true },
                        { quantity: 200, price: 0, enabled: true },
                        { quantity: 250, price: 0, enabled: true },
                        { quantity: 500, price: 0, enabled: true },
                        { quantity: 1000, price: 0, enabled: true }
                      ]);
                    }
                  }}
                  className="rounded"
                />
                <Label htmlFor="scalingPrice" className="text-sm font-normal cursor-pointer">
                  Scaling Price
                </Label>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Choose between fixed pricing or quantity-based scaling prices
            </p>
          </div>

          {/* Fixed Price Section */}
          {(!formData.pricing.scalingPrices || formData.pricing.scalingPrices.length === 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="basePrice">Base Price *</Label>
              <Input
                id="basePrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.pricing.basePrice}
                onChange={(e) => handlePricingChange('basePrice', e.target.value)}
                placeholder="0.00"
                className={errors.basePrice ? 'border-red-500' : ''}
              />
              {errors.basePrice && (
                <p className="text-red-500 text-sm mt-1">{errors.basePrice}</p>
              )}
            </div>

            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.pricing.currency}
                onValueChange={(value) => handlePricingChange('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {getFieldOptions('currency').map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          )}

          {/* Scaling Prices */}
          {formData.pricing.scalingPrices && formData.pricing.scalingPrices.length > 0 && (
          <div>
            <Label>Scaling Prices</Label>
            <p className="text-sm text-gray-600 mb-3">
              Set different prices for different quantities - each tier has its own color
            </p>
            
            {/* Compact pricing tiers with toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2 mb-4">
              {formData.pricing.scalingPrices?.map((price, index) => {
                // Define colors for each tier
                const colors = [
                  'border-blue-200 bg-blue-50',
                  'border-green-200 bg-green-50', 
                  'border-purple-200 bg-purple-50',
                  'border-orange-200 bg-orange-50',
                  'border-pink-200 bg-pink-50',
                  'border-indigo-200 bg-indigo-50',
                  'border-cyan-200 bg-cyan-50',
                  'border-yellow-200 bg-yellow-50'
                ];
                const colorClass = colors[index % colors.length];
                const isEnabled = price.enabled !== false; // Default to true if not specified
                
                return (
                  <div key={index} className={`border-2 rounded-lg p-2 ${colorClass} ${!isEnabled ? 'opacity-50' : ''} transition-opacity`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600">{price.quantity} KG</span>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => {
                          const newScalingPrices = [...(formData.pricing.scalingPrices || [])];
                          newScalingPrices[index] = { ...price, enabled: checked };
                          handlePricingChange('scalingPrices', newScalingPrices);
                        }}
                        className="scale-75"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      {/* Price Input - More compact */}
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={price.price}
                        onChange={(e) => {
                          const newScalingPrices = [...(formData.pricing.scalingPrices || [])];
                          newScalingPrices[index] = { ...price, price: parseFloat(e.target.value) || 0 };
                          handlePricingChange('scalingPrices', newScalingPrices);
                        }}
                        placeholder="$0.00"
                        className="h-7 text-sm"
                        disabled={!isEnabled}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            
          </div>
          )}
        </CardContent>
      </Card>


      
        </TabsContent>

        <TabsContent value="ledger" className="space-y-6">
          <SampleLedgerAdvanced
            sample={sample}
            onSave={(data) => {
              setLedgerData(data);
              setActiveTab('basic');
              toast.success('Ledger data saved - you can now submit the sample');
            }}
            onCancel={() => setActiveTab('basic')}
          />
        </TabsContent>

        <TabsContent value="attachments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paperclip className="h-5 w-5" />
                Attachments
              </CardTitle>
              <CardDescription>
                Upload documents, images, or other files related to this sample
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                />
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-2">
                  Drag and drop files here, or click to browse
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Select Files
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Maximum file size: 10MB. Supported formats: Images, PDF, Word, Excel, Text
                </p>
              </div>

              {/* Attachments List */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Uploaded Files ({attachments.length})</h4>
                  <div className="space-y-2">
                    {attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">{attachment.fileName}</p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(attachment.fileSize)} • Uploaded {new Date(attachment.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {attachment.fileUrl && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = attachment.fileUrl!;
                                link.download = attachment.fileName;
                                link.click();
                              }}
                            >
                              Download
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveAttachment(attachment.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {attachments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm">No attachments uploaded yet</p>
                  <p className="text-xs mt-1">Upload files to attach them to this sample</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : sample ? 'Update Sample' : 'Create Sample'}
        </Button>
        {ledgerData && (
          <Badge variant="secondary" className="ml-2">
            Ledger Data Added
          </Badge>
        )}
      </div>
    </form>
  );
};
