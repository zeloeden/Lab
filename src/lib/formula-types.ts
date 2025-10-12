export interface RawMaterial {
  id: string;
  itemNameEN: string;
  itemNameAR?: string;
  supplier?: string;
  price: number;
  currency: string;
  unit: 'ml' | 'g' | 'kg' | 'L';
  density?: number; // For converting between volume and weight
  inStock: boolean;
  category?: string;
}

export interface FormulaIngredient {
  id: string;
  rawMaterialId: string;
  rawMaterial?: RawMaterial;
  percentage: number;
  notes?: string;
  cost?: number; // Calculated based on percentage and raw material price
  isColorant?: boolean; // Flag for colorant ingredients
  colorCodeHex?: string; // Hex color code if this is a colorant
}

export interface Formula {
  id: string;
  name: string;
  sampleId: string; // Primary sample this formula is linked to
  secondarySampleId?: string; // Secondary sample this formula is linked to
  ingredients: FormulaIngredient[];
  totalPercentage: number; // Should equal 100%
  totalCost: number; // Sum of all ingredient costs
  costPerUnit: number; // Cost per ml/g
  sellingPrice?: number;
  profitMargin?: number;
  notes?: string;
  status: 'Untested' | 'Testing' | 'Approved' | 'Rejected' | 'Retest';
  // Default testing/processing parameters for this formula
  temperatureC?: number;
  mixtureSpeedRpm?: number;
  batchSize: number; // Size of the batch in ml or g
  batchUnit: 'ml' | 'g' | 'kg' | 'L';
  // Internal & External codes
  internalCode: string; // Auto-generated internal code (NBS001, NBS002, etc.)
  externalCode?: string; // External code set by user
  purpose?: string; // Purpose of the formula
  colorPercentage?: number; // Color as percentage
  colorCode?: string; // Color code from raw materials
  // Version lineage
  predecessorFormulaId?: string; // Link to previous formula version
  successorFormulaIds?: string[]; // Links to next formula versions
  // Testing summary
  lastTestId?: string; // ID of the most recent test
  lastTestOutcome?: 'Approved' | 'Rejected' | 'Retest'; // Outcome of last test
  attemptsTotal?: number; // Total number of test attempts
  // Audit fields
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  // Generated product info (when approved)
  productId?: string; // New sample ID created from this formula
  productName?: string;
  productCode?: string;
  // QR Code and Barcode
  qrCode?: string; // Base64 QR code image
  barcode?: string; // Barcode string
  barcodeImage?: string; // Base64 barcode image
}

export interface FormulaTest {
  id: string;
  formulaId: string;
  testVolumeValue: number; // Volume used for testing
  testVolumeUnit: 'ml' | 'g' | 'kg' | 'L'; // Unit for test volume
  controls?: {
    temperatureC?: number;
    mixtureSpeedRpm?: number;
    durationMin?: number;
    notes?: string;
  };
  steps: Array<{
    ingredientId: string;
    percentage: number;
    plannedAmount: number;
    plannedUnit: 'ml' | 'g';
    userEnteredAmount?: number;
    confirmed: boolean;
    timestamp?: string;
  }>;
  attemptCount: number; // Number of attempts in this test session
  outcome: 'Approved' | 'Rejected' | 'Retest' | 'Incomplete';
  feedback?: string; // User feedback after test
  startedAt: Date;
  completedAt?: Date;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: Date;
  // Legacy fields for backward compatibility
  testDate?: Date;
  temperatureC?: number;
  mixtureSpeedRpm?: number;
  topNote?: string;
  middleNote?: string;
  baseNote?: string;
  longevity?: string;
  sillage?: string;
  overallRating?: number;
  notes?: string;
  result?: 'Pass' | 'Fail' | 'Needs Adjustment';
  adjustmentSuggestions?: string;
  testedBy?: string;
}

export interface FormulaCostBreakdown {
  ingredients: {
    name: string;
    percentage: number;
    amount: number; // Actual amount based on batch size
    unit: string;
    unitCost: number;
    totalCost: number;
  }[];
  totalMaterialCost: number;
  packagingCost?: number;
  laborCost?: number;
  overheadCost?: number;
  totalProductionCost: number;
  suggestedRetailPrice?: number;
  profitMargin?: number;
}
