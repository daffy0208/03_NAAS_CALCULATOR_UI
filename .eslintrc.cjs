module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: [
    'security'
  ],
  rules: {
    // Security rules
    // Note: Object injection warnings downgraded to 'warn' due to many false positives
    // from dynamic property access patterns used throughout the codebase (e.g., component[type])
    'security/detect-object-injection': 'warn',
    'security/detect-non-literal-regexp': 'warn',
    'security/detect-eval-with-expression': 'error',
    'security/detect-unsafe-regex': 'error',

    // Code quality rules
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    'no-var': 'error',
    'prefer-const': 'error',

    // Function complexity - relaxed for existing code
    'complexity': ['warn', 15],
    'max-depth': ['warn', 5],
    'max-lines-per-function': ['warn', 100],
    'max-params': ['warn', 6]
  },
  overrides: [
    {
      files: ['*.test.js', '*.spec.js', 'cypress/**/*.js'],
      env: {
        'cypress/globals': true
      },
      plugins: ['cypress'],
      rules: {
        'no-console': 'off'
      }
    }
  ],
  globals: {
    // Global libraries
    'XLSX': 'readonly',
    'jsPDF': 'readonly',
    'DOMPurify': 'readonly'
  }
};