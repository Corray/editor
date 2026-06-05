import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

export default defineConfig({
  plugins: [
    solid(),
    // PWA 离线 + 可安装（ADR-009）：Workbox generateSW，runtime 内联自托管（CSP script-src 'self' 安全）
    VitePWA({
      registerType: 'prompt', // D3：不静默更新，由 main.tsx onNeedRefresh → toast 提示
      // base 继承下方 vite base '/editor/'（D4 scope）
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'editor — Markdown 编辑器',
        short_name: 'editor',
        description: 'Web 轻量 Markdown 编辑器（离线可用）',
        start_url: '/editor/',
        scope: '/editor/',
        display: 'standalone',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // D2：含懒加载 chunk（mermaid/katex）+ katex woff2 字体 → 离线也能渲染公式/图
        globPatterns: ['**/*.{js,css,html,woff2,svg,webmanifest}'],
      },
      devOptions: {
        enabled: false, // dev 不启 SW；e2e 须 build + preview（test-plan §3）
      },
    }),
  ],
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
