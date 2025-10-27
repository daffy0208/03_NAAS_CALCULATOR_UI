# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NaaS (Network-as-a-Service) Pricing Calculator - A comprehensive web application that replicates and enhances Excel-based network service pricing calculations. This is a production-ready Vite + Vanilla JS application with Tailwind CSS for professional network service quoting.

**Current Status:** v1.0.0 Production (85% Excel parity)
**Development Methodology:** Stepwise Refinement - Progressive elaboration from working core to enterprise platform

### Essential Documentation

Before starting development, review these core documents:

1. **Product Requirements (PRD):** `docs/PRD.md`
   - Complete feature specifications for v1.0-2.0
   - User stories and acceptance criteria
   - Technical and non-functional requirements
   - Success metrics and KPIs

2. **Development Roadmap:** `docs/DEVELOPMENT_ROADMAP.md`
   - Stepwise refinement strategy
   - Phase breakdowns (v1.0 → v1.1 → v1.5 → v2.0)
   - Iteration timelines and deliverables
   - Quality gates and success criteria

3. **Pricing Model:** `docs/pricing-model-documentation.md`
   - Detailed calculation methodologies
   - Dependency relationships
   - Discount structures and formulas
   - Test scenarios with expected results

4. **Implementation Plans:** `docs/reports/archive/`
   - Comprehensive Implementation Plan
   - Exact Spreadsheet Replication Plan
   - Various analysis and testing reports

**Development Philosophy:** This project follows stepwise refinement - each phase builds incrementally on the previous, delivering production-ready value while maintaining stability. Never break existing functionality; always add or enhance.

## Development Commands

### Essential Commands
```bash
npm run dev              # Start development server (localhost:8000)
npm run build            # Production build with optimization
npm run preview          # Preview production build
npm test                 # Run Vitest unit tests
npm run test:ui          # Open Vitest UI for interactive testing
npm run test:run         # Run tests once (CI mode)
npm run test:e2e         # Open Cypress for E2E tests
npm run test:e2e:headless # Run Cypress tests headless
npm run lint             # Auto-fix linting issues
npm run lint:check       # Check lint without fixing
npm run format           # Format all files with Prettier
npm run format:check     # Check formatting without changes
npm run clean            # Clean build artifacts
```

### Running Single Tests
```bash
npx vitest run tests/utils/security.test.js  # Run specific test file
npx cypress run --spec "cypress/e2e/calculator.cy.js"  # Run specific E2E test
```

## Architecture

### Entry Point and Module System (v1.0)

**Current Architecture:** Global Class-Based with Script Tags

The application uses a **legacy script tag architecture** where all modules are loaded as global classes via `<script>` tags in `index.html`. This is an intentional design decision for v1.0 stability and compatibility.

**Key Components:**
- `index.html`: Contains 14 `<script>` tags loading application code in dependency order
- `src/main.js`: Minimal Vite entry point that only imports CSS (no application logic)
- `vite.config.js`: Configured to bundle CSS and static assets, not application JavaScript
- All classes exposed to `window` object: `NaaSApp`, `QuoteDataStore`, `NaaSCalculator`, etc.

**Why This Architecture:**
1. **Stability First**: Working production code with proven reliability
2. **Low Risk**: No complex module refactoring required for v1.0
3. **Gradual Migration**: Allows stepwise refinement approach
4. **CDN Fallbacks**: Includes automatic fallback to local copies if CDN fails
5. **Browser Compatibility**: Works across all target browsers without transpilation issues

**Vite's Role in v1.0:**
- Bundles and optimizes CSS (Tailwind)
- Provides dev server with fast refresh
- Builds production HTML with proper asset paths
- PWA manifest generation
- Does NOT bundle application JavaScript (intentional)

**CDN Dependencies with Fallback:**
The application loads three external libraries from CDN with automatic local fallback:
- XLSX (0.18.5) - Excel import/export
- jsPDF (2.5.1) - PDF generation
- DOMPurify (3.0.8) - XSS protection

