import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Keep Vitest cache inside the app workspace to avoid writes through external node_modules symlinks.
  cacheDir: '.vite',
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
