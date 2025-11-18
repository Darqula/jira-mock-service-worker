import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
  eslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // Browser and React environments (config-ui)
    files: ['packages/config-ui/**/*.ts', 'packages/config-ui/**/*.tsx'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        React: 'readonly',
      },
    },
  },
  {
    // Config files
    files: ['**/*.config.js', '**/*.config.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
        module: 'writable',
      },
    },
    rules: {
      'no-undef': 'off',
    },
  },
  {
    ignores: ['node_modules', 'dist', 'build', '.next', 'eslint.config.mjs'],
  },
];
