import { test, expect } from '@playwright/test';

// PWA / Service Worker e2e (M8 / ADR-009). SW is disabled in dev
// (devOptions.enabled:false) → these run only against the `pwa` project,
// which serves the built dist via `vite preview` (real sw.js). Base is
// '/editor/' (preview honours vite base), so we goto('/editor/') explicitly.

const tb = { name: 'Markdown editor' };
const APP = '/editor/';

async function waitForSWActive(page: import('@playwright/test').Page) {
  await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) throw new Error('no SW support');
    await navigator.serviceWorker.ready; // active + controlling
  });
}

test.describe('AC-v15 PWA 离线', () => {
  test('E2E-v15-001: 在线访问→SW 就绪→断网 reload→应用仍可打开+编辑', async ({
    page,
    context,
  }) => {
    await page.goto(APP);
    await waitForSWActive(page);
    await page.reload(); // 让页面被 SW 接管
    await waitForSWActive(page);

    await context.setOffline(true);
    await page.reload(); // 离线 reload —— 须从 precache 命中
    await expect(page.getByRole('textbox', tb)).toBeVisible({ timeout: 15_000 });
    await page.getByRole('textbox', tb).fill('# 离线也能编辑');
    await expect(page.getByLabel('Preview').locator('h1')).toHaveText(
      '离线也能编辑',
    );
    await context.setOffline(false);
  });

  test('E2E-v15-002: 离线编辑→IndexedDB 持久化→离线重开仍在', async ({
    page,
    context,
  }) => {
    await page.goto(APP);
    await waitForSWActive(page);
    await page.reload();
    await waitForSWActive(page);

    await context.setOffline(true);
    await page.reload();
    const ta = page.getByRole('textbox', tb);
    await ta.fill('# 离线持久化测试');
    await page.waitForTimeout(800); // debounce 写 IDB (500ms)
    await page.reload(); // 仍离线
    await expect(page.getByRole('textbox', tb)).toHaveValue('# 离线持久化测试', {
      timeout: 15_000,
    });
    await context.setOffline(false);
  });

  test('E2E-v15-003: 公式始终离线可用(precache)；图按用过的离线可用(runtimeCaching) — F-V15-1 修订', async ({
    page,
    context,
  }) => {
    await page.goto(APP);
    await waitForSWActive(page);
    await page.reload();
    await waitForSWActive(page);

    const ta = page.getByRole('textbox', tb);
    const preview = page.getByLabel('Preview');
    // 先在线渲染一次 mermaid → mmd chunk 经 runtimeCaching(CacheFirst) 缓存
    await ta.fill('$E = mc^2$\n\n```mermaid\ngraph TD; A-->B\n```');
    await expect(preview.locator('.katex').first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(preview.locator('svg').first()).toBeVisible({ timeout: 15_000 });

    // 断网 reload → katex(precache) + mermaid(已缓存) 都应离线渲染
    await context.setOffline(true);
    await page.reload();
    await ta.fill('$a^2+b^2$\n\n```mermaid\ngraph TD; X-->Y\n```');
    await expect(preview.locator('.katex').first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(preview.locator('svg').first()).toBeVisible({ timeout: 15_000 });
    await context.setOffline(false);
  });

  test('E2E-v15-006: 加载 console 无 error（CSP / manifest 干净 / PP-003 #7）', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(APP);
    await waitForSWActive(page);
    await page.reload();
    await page.waitForTimeout(1500);
    // manifest present
    await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
