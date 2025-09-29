/**
 * Test setup and configuration
 * Provides global test utilities and mocks
 */

import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
  store: new Map(),
  getItem: vi.fn((key) => localStorageMock.store.get(key) || null),
  setItem: vi.fn((key, value) => localStorageMock.store.set(key, value)),
  removeItem: vi.fn((key) => localStorageMock.store.delete(key)),
  clear: vi.fn(() => localStorageMock.store.clear()),
  get length() {
    return localStorageMock.store.size;
  },
  key: vi.fn((index) => Array.from(localStorageMock.store.keys())[index] || null)
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
  log: vi.fn()
};

// Mock DOM methods
Object.defineProperty(window, 'DOMParser', {
  value: class DOMParser {
    parseFromString(html) {
      const div = document.createElement('div');
      div.innerHTML = html;
      return {
        body: { firstChild: div.firstChild }
      };
    }
  }
});

// Mock external libraries
global.XLSX = {
  read: vi.fn(),
  write: vi.fn(),
  utils: {
    sheet_to_json: vi.fn(() => []),
    json_to_sheet: vi.fn(() => ({})),
    book_new: vi.fn(() => ({})),
    book_append_sheet: vi.fn()
  }
};

global.jsPDF = vi.fn(() => ({
  text: vi.fn(),
  save: vi.fn(),
  addPage: vi.fn(),
  setFontSize: vi.fn()
}));

global.DOMPurify = {
  sanitize: vi.fn((html) => {
    // Simple mock that removes script tags but keeps safe content
    return html.replace(/<script[^>]*>.*?<\/script>/gi, '');
  })
};

// Test utilities
export const TestUtils = {
  /**
   * Create a mock HTML element
   */
  createMockElement(tagName = 'div', attributes = {}) {
    const element = document.createElement(tagName);
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    return element;
  },

  /**
   * Create a mock form with inputs
   */
  createMockForm(inputs = {}) {
    const form = document.createElement('form');
    Object.entries(inputs).forEach(([name, value]) => {
      const input = document.createElement('input');
      input.name = name;
      input.value = value;
      form.appendChild(input);
    });
    return form;
  },

  /**
   * Simulate user input event
   */
  simulateInput(element, value) {
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
  },

  /**
   * Simulate click event
   */
  simulateClick(element) {
    element.dispatchEvent(new Event('click', { bubbles: true }));
  },

  /**
   * Wait for DOM updates
   */
  async waitForDOM() {
    await new Promise(resolve => setTimeout(resolve, 0));
  },

  /**
   * Clear all mocks
   */
  clearAllMocks() {
    vi.clearAllMocks();
    localStorageMock.store.clear();
  }
};

// Reset state before each test
beforeEach(() => {
  TestUtils.clearAllMocks();
  document.body.innerHTML = '';
});