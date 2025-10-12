# NBS LIMS - System Design Document

## Implementation Approach

### Technology Stack Selection

**Frontend Framework**: Next.js 14 with React 18 and TypeScript for type safety and modern development experience. Next.js provides excellent PWA support, SSG/SSR capabilities, and built-in optimization features.

**UI Component Library**: Shadcn-ui built on Radix UI primitives with Tailwind CSS for consistent, accessible components and rapid styling. This combination provides excellent RTL support and theme customization capabilities.

**State Management**: Zustand for lightweight, TypeScript-friendly global state management. Redux Toolkit Query for server state management and caching.

**Local Database**: Dexie.js (IndexedDB wrapper) for robust offline-first data storage with excellent TypeScript support and advanced querying capabilities.

**PWA Implementation**: Next.js PWA plugin with Workbox for service worker management, background sync, and offline functionality.

**Multi-language Support**: next-i18next for internationalization with automatic RTL detection and layout switching.

**Authentication**: NextAuth.js for secure authentication with Google OAuth integration for Drive sync.

### Architecture Patterns

**Offline-First Architecture**: Primary data storage in IndexedDB with background synchronization to Google Drive. All operations work offline with automatic sync when connection is restored.

**Domain-Driven Design**: Clear separation of business logic into domain services, with repository pattern for data access abstraction.

**Component-Based Architecture**: Modular, reusable components with clear separation of concerns and consistent API patterns.

**Event-Driven Updates**: Real-time UI updates using custom hooks and event emitters for cross-component communication.

## Data Structures and Interfaces

### Core Entity Models

```typescript
// User and Authentication
interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

interface UserRole {
  id: string;
  name: 'Admin' | 'LabLead' | 'Technician' | 'Purchasing' | 'Viewer';
  permissions: Permission[];
}

interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

interface UserPreferences {
  language: 'en' | 'ar';
  theme: 'light' | 'dark';
  timezone: string;
}

// Sample Management
interface Sample {
  id: string;
  sampleNo: number; // Auto-generated, unique
  itemNameEN: string;
  itemNameAR: string;
  supplierId: string;
  batchNumber: string;
  dateOfSample: Date;
  purpose: Purpose;
  status: SampleStatus;
  approved: boolean;
  approvedTestId?: string;
  storageLocation: StorageLocation;
  customIdNo?: string;
  pricing: SamplePricing;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface StorageLocation {
  cabinetNo: string;
  trayNo: string;
  refrigeratorShelf: string;
}

interface SamplePricing {
  basePrice: number;
  currency: string;
  scalingPrices?: ScalingPrice[];
}

interface ScalingPrice {
  tier: '25KG' | '50KG' | '100KG' | '200KG' | '500KG' | '1000KG';
  price: number;
}

// Supplier Management
interface Supplier {
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

interface ContactInfo {
  phone?: string;
  email?: string;
  contactPerson?: string;
}

interface Address {
  street: string;
  city: string;
  country: string;
  postalCode?: string;
}

// Test Management
interface Test {
  id: string;
  sampleId: string;
  useType: UseType;
  date: Date;
  result: TestResult;
  approved: boolean;
  personalUseData?: PersonalUseTest;
  industrialData?: IndustrialTest;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PersonalUseTest {
  topNote: string;
  baseNote: string;
}

interface IndustrialTest {
  formula: FormulaEntry[];
  formulaStatus: FormulaStatus;
}

interface FormulaEntry {
  id: string;
  percentage: number;
  item: string; // Sample reference or free text
  notes?: string;
}

// Purchasing Workflow
interface RequestedItem {
  id: string;
  itemName: string;
  sampleId?: string;
  quantity: number;
  unitOfMeasure: string;
  priority: Priority;
  purposeTag: PurposeTag;
  date: Date;
  status: RequestStatus;
  orderReference?: string;
  orderDate?: Date;
  notes?: string;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Task Management
interface Task {
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

interface TaskComment {
  id: string;
  content: string;
  authorId: string;
  createdAt: Date;
  parentId?: string; // For threaded comments
}

interface TaskAttachment {
  id: string;
  filename: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: Date;
}

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  assigneeId?: string;
  createdAt: Date;
}

// Audit Trail
interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  userId: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

// Enums
type UserRole = 'Admin' | 'LabLead' | 'Technician' | 'Purchasing' | 'Viewer';
type Purpose = 'Personal Use' | 'Industrial';
type SampleStatus = 'Pending' | 'Testing' | 'Rejected' | 'Accepted';
type UseType = 'Personal Use' | 'Industrial';
type TestResult = 'Accepted' | 'Rejected' | 'Rework' | 'Retest';
type FormulaStatus = 'Success' | 'Rejected' | 'Retest';
type Priority = 'Air' | 'Sea' | 'Land';
type PurposeTag = 'Requested' | 'To fill the container with';
type RequestStatus = 'Requested' | 'Sent to Ordering' | 'Ordered';
type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';
type TaskStatus = 'Backlog' | 'In Progress' | 'Waiting' | 'Done';
type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT';
```

