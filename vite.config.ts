import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

// F-V15-1 修：把 mermaid 生态的重 chunk（mermaid.core / cytoscape / wardley /
// 各 diagram 子 chunk）路由到 assets/mmd/，从 precache 排除（globIgnores）+ 改
// runtimeCaching（CacheFirst，cache-on-use）。app 核心 + katex 仍 precache（离线
// 公式始终可用）。避免误伤 app 共享库（dompurify/markdown-it 等绝不进 mmd）。
// F-V15-1：按 chunk **名**判定 mermaid 生态（chunkFileNames 里 moduleIds 对部分
// chunk 不可靠 / 为空 → 名判定确定性更高）。app chunk 仅 index*/katex* / 不会误中。
// 过度路由（误把 app 首屏 chunk 移走）会被离线 e2e（E2E-v15-001 离线打开）兜住。
const MERMAID_NAME =
  /(^|[-/])(mermaid|cytoscape|wardley|dagre|cose-bilkent|fcose|elkjs?|khroma|arc|graph|sankey|pie|gantt|flowchart|chord)(\.|[-_]|$)|diagram/i;

function isMermaidChunk(name: string): boolean {
  return MERMAID_NAME.test(name);
}

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
        // D2（F-V15-1 修订）：precache app 核心 + katex + 字体 + 静态资源；
        // mermaid 重 chunk（assets/mmd/）排除 precache → runtimeCaching 按需缓存。
        globPatterns: ['**/*.{js,css,html,woff2,svg,webmanifest}'],
        globIgnores: ['**/assets/mmd/**'],
        runtimeCaching: [
          {
            // mermaid 生态 chunk：首次（在线）渲染图时按需缓存 → 之后离线可用
            urlPattern: /\/assets\/mmd\/.*\.js$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mermaid-chunks',
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
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
    rollupOptions: {
      output: {
        // 路由 mermaid 生态重 chunk 到 assets/mmd/（F-V15-1：precache 排除 + runtimeCaching）
        chunkFileNames(chunkInfo) {
          return isMermaidChunk(chunkInfo.name)
            ? 'assets/mmd/[name]-[hash].js'
            : 'assets/[name]-[hash].js';
        },
      },
    },
  },
  server: {
    port: 5173,
    open: false,
  },
});