If CDN fails, the application automatically loads from `/node_modules/`.

**Migration Roadmap:**
- **v1.0** (Current): Global classes via script tags
- **v1.1** (Q1 2025): Convert utilities to ES modules
- **v1.5** (Q2 2025): Full ES module architecture
- **v2.0** (Q3-Q4 2025): Backend integration with modern bundling

See `docs/DEVELOPMENT_ROADMAP.md` for detailed migration plan.

### Core Calculation System

**Dependency-Based Architecture**: The calculator uses a sophisticated dependency graph system that ensures calculations execute in the correct order:

- **Dependency Graph** (`src/core/dependency-graph.js`): Defines component relationships and calculation order across 5 levels (0-4)
  - Level 0: Independent components (help, assessment, admin, otherCosts)
  - Level 1: Base infrastructure (prtg, capital, onboarding, pbsFoundation)
  - Level 2: Services depending on infrastructure (support requires capital for device count)
  - Level 3: Enhanced services (enhancedSupport, naasStandard, naasEnhanced)
  - Level 4: Contract pricing (dynamics1Year, dynamics3Year, dynamics5Year with wildcard dependencies)

- **Calculation Orchestrator** (`src/core/calculation-orchestrator.js`): Manages calculation execution
  - Topological sorting ensures dependencies calculate before dependents
  - Debouncing prevents calculation storms (50ms default)
  - Context injection passes dependency data between calculations
  - Tracks calculation history and performance metrics

**Critical Pattern**: When modifying calculations, always check `DependencyGraph` to understand component relationships. The `support` component depends on `capital` for device counts, and dynamic pricing components depend on all active components (`'*'` wildcard).

### Application State Management

**Data Store Pattern** (`src/services/data-store.js`): Centralized state management with pub/sub
- Components subscribe to data changes
- All state mutations go through the data store
- Automatic localStorage persistence via StorageManager
- Race condition prevention through initialization promises

**Storage Manager** (`src/services/storage-manager.js`): Handles all localStorage operations
- Auto-save with debouncing (5 second intervals)
- Data recovery and corruption handling
- Quota management and cleanup strategies

### Component System

**Component Manager** (`src/components/components.js`): Manages individual pricing components
- Dynamic form generation based on component configuration
- Real-time validation and calculation updates
- Component-specific configuration persistence

**Quote Wizard** (`src/components/wizard.js`): Multi-step guided quote builder
- 5-step workflow for comprehensive quotes
- Live pricing sidebar updates
- Progress tracking and data persistence

### Main Application Controller

**NaaSApp** (`src/app.js`): Main orchestrator (2189 lines)
- Manages view switching (dashboard, components, wizard, history)
- Coordinates between ComponentManager and QuoteWizard
- Handles auto-save, notifications, and UI state
- Resource management (intervals, timeouts, event listeners)
- Accessibility features (ARIA labels, keyboard navigation, screen reader announcements)

### Key Files by Purpose

**Calculations**:
- `src/core/calculations.js` - All pricing formulas (PRTG, capital equipment financing, support escalation, etc.)
- `src/core/calculation-orchestrator.js` - Execution order and dependency management
- `src/core/dependency-graph.js` - Component relationship definitions

**Data Management**:
- `src/services/data-store.js` - Centralized state with pub/sub
- `src/services/storage-manager.js` - localStorage persistence layer

**UI Components**:
- `src/components/components.js` - Individual component forms and management
- `src/components/wizard.js` - Multi-step quote workflow
- `src/app.js` - Main application controller and view management

**Utilities**:
- `src/utils/security.js` - Input sanitization and XSS prevention
- `src/utils/error-handler.js` - Global error handling
- `src/utils/import-export.js` - Excel/CSV import/export using SheetJS

## Important Implementation Details

### Calculation Formulas

**APR Financing** (Capital Equipment):
```javascript
// Uses Excel PMT function equivalent
monthlyPayment = (loanAmount * monthlyRate * (1 + monthlyRate)^termMonths) / ((1 + monthlyRate)^termMonths - 1)
```