### Service Layer Architecture

```typescript
// Repository Pattern for Data Access
interface Repository<T> {
  create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(filter?: FilterOptions): Promise<T[]>;
  update(id: string, updates: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  count(filter?: FilterOptions): Promise<number>;
}

// Sample Repository with Special Methods
interface SampleRepository extends Repository<Sample> {
  getNextSampleNumber(): Promise<number>;
  findBySampleNo(sampleNo: number): Promise<Sample | null>;
  findBySupplier(supplierId: string): Promise<Sample[]>;
  findApproved(): Promise<Sample[]>;
  bulkImport(samples: Partial<Sample>[]): Promise<Sample[]>;
}

// Service Layer
interface SampleService {
  createSample(data: CreateSampleRequest): Promise<Sample>;
  updateSample(id: string, data: UpdateSampleRequest): Promise<Sample>;
  approveSample(sampleId: string, testId: string): Promise<Sample>;
  importSamples(data: ImportSampleData[]): Promise<ImportResult>;
  exportSamples(format: ExportFormat, filter?: FilterOptions): Promise<Blob>;
  searchSamples(query: string, filter?: FilterOptions): Promise<Sample[]>;
}

interface TestService {
  createTest(data: CreateTestRequest): Promise<Test>;
  approveTest(testId: string): Promise<Test>;
  getTestsBySample(sampleId: string): Promise<Test[]>;
  getApprovedTest(sampleId: string): Promise<Test | null>;
}

interface PurchasingService {
  createRequest(data: CreateRequestRequest): Promise<RequestedItem>;
  moveToOrdered(requestId: string, orderData: OrderData): Promise<RequestedItem>;
  getRequestsByStatus(status: RequestStatus): Promise<RequestedItem[]>;
  bulkUpdateStatus(requestIds: string[], status: RequestStatus): Promise<RequestedItem[]>;
}

// Sync Service for Google Drive Integration
interface SyncService {
  syncToCloud(): Promise<SyncResult>;
  syncFromCloud(): Promise<SyncResult>;
  resolveConflicts(conflicts: DataConflict[]): Promise<void>;
  getLastSyncTime(): Promise<Date | null>;
  enableAutoSync(interval: number): void;
  disableAutoSync(): void;
}

interface DataConflict {
  entityType: string;
  entityId: string;
  localVersion: any;
  cloudVersion: any;
  conflictType: 'UPDATE_UPDATE' | 'UPDATE_DELETE' | 'DELETE_UPDATE';
}

// Analytics Service
interface AnalyticsService {
  getKPIs(dateRange: DateRange): Promise<KPIData>;
  getSampleMetrics(filter: AnalyticsFilter): Promise<SampleMetrics>;
  getSupplierPerformance(filter: AnalyticsFilter): Promise<SupplierPerformance[]>;
  getPurchasingMetrics(filter: AnalyticsFilter): Promise<PurchasingMetrics>;
  generateReport(type: ReportType, filter: AnalyticsFilter): Promise<Report>;
}
```

