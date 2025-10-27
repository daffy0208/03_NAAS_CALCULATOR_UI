import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Use jsdom environment for DOM testing
    environment: 'jsdom',

    // Enable globals (describe, it, expect, etc.)
    globals: true,

    // Setup files to run before tests
    setupFiles: [],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'cypress/',
        '*.config.js',
        '*.config.ts',
        'tests/',
        'src/main.js'
      ],
      include: ['src/**/*.js'],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80
    },

    // Test file patterns
    include: ['tests/**/*.test.js', 'tests/**/*.spec.js'],
    exclude: ['node_modules', 'dist', 'cypress'],

    // Test timeout (10 seconds)
    testTimeout: 10000,

    // Hook timeout
    hookTimeout: 10000,

    // Reporters
    reporters: ['verbose'],

    // Mock browser APIs if needed
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,
  },

  // Resolve aliases to match vite.config.js
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@services': resolve(__dirname, './src/services'),
      '@utils': resolve(__dirname, './src/utils')
    }
  },

  // Define environment variables
  define: {
    'import.meta.env.MODE': JSON.stringify('test'),
    'import.meta.env.DEV': false,
    'import.meta.env.PROD': false,
    'import.meta.env.SSR': false
  }
});
