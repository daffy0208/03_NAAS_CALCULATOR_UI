/**
 * End-to-end tests for NaaS Calculator
 */

describe('NaaS Pricing Calculator', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('#loadingIndicator').should('not.be.visible');
  });

  describe('Navigation', () => {
    it('should display all navigation items', () => {
      cy.get('#dashboardBtn').should('be.visible').and('contain', 'Dashboard');
      cy.get('#componentsBtn').should('be.visible').and('contain', 'Components');
      cy.get('#wizardBtn').should('be.visible').and('contain', 'Full Quote');
      cy.get('#historyBtn').should('be.visible').and('contain', 'History');
    });

    it('should switch between views', () => {
      // Test Components view
      cy.get('#componentsBtn').click();
      cy.get('#componentsView').should('be.visible');
      cy.get('#dashboardView').should('not.be.visible');

      // Test Wizard view
      cy.get('#wizardBtn').click();
      cy.get('#wizardView').should('be.visible');
      cy.get('#componentsView').should('not.be.visible');

      // Test History view
      cy.get('#historyBtn').click();
      cy.get('#historyView').should('be.visible');
      cy.get('#wizardView').should('not.be.visible');

      // Back to Dashboard
      cy.get('#dashboardBtn').click();
      cy.get('#dashboardView').should('be.visible');
      cy.get('#historyView').should('not.be.visible');
    });

    it('should work on mobile', () => {
      cy.viewport(375, 667); // Mobile viewport

      cy.get('#mobileMenuBtn').click();
      cy.get('#mobileMenu').should('be.visible');

      cy.get('#mobileComponentsBtn').click();
      cy.get('#componentsView').should('be.visible');
      cy.get('#mobileMenu').should('not.be.visible');
    });
  });

  describe('Dashboard', () => {
    it('should display component cards', () => {
      cy.get('#dashboardComponents').should('be.visible');
      cy.get('[data-component]').should('have.length.greaterThan', 5);
    });

    it('should show component prices', () => {
      cy.get('[data-component="prtg"]').should('contain', '£');
      cy.get('[data-component="support"]').should('contain', '£');
    });

    it('should navigate to component from card click', () => {
      cy.get('[data-component="prtg"]').click();
      cy.get('#componentsView').should('be.visible');
      cy.get('.component-item.active[data-component="prtg"]').should('exist');
    });

    it('should start full quote builder', () => {
      cy.get('#startFullQuoteBtn').click();
      cy.get('#wizardView').should('be.visible');
      cy.get('#wizardContent').should('be.visible');
    });
  });

  describe('Components View', () => {
    beforeEach(() => {
      cy.get('#componentsBtn').click();
    });

    it('should display component list', () => {
      cy.get('#componentList').should('be.visible');
      cy.get('.component-item').should('have.length.greaterThan', 5);
    });

    it('should select and configure PRTG component', () => {
      cy.get('.component-item[data-component="prtg"]').click();
      cy.get('#componentConfigArea').should('contain', 'PRTG');

      // Test form inputs
      cy.get('select[name="serviceLevel"]').select('enhanced');
      cy.get('input[name="alertRecipients"]').clear().type('20');

      // Should update pricing
      cy.get('#componentResults').should('be.visible');
      cy.get('#pricingSummary').should('contain', '£');
    });

    it('should handle capital equipment configuration', () => {
      cy.get('.component-item[data-component="capital"]').click();

      // Add equipment
      cy.get('#equipmentDescription').type('Test Router');
      cy.get('#equipmentQuantity').clear().type('2');
      cy.get('#equipmentUnitCost').type('1500');
      cy.get('#addEquipment').click();

      // Should show in list
      cy.get('#equipmentList').should('contain', 'Test Router');
      cy.get('#equipmentList').should('contain', '£3,000');

      // Test financing
      cy.get('input[name="financing"]').check();
      cy.get('select[name="termMonths"]').select('36');

      cy.get('#componentResults').should('be.visible');
    });

    it('should export component quote', () => {
      cy.get('.component-item[data-component="support"]').click();
      cy.get('input[name="deviceCount"]').clear().type('50');

      cy.get('#exportComponentsQuote').click();
      // Note: File download testing would require additional setup
    });
  });

  describe('Full Quote Wizard', () => {
    beforeEach(() => {
      cy.get('#wizardBtn').click();
    });

    it('should display wizard steps', () => {
      cy.get('#stepIndicators').should('be.visible');
      cy.get('#progressBar').should('be.visible');
      cy.get('#currentStep').should('contain', '1');
      cy.get('#totalSteps').should('contain.text', /\d+/);
    });

    it('should navigate through wizard steps', () => {
      // Should start with project info
      cy.get('#wizardContent').should('contain', 'Project Information');

      // Fill project info and continue
      cy.get('input[name="projectName"]').type('Test Project');
      cy.get('input[name="customerName"]').type('Test Customer');
      cy.get('button').contains('Next').click();

      // Should advance to next step
      cy.get('#currentStep').should('not.contain', '1');
    });

    it('should save progress automatically', () => {
      cy.get('input[name="projectName"]').type('Auto Save Test');

      // Wait for auto-save
      cy.wait(11000); // Auto-save happens every 10 seconds

      // Refresh page and check if data persists
      cy.reload();
      cy.get('#wizardBtn').click();
      cy.get('input[name="projectName"]').should('have.value', 'Auto Save Test');
    });
  });

  describe('Import/Export', () => {
    it('should open import modal', () => {
      cy.get('#importBtn').click();
      cy.get('#importModal').should('be.visible');
      cy.get('#importModalTitle').should('contain', 'Import Data');
    });

    it('should open export modal', () => {
      cy.get('#exportBtn').click();
      cy.get('#exportModal').should('be.visible');
      cy.get('#exportModalTitle').should('contain', 'Export Data');
    });

    it('should close modals', () => {
      cy.get('#importBtn').click();
      cy.get('.modal-close').click();
      cy.get('#importModal').should('not.be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle calculation errors gracefully', () => {
      cy.get('#componentsBtn').click();
      cy.get('.component-item[data-component="prtg"]').click();

      // Enter invalid data
      cy.get('input[name="alertRecipients"]').clear().type('invalid');

      // Should show error message
      cy.get('.error-notification', { timeout: 5000 }).should('be.visible');
    });

    it('should recover from network errors', () => {
      // Simulate network failure (would need server setup for proper testing)
      cy.window().then((win) => {
        win.navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => {
            registration.unregister();
          });
        });
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      cy.get('[aria-label]').should('have.length.greaterThan', 5);
      cy.get('button[aria-label="Dashboard"]').should('exist');
      cy.get('button[aria-label="Components"]').should('exist');
    });

    it('should support keyboard navigation', () => {
      cy.get('body').tab();
      cy.focused().should('have.attr', 'id', 'mobileMenuBtn');

      cy.focused().tab();
      cy.focused().should('have.attr', 'id', 'dashboardBtn');
    });

    it('should have proper heading structure', () => {
      cy.get('h1').should('exist');
      cy.get('h2').should('exist');
      cy.get('h3').should('exist');
    });
  });

  describe('Performance', () => {
    it('should load within acceptable time', () => {
      const start = performance.now();
      cy.visit('/').then(() => {
        const loadTime = performance.now() - start;
        expect(loadTime).to.be.lessThan(3000); // 3 seconds
      });
    });

    it('should update calculations quickly', () => {
      cy.get('#componentsBtn').click();
      cy.get('.component-item[data-component="prtg"]').click();

      const start = performance.now();
      cy.get('input[name="alertRecipients"]').clear().type('25');

      cy.get('#componentResults').should('be.visible').then(() => {
        const calcTime = performance.now() - start;
        expect(calcTime).to.be.lessThan(1000); // 1 second
      });
    });
  });

  describe('Data Persistence', () => {
    it('should save component configurations', () => {
      cy.get('#componentsBtn').click();
      cy.get('.component-item[data-component="support"]').click();

      cy.get('input[name="deviceCount"]').clear().type('100');
      cy.get('select[name="serviceDesk"]').select('24x7');

      // Save component
      cy.get('#saveComponent').click();

      // Verify notification
      cy.get('.error-notification').should('contain', 'saved successfully');

      // Refresh and verify data persists
      cy.reload();
      cy.get('#componentsBtn').click();
      cy.get('.component-item[data-component="support"]').click();

      cy.get('input[name="deviceCount"]').should('have.value', '100');
    });
  });
});