### Component Architecture

```typescript
// Base Component Props
interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Form Components
interface FormFieldProps<T = any> extends BaseComponentProps {
  name: string;
  label: string;
  labelAR?: string;
  value: T;
  onChange: (value: T) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  placeholderAR?: string;
}

// Data Table Component
interface DataTableProps<T> extends BaseComponentProps {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: PaginationConfig;
  sorting?: SortConfig;
  filtering?: FilterConfig;
  selection?: SelectionConfig<T>;
  actions?: TableAction<T>[];
  onRowClick?: (item: T) => void;
}

interface TableColumn<T> {
  key: keyof T;
  title: string;
  titleAR?: string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
}

// Modal/Drawer Components
interface DrawerProps extends BaseComponentProps {
  open: boolean;
  onClose: () => void;
  title: string;
  titleAR?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  position?: 'left' | 'right';
}

// Search Component
interface SearchProps extends BaseComponentProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  placeholderAR?: string;
  suggestions?: SearchSuggestion[];
  loading?: boolean;
}

// Theme and Internationalization
interface ThemeContextValue {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  colors: ThemeColors;
}

interface I18nContextValue {
  language: 'en' | 'ar';
  setLanguage: (lang: 'en' | 'ar') => void;
  t: (key: string, options?: any) => string;
  dir: 'ltr' | 'rtl';
}

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  turquoise: string;
}
```

## Program Call Flow

### Sample Creation and Management Flow

```mermaid
sequenceDiagram
    participant U as User
    participant SC as SampleComponent
    participant SS as SampleService
    participant SR as SampleRepository
    participant DB as IndexedDB
    participant AS as AuditService
    participant SY as SyncService

    U->>SC: Click "Create Sample"
    SC->>SC: Open CreateSampleDrawer
    SC->>SS: getNextSampleNumber()
    SS->>SR: getNextSampleNumber()
    SR->>DB: SELECT MAX(sampleNo) FROM samples
    DB-->>SR: Return max number
    SR-->>SS: Return next number (max + 1)
    SS-->>SC: Return sample number
    SC->>SC: Pre-fill sample number field
    
    U->>SC: Fill form and submit
    SC->>SC: Validate form data
    SC->>SS: createSample(sampleData)
    SS->>SR: create(sample)
    SR->>DB: INSERT sample record
    DB-->>SR: Return created sample
    SR-->>SS: Return sample
    SS->>AS: logAudit(CREATE, sample)
    AS->>DB: INSERT audit log
    SS-->>SC: Return created sample
    SC->>SC: Update UI state
    SC->>SY: triggerBackgroundSync()
    SY->>SY: Queue sync operation
```

### Test Approval Workflow

```mermaid
sequenceDiagram
    participant U as User
    participant TC as TestComponent
    participant TS as TestService
    participant SS as SampleService
    participant TR as TestRepository
    participant SR as SampleRepository
    participant DB as IndexedDB
    participant AS as AuditService

    U->>TC: Click "Approve Test"
    TC->>TS: approveTest(testId)
    TS->>TR: findById(testId)
    TR->>DB: SELECT test WHERE id = testId
    DB-->>TR: Return test
    TR-->>TS: Return test
    
    TS->>SS: getApprovedTest(sampleId)
    SS->>TR: findApprovedBySample(sampleId)
    TR->>DB: SELECT test WHERE sampleId AND approved = true
    DB-->>TR: Return current approved test
    TR-->>SS: Return approved test
    SS-->>TS: Return approved test
    
    alt Has existing approved test
        TS->>TR: update(existingTestId, {approved: false})
        TR->>DB: UPDATE test SET approved = false
    end
    
    TS->>TR: update(testId, {approved: true})
    TR->>DB: UPDATE test SET approved = true
    DB-->>TR: Return updated test
    TR-->>TS: Return updated test
    
    TS->>SS: updateSample(sampleId, {approved: true, approvedTestId: testId})
    SS->>SR: update(sampleId, updates)
    SR->>DB: UPDATE sample
    DB-->>SR: Return updated sample
    SR-->>SS: Return sample
    SS-->>TS: Return sample
    
    TS->>AS: logAudit(APPROVE, test)
    AS->>DB: INSERT audit log
    TS-->>TC: Return approved test
    TC->>TC: Update UI with approval status
```

