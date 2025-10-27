# Technical Debt Documentation
# NaaS Pricing Calculator

**Last Updated:** January 2025
**Version:** 1.0.0
**Purpose:** Document known technical debt, orphaned code, and improvement opportunities

---

## Executive Summary

This document catalogs technical debt items discovered during code analysis. Items are prioritized by impact and include recommended remediation strategies.

**Key Findings:**
- TypeScript/React scaffolding exists but is not wired into the application
- Test coverage gaps (~15% vs claimed 75-90%)
- Security hardening needed (XSS protection audit)
- E2E tests exist but not in CI/CD pipeline

---

## 1. Orphaned TypeScript/React Components

### Status: Not Wired Up ⚠️

### Description
The codebase contains a complete set of TypeScript/React component scaffolding that is not integrated into the actual application.

### Locations
```
components/
├── agents/
│   └── simple-task-agent.ts          # LLM agent scaffolding
├── auth/
│   ├── LoginForm.tsx                  # React auth components
│   ├── PasswordReset.tsx
│   ├── ProtectedRoute.tsx
│   └── SignupForm.tsx
├── errors/
│   ├── ErrorBoundary.tsx              # React error boundaries
│   ├── ErrorFallback.tsx
│   └── NotFound.tsx
├── feedback/
│   ├── LoadingSpinner.tsx             # React UI components
│   ├── Skeleton.tsx
│   └── Toast.tsx
└── forms/
    ├── FormField.tsx                  # Reusable React form fields
    └── useForm.ts                     # React hooks

lib/integrations/
├── llm-providers/
│   ├── anthropic-client.ts            # Claude API client
│   └── openai-client.ts               # OpenAI API client
├── platforms/
│   └── client.ts                      # Platform integration stubs
└── vector-databases/
    └── client.ts                      # Vector DB stubs
```

### Missing Configuration
- ❌ No `tsconfig.json` for TypeScript
- ❌ No React dependencies in `package.json`
- ❌ No build configuration for TypeScript/React
- ❌ TypeScript not referenced in `vite.config.js`
- ❌ No import statements in actual application code

### Current Application Stack
The **actual running application** uses:
- ✅ Vanilla JavaScript (ES6+)
- ✅ Vite build system
- ✅ Tailwind CSS
- ✅ No TypeScript, no React, no JSX

