# NBS LIMS - Laboratory Information Management System
## Complete System Specification

**Version:** 1.0  
**Date:** January 2025  
**Technology Stack:** React + TypeScript + Tailwind CSS + shadcn/ui + Framer Motion  
**Architecture:** PWA (Progressive Web App) with Offline-First Design  

---

## 1. System Overview

### 1.1 Business Purpose
NBS LIMS is a comprehensive Laboratory Information Management System designed specifically for perfume and fragrance laboratories. The system streamlines laboratory operations by providing an integrated platform that eliminates manual processes, reduces operational errors by 80%, and enables uninterrupted laboratory operations through PWA technology.

### 1.2 Key Business Goals
- **Streamline Laboratory Operations**: Automated sample numbering, workflow management, and real-time status tracking
- **Enable Offline-First Laboratory Management**: 99.9% system availability through PWA technology with local database storage
- **Facilitate Multi-Regional Compliance**: Bilingual interface (English/Arabic RTL), comprehensive audit trails, and flexible approval workflows
- **Support Complex Business Workflows**: Sample tracking, supplier management, testing procedures, purchasing workflows, and formula management

### 1.3 Target Users
- **Laboratory Technicians**: Sample registration and testing
- **Laboratory Leads**: Quality control and approval processes
- **Purchasing Managers**: Procurement workflow management
- **System Administrators**: User management and system configuration
- **Viewers**: Read-only access for reporting and monitoring

---

## 2. Main Modules

### 2.1 Samples Module
**Purpose**: Core sample management with comprehensive tracking and lifecycle management

**Key Features**:
- Auto-generated sequential sample numbering (max existing + 1 rule)
- Bilingual support (English/Arabic) with RTL layout
- Comprehensive sample information including supplier details, patch numbers, and pricing
- Storage location management with rack/position tracking
- Barcode and QR code generation for each sample
- Sample ledger with branding information and customer details
- Raw material flagging for formula integration
- Patch number grouping for batch management
- Custom fields support for extensibility

**UI Components**:
- Sample list with advanced filtering and search
- Sample detail modal with tabbed interface (Overview, Details, Ledger, Formulas, Tests)
- Sample creation/edit forms with validation
- Patch number group display with smart hiding logic
- Glassmorphism-styled section headers with watermark backgrounds

### 2.2 Tests Module
**Purpose**: Test management with approval workflows and quality control

**Key Features**:
- Personal Use vs Industrial test workflows
- Test result management (Accepted, Rejected, Rework, Retest)
- Approval workflow with role-based permissions
- Test parameter tracking (temperature, speed, etc.)
- Integration with sample lifecycle
- Test history and audit trails

**UI Components**:
- Test creation forms with conditional fields
- Test result display with status indicators
- Approval buttons with permission controls
- Test history timeline

### 2.3 Formulas Module
**Purpose**: Formula creation, management, and cost calculation

**Key Features**:
- Formula creation with ingredient management
- Primary and secondary sample linking
- Cost calculation and pricing analysis
- QR code and barcode generation for formulas
- Formula approval workflow
- Raw material integration
- Color configuration with percentage tracking
- Internal code auto-generation (NBS001, NBS002, etc.)

**UI Components**:
- Formula list with cost visibility controls
- Formula creation/edit dialogs
- Ingredient management with percentage validation
- Cost breakdown tables and visualizations
- QR/Barcode display and download functionality

### 2.4 Finished Goods Module
**Purpose**: Management of approved formulas converted to finished products

**Key Features**:
- Automatic generation from approved formulas
- Product information management
- Inventory tracking
- Quality control integration
- Branding and pricing management

### 2.5 Label Editor Module
**Purpose**: Advanced label design and printing system

**Key Features**:
- Canvas-based editing with Fabric.js
- Millimeter-precise positioning (300 DPI accuracy)
- Multiple element types (text, shapes, images, barcodes, QR codes, tables)
- Dynamic data binding with `{{Variable}}` syntax
- Multi-select and grouping capabilities
- Layer management with z-index ordering
- Export to PDF and print-ready formats
- RTL support for Arabic text