### Purchasing Workflow State Transitions

```mermaid
sequenceDiagram
    participant U as User
    participant PC as PurchasingComponent
    participant PS as PurchasingService
    participant PR as RequestRepository
    participant DB as IndexedDB
    participant NS as NotificationService

    U->>PC: Create new request
    PC->>PS: createRequest(requestData)
    PS->>PR: create(request)
    PR->>DB: INSERT request with status 'Requested'
    DB-->>PR: Return created request
    PR-->>PS: Return request
    PS-->>PC: Return request
    PC->>PC: Add to "Requested" column
    
    U->>PC: Move to "To Be Ordered" (drag/checkbox)
    PC->>PS: updateRequestStatus(requestId, 'Sent to Ordering')
    PS->>PR: update(requestId, {status: 'Sent to Ordering'})
    PR->>DB: UPDATE request SET status = 'Sent to Ordering'
    DB-->>PR: Return updated request
    PR-->>PS: Return request
    PS-->>PC: Return request
    PC->>PC: Move to "To Be Ordered" column
    
    U->>PC: Mark as Ordered (with order details)
    PC->>PS: moveToOrdered(requestId, orderData)
    PS->>PR: update(requestId, {status: 'Ordered', orderReference, orderDate})
    PR->>DB: UPDATE request with order details
    DB-->>PR: Return updated request
    PR-->>PS: Return request
    PS->>NS: sendOrderNotification(request)
    NS->>NS: Queue notification
    PS-->>PC: Return ordered request
    PC->>PC: Move to "Ordered" column with green highlight
    PC->>PC: Update linked sample status
```

### Offline-First Data Synchronization

```mermaid
sequenceDiagram
    participant U as User
    participant APP as Application
    participant SW as ServiceWorker
    participant DB as IndexedDB
    participant SY as SyncService
    participant GD as GoogleDrive
    participant CR as ConflictResolver

    Note over U,GD: User works offline
    U->>APP: Perform CRUD operations
    APP->>DB: Store changes locally
    DB-->>APP: Confirm storage
    APP->>SW: Register background sync
    SW->>SW: Queue sync task
    
    Note over U,GD: Connection restored
    SW->>SY: Trigger background sync
    SY->>DB: Get pending changes
    DB-->>SY: Return change queue
    
    SY->>GD: Upload local changes
    GD-->>SY: Return upload result
    
    SY->>GD: Download remote changes
    GD-->>SY: Return remote data
    
    SY->>CR: detectConflicts(local, remote)
    CR->>CR: Compare timestamps and versions
    CR-->>SY: Return conflicts list
    
    alt Has conflicts
        SY->>CR: resolveConflicts(conflicts)
        CR->>CR: Apply last-write-wins strategy
        CR->>DB: Update with resolved data
        CR-->>SY: Return resolution result
    end
    
    SY->>DB: Update sync metadata
    SY->>APP: Emit sync complete event
    APP->>APP: Update UI with sync status
```

### Multi-language and RTL Support Flow

