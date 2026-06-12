import { test, expect } from '@playwright/test';
import { resetStorage } from './_storage';

const tb = { name: 'Markdown editor' };

// v2.3 语法高亮（共识 AC-v23-1/4/6 / ADR-019）。XSS 门槛 = AC-v14-3 同款（双引擎）。
test.describe('AC-v23 代码块语法高亮', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetStorage(page);
    await page.reload();
  });

  test('E2E-AC16-1: ```js fence → 懒加载后预览着色（AC-v23-1）', async ({
    page,
  }) => {
    await page
      .getByRole('textbox', tb)
      .fill('```js\nconst x = 1; // note\n```');
    // hljs lazy chunk 加载 + 重渲染 → poll
    await expect(page.locator('.preview-content .hljs-keyword').first()).toBeVisible();
    await expect(page.locator('.preview-content .hljs-comment').first()).toBeVisible();
  });

  test('E2E-AC16-2: 恶意代码内容无 alert / 无 script（AC-v23-4 XSS 门槛）', async ({
    page,
  }) => {
    let dialogFired = false;
    page.on('dialog', (d) => {
      dialogFired = true;
      void d.dismiss();
    });
    await page
      .getByRole('textbox', tb)
      .fill(
        '```html\n<script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(1)">x</a>\n```',
      );
    await expect(page.locator('.preview-content pre').first()).toBeVisible();
    const counts = await page.evaluate(() => ({
      scripts: document.querySelectorAll('.preview-content script').length,
      onerror: document.querySelectorAll('.preview-content [onerror]').length,
      jsHref: [...document.querySelectorAll('.preview-content a')].filter((a) =>
        (a.getAttribute('href') ?? '').startsWith('javascript:'),
      ).length,
    }));
    expect(counts).toEqual({ scripts: 0, onerror: 0, jsHref: 0 });
    expect(dialogFired).toBe(false);
  });

  test('E2E-AC16-3: 主题切换 → 代码配色即时跟随（AC-v23-6，零重渲染）', async ({
    page,
  }) => {
    await page.getByRole('textbox', tb).fill('```js\nconst x = 1;\n```');
    const kw = page.locator('.preview-content .hljs-keyword').first();
    await expect(kw).toBeVisible();
    const colorBefore = await kw.evaluate((el) => getComputedStyle(el).color);
    await page.getByRole('button', { name: '切换主题' }).click();
    await expect
      .poll(() => kw.evaluate((el) => getComputedStyle(el).color))
      .not.toBe(colorBefore);
  });
});
