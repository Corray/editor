import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { resetStorage } from './_storage';

const tb = { name: 'Markdown editor' };

// v3.6 mark/ins（共识 AC-v36 / ADR-032）。双引擎。
test.describe('AC-v36 文本高亮/标记', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetStorage(page);
    await page.reload();
  });

  const pc = (page: Page) => page.locator('.preview-content');

  test('E2E-AC29-1: ==mark== / ++ins++ 懒加载后渲染（AC-v36-1/2）', async ({
    page,
  }) => {
    await page.getByRole('textbox', tb).fill('==高亮== 和 ++插入++');
    await expect(pc(page).locator('mark').first()).toHaveText('高亮');
    await expect(pc(page).locator('ins').first()).toHaveText('插入');
  });

  test('E2E-AC29-2: XSS — ==恶意== 无 alert（AC-v36-5 双引擎门槛）', async ({
    page,
  }) => {
    let dialog = false;
    page.on('dialog', (d) => {
      dialog = true;
      void d.dismiss();
    });
    await page.getByRole('textbox', tb).fill('==<script>alert(1)</script>== ++text++');
    await expect(pc(page).locator('ins').first()).toBeVisible(); // 扩展已加载
    const scripts = await page.evaluate(
      () => document.querySelectorAll('.preview-content script').length,
    );
    expect(scripts).toBe(0);
    expect(dialog).toBe(false);
  });
});
