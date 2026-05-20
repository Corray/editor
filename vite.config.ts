import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import path from 'node:path';

export default defineConfig({
  plugins: [solid()],
  // GitHub Pages subdirectory deploy: https://corray.github.io/editor/
  // 决议见 ADR-004 (accepted 2026-05-20)
  base: '/editor/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    cssCodeSplit: false,
  },
  server: {
    port: 5173,
    open: false,
  },
});