**UI Components**:
- Canvas editor with rulers and guides
- Tools panel with element creation tools
- Inspector panel for element properties
- Layers panel for element management
- Variables picker for data binding

### 2.6 Suppliers Module
**Purpose**: Supplier management with pricing configurations

**Key Features**:
- Supplier information management
- Contact details and communication tracking
- Pricing configuration with scaling options
- Supplier performance tracking
- Integration with purchasing workflows

### 2.7 Purchasing Module
**Purpose**: Three-column purchasing pipeline management

**Key Features**:
- Request → To Be Ordered → Ordered workflow
- Cost estimation and tracking
- Supplier integration
- Priority management (Low, Medium, High, Critical)
- Approval workflows
- Purchase order generation

**UI Components**:
- Three-column Kanban board layout
- Request creation forms
- Cost visibility controls based on permissions
- Status tracking with visual indicators

### 2.8 Requested Items Module
**Purpose**: Item request management and tracking

**Key Features**:
- Item request creation and tracking
- Approval workflows
- Integration with purchasing module
- Status tracking and notifications

### 2.9 Tasks Module
**Purpose**: Task management with Kanban board interface

**Key Features**:
- Kanban board with drag-and-drop functionality
- Task assignment and tracking
- Priority management
- Due date tracking
- Status management (Pending, In Progress, Completed)

### 2.10 Analytics Module
**Purpose**: Dashboard with KPIs and reporting

**Key Features**:
- Key performance indicators (KPIs)
- Interactive charts and graphs
- Real-time data visualization
- Customizable dashboard widgets
- Export capabilities

### 2.11 Settings Module
**Purpose**: System configuration and user management

**Key Features**:
- User profile management
- Role and permission configuration
- System preferences
- Theme and language settings
- Custom fields management
- Sound settings and notifications
- Database management tools

---

## 3. UI Layouts

### 3.1 Main Application Layout
- **Sidebar Navigation**: Role-based menu with icons and labels
- **Top Header**: User profile, theme toggle, language switcher
- **Main Content Area**: Dynamic content based on selected module
- **Responsive Design**: Desktop-first with mobile adaptation

### 3.2 Sample Detail Modal
- **Tabbed Interface**: Overview, Details, Ledger, Formulas, Tests
- **Dynamic Tabs**: Only show tabs with available content
- **Glassmorphism Headers**: Each section has glass-styled headers with watermarks
- **Patch Number Tab**: Dedicated tab for patch-related samples (hidden if only one sample)

### 3.3 Formula Management
- **Formula List**: Table with cost visibility controls
- **Creation Dialog**: Multi-step form with validation
- **Detail View**: Tabbed interface with ingredients, costing, and testing
- **QR/Barcode Display**: Visual representation with download options

### 3.4 Purchasing Pipeline
- **Three-Column Layout**: Requested → To Be Ordered → Ordered
- **Drag-and-Drop**: Move items between columns
- **Cost Visibility**: Permission-based cost display
- **Status Indicators**: Visual status representation

### 3.5 Label Editor
- **Canvas Area**: Main editing workspace with rulers
- **Tools Panel**: Element creation and editing tools
- **Inspector Panel**: Element properties and settings
- **Layers Panel**: Element organization and management

---

## 4. Data Models

### 4.1 Core Entities

