# Product Requirements Document (PRD)
# NaaS Pricing Calculator - Master Requirements

**Version:** 2.0
**Status:** Production v1.0 Complete, v1.1-2.0 In Planning
**Last Updated:** January 2025
**Owner:** Qolcom Ltd

---

## Executive Summary

The NaaS Pricing Calculator is a web-based application that replicates and enhances the functionality of the Excel-based NaaS & Support costing spreadsheet. The system provides accurate, real-time pricing calculations for network-as-a-service solutions with a modern, responsive interface.

**Current Status:** v1.0 (85% of Excel functionality) - Production Ready
**Target:** v2.0 (100% feature parity + enhancements)

---

## 1. Product Vision

### 1.1 Problem Statement
Sales teams currently rely on complex Excel spreadsheets for NaaS pricing calculations, leading to:
- Manual data entry errors
- Difficulty maintaining consistency across quotes
- Limited accessibility (desktop-only)
- No audit trail or version control
- Time-consuming quote generation process

### 1.2 Solution
A modern web application that:
- Replicates all Excel calculations with 100% accuracy
- Provides intuitive, guided workflows
- Enables real-time collaboration and quote management
- Offers mobile accessibility
- Maintains automatic data persistence and history

### 1.3 Success Metrics
- **Accuracy:** 100% match with Excel formulas
- **Time Savings:** 75% reduction in quote generation time
- **Error Reduction:** 90% fewer calculation errors
- **User Adoption:** 90% preference over spreadsheet
- **Quote Accuracy:** 95% match with final contracts

---

## 2. User Personas

### 2.1 Primary Users

**Sales Representative**
- Generates 5-10 quotes per week
- Needs quick component pricing
- Requires mobile access during client meetings
- Values simplicity and speed

**Sales Engineer**
- Creates complex, multi-component solutions
- Needs detailed breakdowns and technical accuracy
- Requires ability to adjust advanced parameters
- Values flexibility and control

**Sales Manager**
- Reviews and approves quotes
- Needs visibility into pricing trends
- Requires audit trail and history
- Values oversight and reporting capabilities

### 2.2 Secondary Users

**Finance Team**
- Validates pricing accuracy
- Reviews discount structures
- Needs export capabilities for ERP integration

**Executive Leadership**
- Reviews pricing strategy
- Monitors win rates and margins
- Needs high-level dashboards

---

## 3. Core Requirements

### 3.1 Functional Requirements

#### 3.1.1 Component Pricing System ✅ IMPLEMENTED v1.0

**15 Core Components:**
1. **Help & Instructions** - User guidance and documentation
2. **PRTG Monitoring** - Network monitoring setup and licensing
3. **Capital Equipment** - Hardware with financing options
4. **Support Services** - 24/7 support packages with CPI escalation
5. **Onboarding** - Implementation and setup services
6. **PBS Foundation** - Platform and administrative services
7. **Platform Assessment** - Network assessment services
8. **Admin Services** - Review and administrative services
9. **Other Costs** - Additional equipment and custom services
10. **Enhanced Support** - Premium support tier
11. **Dynamics 1 Year** - 1-year dynamic pricing
12. **Dynamics 3 Year** - 3-year dynamic pricing
13. **Dynamics 5 Year** - 5-year dynamic pricing
14. **NaaS Standard** - Standard package bundle
15. **NaaS Enhanced** - Enhanced package bundle

**Component Features:**
- Independent configuration and pricing
- Real-time calculation updates
- Parameter validation and constraints
- Default value management
- Individual save/load capability

#### 3.1.2 Calculation Engine ✅ IMPLEMENTED v1.0

**Financial Calculations:**
- **APR Financing:** Excel PMT function equivalent for equipment
  ```
  monthlyPayment = (P × r × (1 + r)^n) / ((1 + r)^n - 1)
  where P = principal, r = monthly rate, n = term in months
  ```

- **CPI Escalation:** 3% annual compound escalation for support services
  ```
  yearCost = baseCost × (1 + 0.03)^(year - 1)
  ```

- **Volume Discounts:**
  - £5,000+ monthly: 10%
  - £3,000+ monthly: 7.5%
  - £1,500+ monthly: 5%
  - 4+ components: +5%
  - 3+ components: +2.5%
  - Annual payment: +2%
  - 3-year term: +3%
  - Maximum caps: 20% monthly, 25% annual, 30% 3-year