```mermaid
sequenceDiagram
    participant U as User
    participant LC as LanguageComponent
    participant I18N as I18nContext
    participant TS as TranslationService
    participant LS as LocalStorage
    participant UI as UIComponents

    U->>LC: Click language toggle (EN/AR)
    LC->>I18N: setLanguage('ar')
    I18N->>TS: loadTranslations('ar')
    TS->>TS: Load Arabic translations
    TS-->>I18N: Return translations
    
    I18N->>LS: Store language preference
    LS-->>I18N: Confirm storage
    
    I18N->>I18N: Set direction to 'rtl'
    I18N->>UI: Trigger re-render with new language
    UI->>UI: Apply RTL styles and Arabic text
    UI->>UI: Update form labels and placeholders
    UI->>UI: Adjust layout direction
    
    I18N-->>LC: Language change complete
    LC->>LC: Update toggle state
```

### Analytics Dashboard Data Aggregation

```mermaid
sequenceDiagram
    participant U as User
    participant AD as AnalyticsDashboard
    participant AS as AnalyticsService
    participant DB as IndexedDB
    participant CC as ChartComponent
    participant CS as CacheService

    U->>AD: Navigate to Analytics
    AD->>CS: checkCache('analytics-kpis')
    CS-->>AD: Return cached data or null
    
    alt Cache miss or expired
        AD->>AS: getKPIs(dateRange)
        AS->>DB: Query samples, tests, requests
        DB-->>AS: Return raw data
        AS->>AS: Calculate KPIs and metrics
        AS-->>AD: Return processed KPIs
        AD->>CS: cacheData('analytics-kpis', kpis)
    end
    
    AD->>CC: Render KPI cards
    CC->>CC: Display metrics with trend indicators
    
    U->>AD: Change date range filter
    AD->>AS: getSampleMetrics(newFilter)
    AS->>DB: Query with date filter
    DB-->>AS: Return filtered data
    AS->>AS: Aggregate by status, supplier, purpose
    AS-->>AD: Return chart data
    AD->>CC: Update charts
    CC->>CC: Animate chart transitions
    
    U->>AD: Export report
    AD->>AS: generateReport('PDF', filter)
    AS->>AS: Format data for export
    AS-->>AD: Return report blob
    AD->>AD: Trigger download
```

## Anything UNCLEAR

### Technical Implementation Questions

1. **Sample Number Collision Handling**: The PRD specifies using MAX(existing) + 1 for sample numbering, but doesn't address concurrent offline creation scenarios. Should we implement a reservation system or use UUIDs with display numbers?

2. **Google Drive Sync Granularity**: Should the system sync individual records or batch changes? What's the optimal sync frequency and conflict detection strategy for large datasets?

3. **Arabic Font Loading Strategy**: Which Arabic web fonts should be used for optimal rendering, and should they be self-hosted or loaded from CDN for offline support?

4. **Performance Thresholds**: The PRD mentions <500ms search response for 10K records, but doesn't specify memory limits or maximum dataset size for offline storage.

5. **Approval Workflow Notifications**: Should approval state changes trigger real-time notifications to relevant users, and what notification delivery mechanism should be implemented?

6. **Data Migration Strategy**: How should existing laboratory data be migrated into the new system, and what validation rules should be applied during bulk imports?

7. **Backup and Recovery**: Beyond Google Drive sync, should the system implement additional backup mechanisms for critical data protection?

8. **Multi-tenant Considerations**: Will the system need to support multiple laboratory organizations with data isolation, or is it designed for single-tenant deployment?

### Business Logic Clarifications

1. **Scaling Price Validation**: Should the system enforce ascending price validation for scaling tiers, or allow flexible pricing structures?

2. **Test Result Enum Extensibility**: The PRD mentions Admin can add/edit test result options - should this be a runtime configuration or require code deployment?

3. **Audit Trail Retention**: What's the retention policy for audit logs, and should there be automatic archiving or purging mechanisms?

4. **Concurrent User Limits**: Are there any restrictions on simultaneous users or concurrent operations that need to be enforced?

5. **Data Export Compliance**: Are there any regulatory requirements for data export formats or audit trail inclusion in exports?

These clarifications would help ensure the implementation fully meets the business requirements and technical constraints while maintaining optimal performance and user experience.