import { test, expect } from '@playwright/test';
import { resetStorage } from './_storage';

const tb = { name: 'Markdown editor' };

// BHV-010：行号 / 字号 / toast 此前仅 unit+手测，无 e2e。本 spec 补端到端验收。
test.describe('AC-BHV010 编辑器偏好（行号 / 字号）+ toast', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetStorage(page);
    await page.reload();
    await page.getByRole('textbox', tb).fill('line1\nline2\nline3');
  });

  test('E2E-BHV010-1: # 切换行号 → gutter 显示/隐藏（默认开）', async ({ page }) => {
    // 默认 showLineNumbers=true → gutter 显示，行号与逻辑行对应（3 行）
    await expect(page.locator('.editor-gutter')).toBeVisible();
    await expect(page.locator('.editor-gutter__line')).toHaveCount(3);
    await page.getByRole('button', { name: '切换行号' }).click();
    await expect(page.locator('.editor-gutter')).toHaveCount(0); // 关
    await page.getByRole('button', { name: '切换行号' }).click();
    await expect(page.locator('.editor-gutter')).toBeVisible(); // 再开
  });

  test('E2E-BHV010-2: A+/A− 调字号（--editor-font-size 变，档位 13/15/17）', async ({
    page,
  }) => {
    const fs = () =>
      page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue('--editor-font-size')
          .trim(),
      );
    expect(await fs()).toBe('15px'); // 默认档
    await page.getByRole('button', { name: '增大字号' }).click();
    expect(await fs()).toBe('17px');
    await page.getByRole('button', { name: '减小字号' }).click();
    await page.getByRole('button', { name: '减小字号' }).click();
    expect(await fs()).toBe('13px'); // 下限档
    // 边界：13 再减不越界（仍 13）
    await page.getByRole('button', { name: '减小字号' }).click();
    expect(await fs()).toBe('13px');
  });

  test('E2E-BHV010-3: 复制 HTML → toast 提示（clipboard stub）', async ({
    page,
    context,
  }) => {
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: async () => {} },
      });
    });
    await page.reload();
    await page.getByRole('textbox', tb).fill('# hi');
    await page.getByRole('button', { name: '复制 HTML' }).click();
    await expect(page.locator('.toast')).toContainText('已复制');
  });
});