**Dependency Management:** ✅ IMPLEMENTED v1.0
- 5-level dependency graph (Level 0-4)
- Topological sorting for calculation order
- Automatic recalculation on dependency changes
- Context injection for cross-component data
- Circular dependency detection

#### 3.1.3 Quote Builder Workflows ✅ IMPLEMENTED v1.0

**Component Pricing View:**
- Select and configure individual components
- Real-time pricing sidebar
- Save component configurations
- Export individual component quotes

**Full Quote Wizard:** (5-step workflow)
1. Project Information - Client details and metadata
2. Component Selection - Enable/disable components
3. Component Configuration - Parameter input for each
4. Review & Adjust - Summary with pricing breakdown
5. Generate Quote - Export and save options

#### 3.1.4 Data Management ✅ IMPLEMENTED v1.0

**Persistence:**
- Automatic localStorage persistence
- Auto-save every 5 seconds (debounced)
- Quote history management
- Component configuration templates
- Import/export Excel/CSV/JSON

**Quote Management:**
- Save named quotes with metadata
- Load and edit existing quotes
- Duplicate quotes for variations
- Delete and clear functionality
- Search and filter quote history

#### 3.1.5 User Interface ✅ IMPLEMENTED v1.0

**Navigation:**
- Dashboard - Overview and quick access
- Components - Individual component pricing
- Wizard - Guided full quote builder
- History - Quote management and history

