import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
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
    // mobile-safari 在本地 Vite dev server + iPhone 14 Pro emulation 下
    // page.goto 稳定超时（webkit engine + mobile UA 触发的 navigation 卡顿）。
    // 移动端 viewport 已在 AC-4 用 iPhone SE context 单独覆盖。
    // TODO(follow-up): 启用 mobile-safari 需调研 webServer 兼容性或换成
    //   Vite preview build（更接近生产）。
    // mobile-safari 不再需要独立 project：webkit project + 测试内自建 mobile
    // context（isMobile/hasTouch）即可覆盖 webkit + 移动 viewport（见 AC4-003）。
    // 原 BHV-004 的 page.goto 30s 超时已随 Playwright 1.43→1.60 升级消失（2026-06-02）。
  ],
  webServer: {
    // Use a dedicated port so we don't accidentally reuse another local Vite
    // app's dev server on 5173 (real bite: another project's Calculator was
    // running on 5173 and reuseExistingServer:true silently picked it up).
    command: 'pnpm dev --port 5174 --strictPort',
    port: 5174,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
