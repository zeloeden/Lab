// Core Entity Types for NBS LIMS

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  language: 'en' | 'ar';
  theme: 'light' | 'dark';
  timezone: string;
}

export interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

// Sample Management
export interface Sample {
  id: string;
  sampleNo: number; // Auto-generated, unique
  itemNameEN: string;
  itemNameAR: string;
  supplierId: string;
  customerId?: string; // Customer who submitted the sample
  customerSampleNumber?: string; // Customer's internal sample number
  patchNumber: string; // Main patch number field (renamed from batchNumber)
  refCode?: string; // New field for reference code
  supplierCode?: string; // New field for supplier code (sales number)
  barcode?: string; // Auto-generated barcode
  qrCode?: string; // Auto-generated QR code
  dateOfSample: Date;
  itemGroup?: string;
  status: SampleStatus;
  approved: boolean;
  approvedTestId?: string;
  storageLocation: StorageLocation;
  customIdNo?: string;
  pricing: SamplePricing;
  shorjaBranch?: ShorjaBranchInfo; // New field for Shorja branch info
  ledger?: SampleLedgerData; // New field for sample ledger
  shipment?: {
    carrier?: string;
    airWaybill?: string;
    shipmentNotes?: string;
    originCountry?: string;
  };
  attachments?: SampleAttachment[];
  
  // Raw Material flag
  isRawMaterial?: boolean;
  // Finished goods flag (generated from approved formula)
  isFinishedGood?: boolean;
  // Formula product flag (generated from approved formula, different from finished goods)
  isFormulaProduct?: boolean;
  sourceFormulaId?: string;
  
  // Branding information
  brandedAs?: {
    brand: string;
    price: number;
    suggestedPrice: number;
    currency: string;
    notes?: string;
    brandedBy?: string;
    brandedAt?: Date;
  };
  
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SampleAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl?: string; // Base64 data URL or external URL
  uploadedAt: Date;
  uploadedBy: string;
  description?: string;
}

export interface StorageLocation {
  rackNumber: string; // e.g., "A1", "B4", "C7"
  position: number; // Position within the rack (1-450)
  notes?: string;
}

// Company Settings
export interface CompanySettings {
  id: string;
  name: string;
  initials: string;
  createdAt: Date;
  updatedAt: Date;
}

// Admin Editor Types
export interface CustomColumn {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean';
  required: boolean;
  options?: string[]; // For select/multiselect types
  defaultValue?: any;
  order: number;
  visible: boolean;
}

export interface CustomSection {
  id: string;
  name: string;
  description?: string;
  columns: CustomColumn[];
  order: number;
  visible: boolean;
}

export interface EditorMode {
  enabled: boolean;
  customSections: CustomSection[];
  customColumns: CustomColumn[];
}

export interface ShorjaBranchInfo {
  sentToShorja: boolean;
  comment?: string;
  sentDate?: Date;
}

export interface SamplePricing {
  basePrice: number;
  currency: string;
  scalingPrices?: ScalingPrice[];
}

export interface ScalingPrice {
  quantity: 25 | 50 | 100 | 200 | 500 | 1000;
  price: number;
  enabled?: boolean; // Optional property to enable/disable tiers
}

// Sample Ledger Data Interface (used by SampleLedgerAdvanced)
export interface SampleLedgerData {
  mainBrand: string;
  customMainBrand?: string;
  relatedNames: string[];
  sampleResult: 'Accepted' | 'Rejected' | 'Pending' | 'Testing';
  customerSampleNo: string;
  dpgPercentage: number;
  previousDpgSampleId?: string;
  previousDpgPercentage?: number;
  priorityLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  concept: string;
  customConcept?: string;
  ingredients: {
    topNotes: string[];
    middleNotes: string[];
    baseNotes: string[];
  };
}

export interface Ingredient {
  name: string;
  icon?: string;
  category?: string;
  description?: string;
}

// Fragrantica API Response Types
export interface FragranticaResponse {
  name: string;
  brand: string;
  notes: {
    top: string[];
    middle: string[];
    base: string[];
  };
  ingredients: string[];
  images?: string[];
}

