import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Cap local parallelism: default (= all cores) saturates an 8-core machine
  // with parallel webkit+chromium navigations → page.goto 30s timeouts +
  // inflated render latency (the real flake root cause; CI stays serial =
  // workers:1, hence stable). 2 local workers keeps contention low and the
  // run deterministic without going fully serial.
  workers: process.env.CI ? 1 : 2,
  reporter: 'html',
  use: {
    // dev server is lenient — 302-redirects '/' → '/editor/' base; specs goto('/').
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
    navigationTimeout: 60_000, // absorb transient load on cold navigation
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      // PWA specs need build+preview (real SW); excluded from dev projects.
      testIgnore: /pwa-offline\.spec\.ts/,
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: /pwa-offline\.spec\.ts/,
    },
    // mobile-safari 不需要独立 project：webkit project + 测试内自建 mobile
    // context（isMobile/hasTouch）即覆盖 webkit + 移动 viewport（见 AC4-003）。
    {
      // M8 PWA：SW 仅 build+preview 启用（devOptions.enabled:false）→ 专用
      // project 跑 preview server（端口 5175 / base /editor/ / 真 sw.js）。
      name: 'pwa',
      testMatch: /pwa-offline\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5175' },
    },
  ],
  webServer: [
    {
      // vite dev（preview 改动已回退 2026-06-03 — 它非 flake fix，flake 根因是
      // worker 竞争，已由上面 workers:CI?1:2 + navigationTimeout 解决）。
      // 专用端口 5174 避免误用其它本地 Vite app（曾被 5173 的 Calculator dev
      // server 通过 reuseExistingServer 静默命中）。
      command: 'pnpm dev --port 5174 --strictPort',
      port: 5174,
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      // PWA project 专用：build + preview 提供真 SW（dist/sw.js）。
      command: 'pnpm build && pnpm preview --port 5175 --strictPort',
      port: 5175,
      reuseExistingServer: false,
      timeout: 120_000, // build 需时间
    },
  ],
});
