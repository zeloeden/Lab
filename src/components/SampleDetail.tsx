import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlassSection } from '@/components/ui/GlassSection';
import { SectionIcon } from '@/components/ui/SectionIcon';
import { 
  Package, 
  Hash, 
  MapPin,
  Building2, 
  DollarSign, 
  QrCode, 
  Copy, 
  Download,
  Eye,
  Calendar,
  User,
  Tag,
  ExternalLink,
  BookOpen,
  FlaskConical,
  Beaker,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import { PrioritySelector, PriorityValue } from '@/components/PrioritySelector';
import { Sample } from '@/lib/types';
import { Formula } from '@/lib/formula-types';
import { sampleService } from '@/services/sampleService';
import { barcodeGenerator } from '@/lib/barcodeUtils';
import { PatchNumberGroup } from './PatchNumberGroup';
import { telemetry } from '@/lib/telemetry';

interface SampleDetailProps {
  sample: Sample;
  onEdit?: (sample: Sample) => void;
  onClose?: () => void;
}

export const SampleDetail: React.FC<SampleDetailProps> = ({
  sample,
  onEdit,
  onClose
}) => {
  const { colors } = useTheme();
  const { hasPermission, user } = useAuth();
  const canViewCost = (user?.role === 'Admin' || (user as any)?.role === 'Owner' || hasPermission('purchasing','view_costs'));
  const [patchSamples, setPatchSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(false);
  const [barcodeImage, setBarcodeImage] = useState<string | null>(null);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [tests, setTests] = useState<any[]>([]);

  // Emit telemetry when cost panel is viewed
  useEffect(() => {
    if (canViewCost && sample.source === 'FORMULA' && sample.traceability === 'actual') {
      telemetry.emit('sample.view.costPanel', { sampleId: sample.id });
    }
  }, [canViewCost, sample.id, sample.source, sample.traceability]);
  const [patchCount, setPatchCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState('overview');

  // Determine which tabs should be shown based on available content
  const hasTests = tests.length > 0;
  const hasFormulas = formulas.length > 0;
  const hasLedger = sample.ledger !== undefined;
  const hasPatchNumber = sample.patchNumber !== undefined && sample.patchNumber !== null;
  
  // Create dynamic tabs based on available content
  const availableTabs = [
    { id: 'overview', label: 'Overview', show: true },
    { id: 'details', label: 'Details', show: true },
    { id: 'patch', label: 'Patch', show: hasPatchNumber },
    { id: 'ledger', label: 'Ledger', show: hasLedger },
    { id: 'formulas', label: 'Formulas', show: hasFormulas },
    { id: 'tests', label: 'Tests', show: hasTests },
  ].filter(tab => tab.show);

  useEffect(() => {
    if (sample.patchNumber) {
      loadPatchSamples();
    }
    generateBarcodeImage();
    loadFormulas();
    loadTests();
  }, [sample]);

  const loadPatchSamples = async () => {
    if (!sample.patchNumber) return;
    
    setLoading(true);
    try {
      const samples = await sampleService.getSamplesByPatchNumber(sample.patchNumber);
      setPatchSamples(samples.filter(s => s.id !== sample.id));
    } catch (error) {
      console.error('Error loading patch samples:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateBarcodeImage = async () => {
    if (!sample.barcode) return;
    
    try {
      const imageDataUrl = await barcodeGenerator.generateBarcode(sample.barcode);
      setBarcodeImage(imageDataUrl);
    } catch (error) {
      console.error('Error generating barcode image:', error);
    }
  };

  const loadFormulas = async () => {
    try {
      const storedFormulas = localStorage.getItem('nbslims_formulas');
      if (storedFormulas) {
        const allFormulas = JSON.parse(storedFormulas);
        // Show formulas where this sample is either primary or secondary
        const sampleFormulas = allFormulas.filter((f: Formula) => 
          f.sampleId === sample.id || f.secondarySampleId === sample.id
        );
        setFormulas(sampleFormulas);
      }
    } catch (error) {
      console.error('Error loading formulas:', error);
    }
  };

  const loadPatchCount = async () => {
    if (!sample.patchNumber) {
      setPatchCount(0);
      return;
    }
    
    try {
      const patchSamples = await sampleService.getSamplesByPatchNumber(sample.patchNumber);
      setPatchCount(patchSamples.length);
    } catch (error) {
      console.error('Error loading patch count:', error);
      setPatchCount(0);
    }
  };

  useEffect(() => {
    const handleFormulaEvents = () => loadFormulas();
    window.addEventListener('formulaApproved', handleFormulaEvents as EventListener);
    window.addEventListener('formulaUpdated', handleFormulaEvents as EventListener);
    return () => {
      window.removeEventListener('formulaApproved', handleFormulaEvents as EventListener);
      window.removeEventListener('formulaUpdated', handleFormulaEvents as EventListener);
    };
  }, []);

  useEffect(() => {
    loadPatchCount();
  }, [sample.patchNumber]);

  const loadTests = async () => {
    try {
      const storedTests = localStorage.getItem('nbslims_tests');
      if (storedTests) {
        const allTests = JSON.parse(storedTests);
        // Filter tests for this sample
        const sampleTests = allTests.filter((t: any) => t.sampleId === sample.id);
        setTests(sampleTests);
      }
    } catch (error) {
      console.error('Error loading tests:', error);
    }
  };

  const getStatusColor = (status: Sample['status']) => {
    switch (status) {
      case 'Untested':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Testing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };


  const getPurposeColor = (purpose: any) => {
    return purpose === 'Personal Use' 
      ? 'bg-blue-100 text-blue-800 border-blue-200'
      : 'bg-purple-100 text-purple-800 border-purple-200';
  };

  const getFormulaStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Testing': return 'bg-blue-100 text-blue-800';
      case 'Draft': return 'bg-gray-100 text-gray-800';
      case 'Retest': return 'bg-yellow-100 text-yellow-800';
      case 'Failed': return 'bg-red-100 text-red-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const downloadBarcode = () => {
    if (!barcodeImage) return;
    
    const link = document.createElement('a');
    link.href = barcodeImage;
    link.download = `sample-${sample.sampleNo}-barcode.png`;
    link.click();
  };

  // Flexible accessors for optional/custom ledger fields
  const sampleAny = sample as any;
  const ledgerAny = (sample.ledger || {}) as any;


  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full grid-cols-${availableTabs.length}`}>
          {availableTabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <GlassSection
          title="Basic Information"
          icon={<SectionIcon icon={Package} />}
          variant="turquoise"
        >
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Item Name (English)</Label>
              <p className="text-lg">{sample.itemNameEN}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-600">Item Name (Arabic)</Label>
              <p className="text-lg" dir="rtl">{sample.itemNameAR}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Batch Number</Label>
                <p className="font-mono">{sample.patchNumber || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Custom ID</Label>
                <p className="font-mono">{sample.customIdNo || 'N/A'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Date of Sample</Label>
                <p className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(sample.dateOfSample).toLocaleDateString()}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Created</Label>
                <p className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(sample.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </GlassSection>

        {/* Patch and Supplier Information */}
        <GlassSection
          title="Patch & Supplier Details"
          icon={<SectionIcon icon={Hash} />}
          variant="indigo"
        >
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Patch Number</Label>
              <div className="flex items-center gap-2">
              <p className="font-mono text-lg">
                {sample.patchNumber || 'N/A'}
              </p>
                {sample.patchNumber && patchCount > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {patchCount} {patchCount === 1 ? 'item' : 'items'}
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-600">Supplier Code</Label>
              <p className="font-mono">
                {sample.supplierCode || 'N/A'}
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-600">Supplier ID</Label>
              <p className="font-mono">{sample.supplierId}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-600">Barcode</Label>
              <div className="flex items-center gap-2">
                <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                  {sample.barcode || 'Not generated'}
                </code>
                {sample.barcode && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(sample.barcode!)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </GlassSection>

        {/* Storage Location */}
        <GlassSection
          title="Storage Location"
          icon={<SectionIcon icon={MapPin} />}
          variant="sky"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Rack</Label>
                <p className="font-mono text-lg">{sample.storageLocation?.rackNumber || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Position</Label>
                <p className="font-mono text-lg">{(sample.storageLocation?.position ?? 'N/A')}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Notes</Label>
                <p className="font-mono text-lg">{sample.storageLocation?.notes || '-'}</p>
              </div>
            </div>
            {sample.storageLocation?.notes && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Notes</Label>
                <p className="text-sm">{sample.storageLocation?.notes}</p>
              </div>
            )}
          </div>
        </GlassSection>

        {/* Pricing Information */}
        {hasPermission('samples', 'view_pricing') && (
          <GlassSection
            title="Pricing Information"
            icon={<SectionIcon icon={DollarSign} />}
            variant="emerald"
          >
            <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Base Price</Label>
              <p className="text-2xl font-bold text-emerald-600">
                {(sample.pricing?.currency || 'USD')} {(sample.pricing?.basePrice ?? 0).toFixed(2)}
              </p>
            </div>

            {sample.pricing?.scalingPrices && sample.pricing.scalingPrices.length > 0 && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Scaling Prices</Label>
                <div className="space-y-2">
                  {sample.pricing.scalingPrices.map((price, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="font-mono">{price.quantity} KG</span>
                      <span className="font-mono">
                        {sample.pricing?.currency || 'USD'} {price.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>
          </GlassSection>
        )}
      </div>

      {/* Barcode/QR Code */}
      {sample.barcode && (
        <GlassSection
          title="Barcode/QR Code"
          icon={<SectionIcon icon={QrCode} />}
          variant="neutral"
        >
            <div className="flex items-center gap-6">
              {barcodeImage && (
                <div className="bg-white p-4 border rounded">
                  <img 
                    src={barcodeImage} 
                    alt={`Barcode for sample ${sample.sampleNo}`}
                    className="max-w-xs"
                  />
                </div>
              )}
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Scan this barcode to quickly find this sample
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={downloadBarcode}
                    disabled={!barcodeImage}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(sample.barcode!)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy Code
                  </Button>
                </div>
              </div>
            </div>
        </GlassSection>
      )}

        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          {/* Storage Location */}
          <GlassSection
            title="Storage Location"
            icon={<SectionIcon icon={Building2} />}
            variant="sky"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Rack</Label>
                  <p className="font-mono text-lg">{sample.storageLocation?.rackNumber || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Position</Label>
                  <p className="font-mono text-lg">{(sample.storageLocation?.position ?? 'N/A')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Notes</Label>
                  <p className="font-mono text-lg">{sample.storageLocation?.notes || '-'}</p>
                </div>
              </div>
              {sample.storageLocation?.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Notes</Label>
                  <p className="text-sm">{sample.storageLocation?.notes}</p>
                </div>
              )}
            </div>
          </GlassSection>

          {/* Pricing Information */}
          {hasPermission('samples', 'view_pricing') && (
            <GlassSection
              title="Pricing Information"
              icon={<SectionIcon icon={DollarSign} />}
              variant="emerald"
            >
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Base Price</Label>
                  <p className="text-2xl font-bold text-emerald-600">
                    {(sample.pricing?.currency || 'USD')} {(sample.pricing?.basePrice ?? 0).toFixed(2)}
                  </p>
                </div>

                {sample.pricing?.scalingPrices && sample.pricing.scalingPrices.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Scaling Prices</Label>
                    <div className="space-y-2">
                      {sample.pricing.scalingPrices.map((price, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="font-mono">{price.quantity} KG</span>
                          <span className="font-mono">
                            {sample.pricing?.currency || 'USD'} {price.price.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </GlassSection>
          )}

          {/* Branding Information */}
          {sample.brandedAs && (
            <GlassSection
              title="Branding Information"
              icon={<SectionIcon icon={Tag} />}
              variant="neutral"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Brand Name</Label>
                    <p className="font-semibold text-lg flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      {sample.brandedAs.brand}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Currency</Label>
                    <p className="font-medium">{sample.brandedAs.currency}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Price</Label>
                    <p className="font-medium">
                      {sample.brandedAs.currency === 'USD' ? '$' : sample.brandedAs.currency + ' '}
                      {sample.brandedAs.price.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Suggested Retail Price</Label>
                    <p className="font-medium text-green-600">
                      {sample.brandedAs.currency === 'USD' ? '$' : sample.brandedAs.currency + ' '}
                      {sample.brandedAs.suggestedPrice.toFixed(2)}
                    </p>
                  </div>
                  {sample.brandedAs.price > 0 && sample.brandedAs.suggestedPrice > 0 && (
                    <div className="col-span-2">
                      <Label className="text-sm font-medium text-gray-600">Profit Margin</Label>
                      <div className="bg-green-50 p-3 rounded-lg mt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Markup:</span>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="font-bold text-green-600">
                              {(((sample.brandedAs.suggestedPrice - sample.brandedAs.price) / sample.brandedAs.price) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-gray-600">Profit:</span>
                          <span className="font-bold">
                            {sample.brandedAs.currency === 'USD' ? '$' : sample.brandedAs.currency + ' '}
                            {(sample.brandedAs.suggestedPrice - sample.brandedAs.price).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  {sample.brandedAs.notes && (
                    <div className="col-span-2">
                      <Label className="text-sm font-medium text-gray-600">Notes</Label>
                      <p className="text-sm mt-1 bg-gray-50 p-3 rounded">{sample.brandedAs.notes}</p>
                    </div>
                  )}
                  {sample.brandedAs.brandedBy && sample.brandedAs.brandedAt && (
                    <div className="col-span-2 border-t pt-4 mt-4">
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Branded by: {sample.brandedAs.brandedBy}</span>
                        <span>Branded on: {new Date(sample.brandedAs.brandedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}
                </div>
            </GlassSection>
          )}

          {/* Raw Material Indicator */}
          {sample.isRawMaterial && (
            <GlassSection
              title="Raw Material"
              icon={<SectionIcon icon={Beaker} />}
              variant="neutral"
            >
              <p className="text-orange-800">
                This sample is marked as a raw material and can be used in formula compositions.
              </p>
            </GlassSection>
          )}

          {/* Audit Information */}
          <GlassSection
            title="Audit Information"
            icon={<SectionIcon icon={User} />}
            variant="neutral"
          >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Created By</Label>
                  <p className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {sample.createdBy}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Last Updated By</Label>
                  <p className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {sample.updatedBy}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Created At</Label>
                  <p className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(sample.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Last Updated</Label>
                  <p className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(sample.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
          </GlassSection>
        </TabsContent>

        <TabsContent value="patch" className="space-y-6">
      {/* Patch Number Group */}
      {sample.patchNumber && (
        <PatchNumberGroup
          patchNumber={sample.patchNumber}
              currentSampleId={sample.id}
          onSampleSelect={(selectedSample) => {
            window.dispatchEvent(new CustomEvent('sampleSelected', { detail: selectedSample }));
          }}
        />
      )}
        </TabsContent>

        <TabsContent value="ledger" className="space-y-6">
      {/* Sample Ledger */}
      {sample.ledger && (
        <GlassSection
          title="Sample Ledger"
          icon={<SectionIcon icon={BookOpen} />}
          variant="neutral"
        >
            {/* Basic Ledger Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Supplier Code</Label>
                <p className="font-mono">{ledgerAny.supplierCode || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Supplier Name</Label>
                <p>{ledgerAny.supplierName || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Perfume Series</Label>
                <p>{ledgerAny.perfumeSeries || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Main Brand</Label>
                <p>{sample.ledger.mainBrand}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Priority</Label>
                <PrioritySelector
                  value={sample.ledger.priorityLevel?.toLowerCase() as PriorityValue || 'medium'}
                  onChange={(value) => {
                    // Update sample priority in localStorage
                    const newPriorityLevel = value.charAt(0).toUpperCase() + value.slice(1) as 'Low' | 'Medium' | 'High' | 'Critical';
                    
                    const storedSamples = localStorage.getItem('nbslims_enhanced_samples');
                    if (storedSamples) {
                      try {
                        const samples = JSON.parse(storedSamples);
                        const updatedSamples = samples.map((s: any) => 
                          s.id === sample.id 
                            ? { 
                                ...s, 
                                ledger: { 
                                  ...s.ledger, 
                                  priorityLevel: newPriorityLevel 
                                } 
                              }
                            : s
                        );
                        localStorage.setItem('nbslims_enhanced_samples', JSON.stringify(updatedSamples));
                        
                        // Trigger a custom event to notify other components
                        window.dispatchEvent(new CustomEvent('sampleUpdated', { 
                          detail: { sampleId: sample.id, field: 'priorityLevel', value: newPriorityLevel }
                        }));
                      } catch (error) {
                        console.error('Error updating sample priority:', error);
                      }
                    }
                  }}
                  className="w-32"
                />
              </div>
            </div>

            {/* Alternative Names */}
            {(ledgerAny.alternativeNames?.name1 || ledgerAny.alternativeNames?.name2) && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Alternative Names</Label>
                <div className="flex gap-2 mt-1">
                  {ledgerAny.alternativeNames?.name1 && (
                    <Badge variant="outline">{ledgerAny.alternativeNames?.name1}</Badge>
                  )}
                  {ledgerAny.alternativeNames?.name2 && (
                    <Badge variant="outline">{ledgerAny.alternativeNames?.name2}</Badge>
                  )}
                </div>
              </div>
            )}

            {/* Sample Result and DPG */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Sample Result</Label>
                <Badge className={getStatusColor(sample.ledger.sampleResult)}>
                  {sample.ledger.sampleResult}
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">DPG Dosage %</Label>
                <p className="font-mono">{ledgerAny.dpgPercentage ?? 'N/A'}%</p>
              </div>
              {ledgerAny.previousDpgPercentage && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Related Sample DPG %</Label>
                  <p className="font-mono">{ledgerAny.previousDpgPercentage}%</p>
                </div>
              )}
            </div>

            {/* Related Sample */}
            {ledgerAny.previousDpgSampleId && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Related Sample</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">#{ledgerAny.previousDpgSampleId}</Badge>
                  <Button size="sm" variant="outline">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Concept */}
            {sample.ledger.concept && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Concept</Label>
                <p className="text-sm bg-gray-50 p-2 rounded">{sample.ledger.concept}</p>
              </div>
            )}

            {/* Ingredients */}
            {sample.ledger?.ingredients && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Ingredients</Label>
                <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                  <div>
                    <p className="font-medium text-gray-700">Top Notes</p>
                    {(sample.ledger?.ingredients?.topNotes || []).map((n, i) => (
                      <Badge key={i} variant="outline" className="mr-1 mt-1">{n}</Badge>
                    ))}
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Middle Notes</p>
                    {(sample.ledger?.ingredients?.middleNotes || []).map((n, i) => (
                      <Badge key={i} variant="outline" className="mr-1 mt-1">{n}</Badge>
                    ))}
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Base Notes</p>
                    {(sample.ledger?.ingredients?.baseNotes || []).map((n, i) => (
                      <Badge key={i} variant="outline" className="mr-1 mt-1">{n}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Perfume Description */}
            {ledgerAny.perfumeDescription && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Perfume Description</Label>
                <p className="text-sm bg-gray-50 p-3 rounded mt-1 whitespace-pre-line">
                  {ledgerAny.perfumeDescription}
                </p>
              </div>
            )}

            {/* Date of Arrival */}
            <div>
              <Label className="text-sm font-medium text-gray-600">Date of Sample Arrival</Label>
              <p className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {ledgerAny.dateOfSampleArrival ? new Date(ledgerAny.dateOfSampleArrival).toLocaleDateString() : 'N/A'}
              </p>
            </div>
        </GlassSection>
      )}
        </TabsContent>

        <TabsContent value="formulas" className="space-y-6">
      {/* Formulas (Approved and Failed) */}
      {formulas.length > 0 && (
        <GlassSection
          title="Linked Formulas"
          icon={<SectionIcon icon={Beaker} />}
          variant="neutral"
        >
            <div className="space-y-4">
              {formulas.map((formula) => (
                <div key={formula.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{formula.name}</h4>
                      <p className="text-sm text-gray-600">
                        Created on {new Date(formula.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={getFormulaStatusBadgeColor(formula.status)}>
                      {formula.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-gray-600">Sample Role</Label>
                      <p className="font-medium">
                        {formula.sampleId === sample.id ? 'Primary Sample' : 'Secondary Sample'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Batch Size</Label>
                      <p className="font-medium">{formula.batchSize} {formula.batchUnit}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Cost per Unit</Label>
                      <p className="font-medium">${formula.costPerUnit.toFixed(3)}/{formula.batchUnit}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Total Cost</Label>
                      <p className="font-medium">${formula.totalCost.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  {formula.productId && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <Label className="text-gray-600">Generated Product</Label>
                      <p className="font-medium">{formula.productName}</p>
                      <p className="text-sm text-gray-600">Code: {formula.productCode}</p>
                    </div>
                  )}
                  
                  {formula.notes && (
                    <div>
                      <Label className="text-gray-600">Notes</Label>
                      <p className="text-sm mt-1">{formula.notes}</p>
                    </div>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Open formula details dialog by dispatching an event consumed by Formulas page
                      window.localStorage.setItem('nbslims_open_formula_id', formula.id);
                      window.location.href = '/formulas';
                    }}
                  >
                    View Full Formula Details
                  </Button>
                </div>
              ))}
            </div>
        </GlassSection>
      )}
        </TabsContent>

        <TabsContent value="tests" className="space-y-6">
      {/* Test Results */}
      {tests.length > 0 && (
        <GlassSection
          title="Personal Perfume Tests"
          icon={<SectionIcon icon={FlaskConical} />}
          variant="neutral"
        >
            <div className="space-y-4">
              {tests.map((test) => (
                <div key={test.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Test Date: {new Date(test.date || test.createdAt).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-600">Test ID: {test.id}</p>
                    </div>
                    <Badge className={
                      test.result === 'Accepted' ? 'bg-green-100 text-green-800' :
                      test.result === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {test.result || 'Pending'}
                    </Badge>
                  </div>
                  
                  {test.personalUseData && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {test.personalUseData.topNote && (
                        <div>
                          <Label className="text-gray-600">Top Note</Label>
                          <p className="font-medium">{test.personalUseData.topNote}</p>
                        </div>
                      )}
                      {test.personalUseData.baseNote && (
                        <div>
                          <Label className="text-gray-600">Base Note</Label>
                          <p className="font-medium">{test.personalUseData.baseNote}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {test.personalUseData?.notes && (
                    <div>
                      <Label className="text-gray-600">Test Notes</Label>
                      <p className="text-sm mt-1 bg-gray-50 p-2 rounded">{test.personalUseData.notes}</p>
                    </div>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.href = `/test-management?highlight=${test.id}`}
                  >
                    View Full Test Details
                  </Button>
                </div>
              ))}
            </div>
        </GlassSection>
      )}
        </TabsContent>
      </Tabs>
      
      {/* Cost panel for FORMULA/actual samples (admin only) */}
      {canViewCost && sample.source === 'FORMULA' && sample.traceability === 'actual' && (
        <Card>
          <CardHeader>
            <CardTitle>Cost (admin)</CardTitle>
            {sample.costComputedAt && (
              <CardDescription>Cost as of {new Date(sample.costComputedAt).toLocaleString()}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {sample.materialTrace?.length ? (
              <div className="space-y-2">
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-2">Raw Material</th>
                        <th className="text-left p-2">Qty (g)</th>
                        <th className="text-left p-2">Unit Cost</th>
                        <th className="text-left p-2">Line Cost</th>
                        <th className="text-left p-2">Lot</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sample.materialTrace.map((r: any) => (
                        <tr key={r.id} className="border-t">
                          <td className="p-2 font-mono">{r.rmId}</td>
                          <td className="p-2">{(r.qtyActual ?? 0).toFixed(4)}</td>
                          <td className="p-2">{r.unitCost !== undefined ? (r.unitCost).toFixed(2) : <span className="px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-800">No price</span>}</td>
                          <td className="p-2">{r.lineCost !== undefined ? (r.lineCost).toFixed(2) : '-'}</td>
                          <td className="p-2">{r.lotId || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    {!sample.costComputedAt && 'No cost snapshot. Recompute now.'}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="font-semibold">Total: {sample.costTotal !== undefined ? (sample.costTotal).toFixed(2) : '-'} {sample.currency || ''}</div>
                    <button className="px-3 py-1 border rounded" onClick={async () => {
                      try {
                        const { computeAndAttachSampleCost } = await import('@/features/preparations/costing');
                        await computeAndAttachSampleCost(sample.id);
                        const raw = localStorage.getItem('nbslims_enhanced_samples');
                        const list = raw ? JSON.parse(raw) : [];
                        const updated = list.find((s: any) => s.id === sample.id);
                        if (updated) {
                          // Update the sample prop by calling onEdit if available
                          if (onEdit) onEdit(updated);
                        }
                        const { telemetry } = await import('@/lib/telemetry');
                        telemetry.emit('cost.sample.recomputed', {
                          sampleId: sample.id,
                          preparationSessionId: sample.preparationSessionId,
                          currency: updated?.currency || 'USD',
                          costTotal: updated?.costTotal || 0,
                          rowsPriced: (updated?.materialTrace || []).filter((r: any) => r.lineCost !== undefined).length,
                          rowsMissingPrice: (updated?.materialTrace || []).filter((r: any) => r.lineCost === undefined).length
                        });
                      } catch {}
                    }}>Recompute cost snapshot</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600">No cost snapshot.</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Helper component for labels
const Label: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <label className={`block text-sm font-medium text-gray-700 ${className}`}>
    {children}
  </label>
);
