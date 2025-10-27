# Testing Quick Start Guide

## TL;DR

```bash
# Run unit tests
npm test

# Run tests once (CI mode)
npm run test:run

# Open test UI
npm run test:ui

# Run E2E tests (start dev server first)
npm run dev          # Terminal 1
npm run test:e2e     # Terminal 2
```

## Current Status

✅ **Unit Tests:** 50/51 passing (98%)
✅ **Configuration:** Fully operational
✅ **Environment:** jsdom (DOM testing enabled)

## Unit Test Commands

### Watch Mode (Recommended for Development)
```bash
npm test
```
Automatically reruns tests when files change. Press `q` to quit.

### Run Once (CI Mode)
```bash
npm run test:run
```
Runs all tests once and exits. Perfect for CI/CD pipelines.

### Interactive UI
```bash
npm run test:ui
```
Opens Vitest UI in browser for visual test exploration and debugging.

### With Coverage
```bash
npm test -- --coverage
```
Generates coverage report in `coverage/` directory.

### Run Specific Test File
```bash
npx vitest run tests/utils/security.test.js
```

## E2E Test Commands

### Interactive Mode (Cypress UI)
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Open Cypress
npm run test:e2e
```

### Headless Mode (CI)
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run tests headless
npm run test:e2e:headless
```

### Run Specific E2E Test
```bash
npx cypress run --spec "cypress/e2e/calculator.cy.js"
```

## Test File Locations

```
tests/
├── utils/
│   ├── security.test.js        ✅ 30/30 passing
│   └── error-handler.test.js   ✅ 20/21 passing
└── (add more tests here)

cypress/
├── e2e/
│   └── calculator.cy.js        ⚠️ Ready (needs dev server)
└── support/
    ├── commands.js
    └── e2e.js
```

## Writing New Tests

### Unit Test Template

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('MyComponent', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('should do something', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### E2E Test Template

```javascript
describe('Feature Name', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should perform user action', () => {
    cy.get('[data-testid="button"]').click();
    cy.get('[data-testid="result"]').should('contain', 'Success');
  });
});
```

## Debugging Tips

### Unit Tests

1. **Use `console.log` in tests** - Output will show in terminal
2. **Use `it.only()`** - Run only one test
3. **Use `describe.skip()`** - Skip a test suite
4. **Check DOM state**: `console.log(document.body.innerHTML)`
5. **Use Vitest UI**: `npm run test:ui` for visual debugging

### E2E Tests

1. **Use Cypress UI** - See tests run in real browser
2. **Use `cy.pause()`** - Pause test execution
3. **Check Network tab** - See API calls in Cypress UI
4. **Screenshots** - Automatically saved on failure in `cypress/screenshots/`

## Common Issues

### Issue: "document is not defined"
**Solution:** This is fixed - `vitest.config.js` enables jsdom environment

### Issue: "Cannot find module '@/utils/...'
**Solution:** This is fixed - Path aliases configured in `vitest.config.js`

### Issue: Cypress can't connect to localhost:8000
**Solution:** Make sure dev server is running with `npm run dev`

### Issue: Tests timing out
**Solution:** Increase timeout in `vitest.config.js` or test file:
```javascript
it('long test', async () => {
  // test code
}, 20000); // 20 second timeout
```

## Configuration Files

- **`vitest.config.js`** - Unit test configuration (jsdom, coverage, aliases)
- **`cypress.config.js`** - E2E test configuration (port 8000)
- **`package.json`** - Test scripts and dependencies

## Coverage Thresholds

Configured in `vitest.config.js`:
- Lines: 80%
- Functions: 80%
- Branches: 80%
- Statements: 80%

Run `npm test -- --coverage` to check current coverage.

## CI/CD Integration

For GitHub Actions, GitLab CI, etc.:

```yaml
# Example GitHub Actions
- name: Run tests
  run: npm run test:run

- name: Run E2E tests
  run: |
    npm run dev &
    npm run test:e2e:headless
```

## What's Tested

### ✅ Currently Covered
- Security utilities (input validation, sanitization)
- Error handling (logging, notifications, recovery)
- XSS prevention
- Data validation

### 🔜 Next to Test
- Calculation orchestrator
- Data store
- Storage manager
- Component manager
- Wizard workflow

## Need Help?

- **Vitest Docs**: https://vitest.dev
- **Cypress Docs**: https://docs.cypress.io
- **Project Docs**: See `TESTING_INFRASTRUCTURE_FIX.md` for detailed setup info
