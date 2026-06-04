import { test, expect } from '@playwright/test';
import { resetStorage } from './_storage';

const tb = { name: 'Markdown editor' };

test.describe('AC-v13 KaTeX 公式', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetStorage(page);
    await page.reload();
  });

  test('E2E-v13-001: $$…$$ 块级公式渲染（懒加载后出 .katex）', async ({
    page,
  }) => {
    await page.getByRole('textbox', tb).fill('$$\\int_0^1 x\\,dx$$');
    // 懒加载 katex chunk 后预览出现 .katex（auto-wait）
    await expect(page.getByLabel('Preview').locator('.katex').first()).toBeVisible();
  });

  test('E2E-v13-001b: inline $…$ 公式渲染', async ({ page }) => {
    await page.getByRole('textbox', tb).fill('能量 $E=mc^2$ 公式');
    await expect(page.getByLabel('Preview').locator('.katex').first()).toBeVisible();
  });

  test('E2E-v13-003: 恶意公式 → 无 alert / 无 script（XSS 发布门槛）', async ({
    page,
  }) => {
    await page.evaluate(() => {
      // @ts-expect-error probe
      window.__alertCalled = false;
      window.alert = () => {
        // @ts-expect-error probe
        window.__alertCalled = true;
      };
    });
    await page
      .getByRole('textbox', tb)
      .fill('$\\href{javascript:alert(1)}{x}$\n\n<img src=x onerror=alert(2)>');
    // 等渲染（含懒加载）
    await expect(page.getByLabel('Preview').locator('.katex').first()).toBeVisible();
    await page.waitForTimeout(300);
    const alerted = await page.evaluate(
      // @ts-expect-error probe
      () => window.__alertCalled === true,
    );
    expect(alerted).toBe(false);
    const preview = page.getByLabel('Preview');
    await expect(preview.locator('script')).toHaveCount(0);
    await expect(preview.locator('[onerror]')).toHaveCount(0);
    await expect(preview.locator('a[href^="javascript:"]')).toHaveCount(0);
  });

  test('E2E-v13-005: "$5 和 $10" 不误判为公式', async ({ page }) => {
    await page.getByRole('textbox', tb).fill('价格 $5 和 $10 元');
    await expect(page.getByLabel('Preview').locator('.preview-content')).toContainText(
      '价格 $5 和 $10 元',
    );
    await expect(page.getByLabel('Preview').locator('.katex')).toHaveCount(0);
  });
});