#### Sample
```typescript
interface Sample {
  id: string;
  sampleNo: number; // Auto-generated, unique
  itemNameEN: string;
  itemNameAR: string;
  supplierId: string;
  patchNumber: string;
  refCode?: string;
  supplierCode?: string;
  barcode?: string;
  qrCode?: string;
  dateOfSample: Date;
  itemGroup?: string;
  status: SampleStatus;
  approved: boolean;
  approvedTestId?: string;
  storageLocation: StorageLocation;
  customIdNo?: string;
  pricing: SamplePricing;
  shorjaBranch?: ShorjaBranchInfo;
  ledger?: SampleLedgerData;
  shipment?: ShipmentInfo;
  attachments?: SampleAttachment[];
  isRawMaterial?: boolean;
  isFinishedGood?: boolean;
  isFormulaProduct?: boolean;
  sourceFormulaId?: string;
  brandedAs?: BrandingInfo;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Formula
```typescript
interface Formula {
  id: string;
  name: string;
  sampleId: string; // Primary sample
  secondarySampleId?: string; // Secondary sample
  ingredients: FormulaIngredient[];
  totalPercentage: number; // Must equal 100%
  totalCost: number;
  costPerUnit: number;
  sellingPrice?: number;
  profitMargin?: number;
  notes?: string;
  status: 'Draft' | 'Testing' | 'Approved' | 'Failed' | 'Retest' | 'Rejected';
  temperatureC?: number;
  mixtureSpeedRpm?: number;
  batchSize: number;
  batchUnit: 'ml' | 'g' | 'kg' | 'L';
  internalCode: string; // Auto-generated (NBS001, NBS002, etc.)
  externalCode?: string;
  purpose?: string;
  colorPercentage?: number;
  colorCode?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  productId?: string; // Generated product ID
  productName?: string;
  productCode?: string;
  qrCode?: string; // Base64 QR code image
  barcode?: string; // Barcode string
  barcodeImage?: string; // Base64 barcode image
}
```

#### User
```typescript
interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'Admin' | 'Lab Lead' | 'Technician' | 'Viewer';
  permissions: Record<string, string[]>;
  profilePhoto?: string;
  profilePhotoName?: string;
}
```

#### PurchaseRequest
```typescript
interface PurchaseRequest {
  id: string;
  requestNumber: string;
  itemName: string;
  description: string;
  quantity: number;
  unit: string;
  estimatedCost: number;
  supplier?: string;
  status: 'requested' | 'to-be-ordered' | 'ordered';
  priority: 'low' | 'medium' | 'high';
  requestedBy: string;
  requestedAt: Date;
  notes?: string;
}
```

### 4.2 Supporting Entities

#### StorageLocation
```typescript
interface StorageLocation {
  rack: string;
  position: string;
  area?: string;
  notes?: string;
}
```

#### SamplePricing
```typescript
interface SamplePricing {
  basePrice?: number;
  currency?: string;
  scalingPrices?: ScalingPrice[];
}
```

#### FormulaIngredient
```typescript
interface FormulaIngredient {
  id: string;
  rawMaterialId: string;
  percentage: number;
  notes?: string;
  cost?: number;
}
```

---

## 5. User Roles & Permissions

### 5.1 Role Hierarchy

#### Admin
- **Full System Access**: All permissions across all modules
- **User Management**: Create, read, update, delete users
- **System Configuration**: Access to all settings and configurations
- **Pricing Access**: View all pricing information
- **Cost Visibility**: Access to all cost-related data

#### Lab Lead
- **Sample Management**: Full CRUD operations with pricing access
- **Test Management**: Create, read, update, approve tests
- **Formula Management**: Full access with cost visibility
- **Purchasing**: Create, read, update with cost visibility
- **Limited User Management**: Read-only user access
- **Settings Access**: Read-only settings access

#### Technician
- **Sample Management**: Create, read, update (no pricing access)
- **Test Management**: Create, read, update (no approval)
- **Formula Management**: Create, read, update (no cost visibility)
- **Purchasing**: Read-only access
- **No User Management**: No user access
- **No Settings Access**: No settings access

#### Viewer
- **Read-Only Access**: View all data without modification rights
- **No Pricing Access**: Cannot view pricing information
- **No Cost Visibility**: Cannot view cost-related data
- **No Management Functions**: Cannot create, update, or delete

### 5.2 Permission Matrix

| Resource | Action | Admin | Lab Lead | Technician | Viewer |
|----------|--------|-------|----------|------------|--------|
| samples | create | ✅ | ✅ | ✅ | ❌ |
| samples | read | ✅ | ✅ | ✅ | ✅ |
| samples | update | ✅ | ✅ | ✅ | ❌ |
| samples | delete | ✅ | ✅ | ❌ | ❌ |
| samples | view_pricing | ✅ | ✅ | ❌ | ❌ |
| tests | create | ✅ | ✅ | ✅ | ❌ |
| tests | read | ✅ | ✅ | ✅ | ✅ |
| tests | update | ✅ | ✅ | ✅ | ❌ |
| tests | delete | ✅ | ❌ | ❌ | ❌ |
| tests | approve | ✅ | ✅ | ❌ | ❌ |
| formulas | create | ✅ | ✅ | ✅ | ❌ |
| formulas | read | ✅ | ✅ | ✅ | ✅ |
| formulas | update | ✅ | ✅ | ✅ | ❌ |
| formulas | delete | ✅ | ❌ | ❌ | ❌ |
| formulas | view_costs | ✅ | ✅ | ❌ | ❌ |
| purchasing | create | ✅ | ✅ | ❌ | ❌ |
| purchasing | read | ✅ | ✅ | ✅ | ✅ |
| purchasing | update | ✅ | ✅ | ❌ | ❌ |
| purchasing | delete | ✅ | ❌ | ❌ | ❌ |
| purchasing | view_costs | ✅ | ✅ | ❌ | ❌ |
| users | create | ✅ | ❌ | ❌ | ❌ |
| users | read | ✅ | ✅ | ❌ | ❌ |
| users | update | ✅ | ❌ | ❌ | ❌ |
| users | delete | ✅ | ❌ | ❌ | ❌ |
| settings | read | ✅ | ✅ | ❌ | ❌ |
| settings | update | ✅ | ❌ | ❌ | ❌ |

---

## 6. Business Logic & Workflows

### 6.1 Sample Lifecycle Workflow

#### Sample Creation
1. **Auto-Numbering**: System generates next sequential number (max existing + 1)
2. **Barcode Generation**: Automatic barcode creation using sample number and patch
3. **Storage Assignment**: Assign rack and position in storage location
4. **Supplier Linking**: Link to supplier with pricing information
5. **Status Initialization**: Set initial status to "Untested"

#### Sample Testing Workflow
1. **Test Creation**: Technician creates test with parameters
2. **Test Execution**: Record test results and observations
3. **Lab Lead Review**: Lab Lead reviews test results
4. **Approval Process**: Single approval per sample (only one approved test)
5. **Status Update**: Update sample status based on approval

#### Sample Approval States
- **Untested** → **Testing** → **Accepted/Rejected**
- **Rejected** → **Rework** → **Retest** → **Accepted/Rejected**

### 6.2 Formula Management Workflow

#### Formula Creation
1. **Primary Sample Selection**: Choose main sample for formula
2. **Secondary Sample Selection**: Optional secondary sample
3. **Ingredient Addition**: Add raw materials with percentages
4. **Percentage Validation**: Ensure total equals 100%
5. **Cost Calculation**: Automatic cost calculation based on ingredient prices
6. **Internal Code Generation**: Auto-generate NBS001, NBS002, etc.

#### Formula Approval Process
1. **Draft** → **Testing** → **Approved/Failed/Retest/Rejected**
2. **Product Generation**: Approved formulas create finished goods
3. **QR/Barcode Generation**: Automatic code generation for tracking

### 6.3 Purchasing Workflow

#### Three-Column Pipeline
1. **Requested**: Initial purchase requests
2. **To Be Ordered**: Approved requests ready for ordering
3. **Ordered**: Completed purchase orders

#### Request Processing
1. **Request Creation**: User creates purchase request with cost estimation
2. **Approval Process**: Lab Lead or Admin approves request
3. **Supplier Selection**: Choose supplier and finalize details
4. **Order Placement**: Convert to purchase order
5. **Receiving**: Track delivery and inventory updates

### 6.4 Patch Number Management

#### Patch Grouping Logic
- Samples with same patch number are grouped together
- Patch tab only appears when multiple samples exist
- Current sample hidden from its own patch group to avoid repetition
- Patch count displayed in sample details

---

## 7. Integrations

### 7.1 Barcode/QR Code System
- **Barcode Generation**: Automatic Code128 barcodes for samples
- **QR Code Generation**: QR codes for formulas and samples
- **Scanning Support**: Barcode scanner integration for quick lookup
- **Print Integration**: Label printing with barcode/QR codes

### 7.2 Export/Import Capabilities
- **CSV Export**: Sample data, test results, formulas
- **Excel Export**: Comprehensive reports with formatting
- **JSON Export**: Complete data backup and migration
- **PDF Generation**: Reports and labels

### 7.3 Label Printing System
- **Canvas-Based Editor**: Fabric.js-powered label design
- **Print Preview**: WYSIWYG label preview
- **Batch Printing**: Multiple labels with different data
- **Template Management**: Save and reuse label templates

### 7.4 PWA Features
- **Offline Storage**: IndexedDB for local data persistence
- **Background Sync**: Data synchronization when online
- **Push Notifications**: Real-time updates and alerts
- **Installation**: Add to home screen functionality

---

## 8. Styling & Theming

### 8.1 Glassmorphism Design System
- **Glass Panels**: Translucent backgrounds with backdrop blur
- **Gradient Overlays**: Subtle color gradients for depth
- **Watermark System**: Company logo watermarks on glass elements
- **Light/Dark Modes**: Automatic theme switching with CSS variables

### 8.2 Color Palette
- **Primary**: Turquoise/Teal (#14B8A6, #38BDF8)
- **Secondary**: Indigo (#6366F1)
- **Accent**: Sky blue variations
- **Neutral**: Slate grays for text and backgrounds

### 8.3 Typography
- **Primary Font**: System font stack for optimal performance
- **RTL Support**: Arabic text rendering with proper direction
- **Font Sizes**: Responsive typography scale
- **Font Weights**: Multiple weights for hierarchy

### 8.4 Component Styling
- **Glass Tabs**: Translucent tab headers with animations
- **Glass Cards**: Elevated card components with blur effects
- **Glass Dialogs**: Modal dialogs with glass styling
- **Glass Section Headers**: Section headers with watermark backgrounds

---

## 9. Interactions & Accessibility

### 9.1 Keyboard Navigation
- **Tab Order**: Logical tab sequence through all interactive elements
- **Keyboard Shortcuts**: Common actions accessible via keyboard
- **Focus Management**: Clear focus indicators and focus trapping
- **Escape Key**: Close modals and dialogs

### 9.2 Responsive Behavior
- **Desktop-First**: Optimized for desktop with mobile adaptation
- **Breakpoints**: Tailwind CSS responsive breakpoints
- **Touch Support**: Touch-friendly interactions for mobile
- **Gesture Support**: Swipe and pinch gestures where appropriate

### 9.3 RTL Support (Arabic/English)
- **Text Direction**: Automatic RTL layout for Arabic content
- **Icon Mirroring**: Icons and UI elements mirrored for RTL
- **Number Formatting**: Proper number formatting for both languages
- **Date Formatting**: Locale-appropriate date formats

### 9.4 Accessibility Features
- **Screen Reader Support**: ARIA labels and semantic HTML
- **Color Contrast**: WCAG AA compliant color combinations
- **Focus Indicators**: Clear visual focus indicators
- **Alternative Text**: Descriptive alt text for images and icons

---

## 10. Extensibility

### 10.1 Custom Fields System
- **Dynamic Fields**: Add custom fields to samples and other entities
- **Field Types**: Text, number, date, select, checkbox, file upload
- **Validation Rules**: Custom validation for custom fields
- **Field Groups**: Organize custom fields into logical groups

### 10.2 Module Architecture
- **Plugin System**: Easy addition of new modules
- **Service Layer**: Abstracted business logic for reusability
- **Component Library**: Reusable UI components
- **Hook System**: Custom React hooks for shared functionality

### 10.3 Data Model Extensions
- **Entity Inheritance**: Extend base entities with custom properties
- **Relationship Management**: Define custom relationships between entities
- **Validation Rules**: Custom validation logic for new fields
- **Migration System**: Database schema migration support

### 10.4 API Integration
- **RESTful API**: Standard REST endpoints for data access
- **GraphQL Support**: Flexible data querying (future enhancement)
- **Webhook System**: Event-driven integrations
- **Third-Party APIs**: Integration with external services

---

## 11. Edge Cases & Risks

### 11.1 Data Integrity Risks
- **Duplicate Sample Numbers**: Prevention through atomic number generation
- **Concurrent Updates**: Optimistic locking for data consistency
- **Data Validation**: Comprehensive validation at all entry points
- **Audit Trail**: Complete audit log for all data changes

### 11.2 System Availability
- **Offline Mode**: Full functionality without internet connection
- **Data Synchronization**: Conflict resolution for offline/online sync
- **Backup Strategy**: Regular data backup and recovery procedures
- **Error Handling**: Graceful error handling and user feedback

### 11.3 User Experience Risks
- **Performance**: Large dataset handling and pagination
- **Memory Management**: Efficient memory usage for PWA
- **Loading States**: Clear loading indicators for all operations
- **Error Recovery**: User-friendly error messages and recovery options

### 11.4 Security Considerations
- **Permission Bypass**: Robust permission checking at all levels
- **Data Exposure**: Sensitive data protection based on user roles
- **Input Validation**: XSS and injection attack prevention
- **Session Management**: Secure session handling and timeout

---

## 12. Future Enhancements

### 12.1 AI-Powered Features
- **Intelligent Search**: AI-powered search with natural language processing
- **Predictive Analytics**: Machine learning for demand forecasting
- **Automated Workflows**: AI-driven workflow optimization
- **Smart Recommendations**: Intelligent suggestions for formula improvements

### 12.2 Advanced Analytics
- **Real-Time Dashboards**: Live data visualization and monitoring
- **Predictive Modeling**: Statistical analysis and trend prediction
- **Custom Reports**: User-defined report generation
- **Data Export**: Advanced export options with custom formatting

### 12.3 Mobile Applications
- **Native Mobile Apps**: iOS and Android applications
- **Offline Synchronization**: Seamless offline/online data sync
- **Push Notifications**: Real-time alerts and updates
- **Camera Integration**: Barcode scanning and image capture

### 12.4 Integration Enhancements
- **ERP Integration**: Connection with enterprise resource planning systems
- **Cloud Storage**: Google Drive and other cloud storage integration
- **API Marketplace**: Third-party integration marketplace
- **Webhook System**: Event-driven integration architecture

### 12.5 Advanced Features
- **Multi-Tenant Support**: Support for multiple organizations
- **Advanced Workflow Engine**: Custom workflow creation and management
- **Document Management**: Integrated document storage and management
- **Compliance Reporting**: Automated compliance and regulatory reporting

---

## Conclusion

NBS LIMS represents a comprehensive, modern laboratory information management system designed specifically for perfume and fragrance laboratories. The system combines advanced technical capabilities with intuitive user experience, providing a robust platform for managing complex laboratory operations while maintaining data integrity and security.

The modular architecture ensures scalability and extensibility, while the offline-first PWA design guarantees uninterrupted operation. The glassmorphism design system provides a premium, modern interface that enhances user experience while maintaining professional functionality.

This specification serves as a complete guide for understanding, implementing, and extending the NBS LIMS system, ensuring consistent development and maintenance practices across all modules and features.

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Next Review**: March 2025  
**Maintained By**: NBS Development Team
