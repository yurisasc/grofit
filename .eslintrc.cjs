module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
    browser: true,
  },
  ignorePatterns: [
    '**/dist/**',
    '**/.next/**',
    '**/.turbo/**',
    '**/node_modules/**',
    '**/.drizzle/**',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/no-explicit-any': 'off',
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      rules: {
        // Customize TS-specific rules here if desired
      },
    },
    {
      files: ['**/*.js', '**/*.jsx'],
      rules: {
        // JS-specific rules can go here
      },
    },
  ],
}
