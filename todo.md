# NBS LIMS Implementation Plan

## Project Overview
- **Name**: NBS LIMS (Laboratory Information Management System)
- **Tech Stack**: React + TypeScript + Shadcn-ui + Tailwind CSS
- **Features**: Multi-language (EN/AR), PWA, Offline-first, Role-based permissions
- **Theme**: Premium turquoise/black/white with light/dark mode

## Critical Business Rules
1. **Sample Numbering**: ALWAYS use max(existing) + 1 rule
2. **Approval Workflow**: Only ONE approved test per sample
3. **Supplier Scaling**: Givaudan=enabled, Expressions=disabled by default
4. **Status Colors**: Accepted=green, Rejected=light red
5. **Purchasing Pipeline**: Requested → To Be Ordered → Ordered

## Core Files to Implement

### 1. Database & Services (src/lib/)
- `database.ts` - IndexedDB setup with Dexie.js
- `types.ts` - All TypeScript interfaces and enums
- `services/sampleService.ts` - Sample CRUD with auto-numbering
- `services/supplierService.ts` - Supplier management
- `services/testService.ts` - Test management with approval logic
- `services/purchasingService.ts` - Purchasing workflow
- `services/taskService.ts` - Task management
- `services/authService.ts` - Authentication and permissions
- `services/auditService.ts` - Audit trail logging

### 2. Context & State Management (src/contexts/)
- `AuthContext.tsx` - User authentication and roles
- `ThemeContext.tsx` - Light/dark mode management
- `I18nContext.tsx` - Multi-language support with RTL
- `DatabaseContext.tsx` - Database connection management

### 3. Core Components (src/components/)
- `Layout.tsx` - Main application layout with sidebar
- `Navigation.tsx` - Sidebar navigation with role-based visibility
- `Header.tsx` - Top header with language/theme toggles
- `DataTable.tsx` - Reusable table with filtering/sorting
- `SearchBar.tsx` - Global search component
- `StatusBadge.tsx` - Color-coded status indicators

### 4. Feature Pages (src/pages/)
- `Dashboard.tsx` - Analytics dashboard with KPIs
- `Samples.tsx` - Sample management with CRUD operations
- `Tests.tsx` - Test management (Personal Use/Industrial)
- `Suppliers.tsx` - Supplier management with scaling config
- `Purchasing.tsx` - Three-column purchasing pipeline
- `Tasks.tsx` - Kanban board task management
- `Settings.tsx` - Admin configuration panel

### 5. Feature-Specific Components (src/components/)
- `samples/SampleForm.tsx` - Create/edit sample drawer
- `samples/SampleDetail.tsx` - Sample profile view
- `tests/TestForm.tsx` - Test creation with conditional fields
- `tests/ApprovalButton.tsx` - Test approval toggle
- `purchasing/PurchasingBoard.tsx` - Three-column workflow
- `tasks/KanbanBoard.tsx` - Task management board
- `analytics/KPICards.tsx` - Dashboard metrics cards

## Implementation Priority

### Phase 1: Foundation (MVP)
1. Database setup with core entities
2. Authentication system with roles
3. Basic CRUD for Samples and Suppliers
4. Sample auto-numbering implementation
5. Multi-language setup (EN/AR)

### Phase 2: Core Features
1. Test management with approval workflow
2. Purchasing pipeline implementation
3. Analytics dashboard with KPIs
4. Import/Export functionality
5. Audit trail system

### Phase 3: Advanced Features
1. Task management with Kanban
2. PWA configuration
3. Offline-first capabilities
4. Google Drive sync (mock implementation)
5. Advanced search and filtering

## Seed Data Requirements
- Purposes: "Personal Use", "Industrial"
- Test Results: "Accepted", "Rejected", "Rework", "Retest"
- Suppliers: "Givaudan" (scaling=true), "Expressions" (scaling=false)
- Sample data for dashboard demonstration

## Key Technical Considerations
- RTL support for Arabic text and layout
- Color-coded status system (green/red highlights)
- Responsive desktop-first design
- Form validation with helpful error messages
- Audit trail for all operations
- Role-based component visibility