**CPI Escalation** (Support Services):
```javascript
// 3% annual escalation over contract term
yearlyRate = baseMonthly * (1 + 0.03)^(year - 1)
```

**Volume Discounts**:
- Monthly total ≥ £5k: 10% discount
- Monthly total ≥ £3k: 7.5% discount
- Monthly total ≥ £1.5k: 5% discount
- Additional 5% for 4+ components, 2.5% for 3+ components
- Annual payment: +2% additional discount
- 3-year commitment: +3% additional discount
- Capped at 20% (monthly), 25% (annual), 30% (3-year)

### Race Condition Prevention

**Initialization Pattern**: App, DataStore, and managers use initialization promises
```javascript
if (this.isInitializing) return this.initPromise;
this.isInitializing = true;
this.initPromise = new Promise(...);
```

**Auto-save Debouncing**:
- Form inputs debounced at 1 second
- Auto-save interval: 5 seconds
- Immediate save on page unload/visibility change

**Calculation Queuing**:
- 50ms debounce for rapid input changes
- Priority-based queue processing
- Prevents duplicate calculations for same component

### Security Considerations

**Input Sanitization** (`src/utils/security.js`):
- Input validation utilities implemented
- SecurityUtils and InputValidator classes available
- XSS detection patterns in place
- SQL injection prevention patterns

**Current Security Status:**
- ⚠️ DOMPurify is installed but integration needs audit
- ✅ Input validation working (see tests/utils/security.test.js)
- ⚠️ Some XSS vectors may remain - review innerHTML usage
- ✅ URL validation functions available
- ⚠️ File upload validation not yet implemented

**Recommended Actions:**
1. Audit all innerHTML usage in codebase
2. Ensure all user input goes through SecurityUtils.sanitize()
3. Review DOMPurify integration in security.js
4. Add Content Security Policy headers when deploying

### Testing Strategy

**Current Test Status:**

**Unit Tests** (Vitest - ✅ Working):
- `tests/utils/security.test.js` - Input sanitization (22 tests passing)
- `tests/utils/error-handler.test.js` - Error handling (tests exist)
- Run with: `npm test`
- Coverage: ~15% (primarily utility functions)

**E2E Tests** (Cypress - ⚠️ Not in CI):
- `cypress/e2e/calculator.cy.js` - Full calculator workflow exists
- Not currently integrated into CI/CD pipeline
- Run with: `npm run test:e2e`

**Integration Tests** (⚠️ Limited):
- Basic component interaction tests exist
- Calculation orchestrator not fully tested
- Dependency graph validation minimal
- Storage manager tests pending

**Test Coverage Gap:**
- Calculation formulas: Not unit tested (verified against Excel manually)
- Component Manager: No unit tests
- Quote Wizard: No unit tests
- Data persistence: Minimal test coverage
- Auto-save logic: Not tested

**Recommended Testing Priorities:**
1. Add calculation formula unit tests (critical for accuracy)
2. Integrate Cypress into CI/CD
3. Test dependency graph edge cases
4. Add data persistence integration tests
5. Test volume discount stacking logic

## Common Development Tasks

### Adding a New Component

1. Update `DependencyGraph` in `src/core/dependency-graph.js`:
   ```javascript
   'newComponent': {
       dependencies: ['requiredComponent'],
       level: 2,
       category: 'services',
       description: 'Component description'
   }
   ```

2. Add calculation method in `src/core/calculations.js`:
   ```javascript
   calculateNewComponent(params) {
       // Return { breakdown, totals, metadata }
   }
   ```

3. Register in `CalculationOrchestrator.executeCalculation()` switch statement

4. Add UI definition in `ComponentManager.components` object

### Modifying Calculations

1. Locate formula in `src/core/calculations.js` (search for component name)
2. Update calculation logic
3. Verify dependencies in `DependencyGraph` are correct
4. Test with `npm test` to ensure accuracy
5. Update volume discount logic if pricing thresholds changed

### Debugging Calculation Order Issues

