import { defineConfig } from 'vitest/config';
import solid from 'vite-plugin-solid';
import path from 'node:path';

export default defineConfig({
  plugins: [solid()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    conditions: ['development', 'browser'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'tests/unit/**/*.test.{ts,tsx}'],
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/main.tsx',
        'src/vite-env.d.ts',
        // type-only re-export api.ts 文件（无 runtime 函数）
        // M1 api.ts 含 createEditorAPI runtime 工厂，**不排除**
        'src/modules/m2-preview/api.ts',
        'src/modules/m3-persistence/api.ts',
        'src/modules/m6-theme/api.ts',
        'src/modules/m7-i18n/api.ts',
      ],
      thresholds: {
        lines: 70,
        branches: 60,
      },
    },
  },
});
