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
    // base includes Vite `base: '/editor/'` — preview serves strictly under it
    // (dev was lenient / 302-redirected '/'); specs use page.goto('./').
    baseURL: 'http://localhost:5174/editor/',
    trace: 'on-first-retry',
    navigationTimeout: 60_000, // absorb transient load on cold navigation
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // mobile-safari 不需要独立 project：webkit project + 测试内自建 mobile
    // context（isMobile/hasTouch）即覆盖 webkit + 移动 viewport（见 AC4-003）。
  ],
  webServer: {
    // FB-005 fix（2026-06-03）：用 `vite preview`（生产 build）而非 `vite dev`。
    // dev server 按需编译 + 冷启动，并行 worker 首次 page.goto 偶发 >30s 超时
    // （PP-003 / 本地 retries:0 → flake 变硬失败）。preview 静态服务无编译，
    // 导航确定性快。专用端口 5174 避免误用其它本地 Vite app（曾被 5173 的
    // Calculator dev server 通过 reuseExistingServer 静默命中）。
    command: 'pnpm build && pnpm preview --port 5174 --strictPort',
    port: 5174,
    reuseExistingServer: false,
    timeout: 120_000, // 覆盖 build + preview 启动
  },
});
