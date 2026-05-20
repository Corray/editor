import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
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
    // {
    //   name: 'mobile-safari',
    //   use: { ...devices['iPhone 14 Pro'] },
    // },
  ],
  webServer: {
    command: 'pnpm dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
