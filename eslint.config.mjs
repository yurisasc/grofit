// ESLint v9 flat config
import js from '@eslint/js'
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import eslintConfigPrettier from 'eslint-config-prettier'
import globals from 'globals'

export default [
  // Ignores (replaces ignorePatterns from .eslintrc)
  {
    ignores: ['**/dist/**', '**/.next/**', '**/.turbo/**', '**/node_modules/**', '**/.drizzle/**'],
  },

  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript rules
  {
    files: ['**/*.{ts,tsx}', '**/*.cts', '**/*.mts'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Recognize Node and Browser globals across TS files in the monorepo
        ...globals.node,
        ...globals.browser,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Start with the plugin's recommended ruleset
      ...(tsPlugin.configs?.recommended?.rules ?? {}),
      // no-undef is not compatible with TypeScript and causes false positives for types (e.g. HTMLButtonElement)
      // TypeScript's type checker already covers undefined identifiers.
      'no-undef': 'off',
      // Project-specific overrides from the previous .eslintrc
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Node JS scripts (e.g., scripts/*.mjs)
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Allow Node globals without no-undef noise in plain JS scripts
      'no-undef': 'off',
    },
  },

  // File-specific overrides
  {
    files: ['**/next-env.d.ts'],
    rules: {
      // Next.js auto-generates this file with triple-slash references; don't lint this rule here
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },

  // Disable formatting-related rules to let Prettier handle formatting
  eslintConfigPrettier,
]
