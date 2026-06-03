import { test, expect } from '@playwright/test';

test.describe('AC-1 编辑 + 预览闭环', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('E2E-AC1-001: H1 markdown renders in preview', async ({ page }) => {
    const textarea = page.getByRole('textbox', { name: 'Markdown editor' });
    await textarea.fill('# Hello');
    const preview = page.getByLabel('Preview');
    await expect(preview.locator('h1')).toHaveText('Hello');
  });

  test('E2E-AC1-002: complex Markdown (table / code / link) renders', async ({
    page,
  }) => {
    const md = [
      '# Title',
      '',
      '- a',
      '- b',
      '',
      '| col1 | col2 |',
      '|------|------|',
      '| x | y |',
      '',
      '```js',
      'const x = 1;',
      '```',
      '',
      '[link](https://example.com)',
    ].join('\n');

    const textarea = page.getByRole('textbox', { name: 'Markdown editor' });
    await textarea.fill(md);
    const preview = page.getByLabel('Preview');

    await expect(preview.locator('h1')).toHaveText('Title');
    await expect(preview.locator('table')).toBeVisible();
    await expect(preview.locator('pre code')).toContainText('const x = 1;');
    await expect(
      preview.locator('a[href="https://example.com"]'),
    ).toBeVisible();
  });

  test('E2E-AC1-003: XSS payload not executable (no alert / no active script)', async ({
    page,
  }) => {
    // Install alert spy before any input
    await page.evaluate(() => {
      // @ts-expect-error attach probe
      window.__alertCalled = false;
      window.alert = () => {
        // @ts-expect-error attach probe
        window.__alertCalled = true;
      };
    });

    const textarea = page.getByRole('textbox', { name: 'Markdown editor' });
    await textarea.fill(
      '<script>alert(1)</script>\n\n<img src=x onerror=alert(2)>\n\n[a](javascript:alert(3))',
    );
    // Give the browser a tick to expose any execution
    await page.waitForTimeout(500);

    const alertCalled = await page.evaluate(
      // @ts-expect-error probe
      () => window.__alertCalled === true,
    );
    expect(alertCalled).toBe(false);

    const preview = page.getByLabel('Preview');
    await expect(preview.locator('script')).toHaveCount(0);
    await expect(preview.locator('[onerror]')).toHaveCount(0);
    await expect(preview.locator('a[href^="javascript:"]')).toHaveCount(0);
  });
});