### Impact
- **Code Confusion:** Developers may assume React/TypeScript are in use
- **Maintenance Burden:** Unused code requires maintenance
- **Build Size:** Unused files bloat repository (not build, as they're not imported)
- **Onboarding:** New developers confused by dual architecture

### Recommendations

**Option A: Remove Scaffolding (Recommended)**
- Delete `components/` and `lib/integrations/` directories
- Clean and simple codebase
- Reduced confusion for developers
- Can recreate when actually needed (v2.0 backend)

**Option B: Wire It Up (High Effort)**
- Install TypeScript: `npm install -D typescript @types/react @types/react-dom`
- Install React: `npm install react react-dom`
- Create `tsconfig.json`
- Configure Vite for TypeScript/React
- Migrate existing components to React
- **Effort:** 2-3 weeks full-time
- **Risk:** Breaking existing functionality

**Option C: Document and Defer (Current State)**
- Keep files as reference/examples
- Add README in `components/` explaining status
- Plan integration for v2.0 (Enterprise Platform phase)
- **Pros:** No immediate work, examples available
- **Cons:** Ongoing confusion

**Recommended Action:** Option A for v1.1, revisit for v2.0 when backend is added.

---

## 2. Test Coverage Gaps

### Status: Partial Implementation ⚠️

### Current State
- **Claimed:** 75% unit, 90% E2E
- **Actual:** ~15% unit, E2E not in CI

### What's Tested ✅
```
tests/utils/security.test.js           # 22 tests passing
  - Input validation
  - XSS detection
  - String sanitization
  - Number validation
  - Email validation

tests/utils/error-handler.test.js      # Tests exist
  - Error logging
  - Error boundaries
```

### What's NOT Tested ❌
```
src/core/calculations.js               # 0 tests
  - APR financing formulas
  - CPI escalation
  - Volume discount stacking
  - Dependency injection

src/core/calculation-orchestrator.js   # 0 tests
  - Topological sorting
  - Dependency resolution
  - Debouncing logic

src/core/dependency-graph.js           # 0 tests
  - Circular dependency detection
  - Level calculation

src/components/components.js           # 0 tests
  - Component rendering
  - Form validation
  - State management

src/components/wizard.js               # 0 tests
  - Multi-step workflow
  - Progress tracking
  - Data persistence

src/services/data-store.js             # 0 tests
  - Pub/sub pattern
  - State mutations
  - Subscription management

src/services/storage-manager.js        # 0 tests
  - localStorage operations
  - Auto-save debouncing
  - Quota management

src/app.js                             # 0 tests (2189 lines!)
  - View switching
  - Event handling
  - Resource cleanup
```

### E2E Test Status
- Cypress tests exist in `cypress/e2e/calculator.cy.js`
- Not integrated into CI/CD pipeline
- No automated runs on commit/PR
- Manual testing only

### Impact
- **High Risk:** Calculation bugs could cause financial errors
- **Regression Risk:** Changes could break existing functionality
- **Confidence:** Low confidence in refactoring safety
- **Compliance:** Cannot verify calculation accuracy programmatically

### Recommendations

**Priority 1: Calculation Formula Tests (Critical)**
```javascript
// tests/core/calculations.test.js
describe('APR Financing', () => {
  it('matches Excel PMT formula', () => {
    const result = calculations.calculateCapital({
      equipmentCost: 10000,
      downPayment: 0,
      apr: 5.0,
      termMonths: 36
    });
    expect(result.monthlyPayment).toBeCloseTo(299.71, 2);
  });
});
```

**Priority 2: Integrate Cypress into CI**
```yaml
# .github/workflows/test.yml
- name: Run E2E Tests
  run: npm run test:e2e:headless
```

**Priority 3: Data Store Tests**
- Test pub/sub notifications
- Test state consistency
- Test localStorage persistence

**Priority 4: Integration Tests**
- Test full quote workflows
- Test dependency resolution
- Test discount stacking

### Estimated Effort
- Calculation tests: 1 week
- CI integration: 2 days
- Data store tests: 3 days
- Integration tests: 1 week
- **Total:** 3 weeks

---

## 3. Security Hardening

### Status: Partial Implementation ⚠️

### What's Implemented ✅
- Input validation utilities (`SecurityUtils`, `InputValidator`)
- XSS detection patterns
- Number/string/email validation
- DOMPurify dependency installed

### What Needs Audit ⚠️

**DOMPurify Integration:**
```javascript
// src/utils/security.js claims DOMPurify is used
// Need to verify:
// 1. All user input passes through sanitization
// 2. innerHTML usage is audited
// 3. setHTML() function actually uses DOMPurify
```

**Potential XSS Vectors:**
- Search for `innerHTML` usage in codebase
- Verify quote name/description sanitization
- Check Excel import data handling
- Audit component parameter display

**Missing Security Features:**
- Content Security Policy headers
- File upload validation (for future features)
- Rate limiting (for future backend)
- CSRF protection (for future backend)

### Recommendations

**Immediate Actions:**
1. **Audit innerHTML Usage:**
   ```bash
   grep -r "innerHTML" src/
   ```
   Replace with `SecurityUtils.setHTML()` or `textContent`

2. **Verify DOMPurify Integration:**
   - Test with malicious input: `<img src=x onerror=alert(1)>`
   - Ensure sanitization happens before storage
   - Check localStorage data is sanitized on load

3. **Add CSP Headers:**
   ```html
   <!-- index.html -->
   <meta http-equiv="Content-Security-Policy"
         content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">
   ```

4. **Security Testing:**
   - Add XSS injection tests
   - Test with OWASP Top 10 payloads
   - Verify output encoding

### Estimated Effort
- innerHTML audit: 1 day
- DOMPurify verification: 1 day
- CSP headers: 2 hours
- Security tests: 2 days
- **Total:** 1 week

---

## 4. Build and Deployment

### Status: Functional but Unoptimized ⚠️

### Current State
- ✅ Vite build works
- ✅ Production build generates optimized bundle
- ⚠️ No CI/CD pipeline
- ⚠️ Manual deployment to Vercel/Netlify
- ⚠️ No automated testing before deploy

### Missing CI/CD
```
Desired Pipeline:
1. Commit pushed
2. Linting runs
3. Unit tests run
4. E2E tests run
5. Build succeeds
6. Deploy to staging
7. Smoke tests pass
8. Deploy to production
```

**Current Reality:**
1. Commit pushed
2. Manual deployment
3. 🤞 Hope it works

### Recommendations

**Add GitHub Actions:**
```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint:check
      - run: npm run format:check
      - run: npm test
      - run: npm run build
      - run: npm run test:e2e:headless

  deploy:
    needs: test
    if: github.ref == 'refs/heads/master'
    runs-on: ubuntu-latest
    steps:
      - run: npm run build
      - uses: vercel/actions@v1
```

### Estimated Effort
- GitHub Actions setup: 1 day
- Deployment automation: 1 day
- **Total:** 2 days

---

## 5. Code Architecture Improvements

### Status: Good Foundation, Room for Improvement 🟡

### Current Strengths ✅
- Dependency graph pattern is excellent
- Calculation orchestrator is well-designed
- Pub/sub data store is clean
- Component separation is good

### Areas for Improvement

**1. File Size**
```
src/app.js: 2189 lines (too large)
```
**Recommendation:** Split into multiple files:
- `src/app/views.js` - View management
- `src/app/navigation.js` - Navigation logic
- `src/app/notifications.js` - Toast notifications
- `src/app/autosave.js` - Auto-save logic
- **Effort:** 2 days

**2. Calculation File Organization**
```
src/core/calculations.js: Large file with all formulas
```
**Recommendation:** Split by component:
- `src/core/calculations/prtg.js`
- `src/core/calculations/capital.js`
- `src/core/calculations/support.js`
- **Effort:** 1 day

**3. Configuration Management**
```
src/config.js exists but underutilized
```
**Recommendation:** Centralize magic numbers:
- Discount thresholds
- CPI rate (currently hardcoded 3%)
- APR rate (currently hardcoded 5%)
- **Effort:** 1 day

**4. Error Handling Consistency**
- Some functions return `{ error }`, others throw
- Inconsistent error messages
- **Recommendation:** Standardize on one pattern
- **Effort:** 2 days

---

## 6. Documentation Gaps

### Status: Good but Outdated 🟡

### What's Good ✅
- CLAUDE.md is comprehensive
- PRD.md is detailed
- DEVELOPMENT_ROADMAP.md is thorough

### What Was Wrong ❌ (Now Fixed)
- ✅ README.md claimed `/js/` directory (updated to `/src/`)
- ✅ DEVELOPMENT_ROADMAP.md claimed 75%/90% test coverage (updated to reality)
- ✅ CLAUDE.md claimed complete security implementation (updated with warnings)

### Still Missing 📋
- API documentation for calculation functions
- Component interaction diagrams
- Data flow diagrams
- localStorage schema documentation
- Deployment guide with environment setup

### Recommendations
1. **Add JSDoc to all functions** (Priority: Medium)
2. **Create architecture diagrams** (Priority: Low)
3. **Document localStorage keys** (Priority: High)
4. **Write deployment guide** (Priority: Medium)

---

## 7. Performance Optimization Opportunities

### Status: Meets Requirements but Can Improve 🟡

### Current Performance ✅
- Calculation time: <500ms (meets target)
- Page load: <2s (acceptable)
- Auto-save: 5s debounce (good)

### Optimization Opportunities

**1. Calculation Caching**
- Cache calculation results by parameters
- Invalidate on parameter change
- **Potential Gain:** 50-80% faster recalculations
- **Effort:** 1 week

**2. Lazy Loading**
- Load wizard only when needed
- Load component forms on demand
- **Potential Gain:** 30% faster initial load
- **Effort:** 3 days

**3. Service Worker**
- vite-plugin-pwa installed but minimal config
- Offline support not fully implemented
- **Potential Gain:** Offline functionality
- **Effort:** 1 week

**4. Bundle Size**
- xlsx: 500KB (largest dependency)
- Could use lighter Excel library
- **Potential Gain:** 40% smaller bundle
- **Effort:** 2 weeks (high risk)

---

## 8. Browser Compatibility

### Status: Modern Browsers Only ⚠️

### Current Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- @vitejs/plugin-legacy installed

### Issues
- ES6+ features used throughout
- Legacy plugin may not cover all syntax
- No polyfills for older browsers
- IE11 definitely not supported

### Recommendations
- Document minimum browser versions
- Add browser detection warning
- Test on actual target browsers
- Consider if legacy support is needed

---

## Priority Matrix

| Item | Priority | Impact | Effort | Recommended Timeline |
|------|----------|--------|--------|---------------------|
| Calculation formula tests | P0 | Critical | 1 week | v1.1 (Q1 2025) |
| Security audit (XSS) | P0 | High | 1 week | v1.1 (Q1 2025) |
| Remove TS/React scaffolding | P1 | Medium | 1 day | v1.1 (Q1 2025) |
| CI/CD pipeline | P1 | High | 2 days | v1.1 (Q1 2025) |
| localStorage tests | P1 | Medium | 3 days | v1.1 (Q1 2025) |
| Split app.js | P2 | Low | 2 days | v1.5 (Q2 2025) |
| Calculation caching | P2 | Medium | 1 week | v1.5 (Q2 2025) |
| Service worker | P3 | Low | 1 week | v2.0 (Q3 2025) |
| Architecture diagrams | P3 | Low | 1 week | v2.0 (Q3 2025) |

---

## Remediation Roadmap

### v1.1 (Q1 2025) - Critical Debt
- Add calculation formula unit tests
- Security audit and XSS fixes
- Remove or document TS/React scaffolding
- Set up CI/CD pipeline
- Add localStorage tests

**Total Effort:** 3-4 weeks

### v1.5 (Q2 2025) - Code Quality
- Split large files (app.js, calculations.js)
- Implement calculation caching
- Improve error handling consistency
- Add comprehensive JSDoc

**Total Effort:** 2-3 weeks

### v2.0 (Q3-Q4 2025) - Enterprise
- Decide on TS/React migration path
- Implement service worker
- Create architecture documentation
- Full test coverage (>90%)

**Total Effort:** Built into v2.0 timeline

---

## Conclusion

The NaaS Pricing Calculator has a solid foundation with good architecture patterns, but technical debt has accumulated in testing, security, and code organization. The most critical items (calculation tests, security audit) should be addressed in v1.1 before adding new features.

The TypeScript/React scaffolding decision is important: either remove it for clarity or commit to integrating it in v2.0. Current recommendation is removal to reduce confusion.

Overall, the debt is manageable and can be addressed incrementally without major refactoring.

---

**Document Status:** Living Document
**Next Review:** After v1.1 release (Q1 2025)
**Owner:** Development Team