1. Check browser console for orchestrator logs
2. Use `app.getState()` in console to inspect current state
3. Check `calculationHistory` in orchestrator for execution order
4. Verify component dependencies in `DependencyGraph.graph`
5. Use `validateRelationships()` to check for missing dependencies

### Working with Data Persistence

- All data automatically persists via `StorageManager`
- Manual save: `dataStore.updateComponent(type, data)`
- Clear storage: `localStorage.clear()` or use History view "Clear All"
- Auto-save indicator shows when data saves successfully
- Check `naas_app_state`, `naas_wizard_autosave`, `naas_components_autosave` in localStorage

## Configuration

### Vite Configuration
- Dev server: Port 8000
- Path aliases: `@`, `@components`, `@services`, `@utils`
- Vendor chunks: xlsx, jspdf, dompurify separated for optimization
- PWA support with offline capabilities

### Tailwind Theme
- Primary color: `qolcom-green` (#00a651)
- Dark theme: `dark-bg` (#111827), `dark-card` (#1f2937)
- Custom animations: fadeIn, slideUp, pulse
- Forms plugin enabled for styled inputs

### Build Optimization
- Terser minification with console/debugger removal in production
- Source maps enabled for debugging
- Legacy browser support via @vitejs/plugin-legacy
- Manual chunks for better code splitting

## Known Patterns and Conventions

### Naming Conventions
- Component types: camelCase (e.g., `prtg`, `pbsFoundation`, `naasStandard`)
- File naming: kebab-case (e.g., `calculation-orchestrator.js`)
- CSS classes: Tailwind utilities, BEM for custom classes
- IDs: camelCase for JavaScript, kebab-case for HTML

### Error Handling
- All calculation methods wrap logic in try-catch
- Return error objects with `{ error, totals: {0}, breakdown: {error: true} }`
- Use `ErrorHandler.handleError()` for consistent logging
- Show user-friendly notifications via `app.showNotification()`

### State Updates
- Always use DataStore methods, never mutate state directly
- Subscribe to changes via `dataStore.subscribe(callback)`
- Component updates trigger automatic recalculation via orchestrator

### Accessibility
- ARIA labels on all interactive elements
- Keyboard navigation support (arrow keys, Enter, Escape)
- Screen reader announcements via `announceToScreenReader()`
- Focus management during view transitions
- High contrast mode support

## Version History and Roadmap

### Current: v1.0.0 ✅ (January 2025)
- Full Excel functionality replicated (85% parity)
- 15 component pricing system
- Dependency-based calculation engine
- Complete quote wizard workflow
- Excel/CSV import/export
- Responsive design with dark theme
- Local persistence and auto-save
- Comprehensive error handling
- WCAG 2.1 AA accessibility

### Planned Releases (Stepwise Refinement)

**v1.1 - Critical Enhancements** (Q1 2025 - 8 weeks):
- Geographic pricing with location multipliers
- Risk assessment system (credit scoring)
- Equipment lifecycle tracking
- Industry compliance costs (HIPAA, SOX, PCI-DSS)
- Enhanced tax calculations
- See `docs/DEVELOPMENT_ROADMAP.md` for detailed iteration plan

**v1.5 - Advanced Features** (Q2 2025 - 12 weeks):
- Dynamic pricing engine (seasonal, utilization-based)
- Multi-currency support (USD, GBP, EUR, CAD)
- Advanced SLA management with penalties
- Enhanced PDF reporting with branding
- Multi-scenario comparisons

**v2.0 - Enterprise Platform** (Q3-Q4 2025 - 16 weeks):
- Backend infrastructure (Node.js + PostgreSQL)
- Multi-tenant architecture
- CRM/ERP integrations (Salesforce, NetSuite)
- SSO authentication
- Advanced analytics and BI dashboards
- Competitive intelligence features

**Detailed Roadmap:** See `docs/DEVELOPMENT_ROADMAP.md` for complete phase breakdowns, iteration details, and success criteria.

**Product Requirements:** See `docs/PRD.md` for comprehensive feature specifications and requirements.
