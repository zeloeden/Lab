import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input as TextInput } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  FlaskConical,
  DollarSign,
  Package,
  CheckCircle,
  XCircle,
  Calculator,
  Percent,
  TrendingUp,
  Search,
  Filter,
  Download,
  Beaker
} from 'lucide-react';
import { Formula, FormulaIngredient, RawMaterial, FormulaCostBreakdown, FormulaTest } from '@/lib/formula-types';
import { Sample } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { FormulaVisualization } from '@/components/FormulaVisualization';
import { ListHeader } from '@/components/ListHeader';
import { initializeSampleData } from '@/utils/sampleDataInitializer';
import { formulaQRBarcodeGenerator } from '@/lib/formulaQRBarcode';
import { FormulaLabelPrintDialog } from '@/components/FormulaLabelPrintDialog';
import { FormulaLineage } from '@/components/FormulaLineage';
import { Wizard as PreparationWizard } from '@/features/preparation/Wizard';
import { buildStepsDefFromFormula } from '@/lib/data/buildStepsDef';
import { PrepBatchDialog } from '@/features/preparation/PrepBatchDialog';

export const Formulas: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sort, setSort] = useState<string>('updatedAt:desc');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [formulaTests, setFormulaTests] = useState<FormulaTest[]>([]);
  const [isFGDialogOpen, setIsFGDialogOpen] = useState(false);
  const [fgForm, setFgForm] = useState<{ itemNameEN: string; itemNameAR?: string; supplierId: string; rackNumber: string; customIdNo?: string } | null>(null);
  const [fgProductId, setFgProductId] = useState<string | null>(null);
  const [isLabelPrintDialogOpen, setIsLabelPrintDialogOpen] = useState(false);
  const [formulaForLabelPrint, setFormulaForLabelPrint] = useState<Formula | null>(null);
  const [prepOpen, setPrepOpen] = useState(false);
  const [overrideBatch, setOverrideBatch] = useState<{size:number, unit:'g'|'kg'|'ml'|'L'}|null>(null);
  const [testForm, setTestForm] = useState<{ temperatureC?: number; mixtureSpeedRpm?: number; overallRating?: number; notes?: string }>(
    { temperatureC: undefined, mixtureSpeedRpm: undefined, overallRating: undefined, notes: '' }
  );
  const [showPreparationWizard, setShowPreparationWizard] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  
  // Formula form state
  const [formulaForm, setFormulaForm] = useState<Partial<Formula>>({
    name: '',
    sampleId: '',
    secondarySampleId: '',
    ingredients: [],
    totalPercentage: 0,
    totalCost: 0,
    costPerUnit: 0,
    status: 'Untested',
    temperatureC: undefined,
    mixtureSpeedRpm: undefined,
    internalCode: '',
    externalCode: '',
    purpose: '',
    colorCode: '',
    colorPercentage: undefined,
    notes: ''
  });
  
  // Ingredient form for adding new ingredients
  const [newIngredient, setNewIngredient] = useState<Partial<FormulaIngredient>>({
    rawMaterialId: '',
    percentage: 0,
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  // Open a specific formula if requested from another page
  useEffect(() => {
    const pendingId = localStorage.getItem('nbslims_open_formula_id');
    if (pendingId) {
      const target = formulas.find(f => f.id === pendingId);
      if (target) {
        setSelectedFormula(target);
        setIsViewDialogOpen(true);
        localStorage.removeItem('nbslims_open_formula_id');
      }
    }
  }, [formulas]);

  useEffect(() => {
    // Load tests whenever selected formula changes
    if (selectedFormula) {
      loadFormulaTests(selectedFormula.id);
      setActiveTab('overview');
    }
  }, [selectedFormula]);

  // Prompt to start testing when opening an Untested formula
  useEffect(() => {
    if (isViewDialogOpen && selectedFormula && selectedFormula.status === 'Untested') {
      const shouldStart = window.confirm('This formula is untested. Start the Testing Wizard now?');
      if (shouldStart) {
        handleStartTest(selectedFormula);
      }
    }
  }, [isViewDialogOpen, selectedFormula]);

  useEffect(() => {
    // Check if there's a sample ID stored for auto-selection when creating a formula
    const storedSampleId = localStorage.getItem('nbslims_open_formula_sample_id');
    if (storedSampleId && samples.length > 0) {
      // Check if the sample exists
      const sample = samples.find(s => s.id === storedSampleId);
      if (sample) {
        // Auto-select the sample as primary sample
        setFormulaForm(prev => ({ ...prev, sampleId: storedSampleId }));
        // Open the create dialog
        setIsCreateDialogOpen(true);
        // Clear the stored sample ID
        localStorage.removeItem('nbslims_open_formula_sample_id');
      }
    }
  }, [samples]);

  const generateInternalCode = () => {
    const existingCodes = formulas.map(f => f.internalCode).filter(Boolean);
    const maxNumber = existingCodes
      .map(code => parseInt(code?.replace('NBS', '') || '0'))
      .reduce((max, num) => Math.max(max, num), 0);
    return `NBS${String(maxNumber + 1).padStart(3, '0')}`;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load formulas from localStorage
      const storedFormulas = localStorage.getItem('nbslims_formulas');
      if (storedFormulas) {
        const parsed = JSON.parse(storedFormulas);
        setFormulas(parsed.map((f: any) => ({
          ...f,
          createdAt: new Date(f.createdAt),
          updatedAt: new Date(f.updatedAt),
          approvedAt: f.approvedAt ? new Date(f.approvedAt) : undefined
        })));
      }
      
      // Load samples
      const storedSamples = localStorage.getItem('nbslims_enhanced_samples');
      let loadedSamples: Sample[] = [];
      if (storedSamples) {
        loadedSamples = JSON.parse(storedSamples);
        setSamples(loadedSamples);
      }
      // Load suppliers from the same database (localStorage)
      try {
        const storedSuppliers = localStorage.getItem('nbslims_suppliers');
        if (storedSuppliers) setSuppliers(JSON.parse(storedSuppliers));
      } catch {}
      
      // Load raw materials from dedicated storage
      const storedRawMaterials = localStorage.getItem('nbslims_raw_materials');
      console.log('Raw materials from localStorage:', storedRawMaterials);
      let loadedRawMaterials: RawMaterial[] = [];
      if (storedRawMaterials) {
        const parsed = JSON.parse(storedRawMaterials);
        // Normalize: ensure itemNameEN is set for consistent lookup
        loadedRawMaterials = parsed.map((rm: any) => ({
          ...rm,
          itemNameEN: rm.itemNameEN || rm.name,
          name: rm.name || rm.itemNameEN
        }));
        console.log('Parsed raw materials:', loadedRawMaterials);
        console.log('Colors found:', loadedRawMaterials.filter(rm => rm.type === 'color'));
      }
      
      // Also get raw materials from samples
      const rawMaterialSamples = loadedSamples.filter(s => 
        s.isRawMaterial === true
      ).map(s => ({
        id: s.id,
        name: s.itemNameEN,
        itemNameEN: s.itemNameEN,
        itemNameAR: s.itemNameAR,
        supplier: s.supplierId,
        price: s.pricing?.basePrice || 0,
        currency: s.pricing?.currency || 'USD',
        unit: 'ml' as const,
        type: 'raw_material' as const,
        inStock: true,
        category: 'Raw Material',
        createdAt: s.createdAt,
        updatedAt: s.updatedAt || s.createdAt
      }));
      
      // Combine both sources
      const combinedMaterials = [...loadedRawMaterials, ...rawMaterialSamples];
      console.log('Combined raw materials:', combinedMaterials);
      console.log('Total colors available:', combinedMaterials.filter(rm => rm.type === 'color').length);
      setRawMaterials(combinedMaterials);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load formulas');
    } finally {
      setLoading(false);
    }
  };

  const saveFormulas = (updatedFormulas: Formula[]) => {
    setFormulas(updatedFormulas);
    localStorage.setItem('nbslims_formulas', JSON.stringify(updatedFormulas));
  };

  const updateSampleStatus = (sampleId: string, status: 'Untested' | 'Pending' | 'Testing' | 'Rejected' | 'Accepted') => {
    const stored = localStorage.getItem('nbslims_enhanced_samples');
    if (!stored) return;
    try {
      const samplesData = JSON.parse(stored);
      const updated = samplesData.map((s: any) => s.id === sampleId ? { ...s, status, updatedAt: new Date() } : s);
      localStorage.setItem('nbslims_enhanced_samples', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('sampleUpdated', { detail: { sampleId, field: 'status', value: status } }));
    } catch (e) {
      console.error('Failed to update sample status from formula flow:', e);
    }
  };

  const loadFormulaTests = (formulaId: string) => {
    const raw = localStorage.getItem('nbslims_formula_tests');
    const allTests: FormulaTest[] = raw ? JSON.parse(raw) : [];
    setFormulaTests(allTests.filter(t => t.formulaId === formulaId));
  };

  const saveFormulaTests = (tests: FormulaTest[]) => {
    localStorage.setItem('nbslims_formula_tests', JSON.stringify(tests));
  };

  const calculateCosts = (ingredients: FormulaIngredient[], batchSize: number): number => {
    return ingredients.reduce((total, ing) => {
      // Check if it's a raw material
      let material = rawMaterials.find(rm => rm.id === ing.rawMaterialId);
      let price = material?.price || 0;
      
      // If not found in raw materials, check if it's the primary sample
      if (!material) {
        const sample = samples.find(s => s.id === ing.rawMaterialId);
        if (sample) {
          price = sample.pricing?.basePrice || 0;
        }
      }
      
      if (price > 0) {
        const amount = (batchSize * ing.percentage) / 100;
        const cost = (amount * price) / 1000; // Assuming price is per liter/kg
        return total + cost;
      }
      return total;
    }, 0);
  };

  const handleAddIngredient = () => {
    if (!newIngredient.rawMaterialId || newIngredient.percentage === 0) {
      toast.error('Please select a material and enter percentage');
      return;
    }
    
    const totalPercentage = (formulaForm.ingredients?.reduce((sum, ing) => sum + ing.percentage, 0) || 0) + (newIngredient.percentage || 0);
    
    if (totalPercentage > 100) {
      toast.error('Total percentage cannot exceed 100%');
      return;
    }
    
    const nextSeq = ((formulaForm.ingredients?.length || 0) + 1);
    const ingredient: FormulaIngredient = {
      id: uuidv4(),
      rawMaterialId: newIngredient.rawMaterialId!,
      percentage: newIngredient.percentage!,
      notes: newIngredient.notes,
      // store sequence if model supports it
      // @ts-expect-error sequence not in interface but mapped downstream
      sequence: nextSeq
    } as any;
    
    const updatedIngredients = [...(formulaForm.ingredients || []), ingredient];
    const totalCost = calculateCosts(updatedIngredients, formulaForm.batchSize || 100);
    
    setFormulaForm({
      ...formulaForm,
      ingredients: updatedIngredients,
      totalPercentage,
      totalCost,
      costPerUnit: totalCost / (formulaForm.batchSize || 100)
    });
    
    setNewIngredient({
      rawMaterialId: '',
      percentage: 0,
      notes: ''
    });
  };

  const handleRemoveIngredient = (ingredientId: string) => {
    const updatedIngredients = formulaForm.ingredients?.filter(ing => ing.id !== ingredientId) || [];
    const totalPercentage = updatedIngredients.reduce((sum, ing) => sum + ing.percentage, 0);
    const totalCost = calculateCosts(updatedIngredients, formulaForm.batchSize || 100);
    
    setFormulaForm({
      ...formulaForm,
      ingredients: updatedIngredients,
      totalPercentage,
      totalCost,
      costPerUnit: totalCost / (formulaForm.batchSize || 100)
    });
  };

  const handleCreateFormula = async () => {
    // Clear previous validation errors
    setValidationErrors({});
    
    // Validate required fields
    const errors: {[key: string]: string} = {};
    
    if (!formulaForm.name?.trim()) {
      errors.name = 'Formula name is required';
    }
    
    if (!formulaForm.sampleId) {
      errors.sampleId = 'Primary sample is required';
    }
    // internalCode is always auto-generated
    
    if (!formulaForm.ingredients || formulaForm.ingredients.length === 0) {
      errors.ingredients = 'At least one ingredient is required';
    }
    
    // Enforce 100% rule: total percentage must equal exactly 100%
    const totalPct = Number(formulaForm.totalPercentage || 0);
    if (totalPct !== 100) {
      errors.totalPercentage = 'Total percentage must equal exactly 100%';
    }
    
    // If there are validation errors, show them and return
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      const errorMessages = Object.values(errors).join(', ');
      toast.error(`Please fix the following issues: ${errorMessages}`);
      return;
    }
    
    let updatedFormulas: Formula[];
    
    if (isEditDialogOpen && selectedFormula) {
      // Update existing formula
      const updatedFormula: Formula = {
        ...selectedFormula,
        name: formulaForm.name!,
        sampleId: formulaForm.sampleId!,
        secondarySampleId: formulaForm.secondarySampleId,
        ingredients: formulaForm.ingredients!,
        totalPercentage: formulaForm.totalPercentage!,
        totalCost: formulaForm.totalCost!,
        costPerUnit: formulaForm.costPerUnit!,
        batchSize: formulaForm.batchSize!,
        batchUnit: formulaForm.batchUnit!,
        status: formulaForm.status || selectedFormula.status,
        temperatureC: formulaForm.temperatureC,
        mixtureSpeedRpm: formulaForm.mixtureSpeedRpm,
        internalCode: formulaForm.internalCode || generateInternalCode(),
        externalCode: formulaForm.externalCode,
        purpose: formulaForm.purpose,
        colorPercentage: formulaForm.colorPercentage,
        colorCode: formulaForm.colorCode,
        notes: formulaForm.notes,
        updatedAt: new Date()
      };
      
      updatedFormulas = formulas.map(f => f.id === selectedFormula.id ? updatedFormula : f);
      toast.success('Formula updated successfully');
    } else {
      // Create new formula
      const newFormula: Formula = {
        id: uuidv4(),
        name: formulaForm.name!,
        sampleId: formulaForm.sampleId!,
        secondarySampleId: formulaForm.secondarySampleId,
        ingredients: formulaForm.ingredients!,
        totalPercentage: formulaForm.totalPercentage!,
        totalCost: formulaForm.totalCost!,
        costPerUnit: formulaForm.costPerUnit!,
        batchSize: formulaForm.batchSize!,
        batchUnit: formulaForm.batchUnit!,
        status: 'Untested',
        temperatureC: formulaForm.temperatureC,
        mixtureSpeedRpm: formulaForm.mixtureSpeedRpm,
        internalCode: formulaForm.internalCode || generateInternalCode(),
        externalCode: formulaForm.externalCode,
        purpose: formulaForm.purpose,
        colorPercentage: formulaForm.colorPercentage,
        colorCode: formulaForm.colorCode,
        notes: formulaForm.notes,
        createdBy: user?.id || 'unknown',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Generate QR code and barcode for the new formula
      try {
        const qrBarcodeResult = await formulaQRBarcodeGenerator.generateFormulaQRBarcode(newFormula);
        newFormula.qrCode = qrBarcodeResult.qrImageBase64;
        newFormula.barcode = qrBarcodeResult.barcode;
        newFormula.barcodeImage = qrBarcodeResult.barcodeImage;
      } catch (error) {
        console.error('Error generating QR code and barcode:', error);
        toast.error('Formula created but failed to generate QR code and barcode');
      }
      
      updatedFormulas = [...formulas, newFormula];
      toast.success('Formula created successfully with QR code and barcode');
      
      // Show label print dialog after successful creation
      setFormulaForLabelPrint(newFormula);
      setIsLabelPrintDialogOpen(true);
    }
    
    saveFormulas(updatedFormulas);
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
    resetForm();
  };

  const handleStartTest = (formula: Formula) => {
    // Start preparation instead of legacy testing wizard
    setSelectedFormula(formula);
    setPrepOpen(true);
  };

  // Note: Manual Formula Sample creation flow removed per spec. Formula Samples are created only from Preparation completion.

  const handleTestComplete = (test: FormulaTest, outcome: 'Approved' | 'Rejected' | 'Retest') => {
    // Save the test
    const updatedTests = [...formulaTests, test];
    setFormulaTests(updatedTests);
    saveFormulaTests(updatedTests);

    // Update the formula status and test summary
    const updatedFormulas = formulas.map(f => {
      if (f.id === test.formulaId) {
        return {
          ...f,
          status: outcome === 'Approved' ? 'Approved' : outcome === 'Rejected' ? 'Rejected' : 'Retest',
          lastTestId: test.id,
          lastTestOutcome: outcome,
          attemptsTotal: (f.attemptsTotal || 0) + test.attemptCount,
          approvedBy: outcome === 'Approved' ? user?.fullName : undefined,
          approvedAt: outcome === 'Approved' ? new Date() : undefined,
        };
      }
      return f;
    });

    setFormulas(updatedFormulas);
    saveFormulas(updatedFormulas);

    toast.success(`Formula test ${outcome.toLowerCase()}`);

    // If approved, show Product Details dialog for Finished Good creation
    if (outcome === 'Approved' && selectedFormula) {
      const updatedFormulas = formulas.map(f => f.id === selectedFormula.id ? { ...f, status: 'Approved' as const } : f);
      setFormulas(updatedFormulas);
      handleApproveFormula(selectedFormula.id, updatedFormulas);
    }
  };

  const handleApproveFormula = async (formulaId: string, currentFormulas?: Formula[]) => {
    const sourceFormulas = currentFormulas || formulas;
    const formula = sourceFormulas.find(f => f.id === formulaId);
    if (!formula) return;
    if (formula.totalPercentage !== 100) {
      toast.error('Total percentage must equal 100% before approval');
      return;
    }
    
    // Update formula status
    const updatedFormula = {
      ...formula,
      status: 'Approved' as const,
      approvedBy: user?.id || 'unknown',
      approvedAt: new Date(),
      updatedAt: new Date()
    };
    
    // Prefill dialog for finished goods
    const primary = samples.find(s => s.id === formula.sampleId);
    const supplierId = primary?.supplierId || 'internal';
    const supplierCode = primary?.supplierCode || '';
    // Try read supplier index from stored suppliers
    let supplierIndex: string | undefined;
    try {
      const rawSuppliers = localStorage.getItem('nbslims_suppliers');
      if (rawSuppliers) {
        const list = JSON.parse(rawSuppliers);
        const sup = list.find((s: any) => s.id === supplierId);
        supplierIndex = sup?.code;
      }
    } catch {}
    const { generateFinishedGoodsCode, nextFinishedGoodsLocation } = await import('@/lib/utils');
    const code = generateFinishedGoodsCode();
    const loc = nextFinishedGoodsLocation();
    setFgForm({
      itemNameEN: primary?.itemNameEN || formula.name, // Remove "Formula Product" from English name
      itemNameAR: primary?.itemNameAR || '',
      supplierId,
      rackNumber: loc.rackNumber,
      customIdNo: code
    });
    setIsFGDialogOpen(true);

    // Create new product/sample from formula (will be finalized on Save)
    const newProduct: Sample = {
      id: uuidv4(),
      sampleNo: Date.now(),
      itemNameEN: primary?.itemNameEN || formula.name, // Remove "Formula Product" from English name
      itemNameAR: primary?.itemNameAR || '',
      supplierId,
      patchNumber: primary?.patchNumber || `FP-${Date.now()}`,
      status: 'Accepted' as const,
      approved: true,
      dateOfSample: new Date(),
      customIdNo: code,
      storageLocation: {
        rackNumber: loc.rackNumber,
        position: loc.position,
        notes: 'Formula Product' // Change from 'Finished Good' to 'Formula Product'
      },
      pricing: {
        basePrice: formula.costPerUnit * 2, // 100% markup
        currency: 'USD',
        scalingPrices: []
      },
      isFinishedGood: false, // Change to false since it's a Formula Product
      isFormulaProduct: true, // Add new flag for Formula Product
      sourceFormulaId: formula.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: user?.id || 'unknown',
      updatedBy: user?.id || 'unknown',
      barcode: barcodeGenerator.generate()
    };
    
    // Save the new product
    const storedSamples = localStorage.getItem('nbslims_enhanced_samples');
    const enhancedSamples = storedSamples ? JSON.parse(storedSamples) : [];
    enhancedSamples.push(newProduct);
    localStorage.setItem('nbslims_enhanced_samples', JSON.stringify(enhancedSamples));
    setFgProductId(newProduct.id);
    
    // Update formula with product info
    updatedFormula.productId = newProduct.id;
    updatedFormula.productName = newProduct.itemNameEN;
    updatedFormula.productCode = newProduct.customIdNo;
    
    const updatedFormulas = sourceFormulas.map(f => f.id === formulaId ? updatedFormula : f);
    saveFormulas(updatedFormulas);
    
    toast.success('Formula approved and product created successfully');
    
    // Reflect on primary sample status
    updateSampleStatus(formula.sampleId, 'Accepted');
    
    // Trigger events
    window.dispatchEvent(new CustomEvent('formulaApproved', { detail: { formula: updatedFormula, product: newProduct } }));
    window.dispatchEvent(new CustomEvent('sampleCreated', { detail: newProduct }));
  };

  const resetForm = () => {
    setValidationErrors({});
    setFormulaForm({
      name: '',
      sampleId: '',
      secondarySampleId: '',
      ingredients: [],
      totalPercentage: 0,
      totalCost: 0,
      costPerUnit: 0,
      batchSize: 100,
      batchUnit: 'ml',
      status: 'Testing',
      temperatureC: undefined,
      mixtureSpeedRpm: undefined,
      internalCode: generateInternalCode(),
      externalCode: '',
      purpose: '',
      colorPercentage: undefined,
      colorCode: '',
      notes: ''
    });
    setNewIngredient({
      rawMaterialId: '',
      percentage: 0,
      notes: ''
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800';
      case 'Testing': return 'bg-blue-100 text-blue-800';
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Failed': return 'bg-red-100 text-red-800';
      case 'Retest': return 'bg-yellow-100 text-yellow-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to extract searchable text from QR code data
  const getQRCodeSearchableText = (formula: Formula): string => {
    if (!formula.qrCode) return '';
    
    // Extract the searchable parts from QR code data
    const searchableParts = [
      formula.internalCode,
      formula.name,
      formula.status,
      formula.id,
      `FORMULA-${formula.internalCode}`,
      `batch-${formula.batchSize}${formula.batchUnit}`,
      `cost-${formula.totalCost?.toFixed(2)}`
    ].filter(Boolean).join(' ');
    
    return searchableParts.toLowerCase();
  };

  const filteredFormulas = formulas.filter(formula => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      formula.name.toLowerCase().includes(searchLower) ||
      formula.id.toLowerCase().includes(searchLower) ||
      formula.internalCode.toLowerCase().includes(searchLower) ||
      (formula.externalCode && formula.externalCode.toLowerCase().includes(searchLower)) ||
      (formula.barcode && formula.barcode.toLowerCase().includes(searchLower)) ||
      // Search in QR code searchable text
      getQRCodeSearchableText(formula).includes(searchLower);
    
    const matchesStatus = statusFilter === 'all' || formula.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getCostBreakdown = (formula: Formula): FormulaCostBreakdown => {
    const ingredientBreakdown = formula.ingredients.map(ing => {
      const material = rawMaterials.find(rm => rm.id === ing.rawMaterialId);
      const amount = (formula.batchSize * ing.percentage) / 100;
      const unitCost = material?.price || 0;
      const totalCost = (amount * unitCost) / 1000;
      
      return {
        name: material?.itemNameEN || 'Unknown',
        percentage: ing.percentage,
        amount,
        unit: formula.batchUnit,
        unitCost,
        totalCost
      };
    });
    
    const totalMaterialCost = ingredientBreakdown.reduce((sum, item) => sum + item.totalCost, 0);
    const packagingCost = totalMaterialCost * 0.05; // 5% of material cost
    const laborCost = 10; // $10 per batch
    const overheadCost = totalMaterialCost * 0.2; // 20% overhead
    const totalProductionCost = totalMaterialCost + packagingCost + laborCost + overheadCost;
    const suggestedRetailPrice = totalProductionCost * 3; // 200% markup
    const profitMargin = ((suggestedRetailPrice - totalProductionCost) / suggestedRetailPrice) * 100;
    
    return {
      ingredients: ingredientBreakdown,
      totalMaterialCost,
      packagingCost,
      laborCost,
      overheadCost,
      totalProductionCost,
      suggestedRetailPrice,
      profitMargin
    };
  };

  // Import barcodeGenerator
  const barcodeGenerator = {
    generate: () => `NBS${Date.now()}${Math.floor(Math.random() * 1000)}`
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Formula Management</h1>
          <p className="text-gray-600">Create and manage perfume formulas with cost calculations</p>
        </div>
        <div className="flex gap-2">
          {hasPermission('formulas', 'create') && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Formula
            </Button>
          )}
          {formulas.length === 0 && rawMaterials.length === 0 && (
            <Button
              variant="outline"
              onClick={() => {
                initializeSampleData();
                loadData();
                toast.success('Sample data loaded successfully! Please refresh the page.');
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Load Sample Data
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Formulas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formulas.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formulas.filter(f => f.status === 'Approved').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">In Testing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formulas.filter(f => f.status === 'Testing').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {formulas.filter(f => f.status === 'Draft').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <ListHeader
        q={searchTerm}
        onQChange={setSearchTerm}
        status={statusFilter}
        onStatusChange={(v) => setStatusFilter(v)}
        sort={sort}
        onSortChange={setSort}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        total={filteredFormulas.length}
        placeholder="Search formulas by name, code, QR code, or barcode..."
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Formulas</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Formula Name</TableHead>
                <TableHead>Primary Sample</TableHead>
                <TableHead>Ingredients</TableHead>
                {hasPermission('formulas', 'view_costs') && <TableHead>Cost/Unit</TableHead>}
                <TableHead>Status</TableHead>
                <TableHead>QR/Barcode</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFormulas.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize).map(formula => {
                const sample = samples.find(s => s.id === formula.sampleId);
                const searchLower = searchTerm.toLowerCase();
                const isQRMatch = formula.qrCode && getQRCodeSearchableText(formula).includes(searchLower);
                const isBarcodeMatch = formula.barcode && formula.barcode.toLowerCase().includes(searchLower);
                
                return (
                  <TableRow key={formula.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{formula.name}</span>
                        {searchTerm && (isQRMatch || isBarcodeMatch) && (
                          <Badge variant="outline" className="text-xs">
                            {isQRMatch && isBarcodeMatch ? 'QR+Barcode' : isQRMatch ? 'QR' : 'Barcode'}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{sample?.itemNameEN || 'Unknown'}</TableCell>
                    <TableCell>{formula.ingredients.length} items</TableCell>
                    {hasPermission('formulas', 'view_costs') && (
                      <TableCell>
                        ${formula.costPerUnit.toFixed(2)}/{formula.batchUnit}
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge className={getStatusBadgeColor(formula.status)}>
                        {formula.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {formula.qrCode && (
                          <div className="w-8 h-8 bg-white rounded border flex items-center justify-center">
                            <img 
                              src={formula.qrCode} 
                              alt="QR" 
                              className="w-6 h-6"
                              title="QR Code Available"
                            />
                          </div>
                        )}
                        {formula.barcodeImage && (
                          <div className="w-16 h-6 bg-white rounded border flex items-center justify-center">
                            <img 
                              src={formula.barcodeImage} 
                              alt="Barcode" 
                              className="h-4"
                              title="Barcode Available"
                            />
                          </div>
                        )}
                        {!formula.qrCode && !formula.barcodeImage && (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formula.createdAt.toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedFormula(formula);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {hasPermission('formulas', 'update') && formula.status === 'Draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedFormula(formula);
                              setFormulaForm(formula);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {formula.status === 'Untested' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-purple-600"
                            onClick={() => handleStartTest(formula)}
                            title="Test this formula"
                          >
                            <Beaker className="h-4 w-4" />
                          </Button>
                        )}
                        {hasPermission('formulas', 'approve') && (formula.status === 'Testing' || formula.status === 'Retest') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600"
                            onClick={() => handleApproveFormula(formula.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {hasPermission('formulas', 'delete') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this formula?')) {
                                const updated = formulas.filter(f => f.id !== formula.id);
                                saveFormulas(updated);
                                toast.success('Formula deleted');
                              }
                            }}
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

      {/* Create/Edit Formula Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
          resetForm();
        } else if (isCreateDialogOpen) {
          // Generate internal code when opening create dialog
          setFormulaForm(prev => ({ ...prev, internalCode: generateInternalCode() }));
        }
      }}>
        <DialogContent 
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? 'Edit Formula' : 'Create New Formula'}
            </DialogTitle>
            <DialogDescription>
              Design perfume formulas with ingredient percentages and cost calculations
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="formulaName">Formula Name *</Label>
                <Input
                  id="formulaName"
                  value={formulaForm.name}
                  onChange={(e) => setFormulaForm({ ...formulaForm, name: e.target.value })}
                  placeholder="e.g., Rose Garden EDT"
                  className={validationErrors.name ? 'border-red-500 focus:border-red-500' : ''}
                />
                {validationErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="primarySample">Primary Sample *</Label>
                <Select
                  value={formulaForm.sampleId}
                  onValueChange={(value) => setFormulaForm({ ...formulaForm, sampleId: value })}
                >
                  <SelectTrigger className={validationErrors.sampleId ? 'border-red-500 focus:border-red-500' : ''}>
                    <SelectValue placeholder="Select primary sample" />
                  </SelectTrigger>
                  <SelectContent>
                    {samples.map(sample => (
                      <SelectItem key={sample.id} value={sample.id}>
                        {sample.itemNameEN} (#{sample.sampleNo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.sampleId && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.sampleId}</p>
                )}
              </div>
              <div>
                <Label htmlFor="secondarySample">Secondary Sample (Optional)</Label>
                <Select
                  value={formulaForm.secondarySampleId || 'none'}
                  onValueChange={(value) => setFormulaForm({ ...formulaForm, secondarySampleId: value === 'none' ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select secondary sample (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No secondary sample</SelectItem>
                    {samples.filter(s => s.id !== formulaForm.sampleId).map(sample => (
                      <SelectItem key={sample.id} value={sample.id}>
                        {sample.itemNameEN} (#{sample.sampleNo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Formula Codes and Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="internalCode">Internal Code *</Label>
                <Input
                  id="internalCode"
                  value={formulaForm.internalCode || generateInternalCode()}
                  disabled
                  className="bg-gray-50"
                  placeholder="Auto-generated"
                />
                <p className="text-xs text-gray-500 mt-1">Auto-generated unique code (NBS001, NBS002, etc.)</p>
              </div>
              <div>
                <Label htmlFor="externalCode">External Code</Label>
                <Input
                  id="externalCode"
                  value={formulaForm.externalCode || ''}
                  onChange={(e) => setFormulaForm({ ...formulaForm, externalCode: e.target.value })}
                  placeholder="Enter external code"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="purpose">Purpose</Label>
                <Input
                  id="purpose"
                  value={formulaForm.purpose || ''}
                  onChange={(e) => setFormulaForm({ ...formulaForm, purpose: e.target.value })}
                  placeholder="Enter formula purpose"
                />
              </div>
            </div>

            {/* Color Selection */}
            <div className="space-y-4">
              <Label>Color Configuration</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="colorSelection">Color</Label>
                  <Select
                    value={formulaForm.colorCode || ''}
                    onValueChange={(value) => {
                      console.log('Selected color value:', value);
                      setFormulaForm({ ...formulaForm, colorCode: value });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a color" />
                    </SelectTrigger>
                    <SelectContent>
                      {(() => {
                        const colors = rawMaterials.filter(rm => rm.type === 'color' && rm.colorCode);
                        console.log('Available colors:', colors);
                        return colors.length > 0 ? (
                          colors.map((color) => (
                            <SelectItem key={color.id} value={color.colorCode!}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-4 h-4 rounded-full border border-gray-300" 
                                  style={{ backgroundColor: color.colorCode }}
                                />
                                <span>{color.colorName || color.name}</span>
                                <span className="text-gray-500 text-sm">({color.colorCode})</span>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-colors" disabled>
                            No colors available. Add colors in Raw Materials first.
                          </SelectItem>
                        );
                      })()}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="colorPercentage">Color Percentage (%)</Label>
                  <Input
                    id="colorPercentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formulaForm.colorPercentage ?? ''}
                    onChange={(e) => setFormulaForm({ ...formulaForm, colorPercentage: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                    placeholder="e.g., 15.5"
                    disabled={!formulaForm.colorCode}
                  />
                </div>
              </div>
            </div>

            {/* Batch size/unit removed by spec; handled only in Preparation */}

            {/* Ingredients Section */}
            <div>
              <Label>Formula Ingredients *</Label>
              <div className={`border rounded-lg p-4 space-y-4 ${validationErrors.ingredients ? 'border-red-500' : ''}`}>
                {/* Add Ingredient Form */}
                <div className="grid grid-cols-4 gap-2 items-end">
                  <div>
                    <Label htmlFor="rawMaterial">Raw Material</Label>
                    <Select
                      value={newIngredient.rawMaterialId}
                      onValueChange={(value) => setNewIngredient({ ...newIngredient, rawMaterialId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Debug: Log raw materials */}
                        {console.log('Raw materials for dropdown:', rawMaterials)}
                        
                        {/* Include primary sample if selected */}
                        {formulaForm.sampleId && (() => {
                          const primarySample = samples.find(s => s.id === formulaForm.sampleId);
                          if (primarySample) {
                            return (
                              <SelectItem key={primarySample.id} value={primarySample.id}>
                                <Badge className="mr-2">Primary</Badge>
                                {primarySample.itemNameEN}
                              </SelectItem>
                            );
                          }
                          return null;
                        })()}
                        
                        {/* Raw materials */}
                        {rawMaterials.filter(rm => rm.type === 'raw_material' || !rm.type).length > 0 ? (
                          rawMaterials.filter(rm => rm.type === 'raw_material' || !rm.type).map(material => (
                            <SelectItem key={material.id} value={material.id}>
                              {material.itemNameEN || material.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-materials" disabled>
                            No raw materials available. Add materials in Raw Materials page first.
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="percentage">Percentage (%)</Label>
                    <Input
                      id="percentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={newIngredient.percentage}
                      onChange={(e) => setNewIngredient({ ...newIngredient, percentage: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ingNotes">Notes</Label>
                    <Input
                      id="ingNotes"
                      value={newIngredient.notes}
                      onChange={(e) => setNewIngredient({ ...newIngredient, notes: e.target.value })}
                      placeholder="Optional notes"
                    />
                  </div>
                  <Button onClick={handleAddIngredient} type="button">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>

                {/* Ingredients List */}
                {formulaForm.ingredients && formulaForm.ingredients.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Seq</TableHead>
                        <TableHead>Material</TableHead>
                        <TableHead>Percentage</TableHead>
                        <TableHead>Amount</TableHead>
                        {hasPermission('formulas', 'view_costs') && <TableHead>Cost</TableHead>}
                        <TableHead>Notes</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formulaForm.ingredients.map((ing, idx) => {
                        // Check if it's a raw material or primary sample
                        let material = rawMaterials.find(rm => rm.id === ing.rawMaterialId);
                        let itemName = material?.itemNameEN || material?.name;
                        let price = material?.price || 0;
                        
                        if (!material) {
                          const sample = samples.find(s => s.id === ing.rawMaterialId);
                          if (sample) {
                            itemName = sample.itemNameEN + ' (Primary)';
                            price = sample.pricing?.basePrice || 0;
                          }
                        }
                        
                        const amount = 0;
                        const cost = 0;
                        // @ts-expect-error sequence not in interface but mapped downstream
                        const seq = ing.sequence || (idx + 1);
                        
                        return (
                          <TableRow key={ing.id}>
                            <TableCell className="font-mono text-sm text-gray-500">{seq}</TableCell>
                            <TableCell>{itemName || 'Unknown'}</TableCell>
                            <TableCell>{ing.percentage}%</TableCell>
                            <TableCell>-</TableCell>
                            {hasPermission('formulas', 'view_costs') && <TableCell>-</TableCell>}
                            <TableCell>{ing.notes || '-'}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveIngredient(ing.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}

                {/* Totals */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Total Percentage:</span>
                    <span className={`font-bold ${formulaForm.totalPercentage === 100 ? 'text-green-600' : 'text-red-600'}`}>
                      {formulaForm.totalPercentage?.toFixed(1)}%
                    </span>
                  </div>
                  {/* Costing removed from formula view; costing is per preparation */}
                </div>
                {validationErrors.ingredients && (
                  <p className="text-red-500 text-sm mt-2">{validationErrors.ingredients}</p>
                )}
              </div>
            </div>

            {/* Testing Controls moved to wizard */}

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formulaForm.notes}
                onChange={(e) => setFormulaForm({ ...formulaForm, notes: e.target.value })}
                placeholder="Additional notes about this formula..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateDialogOpen(false);
              setIsEditDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateFormula}>
              {isEditDialogOpen ? 'Update Formula' : 'Create Formula'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Formula Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent 
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Formula Details: {selectedFormula?.name}</DialogTitle>
            <DialogDescription>
              Read-only details. Preparation happens via Guided Preparation and testing via Sample Management.
            </DialogDescription>
          </DialogHeader>
          
          {selectedFormula && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className={`grid w-full grid-cols-3`}>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
                <TabsTrigger value="lineage">Lineage</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Formula Name</Label>
                    <p className="font-medium">{selectedFormula.name}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Status</Label>
                    <Badge className={getStatusBadgeColor(selectedFormula.status)}>
                      {selectedFormula.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-gray-600">Primary Sample</Label>
                    <p className="font-medium">
                      {samples.find(s => s.id === selectedFormula.sampleId)?.itemNameEN || 'Unknown'}
                    </p>
                  </div>
                  {selectedFormula.secondarySampleId && (
                    <div>
                      <Label className="text-gray-600">Secondary Sample</Label>
                      <p className="font-medium">
                        {samples.find(s => s.id === selectedFormula.secondarySampleId)?.itemNameEN || 'Unknown'}
                      </p>
                    </div>
                  )}
                  {/* Batch size removed in new flow */}
                  {selectedFormula.productId && (
                    <>
                      <div>
                        <Label className="text-gray-600">Generated Product</Label>
                        <p className="font-medium">{selectedFormula.productName}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Product Code</Label>
                        <p className="font-medium">{selectedFormula.productCode}</p>
                      </div>
                    </>
                  )}
                </div>
                {selectedFormula.notes && (
                  <div>
                    <Label className="text-gray-600">Notes</Label>
                    <p className="mt-1">{selectedFormula.notes}</p>
                  </div>
                )}

                {/* Quick status actions */}
                <div className="flex gap-2 pt-2">
                  {selectedFormula.status !== 'Approved' && hasPermission('formulas', 'approve') && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        handleApproveFormula(selectedFormula.id);
                        setIsViewDialogOpen(false);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  )}
                  {selectedFormula.status !== 'Failed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const updated = formulas.map(f => f.id === selectedFormula.id ? { ...f, status: 'Failed' as const, updatedAt: new Date() } : f);
                        saveFormulas(updated);
                        setSelectedFormula({ ...selectedFormula, status: 'Failed', updatedAt: new Date() });
                        updateSampleStatus(selectedFormula.sampleId, 'Rejected');
                        window.dispatchEvent(new CustomEvent('formulaUpdated', { detail: { formulaId: selectedFormula.id, status: 'Failed' } }));
                        toast.success('Formula marked as Failed');
                      }}
                    >
                      Mark Failed
                    </Button>
                  )}
                  {selectedFormula.status !== 'Retest' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Mark current as Failed
                        const updated = formulas.map(f => f.id === selectedFormula.id ? { ...f, status: 'Failed' as const, updatedAt: new Date() } : f);
                        // Create a clone as new Draft/Testing formula linked to same sample
                        const clone: Formula = {
                          ...selectedFormula,
                          id: uuidv4(),
                          status: 'Testing',
                          createdAt: new Date(),
                          updatedAt: new Date(),
                          approvedAt: undefined,
                          approvedBy: undefined,
                          productId: undefined,
                          productName: undefined,
                          productCode: undefined
                        };
                        const withClone = [...updated, clone];
                        saveFormulas(withClone);
                        setSelectedFormula(clone);
                        updateSampleStatus(selectedFormula.sampleId, 'Testing');
                        window.dispatchEvent(new CustomEvent('formulaUpdated', { detail: { formulaId: selectedFormula.id, status: 'Failed' } }));
                        toast.success('Retest created: previous formula marked Failed and new Testing formula opened');
                      }}
                    >
                      Mark Retest
                    </Button>
                  )}
                </div>

                {/* QR Code and Barcode Section */}
                {(selectedFormula.qrCode || selectedFormula.barcode) && (
                  <div className="mt-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      QR Code & Barcode
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* QR Code */}
                      {selectedFormula.qrCode && (
                        <div className="text-center">
                          <Label className="text-gray-600 mb-2 block">QR Code</Label>
                          <div className="inline-block p-2 bg-white rounded-lg shadow-sm">
                            <img 
                              src={selectedFormula.qrCode} 
                              alt="Formula QR Code" 
                              className="w-32 h-32 mx-auto"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-2">Scan to view formula details</p>
                        </div>
                      )}

                      {/* Barcode */}
                      {selectedFormula.barcodeImage && (
                        <div className="text-center">
                          <Label className="text-gray-600 mb-2 block">Barcode</Label>
                          <div className="inline-block p-2 bg-white rounded-lg shadow-sm">
                            <img 
                              src={selectedFormula.barcodeImage} 
                              alt="Formula Barcode" 
                              className="h-16 mx-auto"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-2 font-mono">
                            {selectedFormula.barcode}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Download Actions */}
                    <div className="flex gap-2 mt-4 justify-center">
                      {selectedFormula.qrCode && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = selectedFormula.qrCode!;
                            link.download = `formula-${selectedFormula.internalCode}-qr.png`;
                            link.click();
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download QR
                        </Button>
                      )}
                      {selectedFormula.barcodeImage && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = selectedFormula.barcodeImage!;
                            link.download = `formula-${selectedFormula.internalCode}-barcode.png`;
                            link.click();
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Barcode
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="ingredients" className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Amount</TableHead>
                      {hasPermission('formulas', 'view_costs') && <TableHead>Unit Cost</TableHead>}
                      {hasPermission('formulas', 'view_costs') && <TableHead>Total Cost</TableHead>}
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedFormula.ingredients.map(ing => {
                      // Check if it's a raw material or primary sample
                      let material = rawMaterials.find(rm => rm.id === ing.rawMaterialId);
                      let itemName = material?.itemNameEN;
                      let price = material?.price || 0;
                      let unit = material?.unit || 'unit';
                      
                      if (!material) {
                        const sample = samples.find(s => s.id === ing.rawMaterialId);
                        if (sample) {
                          itemName = sample.itemNameEN + ' (Primary)';
                          price = sample.pricing?.basePrice || 0;
                          unit = 'unit';
                        }
                      }
                      
                      const amount = (100 * ing.percentage) / 100; // assume reference 100 units for display
                      const cost = (amount * price) / 1000;
                      
                      return (
                        <TableRow key={ing.id}>
                          <TableCell className="font-medium">{itemName || 'Unknown'}</TableCell>
                          <TableCell>{ing.percentage}%</TableCell>
                          <TableCell>{amount.toFixed(2)} {selectedFormula.batchUnit}</TableCell>
                          {hasPermission('formulas', 'view_costs') && <TableCell>${price.toFixed(2)}/{unit}</TableCell>}
                          {hasPermission('formulas', 'view_costs') && <TableCell>${cost.toFixed(2)}</TableCell>}
                          <TableCell>{ing.notes || '-'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TabsContent>

              {hasPermission('formulas', 'view_costs') && (
                <TabsContent value="costing" className="space-y-4">
                  {(() => {
                    const breakdown = getCostBreakdown(selectedFormula);
                    return (
                      <>
                        <Card>
                          <CardHeader>
                            <CardTitle>Material Cost Breakdown</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Material</TableHead>
                                  <TableHead>%</TableHead>
                                  <TableHead>Amount</TableHead>
                                  <TableHead>Cost</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {breakdown.ingredients.map((item, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell>{item.percentage}%</TableCell>
                                    <TableCell>{item.amount.toFixed(2)} {item.unit}</TableCell>
                                    <TableCell>${item.totalCost.toFixed(2)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle>Total Production Cost</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Material Cost:</span>
                                <span>${breakdown.totalMaterialCost.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Packaging Cost:</span>
                                <span>${breakdown.packagingCost?.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Labor Cost:</span>
                                <span>${breakdown.laborCost?.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Overhead (20%):</span>
                                <span>${breakdown.overheadCost?.toFixed(2)}</span>
                              </div>
                              <div className="border-t pt-2 mt-2">
                                <div className="flex justify-between font-bold">
                                  <span>Total Production Cost:</span>
                                  <span>${breakdown.totalProductionCost.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-green-600 font-bold mt-2">
                                  <span>Suggested Retail Price:</span>
                                  <span>${breakdown.suggestedRetailPrice?.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-blue-600 mt-1">
                                  <span>Profit Margin:</span>
                                  <span>{breakdown.profitMargin?.toFixed(1)}%</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    );
                  })()}
                </TabsContent>
              )}

              {/* Testing tab and legacy controls removed per unified Samples-based testing flow */}

              {/* Lineage Tab */}
              <TabsContent value="lineage" className="space-y-4">
                {selectedFormula && (
                  <FormulaLineage
                    currentFormula={selectedFormula}
                    allFormulas={formulas}
                    onFormulaSelect={(formula) => {
                      setSelectedFormula(formula);
                      setActiveTab('overview');
                    }}
                  />
                )}
              </TabsContent>
            </Tabs>
          )}
            
          {/* Show visualization for approved formulas */}
          {selectedFormula?.status === 'Approved' && (
            <div className="mt-6">
              <FormulaVisualization 
                formula={selectedFormula} 
                rawMaterials={[
                  ...rawMaterials,
                  // Include primary sample in raw materials for visualization
                  ...samples.filter(s => s.id === selectedFormula.sampleId).map(s => ({
                    id: s.id,
                    itemNameEN: s.itemNameEN,
                    itemNameAR: s.itemNameAR,
                    supplier: s.supplierId,
                    price: s.pricing?.basePrice || 0,
                    currency: s.pricing?.currency || 'USD',
                    unit: 'ml' as const,
                    inStock: true,
                    category: 'Primary Sample'
                  }))
                ]} 
              />
            </div>
          )}
          
          <DialogFooter>
            {selectedFormula?.status === 'Testing' && hasPermission('formulas', 'approve') && (
              <Button 
                onClick={() => {
                  handleApproveFormula(selectedFormula.id);
                  setIsViewDialogOpen(false);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve & Create Product
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Finished Goods Details Dialog (post-approval) */}
      <Dialog open={isFGDialogOpen} onOpenChange={(open) => {
        // Prevent closing without saving
        if (open === false) return; 
        setIsFGDialogOpen(open);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Formula Product Details</DialogTitle>
            <DialogDescription>Review and adjust the generated formula product info.</DialogDescription>
          </DialogHeader>
          {fgForm && (
            <div className="space-y-3">
              <div>
                <Label>Item Name (English)</Label>
                <TextInput value={fgForm.itemNameEN} onChange={(e) => setFgForm({ ...fgForm, itemNameEN: e.target.value })} />
              </div>
              <div>
                <Label>Item Name (Arabic)</Label>
                <TextInput value={fgForm.itemNameAR || ''} onChange={(e) => setFgForm({ ...fgForm, itemNameAR: e.target.value })} />
              </div>
              <div>
                <Label>Supplier</Label>
                <Select value={fgForm.supplierId} onValueChange={(v) => setFgForm({ ...fgForm, supplierId: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.length > 0
                      ? suppliers.map((sup: any) => (
                          <SelectItem key={sup.id} value={sup.id}>{sup.name || sup.id}</SelectItem>
                        ))
                      : Array.from(new Set(samples.map(s => s.supplierId))).map((supplierId) => (
                          <SelectItem key={supplierId} value={supplierId as string}>{supplierId as string}</SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Rack</Label>
                  <TextInput value={fgForm.rackNumber} onChange={(e) => setFgForm({ ...fgForm, rackNumber: e.target.value })} />
                </div>
                <div>
                  <Label>Code</Label>
                  <TextInput value={fgForm.customIdNo || ''} onChange={(e) => setFgForm({ ...fgForm, customIdNo: e.target.value })} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() => {
                if (!fgForm || !fgProductId) { setIsFGDialogOpen(false); return; }
                try {
                  const stored = localStorage.getItem('nbslims_enhanced_samples');
                  const list = stored ? JSON.parse(stored) : [];
                  const updated = list.map((s: any) => s.id === fgProductId ? {
                    ...s,
                    itemNameEN: fgForm.itemNameEN,
                    itemNameAR: fgForm.itemNameAR || s.itemNameAR,
                    supplierId: fgForm.supplierId,
                    customIdNo: fgForm.customIdNo,
                    storageLocation: { ...s.storageLocation, rackNumber: fgForm.rackNumber },
                    isFormulaProduct: true, // Ensure it stays as formula product
                    updatedAt: new Date()
                  } : s);
                  localStorage.setItem('nbslims_enhanced_samples', JSON.stringify(updated));
                  toast.success('Formula product saved');
                } catch (e) {
                  console.error('Save FG error', e);
                  toast.error('Failed to save formula product');
                }
                setIsFGDialogOpen(false);
              }}
            >
              Save
            </Button>
            <Button variant="outline" onClick={() => setIsFGDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Label Print Dialog */}
      {formulaForLabelPrint && (
        <FormulaLabelPrintDialog
          open={isLabelPrintDialogOpen}
          onOpenChange={setIsLabelPrintDialogOpen}
          formula={formulaForLabelPrint}
        />
      )}

      {/* Guided Preparation Wizard (Barcode gate + Scale) */}
      {showPreparationWizard && selectedFormula && overrideBatch && (
        <Dialog open={true} onOpenAutoFocus={(e)=> e.preventDefault()} onOpenChange={(open) => !open && setShowPreparationWizard(false)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e)=> e.preventDefault()}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Beaker className="h-5 w-5 text-purple-600" />
                Guided Preparation: {selectedFormula.name}
              </DialogTitle>
              <DialogDescription>
                Preparing {overrideBatch.size} {overrideBatch.unit} batch with hardware integration
              </DialogDescription>
            </DialogHeader>
            {(() => {
              let stepsDef: any[] = [];
              try {
                const rmMap = new Map<string, any>();
                try {
                  const raw = localStorage.getItem('nbslims_raw_materials');
                  if (raw) JSON.parse(raw).forEach((rm: any)=> rmMap.set(rm.id, rm));
                } catch {}
                const getRawMaterial = (id: string) => rmMap.get(id) || rawMaterials.find(rm=>rm.id===id);
                stepsDef = buildStepsDefFromFormula(selectedFormula as any, { getRawMaterial, overrideBatch });
              } catch (e) {
                console.error('Failed to build steps for wizard:', e);
                toast.error('Some ingredients lack grams or codes. Please complete authoring data.');
                stepsDef = [];
              }
              return stepsDef.length > 0 ? (
                <PreparationWizard
                  formula={{ id: selectedFormula.id, name: selectedFormula.name }}
                  stepsDef={stepsDef}
                  operator={user?.fullName || user?.id || 'operator'}
                />
              ) : (
                <div className="p-4 text-center text-red-600">
                  Unable to build dispensing steps. Check console for details.
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      )}

      {/* Preparation Size Dialog */}
      <PrepBatchDialog
        open={prepOpen}
        formula={selectedFormula}
        getRawMaterial={(id:string)=> rawMaterials.find(rm=>rm.id===id)}
        onCancel={()=> setPrepOpen(false)}
        onConfirm={(size,unit)=>{ setPrepOpen(false); setOverrideBatch({ size, unit }); setShowPreparationWizard(true); }}
      />
    </div>
  );
};
