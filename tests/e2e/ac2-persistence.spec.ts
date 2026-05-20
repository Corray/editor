import { test, expect } from '@playwright/test';

test.describe('AC-2 持久化', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('E2E-AC2-001: content survives reload (debounced save)', async ({
    page,
  }) => {
    const textarea = page.getByRole('textbox', { name: 'Markdown editor' });
    await textarea.fill('# persisted');
    // Wait past debounce (500ms) so M3 setItem fires
    await page.waitForTimeout(800);

    await page.reload();

    const restored = page.getByRole('textbox', { name: 'Markdown editor' });
    await expect(restored).toHaveValue('# persisted');
  });

  test.skip('E2E-AC2-002: clear button empties textarea + persistence', () => {
    // SKIP — 依赖 GAP-004（清空按钮 UI 未实现）；
    // 待 GAP-004 修复后 unskip。
  });
});
