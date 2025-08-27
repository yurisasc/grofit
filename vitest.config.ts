import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: __dirname,
  test: {
    globals: true,
    environment: 'node',
    // Look for test files in all packages
    include: ['packages/**/__tests__/*.{test,spec}.{ts,tsx}'],
    // Exclude node_modules, dist, etc.
    exclude: ['**/node_modules/**', '**/dist/**', '**/.turbo/**'],
  },
})
