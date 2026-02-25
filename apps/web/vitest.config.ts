import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.tsx'],
    css: false,
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