// Supplier Management
export interface Supplier {
  id: string;
  name: string;
  code?: string;
  contactInfo: ContactInfo;
  address: Address;
  scalingEnabled: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactInfo {
  phone?: string;
  email?: string;
  contactPerson?: string;
}

export interface Address {
  street: string;
  city: string;
  country: string;
  postalCode?: string;
}

// Test Management
export interface Test {
  id: string;
  sampleId: string;
  useType: UseType;
  date: Date;
  dueDate?: Date;
  result: TestResult;
  status: TestStatus;  // Current status of the test
  approved: boolean;
  personalUseData?: PersonalUseTest;
  industrialData?: IndustrialTest;
  brandedAs?: BrandedAs;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandedAs {
  brand: string;
  price: number;
  suggestedPrice: number;
  currency: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonalUseTest {
  topNote: string;
  baseNote: string;
  notes: string;
  date: Date;
  result: TestResult;
}

export interface IndustrialTest {
  formula: FormulaEntry[];
  notes: string;
  status: FormulaStatus;
  result: TestResult; // Overall result for the industrial test
}

export interface FormulaEntry {
  id: string;
  percentage: number; // Sample 1 percentage
  sampleId?: string; // Sample 1 reference
  sampleName?: string; // Sample 1 display name
  percentage2?: number; // Sample 2 percentage
  sampleId2?: string; // Sample 2 reference
  sampleName2?: string; // Sample 2 display name
  notes?: string;
  result?: TestResult; // Result for this formula entry (accepted, rejected, rework, retest)
}

// Purchasing Workflow
export interface RequestedItem {
  id: string;
  sampleId: string;
  supplierId: string;
  quantity: number;
  unit: ItemUnit;
  priority: ItemPriority;
  state: RequestState;
  requestedBy: string;
  requestedAt: Date;
  lastUpdatedBy: string;
  lastUpdatedAt: Date;

  // ordering info (when state=ordered)
  poNumber?: string;
  orderedAt?: Date;
  notes?: string;

  // audit
  history: Array<{
    at: Date;
    by: string;
    from?: RequestState;
    to: RequestState;
    note?: string;
  }>;
}

// Task Management
export interface Task {
  id: string;
  title: string;
  description: string;
  assignees: string[];
  dueDate?: Date;
  priority: TaskPriority;
  status: TaskStatus;
  comments: TaskComment[];
  attachments: TaskAttachment[];
  watchers: string[];
  subtasks: SubTask[];
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskComment {
  id: string;
  content: string;
  authorId: string;
  createdAt: Date;
  parentId?: string; // For threaded comments
}

export interface TaskAttachment {
  id: string;
  filename: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  assigneeId?: string;
  createdAt: Date;
}

// Audit Trail
export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  userId: string;
  userName?: string;
  userRole?: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  description?: string; // Human-readable description of the action
  affectedFields?: string[]; // List of fields that were changed
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

// Enhanced User Activity Tracking
export interface UserActivity {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: UserAction;
  entityType: string;
  entityId: string;
  entityName?: string;
  description: string;
  timestamp: Date;
  ipAddress?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

// Barcode/QR Code Types
export interface BarcodeData {
  sampleId: string;
  sampleNo: number;
  barcode: string;
  qrCode: string;
  generatedAt: Date;
  generatedBy: string;
}

// Enums
export type UserRole = 'Admin' | 'LabLead' | 'Technician' | 'Purchasing' | 'Viewer';
export type SampleStatus = 'Untested' | 'Pending' | 'Testing' | 'Rejected' | 'Accepted';

// Purpose is now a free text field
export type Purpose = string;
export type UseType = 'Personal Use';
export type TestResult = 'Accepted' | 'Rejected' | 'Rework' | 'Retest';
export type TestStatus = 'Untested' | 'Testing' | 'Approved' | 'Rejected' | 'Rework' | 'Retest' | 'Not Approved';
export type FormulaStatus = 'Approved' | 'Rejected' | 'Retest';
export type Priority = 'Air' | 'Sea' | 'Land';
export type PurposeTag = 'Requested' | 'To fill the container with';
export type RequestStatus = 'Requested' | 'Sent to Ordering' | 'Ordered';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TaskStatus = 'Backlog' | 'In Progress' | 'Waiting' | 'Done';
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT';

// New types for improved RequestedItem interface
export type RequestState = 'requested' | 'to-be-ordered' | 'ordered';
export type ItemPriority = 'low' | 'medium' | 'high' | 'critical';
export type ItemUnit = 'ml' | 'L' | 'g' | 'kg' | 'pcs';
export type UserAction = 'LOGIN' | 'LOGOUT' | 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'EXPORT' | 'IMPORT' | 'SEARCH' | 'VIEW_REPORT' | 'DOWNLOAD' | 'UPLOAD' | 'SYNC' | 'BACKUP' | 'RESTORE';

// Analytics Types
export interface KPIData {
  acceptedSamples30Days: number;
  acceptedSamples90Days: number;
  rejectedPercentage: number;
  retestPercentage: number;
  reworkPercentage: number;
  requestedVsOrdered: {
    requested: number;
    ordered: number;
  };
}

export interface SupplierPerformance {
  supplierId: string;
  supplierName: string;
  acceptanceRate: number;
  averageLeadTime: number;
  totalSamples: number;
}

// Form Types
export interface CreateSampleRequest {
  itemNameEN: string;
  itemNameAR: string;
  supplierId: string;
  batchNumber: string;
  dateOfSample: Date;
  itemGroup?: string;
  storageLocation: StorageLocation;
  customIdNo?: string;
  pricing: SamplePricing;
}

export interface CreateTestRequest {
  sampleId: string;
  useType: UseType;
  date: Date;
  personalUseData?: PersonalUseTest;
  industrialData?: IndustrialTest;
}

export interface CreateRequestRequest {
  itemName: string;
  sampleId?: string;
  quantity: number;
  unitOfMeasure: string;
  priority: Priority;
  purposeTag: PurposeTag;
  date: Date;
  notes?: string;
}

// Utility Types
export interface FilterOptions {
  [key: string]: unknown;
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface TableColumn<T> {
  key: keyof T;
  title: string;
  titleAR?: string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: unknown, item: T) => React.ReactNode;
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

// Role Permissions Matrix
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  Admin: [
    { resource: 'samples', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'tests', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'suppliers', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'purchasing', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'tasks', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'analytics', actions: ['read'] },
    { resource: 'settings', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
  ],
  LabLead: [
    { resource: 'samples', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'tests', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'suppliers', actions: ['read'] },
    { resource: 'purchasing', actions: ['read'] },
    { resource: 'tasks', actions: ['read', 'update'] },
    { resource: 'analytics', actions: ['read'] },
  ],
  Technician: [
    { resource: 'samples', actions: ['read'] },
    { resource: 'tests', actions: ['create', 'update'] },
    { resource: 'suppliers', actions: ['read'] },
    { resource: 'purchasing', actions: ['create'] },
    { resource: 'tasks', actions: ['read', 'update'] },
  ],
  Purchasing: [
    { resource: 'samples', actions: ['read'] },
    { resource: 'tests', actions: ['read'] },
    { resource: 'suppliers', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'purchasing', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'tasks', actions: ['read', 'update'] },
    { resource: 'analytics', actions: ['read'] },
  ],
  Viewer: [
    { resource: 'samples', actions: ['read'] },
    { resource: 'tests', actions: ['read'] },
    { resource: 'suppliers', actions: ['read'] },
    { resource: 'purchasing', actions: ['read'] },
    { resource: 'analytics', actions: ['read'] },
  ],
};

export type SampleSource = 'FORMULA' | 'SAMPLE';
export type Traceability = 'actual' | 'theoretical';

export interface NewSampleModel {
  id: string;
  source: SampleSource;
  traceability: Traceability;
  formulaVersionId?: string;
  preparationSessionId?: string;
  status: 'Untested' | 'InProgress' | 'Tested';
  code?: string;
  
  yield?: number; lot?: string; density?: number;
  createdAt: string; createdBy?: string;
}

export interface NewTestModel {
  id: string;
  sampleId: string;
  status: 'Untested' | 'InProgress' | 'Completed';
  result?: 'Pass' | 'Fail' | 'N/A';
  notes?: string;
  createdAt: string; createdBy?: string;
}

export function testDisplayName(sample: { source: SampleSource }){
  return sample.source === 'FORMULA' ? 'Formula Sample Test' : 'Sample Test';
}