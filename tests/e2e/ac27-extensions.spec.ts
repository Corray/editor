import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { resetStorage } from './_storage';

const tb = { name: 'Markdown editor' };

// v3.4 markdown 扩展包（共识 AC-v34 / ADR-030）。双引擎。
test.describe('AC-v34 markdown 扩展包', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetStorage(page);
    await page.reload();
  });

  const pc = (page: Page) => page.locator('.preview-content');

  test('E2E-AC27-1: emoji / 脚注 / 上下标 懒加载后渲染（AC-v34-1/2/3）', async ({
    page,
  }) => {
    await page.getByRole('textbox', tb).fill(
      ':smile: H~2~O x^2^\n\ntext[^1]\n\n[^1]: note',
    );
    // 扩展 lazy chunk 加载 + 重渲染 → poll
    await expect(pc(page)).toContainText('😄');
    await expect(pc(page).locator('sub')).toHaveText('2');
    await expect(pc(page).locator('sup').first()).toBeVisible();
    await expect(pc(page).locator('.footnotes')).toContainText('note');
  });

  test('E2E-AC27-2: XSS — 扩展语法承载恶意内容无 alert（AC-v34-6 双引擎门槛）', async ({
    page,
  }) => {
    let dialog = false;
    page.on('dialog', (d) => {
      dialog = true;
      void d.dismiss();
    });
    await page.getByRole('textbox', tb).fill('~<script>alert(1)</script>~ :smile:');
    await expect(pc(page)).toContainText('😄'); // 扩展已加载
    const counts = await page.evaluate(() => ({
      scripts: document.querySelectorAll('.preview-content script').length,
    }));
    expect(counts.scripts).toBe(0);
    expect(dialog).toBe(false);
  });
});
