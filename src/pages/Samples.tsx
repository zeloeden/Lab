import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { normalizeForSearch } from '@/lib/qr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Plus, Search, Filter, Edit, Trash2, Eye, Package, Clock, CheckCircle, MapPin, Printer, BookOpen, TestTube, Download, QrCode } from 'lucide-react';
import { testService } from '@/services/testService';
import { barcodeGenerator } from '@/lib/barcodeUtils';
import { supplierService } from '@/services/supplierService';
import { SampleForm } from '@/components/SampleForm';
import { SampleLedgerAdvanced } from '@/components/SampleLedgerAdvanced';
import { SampleBranding } from '@/components/SampleBranding';
import { SampleDetail } from '@/components/SampleDetail';
import { TestFormulaDialog } from '@/components/TestFormulaDialog';
import GlassDialog from '@/components/ui/GlassDialog';
import { getFieldOptions } from '@/lib/customFieldsUtils';
import { Sample } from '@/lib/types';
import { PreparationDetails } from '@/features/preparations/PreparationDetails';
import { guardManualFormulaCreation } from '@/lib/sampleGuards';

// Enhanced sample service that uses the same storage as the enhanced samples
const sampleService = {
  getAllSamples: async () => {
    const stored = localStorage.getItem('nbslims_enhanced_samples');
    return stored ? JSON.parse(stored) : [];
  },
  createSample: async (data: any) => {
    const samples = await sampleService.getAllSamples();
    
    // Validate sample ID uniqueness
    if (data.sampleId) {
      const existingWithSameId = samples.find((s: any) => s.sampleId === data.sampleId);
      if (existingWithSameId) {
        throw new Error(`Sample ID "${data.sampleId}" already exists. Please use a different ID.`);
      }
    }
    
    const newSample = {
      ...data,
      id: `sample-${Date.now()}`,
      sampleNo: samples.length + 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const updated = [newSample, ...samples];
    localStorage.setItem('nbslims_enhanced_samples', JSON.stringify(updated));
    return newSample;
  },
  updateSample: async (id: string, data: any) => {
    const samples = await sampleService.getAllSamples();
    
    // Validate sample ID uniqueness if being updated
    if (data.sampleId) {
      const existingWithSameId = samples.find((s: any) => s.sampleId === data.sampleId && s.id !== id);
      if (existingWithSameId) {
        throw new Error(`Sample ID "${data.sampleId}" already exists. Please use a different ID.`);
      }
    }
    
    const updated = samples.map((s: any) => s.id === id ? { ...s, ...data, updatedAt: new Date() } : s);
    localStorage.setItem('nbslims_enhanced_samples', JSON.stringify(updated));
    return updated.find((s: any) => s.id === id);
  }
};


const companyService = {
  getAllCompanies: async () => {
    const stored = localStorage.getItem('nbslims_companies');
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Default companies if none exist
    const defaultCompanies = [
      { id: 'comp-1', name: 'Company A', hasScalingPricing: true },
      { id: 'comp-2', name: 'Company B', hasScalingPricing: false },
      { id: 'comp-3', name: 'Company C', hasScalingPricing: true }
    ];
    localStorage.setItem('nbslims_companies', JSON.stringify(defaultCompanies));
    return defaultCompanies;
  }
};

interface EnhancedSample {
  id: string;
  sampleNo: number;
  sampleId?: string; // Make optional to match usage
  itemNameEN: string;
  itemNameAR?: string;
  supplierId: string;
  patchNumber?: string;
  category?: string;
  refCode?: string;
  supplierCode?: string;
  barcode?: string;
  qrCode?: string;
  qrImageBase64?: string;
  dateOfSample?: Date;
  itemGroup?: string;
  status: 'Untested' | 'Pending' | 'Testing' | 'Rejected' | 'Accepted';
  approved?: boolean;
  approvedTestId?: string;
  customIdNo?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
  storageLocation?: {
    rackNumber?: string;
    position?: number;
    rackArea?: string; // Keep for backward compatibility
    notes?: string;
  };
  pricing?: {
    basePrice?: number;
    currency?: string;
    scalingPrices?: any[];
  };
  shorjaBranch?: {
    sentToShorja: boolean;
    comment?: string;
    sentDate?: Date;
  };
  ledger?: any;
  tests?: any[]; // Tests associated with this sample
  shipment?: {
    carrier?: string;
    airWaybill?: string;
    shipmentNotes?: string;
    originCountry?: string;
  };
  isFinishedGood?: boolean;
  sourceFormulaId?: string;
}

export const Samples: React.FC = () => {
  const [sp] = useSearchParams();
  const { user, hasPermission } = useAuth();
  const canViewCost = (user?.role === 'Admin' || (user as any)?.role === 'Owner' || hasPermission('purchasing','view_costs'));
  
  const [samples, setSamples] = useState<EnhancedSample[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rawQuery, setRawQuery] = useState('');
  const query = useMemo(() => normalizeForSearch(rawQuery), [rawQuery]);
  const [statusFilter, setStatusFilter] = useState<'all'|'Untested'|'Tested'>('Untested');
  const [sourceFilter, setSourceFilter] = useState<'all'|'FORMULA'|'SAMPLE'>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDateGroupDialogOpen, setIsDateGroupDialogOpen] = useState(false);
  const [isLedgerDialogOpen, setIsLedgerDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'samples' | 'branding'>('samples');
  const [isTestFormulaDialogOpen, setIsTestFormulaDialogOpen] = useState(false);
  const [selectedSampleForDialog, setSelectedSampleForDialog] = useState<EnhancedSample | null>(null);
  const [prepSheetId, setPrepSheetId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'createdAt'|'id'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');
  const [debouncedSearch, setDebouncedSearch] = useState(query);

  // Persist/restore UI state
  useEffect(()=>{
    try {
      const raw = localStorage.getItem('samples_ui_state_v1');
      if (raw){
        const st = JSON.parse(raw);
        if (st.statusFilter) setStatusFilter(st.statusFilter);
        if (st.sourceFilter) setSourceFilter(st.sourceFilter);
        if (st.sortField) setSortField(st.sortField);
        if (st.sortDir) setSortDir(st.sortDir);
      }
    } catch {}
  }, []);
  useEffect(()=>{
    try {
      localStorage.setItem('samples_ui_state_v1', JSON.stringify({ statusFilter, sourceFilter, sortField, sortDir }));
    } catch {}
  }, [statusFilter, sourceFilter, sortField, sortDir]);

  // Debounce search input
  useEffect(()=>{
    const t = setTimeout(()=> setDebouncedSearch(query), 150);
    return ()=> clearTimeout(t);
  }, [query]);

  // Seed search from ?code= or ?search=
  useEffect(()=>{
    const code = (sp.get('code') || sp.get('search') || '').trim();
    if (code) setRawQuery(code);
  }, [sp]);

  const norm = (s:string) => s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
  const esc = (s:string) => s.replace(/[&<>"']/g, (c)=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c] as string));
  const tokenize = (s:string) => norm(s).trim().split(/\s+/).filter(Boolean);

  const highlight = (text:string, tokens:string[]) => {
    const norm = (s:string)=> s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
    const src = text ?? '';
    const nsrc = norm(src);
    const ranges: Array<[number, number]> = [];
    for (const t of tokens){
      const nt = norm(t);
      let i = nsrc.indexOf(nt);
      while (nt && i !== -1){ ranges.push([i, i+nt.length]); i = nsrc.indexOf(nt, i+nt.length); }
    }
    ranges.sort((a,b)=> a[0]-b[0]);
    const merged: Array<[number, number]> = [];
    for (const [s,e] of ranges){ if (!merged.length || s > merged.at(-1)![1]) merged.push([s,e]); else merged.at(-1)![1] = Math.max(merged.at(-1)![1], e); }
    const out: React.ReactNode[] = [];
    let pos = 0;
    for (const [s,e] of merged){ if (pos < s) out.push(src.slice(pos,s)); out.push(<mark key={s}>{src.slice(s,e)}</mark>); pos = e; }
    if (pos < src.length) out.push(src.slice(pos));
    return <>{out}</>;
  };
  
  const [selectedSample, setSelectedSample] = useState<EnhancedSample | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Form state for both create and edit
  const [formData, setFormData] = useState({
    sampleId: '',
    itemNameEN: '',
    itemNameAR: '',
    supplierId: '',
    category: '',
    refCode: '', // New field for reference code
    status: 'Untested' as 'Untested' | 'Pending' | 'Testing' | 'Rejected' | 'Accepted',
    // Storage location fields
    rackArea: '',
    locationNotes: '',
    // Shorja branch fields
    sentToShorja: false,
    shorjaComment: '',
    // Company pricing fields
    companyId: '',
    hasScalingPricing: true,
    basePrice: '',
    scalingPrices: {
      weight1: '25 kg',
      price1: '30$',
      weight2: '100 kg',
      price2: '35$',
      weight3: '250 kg',
      price3: '40$'
    }
  });

  useEffect(() => {
    loadData();
    
    // Listen for all data updates
    const handleSampleUpdate = () => {
      loadData();
    };
    const handleSampleSelected = (e: any) => {
      const s = e?.detail;
      if (!s) return;
      setSelectedSample(s);
      setIsViewDialogOpen(true);
    };
    
    const handleSupplierUpdate = () => {
      loadData();
    };
    
    window.addEventListener('sampleUpdated', handleSampleUpdate);
    window.addEventListener('sampleCreated', handleSampleUpdate);
    window.addEventListener('sampleSelected', handleSampleSelected as EventListener);
    window.addEventListener('supplierUpdated', handleSupplierUpdate);
    
    return () => {
      window.removeEventListener('sampleUpdated', handleSampleUpdate);
      window.removeEventListener('sampleCreated', handleSampleUpdate);
      window.removeEventListener('sampleSelected', handleSampleSelected as EventListener);
      window.removeEventListener('supplierUpdated', handleSupplierUpdate);
    };
    // Highlight newly created from preparation
    const url = new URLSearchParams(window.location.search);
    const highlightByPrep = url.get('highlightByPrep');
    if (highlightByPrep){
      // show toast and open the row if present
      setTimeout(()=>{
        try {
          const stored = localStorage.getItem('nbslims_enhanced_samples');
          const list = stored ? JSON.parse(stored) : [];
          const found = list.find((s:any)=> s.preparationSessionId === highlightByPrep);
          if (found){
            const existed = !!samples.find((s:any)=> s.preparationSessionId === highlightByPrep);
            window.dispatchEvent(new CustomEvent('toast', { detail: { type:'success', message: existed ? 'Formula Sample updated — already exists for this preparation.' : 'Formula Sample created — start its test whenever you’re ready.' } }));
            setSelectedSample(found);
            setIsViewDialogOpen(true);
          }
        } catch {}
      }, 300);
      // remove parameter
      try { window.history.replaceState({}, '', window.location.pathname); } catch {}
    }
    const prepIdFromRoute = url.get('prep');
    if (prepIdFromRoute){ setPrepSheetId(prepIdFromRoute); }
  }, []);

  const loadSuppliersFromStorage = async () => {
    try {
      // Try to get suppliers from localStorage first
      const storedSuppliers = localStorage.getItem('nbslims_suppliers');
      if (storedSuppliers) {
        const suppliers = JSON.parse(storedSuppliers);
        // Convert complex supplier objects to simple format for compatibility
        return suppliers.map((supplier: any) => ({
          id: supplier.id,
          name: supplier.name,
          code: supplier.code || supplier.contactPerson || '',
          email: supplier.email,
          phone: supplier.phone,
          address: supplier.address,
          country: supplier.country,
          status: supplier.status
        }));
      }
      
      // If no stored suppliers, try the real supplier service
      try {
        const realSuppliers = await supplierService.getAllSuppliers();
        if (realSuppliers.length > 0) {
          const compatibleSuppliers = realSuppliers.map((supplier: any) => ({
            id: supplier.id,
            name: supplier.name,
            code: supplier.code || '',
            email: supplier.email,
            phone: supplier.phone,
            address: supplier.address,
            country: supplier.country,
            status: supplier.status
          }));
          localStorage.setItem('nbslims_suppliers', JSON.stringify(realSuppliers));
          return compatibleSuppliers;
        }
      } catch (error) {
        console.warn('Real supplier service not available, using defaults');
      }
      
      // Fallback to default suppliers
      const defaultSuppliers = [
        { id: 'sup-1', name: 'Chemical Supplies Co.', code: 'CHEM001', country: 'United Arab Emirates' },
        { id: 'sup-2', name: 'Lab Equipment Ltd.', code: 'LAB002', country: 'United States' },
        { id: 'sup-3', name: 'Scientific Materials Inc.', code: 'SCI003', country: 'Germany' }
      ];
      localStorage.setItem('nbslims_suppliers', JSON.stringify(defaultSuppliers));
      return defaultSuppliers;
    } catch (error) {
      console.error('Error loading suppliers:', error);
      return [];
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [samplesData, suppliersData, companiesData, testsData] = await Promise.all([
        sampleService.getAllSamples(),
        loadSuppliersFromStorage(),
        companyService.getAllCompanies(),
        testService.getAllTests()
      ]);
      
      const storedSamples = localStorage.getItem('nbslims_enhanced_samples');
      let enhancedSamples;
      
      if (storedSamples) {
        enhancedSamples = JSON.parse(storedSamples);
      } else {
        enhancedSamples = samplesData.map((sample: any) => ({
          ...sample,
          storageLocation: undefined
        }));
        localStorage.setItem('nbslims_enhanced_samples', JSON.stringify(enhancedSamples));
      }
      
      // Generate barcodes (and QR if missing) for samples that don't have them
      const samplesWithBarcodes = enhancedSamples.map((sample: any) => {
        let updated = { ...sample };
        if (!updated.barcode) {
          const barcode = barcodeGenerator.generateBarcodeString(updated.sampleNo || 1);
          updated.barcode = barcode;
          // fallback qrCode to barcode text if none
          if (!updated.qrCode) updated.qrCode = barcode;
        }
        return updated;
      });

      // Ensure every sample has a generated QR image (qrImageBase64)
      // We keep this serial to avoid blocking UI; runs once at load
      for (let i = 0; i < samplesWithBarcodes.length; i++) {
        const s = samplesWithBarcodes[i];
        if (!s.qrImageBase64) {
          try {
            const { qrGenerator } = await import('@/lib/qrGenerator');
            const qrResult = await qrGenerator.generateSampleQR({
              sampleId: s.sampleId || s.id,
              sampleNo: s.sampleNo || i + 1,
              itemNameEN: s.itemNameEN || '',
              itemNameAR: s.itemNameAR || '',
              supplierId: s.supplierId || '',
              supplierCode: s.supplierCode || '',
              storageLocation: {
                rackArea: s.storageLocation?.rackArea || s.storageLocation?.rackNumber,
                rackNumber: s.storageLocation?.rackNumber,
                position: s.storageLocation?.position || 0
              },
              createdAt: new Date(s.createdAt || Date.now()),
              customIdNo: s.customIdNo || s.sampleId
            });
            s.qrCode = s.qrCode || qrResult.qrId;
            s.qrImageBase64 = qrResult.qrImageBase64;
          } catch (e) {
            console.warn('QR generation skipped for sample', s.id, e);
          }
        }
      }
      
      // Associate tests with samples
      const samplesWithTests = samplesWithBarcodes.map((sample: any) => {
        const sampleTests = testsData.filter((test: any) => test.sampleId === sample.id);
        return {
          ...sample,
          tests: sampleTests
        };
      });
      
      setSamples(samplesWithTests);
      // Save updated samples with barcodes
      localStorage.setItem('nbslims_enhanced_samples', JSON.stringify(samplesWithTests));
      setSuppliers(suppliersData);
      setCompanies(companiesData);
    } catch (error) {
      toast.error('Failed to load data');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSamples = useCallback((updatedSamples: EnhancedSample[]) => {
    setSamples(updatedSamples);
    localStorage.setItem('nbslims_enhanced_samples', JSON.stringify(updatedSamples));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      sampleId: '',
      itemNameEN: '',
      itemNameAR: '',
      supplierId: '',
      category: '',
      refCode: '',
      status: 'Untested',
      rackArea: '',
      locationNotes: '',
      sentToShorja: false,
      shorjaComment: '',
      companyId: '',
      hasScalingPricing: false,
      basePrice: '',
      scalingPrices: {
        weight1: '25 kg',
        price1: '30$',
        weight2: '100 kg',
        price2: '35$',
        weight3: '250 kg',
        price3: '40$'
      }
    });
  }, []);

  const handleCreateSample = useCallback(async () => {
    // Guard against manual FORMULA sample creation
    if ((formData as any).source === 'FORMULA') {
      guardManualFormulaCreation();
      return;
    }
    
    if (!formData.itemNameEN || !formData.supplierId || !formData.sampleId) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      // Generate barcode and QR code for new sample
      const tempSampleNo = samples.length + 1;
      const barcode = barcodeGenerator.generateBarcodeString(tempSampleNo);
      
      const sampleData = {
        sampleId: formData.sampleId,
        itemNameEN: formData.itemNameEN,
        itemNameAR: formData.itemNameAR,
        supplierId: formData.supplierId,
        category: formData.category,
        refCode: formData.refCode,
        status: formData.status,
        barcode: barcode,
        qrCode: barcode,
        createdBy: user?.id || 'unknown'
      };

      const newSample = await sampleService.createSample(sampleData);
      
      // Add storage location if provided
      let storageLocation = undefined;
      if (formData.rackArea && formData.rackArea.trim()) {
        storageLocation = {
          rackArea: formData.rackArea.trim(),
          notes: formData.locationNotes.trim()
        };
      }

      // Add Shorja branch info if provided
      let shorjaBranch = undefined;
      if (formData.sentToShorja) {
        shorjaBranch = {
          sentToShorja: formData.sentToShorja,
          comment: formData.shorjaComment.trim() || undefined,
          sentDate: new Date()
        };
      }

      // Add company pricing info if provided
      let companyPricing = undefined;
      if (formData.companyId) {
        const selectedCompany = companies.find(c => c.id === formData.companyId);
        companyPricing = {
          companyId: formData.companyId,
          hasScalingPricing: formData.hasScalingPricing,
          basePrice: formData.basePrice ? parseFloat(formData.basePrice) : undefined,
          scalingPrices: formData.hasScalingPricing ? formData.scalingPrices : undefined
        };
      }

      const enhancedSample: EnhancedSample = {
        ...newSample,
        storageLocation,
        shorjaBranch,
        companyPricing
      };
      
      const updatedSamples = [enhancedSample, ...samples];
      saveSamples(updatedSamples);
      
      // Trigger event to notify other components
      window.dispatchEvent(new CustomEvent('sampleCreated', { 
        detail: { sampleId: enhancedSample.id, field: 'created', value: enhancedSample }
      }));
      
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success('Sample created successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create sample';
      toast.error(errorMessage);
      console.error('Error creating sample:', error);
    }
  }, [formData, user?.id, samples, saveSamples, resetForm]);

  const handleViewClick = useCallback((sample: EnhancedSample) => {
    setSelectedSample(sample);
    setIsViewDialogOpen(true);
  }, []);

  const handleTestSample = useCallback((sample: EnhancedSample) => {
    // Check if tests exist for this sample
    const storedTests = localStorage.getItem('nbslims_tests');
    const allTests = storedTests ? JSON.parse(storedTests) : [];
    const sampleTests = allTests.filter((test: any) => test.sampleId === sample.id);
    const hasTests = sampleTests.length > 0;
    
    if (hasTests) {
      // If test exists, navigate to test management page with the most recent test highlighted
      const mostRecentTest = sampleTests.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      window.location.href = `/test-management?highlight=${mostRecentTest.id}`;
    } else {
      // If no test exists, show dialog to choose between test and formula
      setSelectedSampleForDialog(sample);
      setIsTestFormulaDialogOpen(true);
    }
  }, []);

  const handleSelectTest = useCallback(() => {
    if (selectedSampleForDialog) {
      window.location.href = `/test-management?createFor=${selectedSampleForDialog.id}`;
    }
    setIsTestFormulaDialogOpen(false);
    setSelectedSampleForDialog(null);
  }, [selectedSampleForDialog]);

  const handleSelectFormula = useCallback(() => {
    if (selectedSampleForDialog) {
      // Set the sample as the primary sample in localStorage for the formula page to pick up
      localStorage.setItem('nbslims_open_formula_sample_id', selectedSampleForDialog.id);
      window.location.href = '/formulas';
    }
    setIsTestFormulaDialogOpen(false);
    setSelectedSampleForDialog(null);
  }, [selectedSampleForDialog]);

  const handlePrintLabel = useCallback((sample: EnhancedSample) => {
    // Store sample data for label editor
    const sampleData = {
      id: sample.id,
      ArabicName: sample.itemNameAR || '',
      EnglishName: sample.itemNameEN,
      SupplierCode: sample.supplierCode || '',
      Price25: 0,
      Price50: 0,
      Price100: 0,
      QRValue: sample.qrCode || '',
      BarcodeValue: sample.barcode || '',
      ExtraFields: {}
    };
    
    // Store in localStorage for the label editor to pick up
    localStorage.setItem('nbslims_label_editor_sample', JSON.stringify(sampleData));
    
    // Navigate to label editor
    window.location.href = '/label-editor';
  }, []);

  const handleDateClick = useCallback((date: string) => {
    setSelectedDate(date);
    setIsDateGroupDialogOpen(true);
  }, []);

  const getDateSamples = useCallback((date: string) => {
    return samples.filter(sample => {
      if (!sample.dateOfSample) return false;
      const sampleDate = new Date(sample.dateOfSample).toISOString().split('T')[0];
      return sampleDate === date;
    });
  }, [samples]);

  const handleEditClick = useCallback((sample: EnhancedSample) => {
    setSelectedSample(sample);
    setFormData({
      sampleId: sample.sampleId || '',
      itemNameEN: sample.itemNameEN,
      itemNameAR: sample.itemNameAR || '',
      supplierId: sample.supplierId,
      category: sample.category || '',
      refCode: sample.refCode || '',
      status: sample.status,
      rackArea: sample.storageLocation?.rackArea || '',
      locationNotes: sample.storageLocation?.notes || '',
      sentToShorja: sample.shorjaBranch?.sentToShorja || false,
      shorjaComment: sample.shorjaBranch?.comment || '',
      companyId: '',
      hasScalingPricing: sample.pricing?.scalingPrices && sample.pricing.scalingPrices.length > 0,
      basePrice: sample.pricing?.basePrice?.toString() || '',
      scalingPrices: {
        weight1: sample.pricing?.scalingPrices?.[0]?.weight || '25 kg',
        price1: sample.pricing?.scalingPrices?.[0]?.price?.toString() || '30$',
        weight2: sample.pricing?.scalingPrices?.[1]?.weight || '100 kg',
        price2: sample.pricing?.scalingPrices?.[1]?.price?.toString() || '35$',
        weight3: sample.pricing?.scalingPrices?.[2]?.weight || '250 kg',
        price3: sample.pricing?.scalingPrices?.[2]?.price?.toString() || '40$'
      }
    });
    setIsEditDialogOpen(true);
  }, []);

  const handleUpdateSample = useCallback(async () => {
    if (!selectedSample || !formData.itemNameEN || !formData.supplierId || !formData.sampleId) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      // Create storage location if any location field is provided
      let storageLocation = undefined;
      if (formData.rackArea.trim() || formData.locationNotes.trim()) {
        storageLocation = {
          rackArea: formData.rackArea.trim(),
          notes: formData.locationNotes.trim()
        };
      }

      // Create Shorja branch info if provided
      let shorjaBranch = undefined;
      if (formData.sentToShorja) {
        shorjaBranch = {
          sentToShorja: formData.sentToShorja,
          comment: formData.shorjaComment.trim() || undefined,
          sentDate: new Date()
        };
      }

      // Create company pricing info if provided
      let companyPricing = undefined;
      if (formData.companyId) {
        const selectedCompany = companies.find(c => c.id === formData.companyId);
        companyPricing = {
          companyId: formData.companyId,
          hasScalingPricing: formData.hasScalingPricing,
          basePrice: formData.basePrice ? parseFloat(formData.basePrice) : undefined,
          scalingPrices: formData.hasScalingPricing ? formData.scalingPrices : undefined
        };
      }

      const updatedSamples = samples.map(s => 
        s.id === selectedSample.id 
          ? { 
              ...s, 
              sampleId: formData.sampleId,
              itemNameEN: formData.itemNameEN,
              itemNameAR: formData.itemNameAR,
              supplierId: formData.supplierId,
              category: formData.category,
              refCode: formData.refCode,
              status: formData.status,
              storageLocation,
              shorjaBranch,
              companyPricing,
              updatedAt: new Date()
            }
          : s
      );
      
      saveSamples(updatedSamples);
      setIsEditDialogOpen(false);
      setSelectedSample(null);
      resetForm();
      toast.success('Sample updated successfully');
    } catch (error) {
      toast.error('Failed to update sample');
      console.error('Error updating sample:', error);
    }
  }, [selectedSample, formData, samples, saveSamples, resetForm]);

  const filteredSamples = samples.filter(sample => {
    const tokens = tokenize(debouncedSearch);
    const hay = {
      sampleCode: sample.sampleId || '',
      formulaCode: (sample as any).formulaId || '',
      formulaName: sample.itemNameEN || '',
      lot: (sample as any).materialTrace?.find?.((t:any)=> t.lotId)?.lotId || '',
      notes: (sample as any).notes || '',
      supplierName: (suppliers.find(s=> s.id===sample.supplierId)?.name) || '',
      prepId: (sample as any).preparationSessionId || ''
    };
    const fieldsNorm = Object.fromEntries(Object.entries(hay).map(([k,v])=> [k, norm(String(v))]));
    const match = tokens.length===0 || tokens.some(tok =>
      fieldsNorm.sampleCode.includes(tok) || fieldsNorm.formulaCode.includes(tok) || fieldsNorm.formulaName.includes(tok) || fieldsNorm.lot.includes(tok) || fieldsNorm.notes.includes(tok) || fieldsNorm.supplierName.includes(tok) || fieldsNorm.prepId.includes(tok)
    );
    
    const matchesStatus = statusFilter === 'all' || sample.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || (sample as any).source === sourceFilter;
    
    const matchesLocation = locationFilter === 'all' || 
                           (locationFilter === 'stored' && sample.storageLocation) ||
                           (locationFilter === 'unstored' && !sample.storageLocation);
    
    return match && matchesStatus && matchesSource && matchesLocation;
  });

  // Ranking and sorting
  const rankedAndSorted = [...filteredSamples].map(s => {
    const tokens = tokenize(debouncedSearch);
    const fCode = norm(String((s as any).formulaId || ''));
    const sCode = norm(String(s.sampleId || ''));
    const other = norm(`${(suppliers.find(x=>x.id===s.supplierId)?.name)||''} ${(s as any).preparationSessionId||''}`);
    const score = tokens.reduce((acc, t)=> acc + (fCode.includes(t)?3:0) + (sCode.includes(t)?2:0) + (other.includes(t)?1:0), 0);
    return { s, score };
  }).sort((a,b)=>{
    if (b.score !== a.score) return b.score - a.score;
    const ca = new Date(a.s.createdAt as any).getTime() || 0;
    const cb = new Date(b.s.createdAt as any).getTime() || 0;
    const byCreated = sortDir==='desc' ? cb - ca : ca - cb;
    if (byCreated !== 0) return byCreated;
    return (sortDir==='desc' ? String(b.s.id).localeCompare(String(a.s.id)) : String(a.s.id).localeCompare(String(b.s.id)));
  }).map(x=> x.s);

  // Telemetry: samples viewed
  useEffect(()=>{
    (async()=>{
      try {
        const { telemetry } = await import('@/lib/telemetry');
        telemetry.emit('samples.viewed', { count: rankedAndSorted.length, filters:{ status: statusFilter, source: sourceFilter }, sort:{ field: sortField, dir: sortDir } });
      } catch {}
    })();
  }, [debouncedSearch, statusFilter, sourceFilter, sortField, sortDir, rankedAndSorted.length]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Untested': return 'bg-gray-100 text-gray-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Testing': return 'bg-blue-100 text-blue-800';
      case 'Accepted': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };


  const formatStorageLocation = (location: EnhancedSample['storageLocation']) => {
    if (!location || !location.rackArea) return 'Not assigned';
    
    return location.rackArea;
  };

  const uniqueRacks = [...new Set(samples
    .filter(s => s.storageLocation?.rackArea)
    .map(s => s.storageLocation!.rackArea)
  )].sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading samples...</p>
        </div>
      </div>
    );
  }

  const renderSampleForm = (isEdit = false) => (
    <div className="space-y-6">
      {/* Basic Sample Information */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sampleId">Sample No *</Label>
            <Input
              id="sampleId"
              value={formData.sampleId}
              onChange={(e) => setFormData(prev => ({ ...prev, sampleId: e.target.value }))}
              placeholder="Enter sample number"
            />
          </div>
          <div>
            <Label htmlFor="itemNameEN">Item Name (EN) *</Label>
            <Input
              id="itemNameEN"
              value={formData.itemNameEN}
              onChange={(e) => setFormData(prev => ({ ...prev, itemNameEN: e.target.value }))}
              placeholder="Enter item name in English"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="itemNameAR">Item Name (AR)</Label>
            <Input
              id="itemNameAR"
              value={formData.itemNameAR}
              onChange={(e) => setFormData(prev => ({ ...prev, itemNameAR: e.target.value }))}
              placeholder="Enter item name in Arabic"
              dir="rtl"
            />
          </div>
          <div>
            <Label htmlFor="refCode">Ref Code</Label>
            <Input
              id="refCode"
              value={formData.refCode}
              onChange={(e) => setFormData(prev => ({ ...prev, refCode: e.target.value }))}
              placeholder="Enter reference code"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="supplier">Supplier *</Label>
            <Select value={formData.supplierId} onValueChange={(value) => setFormData(prev => ({ ...prev, supplierId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map(supplier => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              placeholder="e.g., Raw Materials, Chemicals"
            />
          </div>
        </div>

      </div>

      <Separator />

      {/* Storage Location Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-purple-500" />
          <Label className="text-base font-medium">Storage Location (Optional)</Label>
        </div>
        <p className="text-sm text-gray-500">
          Specify where this sample will be stored in the laboratory
        </p>

        <div>
          <Label htmlFor="rackArea">Rack/Storage Area</Label>
          <Input
            id="rackArea"
            value={formData.rackArea}
            onChange={(e) => setFormData(prev => ({ ...prev, rackArea: e.target.value }))}
            placeholder="e.g., Rack A, Storage Room 1"
          />
        </div>

        <div>
          <Label htmlFor="locationNotes">Storage Notes</Label>
          <Textarea
            id="locationNotes"
            value={formData.locationNotes}
            onChange={(e) => setFormData(prev => ({ ...prev, locationNotes: e.target.value }))}
            placeholder="Additional storage notes or special instructions"
            rows={3}
          />
        </div>
      </div>

      {/* Shorja Branch Section */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Shorja Branch (Optional)</Label>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="sentToShorja"
              checked={formData.sentToShorja}
              onChange={(e) => setFormData(prev => ({ ...prev, sentToShorja: e.target.checked }))}
              className="rounded"
            />
            <Label htmlFor="sentToShorja" className="text-sm font-normal">
              Sample was sent to Shorja branch
            </Label>
          </div>
          
          {formData.sentToShorja && (
            <div>
              <Label htmlFor="shorjaComment">Shorja Branch Comment</Label>
              <Textarea
                id="shorjaComment"
                value={formData.shorjaComment}
                onChange={(e) => setFormData(prev => ({ ...prev, shorjaComment: e.target.value }))}
                placeholder="Enter comment from Shorja branch"
                rows={3}
              />
            </div>
          )}
        </div>
      </div>

      {/* Company Pricing Section */}
      {hasPermission('samples', 'view_pricing') && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-green-500" />
            <Label className="text-base font-medium">Company Pricing (Optional)</Label>
          </div>
          <p className="text-sm text-gray-500">
            Configure pricing information for different companies
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="companyId">Company</Label>
              <Select value={formData.companyId} onValueChange={(value) => {
                const selectedCompany = companies.find(c => c.id === value);
                setFormData(prev => ({ 
                  ...prev, 
                  companyId: value,
                  hasScalingPricing: selectedCompany?.hasScalingPricing || false
                }));
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="basePrice">Base Price ($)</Label>
              <Input
                id="basePrice"
                type="number"
                value={formData.basePrice}
                onChange={(e) => setFormData(prev => ({ ...prev, basePrice: e.target.value }))}
                placeholder="Enter base price"
              />
            </div>
          </div>

          {formData.companyId && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="hasScalingPricing"
                  checked={formData.hasScalingPricing}
                  onChange={(e) => setFormData(prev => ({ ...prev, hasScalingPricing: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="hasScalingPricing" className="text-sm font-normal">
                  This company uses scaling pricing (different prices for different weights)
                </Label>
              </div>
              
              {formData.hasScalingPricing && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Weight 1</Label>
                      <Input
                        value={formData.scalingPrices.weight1}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          scalingPrices: { ...prev.scalingPrices, weight1: e.target.value }
                        }))}
                        placeholder="25 kg"
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Weight 2</Label>
                      <Input
                        value={formData.scalingPrices.weight2}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          scalingPrices: { ...prev.scalingPrices, weight2: e.target.value }
                        }))}
                        placeholder="100 kg"
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Weight 3</Label>
                      <Input
                        value={formData.scalingPrices.weight3}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          scalingPrices: { ...prev.scalingPrices, weight3: e.target.value }
                        }))}
                        placeholder="250 kg"
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Price 1</Label>
                      <Input
                        value={formData.scalingPrices.price1}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          scalingPrices: { ...prev.scalingPrices, price1: e.target.value }
                        }))}
                        placeholder="30$"
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Price 2</Label>
                      <Input
                        value={formData.scalingPrices.price2}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          scalingPrices: { ...prev.scalingPrices, price2: e.target.value }
                        }))}
                        placeholder="35$"
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Price 3</Label>
                      <Input
                        value={formData.scalingPrices.price3}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          scalingPrices: { ...prev.scalingPrices, price3: e.target.value }
                        }))}
                        placeholder="40$"
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <Button 
          variant="outline" 
          onClick={() => {
            if (isEdit) {
              setIsEditDialogOpen(false);
            } else {
              setIsCreateDialogOpen(false);
            }
            resetForm();
          }}
        >
          Cancel
        </Button>
        <Button onClick={isEdit ? handleUpdateSample : handleCreateSample}>
          {isEdit ? 'Update Sample' : 'Create Sample'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sample Management</h1>
          <p className="text-gray-600">Track and manage laboratory samples with integrated storage locations</p>
        </div>
        <div className="flex space-x-2">
          {activeTab === 'samples' && hasPermission('samples', 'create') && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Sample
                </Button>
              </DialogTrigger>
              <DialogContent 
                className="max-w-4xl max-h-[90vh] overflow-y-auto"
                onInteractOutside={(e) => e.preventDefault()}
              >
                <DialogHeader>
                  <DialogTitle>Create New Sample</DialogTitle>
                  <DialogDescription>
                    Add a new sample with comprehensive storage location and pricing information
                  </DialogDescription>
                </DialogHeader>
                <SampleForm
                  suppliers={suppliers}
                  onSave={(sample) => {
                    // Map storage location from SampleForm format to Samples format
                    const storageLocation = sample.storageLocation ? {
                      rackArea: sample.storageLocation.rackNumber || '',
                      rackNumber: sample.storageLocation.rackNumber || '',
                      position: sample.storageLocation.position || 0,
                      notes: sample.storageLocation.notes || ''
                    } : undefined;

                    const enhancedSample: EnhancedSample = {
                      ...sample,
                      id: `sample-${Date.now()}`,
                      sampleNo: samples.length + 1,
                      sampleId: sample.customIdNo || sample.id,
                      storageLocation,
                      tests: [],
                      createdBy: user?.id || 'unknown',
                      updatedBy: user?.id || 'unknown'
                    };
                    const updatedSamples = [enhancedSample, ...samples];
                    saveSamples(updatedSamples);
                    setIsCreateDialogOpen(false);
                    toast.success('Sample created successfully');
                  }}
                  onCancel={() => setIsCreateDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'samples' | 'branding')} className="space-y-6">
        <TabsList>
          <TabsTrigger value="samples">Samples</TabsTrigger>
          <TabsTrigger value="branding">Sample Branding</TabsTrigger>
        </TabsList>

        <TabsContent value="samples" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold">{samples.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold">{samples.filter(s => s.status === 'Pending').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-blue-500 rounded-full" />
                  <div>
                    <p className="text-sm text-gray-600">Testing</p>
                    <p className="text-2xl font-bold">{samples.filter(s => s.status === 'Testing').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Accepted</p>
                    <p className="text-2xl font-bold">{samples.filter(s => s.status === 'Accepted').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-600">Stored</p>
                    <p className="text-2xl font-bold">{samples.filter(s => s.storageLocation).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by Sample Code, Formula Code, Lot, notes..."
                      value={rawQuery}
                      onChange={(e) => setRawQuery(e.target.value)}
                      onFocus={() => import('@/pages/FormulaFirst')}
                      className="pl-10"
                    />
                  </div>
                </div>
            <Select value={statusFilter} onValueChange={(v:any) => setStatusFilter(v)}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="Untested">Untested</SelectItem>
                    <SelectItem value="Tested">Tested</SelectItem>
                  </SelectContent>
                </Select>
            <Select value={sourceFilter} onValueChange={(v: any) => setSourceFilter(v)}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="FORMULA">Formula Samples</SelectItem>
                <SelectItem value="SAMPLE">Samples</SelectItem>
              </SelectContent>
            </Select>
            <Select value={locationFilter || 'all'} onValueChange={(v) => setLocationFilter(v)}>
                  <SelectTrigger className="w-48">
                    <MapPin className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="stored">With Storage</SelectItem>
                    <SelectItem value="unstored">No Storage</SelectItem>
                    {uniqueRacks.map(rack => (
                      <SelectItem key={rack} value={rack}>{rack}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Samples ({filteredSamples.length})</CardTitle>
              <CardDescription>
                Manage laboratory samples with integrated storage location tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-2">
                <Button variant="outline" size="sm" onClick={() => {
                  try {
                    const rows = rankedAndSorted.map((r:any)=> ({
                      SampleSource: (r as any).source || '',
                      Traceability: (r as any).traceability || '',
                      Formula: (r as any).formulaId || '',
                      FormulaVersionLabel: (r as any).formulaVersionLabel || '',
                      PrepID: (r as any).preparationSessionId || '',
                      SampleCode: r.sampleId || '',
                      CreatedAtISO: r.createdAt ? new Date(r.createdAt).toISOString() : '',
                      Status: r.status || '',
                      Supplier: suppliers.find(s=> s.id===r.supplierId)?.name || ''
                    }));
                    const header = Object.keys(rows[0]||{});
                    const csv = [header.join(','), ...rows.map(obj => header.map(h => String(obj[h]).replace(/"/g,'""')).map(v=>`"${v}"`).join(','))].join('\n');
                    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = `Samples_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.csv`;
                    a.click();
                  } catch {}
                }}>
                  <Download className="h-4 w-4 mr-2" /> Export CSV
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sample</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Traceability</TableHead>
                    <TableHead>Formula</TableHead>
                    <TableHead>Prep ID</TableHead>
                    <TableHead>Sample Code</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rankedAndSorted.map((sample) => {
                const supplier = suppliers.find(s => s.id === sample.supplierId);
                
                // Check tests for this sample
                const storedTests = localStorage.getItem('nbslims_tests');
                const allTests = storedTests ? JSON.parse(storedTests) : [];
                const sampleTests = allTests.filter((test: any) => test.sampleId === sample.id);
                const hasTests = sampleTests.length > 0;
                const testCount = sampleTests.length;
                
                return (
                  <TableRow key={sample.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleViewClick(sample)}>
                    <TableCell>
                      <div className="font-medium">{sample.itemNameEN || sample.sampleId}</div>
                      <div className="text-xs text-gray-500">{sample.sampleId}</div>
                    </TableCell>
                    <TableCell><Badge className="bg-gray-100 text-gray-800 border">{(sample as any).source === 'FORMULA' ? 'Formula Sample' : 'Sample'}</Badge></TableCell>
                    <TableCell><Badge className="bg-gray-100 text-gray-800 border">{(sample as any).traceability === 'actual' ? 'Actual' : 'Theoretical'}</Badge></TableCell>
                    <TableCell>{(sample as any).source === 'FORMULA' ? (
                      <div className="text-sm">
                        <div>{highlight(sample.itemNameEN || (sample as any).formulaName || 'Formula Sample', tokenize(debouncedSearch))}</div>
                        <div className="text-gray-500">{highlight((sample as any).formulaVersionLabel || 'unversioned', tokenize(debouncedSearch))}</div>
                      </div>
                    ) : '—'}</TableCell>
                    <TableCell>
                      {(sample as any).traceability === 'actual' && (sample as any).preparationSessionId ? (
                        <Button variant="ghost" className="p-0 h-auto font-mono text-blue-600" onClick={(e)=>{ e.stopPropagation(); setPrepSheetId((sample as any).preparationSessionId); }}>
                          {highlight((sample as any).preparationSessionId, tokenize(debouncedSearch))}
                        </Button>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="font-medium">{highlight(sample.sampleId || 'N/A', tokenize(debouncedSearch))}</TableCell>
                    <TableCell>{sample.createdAt ? new Date(sample.createdAt).toLocaleString() : 'N/A'}</TableCell>
                    <TableCell><Badge className={getStatusBadgeColor(sample.status)}>{sample.status}</Badge></TableCell>
                    <TableCell>{highlight(supplier?.name || 'Unknown', tokenize(debouncedSearch))}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewClick(sample)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {/* Generate QR if missing */}
                        {!sample.qrImageBase64 && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const { qrGenerator } = await import('@/lib/qrGenerator');
                                const qrResult = await qrGenerator.generateSampleQR({
                                  sampleId: sample.sampleId || sample.id,
                                  sampleNo: sample.sampleNo || 0,
                                  itemNameEN: sample.itemNameEN || '',
      itemNameAR: sample.itemNameAR || '',
      supplierId: sample.supplierId || '',
      supplierCode: sample.supplierCode || '',
      storageLocation: {
                                    rackArea: sample.storageLocation?.rackArea || sample.storageLocation?.rackNumber,
                                    rackNumber: sample.storageLocation?.rackNumber,
                                    position: sample.storageLocation?.position || 0
                                  },
                                  createdAt: new Date(sample.createdAt || Date.now()),
                                  customIdNo: sample.customIdNo || sample.sampleId
                                });
                                const updated = samples.map(s => s.id === sample.id ? { ...s, qrCode: qrResult.qrId, qrImageBase64: qrResult.qrImageBase64 } : s);
                                saveSamples(updated);
                                toast.success('QR generated');
                              } catch (err) {
                                toast.error('Failed to generate QR');
                              }
                            }}
                            title="Generate QR"
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                        )}
                        {/* Optional: Upload/replace QR image for this sample */}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = () => {
                              const file = input.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = () => {
                                const dataUrl = reader.result as string;
                                const updated = samples.map(s => s.id === sample.id ? { ...s, qrImageBase64: dataUrl } : s);
                                saveSamples(updated);
                                toast.success('QR image uploaded');
                              };
                              reader.readAsDataURL(file);
                            };
                            input.click();
                          }}
                          title="Upload QR image"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedSample(sample);
                            setIsLedgerDialogOpen(true);
                          }}
                          title="Sample Ledger"
                        >
                          <BookOpen className="h-4 w-4" />
                        </Button>
                        {hasPermission('samples', 'update') && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditClick(sample)}
                            title="Edit Sample"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTestSample(sample);
                          }}
                          title={hasTests ? `View Test Information (${testCount} test${testCount > 1 ? 's' : ''})` : ((sample as any).source === 'FORMULA' ? 'Start Formula Sample Test' : 'Start Sample Test')}
                          className="text-green-600 hover:text-green-700"
                        >
                          <TestTube className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handlePrintLabel(sample)}
                          title="Print Label"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        {hasPermission('samples', 'delete') && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700"
                            title="Delete Sample"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

        </TabsContent>

        <TabsContent value="branding" className="space-y-6"> 
          <SampleBranding samples={samples as unknown as Sample[]} onUpdate={loadData} />
        </TabsContent>

      </Tabs>

      {/* Preparation Detail Sheet */}
      <Sheet open={!!prepSheetId} onOpenChange={(open)=>{ if (!open) setPrepSheetId(null); }}>
        <SheetContent side="right" className="sm:max-w-xl w-full">
          <SheetHeader>
            <SheetTitle>Preparation {prepSheetId}</SheetTitle>
          </SheetHeader>
          {prepSheetId && (
            <div className="h-[80vh] overflow-auto pr-1">
              <PreparationDetails id={prepSheetId} layout="drawer" />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* View Sample Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent 
          className="max-w-5xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="sr-only">
              Sample Details - {selectedSample ? `Sample #${selectedSample.sampleNo}` : ''}
            </DialogTitle>
          </DialogHeader>
          {selectedSample && (
            <SampleDetail 
              sample={selectedSample as any}
              onEdit={(s) => handleEditClick(s as any)}
              onClose={() => setIsViewDialogOpen(false)}
              onDateClick={(date) => {
                setIsViewDialogOpen(false);
                handleDateClick(date);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Sample Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent 
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Edit Sample</DialogTitle>
            <DialogDescription>
              Update sample information, storage location, and pricing
            </DialogDescription>
          </DialogHeader>
          {selectedSample && (
            <SampleForm
              sample={selectedSample as Sample}
              suppliers={suppliers}
              onSave={(updatedSample) => {
                console.log('Updating sample:', selectedSample.id, updatedSample);
                
                // Map storage location from SampleForm format to Samples format
                const storageLocation = updatedSample.storageLocation ? {
                  rackArea: updatedSample.storageLocation.rackNumber || '',
                  rackNumber: updatedSample.storageLocation.rackNumber || '',
                  position: updatedSample.storageLocation.position || 0,
                  notes: updatedSample.storageLocation.notes || ''
                } : undefined;

                const updatedSamples = samples.map(s => 
                  s.id === selectedSample.id 
                    ? { 
                        ...updatedSample, 
                        id: selectedSample.id, 
                        sampleNo: selectedSample.sampleNo, 
                        sampleId: updatedSample.customIdNo || selectedSample.sampleId,
                        storageLocation,
                        tests: selectedSample.tests,
                        barcode: selectedSample.barcode || updatedSample.barcode,
                        qrCode: selectedSample.qrCode || updatedSample.qrCode,
                        updatedBy: user?.id || 'unknown',
                        updatedAt: new Date()
                      }
                    : s
                );
                console.log('Updated samples array:', updatedSamples);
                try {
                  saveSamples(updatedSamples);
                  console.log('Samples saved successfully to localStorage');
                  
                  // Trigger event to notify other components
                  window.dispatchEvent(new CustomEvent('sampleUpdated', { 
                    detail: { sampleId: selectedSample.id, field: 'updated', value: updatedSample }
                  }));
                  
                  setIsEditDialogOpen(false);
                  setSelectedSample(null);
                  toast.success('Sample updated successfully');
                } catch (saveError) {
                  console.error('Error saving updated samples:', saveError);
                  toast.error('Failed to save sample updates');
                }
              }}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedSample(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>


      {/* Date Group Dialog */}
      <Dialog open={isDateGroupDialogOpen} onOpenChange={setIsDateGroupDialogOpen}>
        <DialogContent 
          className="max-w-6xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Samples from {selectedDate}</DialogTitle>
            <DialogDescription>
              All samples received on "{selectedDate}" and their shipment tracking information
            </DialogDescription>
          </DialogHeader>
          {selectedDate && (
            <div className="space-y-6">
              {/* Date Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Date Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{getDateSamples(selectedDate).length}</p>
                      <p className="text-sm text-gray-600">Total Samples</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {getDateSamples(selectedDate).filter(s => s.status === 'Accepted').length}
                      </p>
                      <p className="text-sm text-gray-600">Accepted</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-600">
                        {getDateSamples(selectedDate).filter(s => s.status === 'Testing' || s.status === 'Pending').length}
                      </p>
                      <p className="text-sm text-gray-600">In Progress</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {getDateSamples(selectedDate).filter(s => s.shipment?.airWaybill).length}
                      </p>
                      <p className="text-sm text-gray-600">With Tracking</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Samples on Date */}
              <Card>
                <CardHeader>
                  <CardTitle>Samples from {selectedDate}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sample #</TableHead>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Shipment Tracking</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getDateSamples(selectedDate).map((sample) => {
                        const supplier = suppliers.find(s => s.id === sample.supplierId);
                        return (
                          <TableRow key={sample.id}>
                            <TableCell className="font-medium">#{sample.sampleNo}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{sample.itemNameEN}</p>
                                {sample.itemNameAR && (
                                  <p className="text-sm text-gray-500" dir="rtl">{sample.itemNameAR}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{supplier?.name || 'Unknown'}</TableCell>
                            <TableCell>
                              <Badge className={getStatusBadgeColor(sample.status)}>
                                {sample.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {sample.shipment?.airWaybill ? (
                                <div className="space-y-1">
                                  <div className="text-sm font-medium">
                                    {sample.shipment.carrier || 'Unknown Carrier'}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    AWB: {sample.shipment.airWaybill}
                                  </div>
                                  {sample.shipment.originCountry && (
                                    <div className="text-xs text-gray-500">
                                      From: {sample.shipment.originCountry}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400 text-sm">No tracking</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleViewClick(sample)}
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleEditClick(sample)}
                                  title="Edit Sample"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Sample Ledger Dialog */}
      <Dialog open={isLedgerDialogOpen} onOpenChange={setIsLedgerDialogOpen}>
        <DialogContent 
          className="max-w-6xl max-h-[95vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Sample Ledger</DialogTitle>
            <DialogDescription>
              Comprehensive sample information and fragrance details
            </DialogDescription>
          </DialogHeader>
          {selectedSample && (
            <SampleLedgerAdvanced
              sample={selectedSample}
              onSave={(ledgerData) => {
                // Update sample with ledger data
                const updatedSamples = samples.map(s => 
                  s.id === selectedSample.id 
                    ? { ...s, ledger: ledgerData, updatedAt: new Date() }
                    : s
                );
                saveSamples(updatedSamples);
                setIsLedgerDialogOpen(false);
                toast.success('Sample ledger updated successfully');
              }}
              onCancel={() => setIsLedgerDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <TestFormulaDialog
        isOpen={isTestFormulaDialogOpen}
        onClose={() => {
          setIsTestFormulaDialogOpen(false);
          setSelectedSampleForDialog(null);
        }}
        onSelectTest={handleSelectTest}
        onSelectFormula={handleSelectFormula}
        sampleName={selectedSampleForDialog?.itemNameEN || ''}
      />
    </div>
  );
};