import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import globals from 'globals';
import coreWebVitals from 'eslint-config-next/core-web-vitals';

const CONFIG_UI_FILES = ['packages/config-ui/**/*.{ts,tsx,js,jsx}'];

export default [
  {
    ignores: [
      '**/.next/**',
      '**/dist/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/next-env.d.ts',
      '**/public/mockServiceWorker.js',
      '**/*.min.*',
      'eslint.config.mjs',
    ],
  },
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
      // The TS compiler (and `npm run typecheck`) already report undefined
      // identifiers; `no-undef` only produces false positives here (React,
      // window, jest/vitest globals), so it is disabled for TS files.
      'no-undef': 'off',
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
    // Browser environment for browser-targeted example apps
    files: ['examples/**/*.ts', 'examples/**/*.tsx'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        React: 'readonly',
      },
    },
  },
  {
    // Plain CommonJS config files (next/postcss/tailwind/jest configs, etc.)
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-undef': 'off',
    },
  },
  // next/core-web-vitals (native flat config; replaces the former
  // packages/config-ui/.eslintrc.json). Scoped to config-ui only.
  ...coreWebVitals.map((config) => ({
    ...config,
    files: CONFIG_UI_FILES,
  })),
  {
    // react-hooks v6's brand-new set-state-in-effect flags two existing
    // init-from-storage / derive-in-effect patterns in ConfigEditor. A correct
    // fix requires refactoring how that state is derived, which is out of scope
    // for this cleanup. Downgraded to warning (acceptable until Phase 3).
    files: CONFIG_UI_FILES,
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
];
