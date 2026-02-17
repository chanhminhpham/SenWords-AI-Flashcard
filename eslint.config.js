const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  // Global rules
  {
    languageOptions: {
      globals: {
        __dirname: 'readonly',
        module: 'readonly',
        require: 'readonly',
      },
    },
    rules: {
      'react/display-name': 'off',
    },
  },
  // Test files & test-utils — allow jest globals
  {
    files: ['**/__tests__/**', '**/*.test.{ts,tsx}', 'src/__test-utils__/**'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
  },
  // Enforce @/ alias in src/ — prevent relative imports
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../**'],
              message: 'Use @/ path alias instead of relative imports.',
            },
          ],
        },
      ],
      // Enforce named exports in src/
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportDefaultDeclaration',
          message: 'Use named exports. Default exports are only allowed in app/ route files.',
        },
      ],
    },
  },
]);
