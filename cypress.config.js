import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,

    setupNodeEvents(on, config) {
      // implement node event listeners here
    },

    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js',

    env: {
      // Test environment variables
      testUser: 'test@example.com',
      apiUrl: 'http://localhost:8000'
    }
  },

  component: {
    devServer: {
      framework: 'vanilla',
      bundler: 'vite',
    },
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.js'
  },

  // Global configuration
  retries: {
    runMode: 2,
    openMode: 0
  },

  screenshotsFolder: 'cypress/screenshots',
  videosFolder: 'cypress/videos',

  // Browser configuration
  chromeWebSecurity: false,

  // Viewport configurations for testing responsive design
  viewportWidth: 1280,
  viewportHeight: 720
});