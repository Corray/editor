import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { resetStorage } from './_storage';

const tb = { name: 'Markdown editor' };

// v3.1 预览任务清单交互（共识 AC-v31 / ADR-027）。双引擎 + 移动 viewport。
test.describe('AC-v31 任务清单交互', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetStorage(page);
    await page.reload();
  });

  const ta = (page: Page) => page.getByRole('textbox', tb);
  const cb = (page: Page) => page.locator('.preview-content .task-checkbox');

  test('E2E-AC24-1: `- [ ]` 渲染 checkbox + 点击翻转源文 + 编辑器同步（AC-v31-1/2）', async ({
    page,
  }) => {
    await ta(page).fill('- [ ] buy milk\n- [x] done');
    await expect(cb(page)).toHaveCount(2);
    await expect(cb(page).nth(0)).not.toBeChecked();
    await expect(cb(page).nth(1)).toBeChecked();
    // 点第一个 → 源文 [ ]→[x]
    await cb(page).nth(0).click();
    await expect(ta(page)).toHaveValue('- [x] buy milk\n- [x] done');
    await expect(cb(page).nth(0)).toBeChecked();
  });

  test('E2E-AC24-2: 多任务点击各自定位准（AC-v31-3）', async ({ page }) => {
    await ta(page).fill('- [ ] a\n- [ ] b\n- [ ] c');
    await cb(page).nth(1).click(); // 点中间
    await expect(ta(page)).toHaveValue('- [ ] a\n- [x] b\n- [ ] c');
  });

  test('E2E-AC24-3: 翻转持久化（reload 保留）（AC-v31-4）', async ({ page }) => {
    await ta(page).fill('- [ ] persist me');
    await cb(page).nth(0).click();
    await page.waitForTimeout(700); // M3 debounce
    await page.reload();
    await expect(ta(page)).toHaveValue('- [x] persist me');
  });

  test('E2E-AC24-4: XSS — 任务项恶意内容无 alert（AC-v31-5 双引擎门槛）', async ({
    page,
  }) => {
    let dialog = false;
    page.on('dialog', (d) => {
      dialog = true;
      void d.dismiss();
    });
    await ta(page).fill('- [ ] <script>alert(1)</script><img src=x onerror=alert(1)>');
    await expect(cb(page).first()).toBeVisible();
    const counts = await page.evaluate(() => ({
      scripts: document.querySelectorAll('.preview-content script').length,
      onerror: document.querySelectorAll('.preview-content [onerror]').length,
    }));
    expect(counts).toEqual({ scripts: 0, onerror: 0 });
    expect(dialog).toBe(false);
  });

  test('E2E-AC24-5: 移动 viewport 预览 tab 可点（AC-v31-7）', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.reload();
    await ta(page).fill('- [ ] mobile task');
    // 切到预览 tab
    await page.getByRole('tab', { name: '预览' }).click();
    await cb(page).first().click();
    // 切回编辑确认源文翻转
    await page.getByRole('tab', { name: '编辑' }).click();
    await expect(ta(page)).toHaveValue('- [x] mobile task');
  });
});