**Features:**
- Responsive design (desktop, tablet, mobile)
- Dark theme with Qolcom green accent (#00a651)
- Real-time validation feedback
- Loading indicators and progress tracking
- Toast notifications for actions
- Accessibility (ARIA, keyboard nav, screen reader)

---

## 4. Advanced Requirements (v1.1-2.0)

### 4.1 Phase 1: Critical Enhancements (v1.1) - 8 weeks

#### 4.1.1 Geographic Pricing System 📋 PLANNED

**Requirements:**
- Location-based cost multipliers
- State/region selection
- Tax calculation by jurisdiction
- Rural/urban pricing adjustments

**Implementation:**
```javascript
// Geographic multipliers
CA, NY: 1.25x
MA: 1.20x
TX, FL, IL: 1.00x (standard)
Rural areas: 0.90x
Midwest: 0.95x

// Sales tax rates by state
CA: 8.75%, NY: 8.0%, TX: 6.25%, FL: 6.0%, etc.
```

**User Impact:**
- More accurate location-specific pricing
- Automatic tax calculations
- Regional quote comparisons

#### 4.1.2 Risk Assessment System 📋 PLANNED

**Requirements:**
- Credit score integration
- Risk-based pricing adjustments
- Payment term recommendations
- Risk premium calculations

**Implementation:**
```javascript
// Risk premiums by credit score
750+: 0% (Low risk)
650-749: 2% (Medium risk)
550-649: 5% (High risk)
<550: 10% (Very high risk)
```

**User Impact:**
- Automated credit risk pricing
- Reduced payment default risk
- Transparent risk-based adjustments

#### 4.1.3 Equipment Lifecycle Management 📋 PLANNED

**Requirements:**
- Technology refresh scheduling
- Depreciation calculations
- Obsolescence reserve planning
- End-of-life cost projections

**Implementation:**
```javascript
// Refresh cycles by equipment type
Servers: 36 months
Network equipment: 60 months
Security appliances: 24 months
Storage: 48 months

// Obsolescence reserve: 15% of equipment value
```

**User Impact:**
- Long-term cost visibility
- Proactive refresh planning
- Total cost of ownership accuracy

#### 4.1.4 Industry Compliance Costs 📋 PLANNED

**Requirements:**
- HIPAA compliance setup costs
- SOX compliance setup costs
- PCI-DSS compliance setup costs
- Industry-specific multipliers

**Implementation:**
```javascript
// Compliance setup costs
HIPAA: £2,500 one-time
SOX: £5,000 one-time
PCI-DSS: £3,500 one-time
```

### 4.2 Phase 2: Advanced Features (v1.5) - 12 weeks

#### 4.2.1 Dynamic Pricing Engine 📋 PLANNED

**Requirements:**
- Seasonal pricing adjustments
- Utilization-based pricing
- Market demand adjustments
- Competitive pricing intelligence

**Implementation:**
```javascript
// Seasonal multipliers by month
May-Aug (Summer): 0.95x (slower season)
Sep-Nov (Q4): 1.10x (high demand)
Dec-Apr: 1.00x (standard)

// Utilization adjustments
>85% utilization: 1.15x (high demand)
>70% utilization: 1.05x (normal)
<50% utilization: 0.90x (capacity available)
```

#### 4.2.2 Multi-Currency Support 📋 PLANNED

**Requirements:**
- Multiple currency support (USD, GBP, EUR, CAD)
- Real-time exchange rates
- Currency hedging costs
- Historical rate tracking

**Implementation:**
```javascript
// Exchange rates (USD base)
GBP: 0.79
EUR: 0.85
CAD: 1.35

// Hedging cost: 1.5% of contract value
```

#### 4.2.3 Advanced SLA Management 📋 PLANNED

**Requirements:**
- SLA target definitions
- Downtime penalty calculations
- Credit calculation automation
- Escalation matrices

**Implementation:**
```javascript
// SLA targets by tier
Enhanced: 99.9% uptime
Standard: 99.5% uptime
Basic: 99.0% uptime

// Penalty: 10x breach percentage
// Max credit: 50% of monthly fee
```

#### 4.2.4 Advanced Reporting 📋 PLANNED

**Requirements:**
- PDF proposal generation with branding
- Detailed cost breakdown reports
- Multi-scenario comparison reports
- Executive summary generation
- Risk analysis reports

### 4.3 Phase 3: Enterprise Features (v2.0) - 16 weeks

#### 4.3.1 Competitive Intelligence 📋 PLANNED

**Requirements:**
- Market price benchmarking
- Win/loss analysis tracking
- Price sensitivity modeling
- Competitive positioning algorithms
- Market trend analysis

#### 4.3.2 Advanced Analytics 📋 PLANNED

**Requirements:**
- Business intelligence dashboards
- Quote conversion tracking
- Margin analysis
- Sales forecasting
- Performance metrics

#### 4.3.3 Integration Capabilities 📋 PLANNED

**Requirements:**
- CRM integration (Salesforce, HubSpot)
- ERP integration (NetSuite, SAP)
- REST API for external systems
- Webhook notifications
- SSO authentication

#### 4.3.4 Multi-Tenant Architecture 📋 PLANNED

**Requirements:**
- Organization/team separation
- Role-based access control
- Custom branding per tenant
- Separate data isolation
- Centralized management

---

## 5. Technical Requirements

### 5.1 Architecture ✅ IMPLEMENTED

**Frontend:**
- Vite build system
- Vanilla JavaScript (ES6+)
- Tailwind CSS for styling
- Progressive Web App (PWA) capabilities

**State Management:**
- Centralized DataStore with pub/sub pattern
- StorageManager for localStorage persistence
- Calculation Orchestrator for execution order
- Dependency Graph for component relationships

**Key Patterns:**
- Dependency injection for cross-component data
- Observer pattern for reactive updates
- Strategy pattern for calculation methods
- Factory pattern for component creation

### 5.2 Performance Requirements ✅ IMPLEMENTED

- **Calculation Speed:** <500ms for complex quotes
- **Page Load:** <2s on 3G connection
- **Auto-save:** 5-second debounced interval
- **UI Responsiveness:** <100ms input feedback

### 5.3 Security Requirements ⚠️ PARTIALLY IMPLEMENTED

**Input Sanitization:** ⚠️ Needs Audit
- ✅ SecurityUtils and InputValidator classes implemented
- ✅ XSS detection patterns in place
- ⚠️ DOMPurify installed but integration needs verification
- ⚠️ innerHTML usage needs audit
- ✅ Input validation for numbers, strings, emails
- ⚠️ SQL injection prevention (N/A - no database, but patterns exist)
- ⚠️ Path traversal protection (partially implemented)

**Data Protection:**
- ✅ Client-side only processing (v1.0)
- ✅ No sensitive data transmission (v1.0)
- ⬜ localStorage encryption (planned v1.1)
- ⬜ Audit logging (planned v1.1)
- ⚠️ Content Security Policy headers (not yet deployed)

**Security Status:** Functional but needs hardening. See `docs/TECHNICAL_DEBT.md` section 3 for details.

### 5.4 Accessibility Requirements ✅ LARGELY IMPLEMENTED

**WCAG 2.1 Level AA Compliance:**
- ✅ ARIA labels on interactive elements (implemented in app.js)
- ✅ Keyboard navigation support (arrow keys, Enter, Escape)
- ✅ Screen reader compatibility (announceToScreenReader function)
- ✅ Focus management during view transitions
- ✅ Semantic HTML structure
- ⚠️ High contrast mode support (partially tested)
- ⚠️ Full WCAG audit not yet performed

**Status:** Core accessibility features implemented. Formal WCAG 2.1 AA audit recommended before claiming full compliance.

### 5.5 Browser Support ✅ IMPLEMENTED

**Supported Browsers:**
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

**Polyfills:**
- Legacy browser support via @vitejs/plugin-legacy
- ES6+ feature detection and fallbacks

---

## 6. Data Models

### 6.1 Component Configuration Schema

```javascript
{
  componentType: String,        // e.g., 'prtg', 'capital'
  enabled: Boolean,             // Component active in quote
  params: {                     // Component-specific parameters
    // Variable by component type
  },
  result: {                     // Calculation results
    totals: {
      oneTime: Number,
      monthly: Number,
      annual: Number,
      threeYear: Number
    },
    breakdown: Object,          // Detailed cost breakdown
    metadata: Object            // Additional info
  },
  timestamp: ISO8601String,     // Last modified
  version: String               // Schema version
}
```

### 6.2 Quote Structure

```javascript
{
  id: UUID,
  name: String,
  description: String,
  project: {
    clientName: String,
    contactPerson: String,
    email: String,
    phone: String,
    location: String            // For geographic pricing
  },
  components: {
    [componentType]: ComponentConfig
  },
  totals: {
    oneTime: Number,
    monthly: Number,
    annual: Number,
    threeYear: Number
  },
  discounts: {
    monthlyDiscount: Number,    // Percentage
    annualDiscount: Number,
    termDiscount: Number,
    reasons: Object             // Discount sources
  },
  metadata: {
    created: ISO8601String,
    modified: ISO8601String,
    version: String,
    createdBy: String,          // User ID (v2.0)
    status: String              // draft/sent/accepted (v2.0)
  }
}
```

### 6.3 Dependency Graph Structure

```javascript
{
  [componentType]: {
    dependencies: String[],     // Array of required components
    level: Number,              // Calculation level (0-4)
    category: String,           // Component category
    description: String,        // Human-readable description
    provides: String[],         // Data provided to dependents
    requires: {                 // Data required from dependencies
      [component]: String[]     // Field names needed
    }
  }
}
```

---

## 7. User Stories

### 7.1 Core User Stories (v1.0) ✅ COMPLETE

**US-001:** As a sales rep, I want to quickly price individual components so I can respond to client inquiries immediately.

**US-002:** As a sales engineer, I want to build complex multi-component quotes so I can provide comprehensive solutions.

**US-003:** As a sales manager, I want to review quote history so I can track pricing trends and consistency.

**US-004:** As a sales rep, I want to save and duplicate quotes so I can create variations for different scenarios.

**US-005:** As a finance team member, I want to export quotes to Excel so I can integrate with our ERP system.

### 7.2 Advanced User Stories (v1.1-2.0) 📋 PLANNED

**US-006:** As a sales rep, I want location-based pricing so my quotes reflect regional cost differences.

**US-007:** As a sales manager, I want risk-based pricing so we protect against payment defaults.

**US-008:** As a sales engineer, I want equipment lifecycle visibility so clients understand long-term costs.

**US-009:** As a finance team member, I want industry compliance costs automatically included so quotes are complete.

**US-010:** As a sales rep, I want to compare multiple pricing scenarios side-by-side so I can present options.

**US-011:** As an executive, I want competitive intelligence so we can optimize our pricing strategy.

**US-012:** As a sales engineer, I want to generate branded PDF proposals so I can send professional documents.

---

## 8. Non-Functional Requirements

### 8.1 Scalability

**Current (v1.0):**
- Single-user localStorage-based storage
- Client-side processing only
- Up to 1,000 saved quotes per user

**Future (v2.0):**
- Multi-user database backend
- Server-side processing for complex calculations
- Unlimited quote storage
- Concurrent user support

### 8.2 Reliability

**Current (v1.0):**
- 99.9% uptime (static hosting)
- Auto-save to prevent data loss
- Error boundaries for graceful degradation

**Target (v2.0):**
- 99.99% uptime with load balancing
- Real-time data synchronization
- Automatic backup and recovery

### 8.3 Maintainability

**Code Quality:**
- ✅ ESLint for code linting (configured, runs with `npm run lint`)
- ✅ Prettier for consistent formatting (configured)
- ⚠️ Inline documentation (partial - JSDoc coverage incomplete)
- ✅ Modular, testable architecture (dependency graph, orchestrator)

**Testing:** ⚠️ Partial Implementation
- ✅ Vitest for unit testing (configured, runs with `npm test`)
- ✅ Cypress for E2E testing (configured, not in CI)
- ⚠️ Code coverage: ~15% actual vs 80% target
- ⬜ Automated CI/CD pipeline (planned v1.1)

**Current Test Status:**
- Unit tests: 22 passing (security.test.js, error-handler.test.js)
- Calculation formulas: Not unit tested (manual Excel verification)
- E2E tests: Exist but not automated
- Integration tests: Minimal coverage

**See:** `docs/TECHNICAL_DEBT.md` section 2 for detailed test gap analysis.

### 8.4 Usability

**Response Times:**
- <100ms for form input feedback
- <500ms for calculation updates
- <2s for page navigation
- <3s for full quote generation

**User Experience:**
- Minimal learning curve (target: <15 min)
- Progressive disclosure of complexity
- Helpful error messages and guidance
- Consistent UI patterns

---

## 9. Constraints and Assumptions

### 9.1 Technical Constraints

- Must work in standard web browsers (no plugins)
- Must be deployable to static hosting (v1.0)
- Must not require backend for core functionality (v1.0)
- Must maintain data privacy (client-side processing)

### 9.2 Business Constraints

- Must exactly match Excel spreadsheet calculations
- Must not expose proprietary pricing algorithms
- Must maintain audit trail for compliance
- Must support existing sales workflows

### 9.3 Assumptions

- Users have modern web browsers (last 2 years)
- Users have basic computer literacy
- Internet connection available (for CDN resources)
- Users primarily work in English (localization v2.0)

---

## 10. Dependencies

### 10.1 External Dependencies

**Production:**
- DOMPurify (^3.0.8) - HTML sanitization
- SheetJS/xlsx (^0.18.5) - Excel import/export
- jsPDF (^2.5.1) - PDF generation

**Development:**
- Vite (^5.1.3) - Build tool
- Tailwind CSS (^3.4.1) - Styling framework
- Vitest (^1.2.2) - Unit testing
- Cypress (^13.6.4) - E2E testing
- ESLint (^8.56.0) - Code linting
- Prettier (^3.2.5) - Code formatting

### 10.2 Internal Dependencies

**Component Dependencies:**
- Support depends on Capital (for device count)
- Enhanced Support depends on Support
- NaaS packages depend on PRTG and Support
- Dynamic pricing depends on all enabled components

---

## 11. Risk Analysis

### 11.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Calculation accuracy issues | High | Low | Extensive testing vs. Excel |
| Browser compatibility problems | Medium | Low | Comprehensive testing, polyfills |
| Performance degradation | Medium | Medium | Debouncing, code optimization |
| Data loss (localStorage limits) | High | Low | Auto-save, export functionality |

### 11.2 Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| User adoption resistance | High | Medium | Training, gradual rollout |
| Pricing strategy exposure | High | Low | Access controls, encryption |
| Calculation errors in quotes | Critical | Low | Validation, testing, review process |
| Competitive disadvantage | Medium | Low | Continuous feature development |

---

## 12. Testing Strategy

### 12.1 Test Coverage

**Unit Tests (Vitest):**
- All calculation methods (100% coverage target)
- Utility functions (security, validation)
- Data store operations
- Component methods

**Integration Tests:**
- Component interaction
- Dependency graph resolution
- Data persistence
- Import/export functionality

**E2E Tests (Cypress):**
- Complete quote workflows
- User navigation flows
- Data entry and validation
- Export and save operations

### 12.2 Test Scenarios

**Calculation Accuracy:**
- Boundary value testing
- Known Excel result comparison
- Edge case handling
- Discount stacking validation

**User Workflows:**
- New quote creation
- Quote modification and save
- Quote duplication
- Export to various formats
- History management

**Error Handling:**
- Invalid input handling
- Missing dependency handling
- Network failure recovery
- Storage quota exceeded

---

## 13. Deployment Strategy

### 13.1 Current Deployment (v1.0) ✅

**Platform:** Vercel / Netlify (static hosting)

**Process:**
1. Run `npm run build`
2. Deploy `dist/` folder to hosting platform
3. Configure custom domain (if applicable)
4. Enable HTTPS and CDN

**Rollback:** Previous deployment versions retained

### 13.2 Future Deployment (v2.0) 📋

**Platform:** AWS / Azure (full-stack)

**Components:**
- Frontend: Static hosting with CDN
- Backend: Node.js API server
- Database: PostgreSQL
- Cache: Redis
- Queue: RabbitMQ

**Process:**
- Automated CI/CD pipeline
- Blue-green deployment strategy
- Automated testing before deployment
- Gradual rollout with canary releases

---

## 14. Success Criteria

### 14.1 Launch Criteria (v1.0) ✅ LARGELY MET

- [x] ✅ All 15 components implemented
- [x] ⚠️ Calculation accuracy ~85% matches Excel (minor discount differences)
- [x] ✅ Responsive design on all devices
- [x] ✅ Import/export functionality working
- [x] ✅ Quote history management
- [x] ✅ Auto-save functionality
- [x] ⚠️ Basic accessibility compliance (not formally audited)
- [x] ✅ User documentation available (CLAUDE.md, PRD.md, DEVELOPMENT_ROADMAP.md)
- [ ] ⚠️ E2E tests exist but not automated in CI

**Status:** v1.0 is functional and production-ready for internal use. Formal testing and security audit recommended before external deployment.

### 14.2 v1.1 Success Criteria 📋 PLANNED

- [ ] Geographic pricing implemented
- [ ] Risk assessment system working
- [ ] Equipment lifecycle tracking
- [ ] Industry compliance costs
- [ ] Tax calculations by jurisdiction
- [ ] Enhanced PDF export
- [ ] Advanced reporting features
- [ ] Performance optimization complete

### 14.3 v2.0 Success Criteria 📋 PLANNED

- [ ] Multi-tenant architecture
- [ ] CRM/ERP integrations
- [ ] Competitive intelligence features
- [ ] Advanced analytics dashboards
- [ ] 99.99% uptime SLA
- [ ] <300ms calculation performance
- [ ] SSO authentication
- [ ] API documentation complete

---

## 15. Timeline and Milestones

### 15.1 Completed Milestones ✅

- **Q4 2024:** v1.0 Development Complete
  - Core component system
  - Calculation engine
  - Quote wizard
  - Data persistence
  - Import/export

### 15.2 Planned Milestones 📋

**Q1 2025: v1.1 - Critical Enhancements (8 weeks)**
- Week 1-2: Geographic pricing system
- Week 3-4: Risk assessment system
- Week 5-6: Equipment lifecycle management
- Week 7-8: Industry compliance, testing, deployment

**Q2 2025: v1.5 - Advanced Features (12 weeks)**
- Week 1-3: Dynamic pricing engine
- Week 4-6: Multi-currency support
- Week 7-9: Advanced SLA management
- Week 10-12: Enhanced reporting, testing, deployment

**Q3-Q4 2025: v2.0 - Enterprise Platform (16 weeks)**
- Week 1-4: Backend infrastructure and database
- Week 5-8: Multi-tenant architecture
- Week 9-12: Integrations (CRM, ERP, SSO)
- Week 13-16: Advanced analytics, testing, deployment

---

## 16. Appendix

### 16.1 Glossary

- **APR:** Annual Percentage Rate - Interest rate for equipment financing
- **CPI:** Consumer Price Index - Inflation rate for cost escalation (3% default)
- **NaaS:** Network as a Service - Subscription-based network infrastructure
- **PRTG:** Paessler Router Traffic Grapher - Network monitoring software
- **SLA:** Service Level Agreement - Performance and uptime guarantees
- **PBS Foundation:** Platform and Business Services foundation layer

### 16.2 References

- Original Excel Spreadsheet: `docs/reports/archive/SPREADSHEET_ANALYSIS.md`
- Pricing Model Documentation: `docs/pricing-model-documentation.md`
- Implementation Plan: `docs/reports/archive/COMPREHENSIVE_IMPLEMENTATION_PLAN.md`
- Technical Architecture: `CLAUDE.md`

### 16.3 Document Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Q4 2024 | Development Team | Initial PRD for v1.0 release |
| 2.0 | Jan 2025 | Development Team | Consolidated master PRD with roadmap |

---

**Document Status:** Living Document - Updated with each major release
**Next Review:** Q1 2025 (before v1.1 development)
