import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test.describe('AC-3 导出', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('E2E-AC3-001: download .md with timestamp filename + correct body', async ({
    page,
  }) => {
    const textarea = page.getByRole('textbox', { name: 'Markdown editor' });
    await textarea.fill('# hello\nworld');

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: '下载 .md' }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^editor-\d{8}-\d{6}\.md$/);

    const path = await download.path();
    if (path) {
      const content = await readFile(path, 'utf-8');
      expect(content).toBe('# hello\nworld');
    }
  });

  test('E2E-AC3-002: copy HTML to clipboard (chromium only — clipboard permission)', async ({
    page,
    context,
    browserName,
  }) => {
    test.skip(
      browserName !== 'chromium',
      'Clipboard read/write permissions only stable in chromium',
    );

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const textarea = page.getByRole('textbox', { name: 'Markdown editor' });
    await textarea.fill('# Hello');
    await page.getByRole('button', { name: '复制 HTML' }).click();
    // small wait for clipboard write to land
    await page.waitForTimeout(300);

    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toContain('<h1>Hello</h1>');
  });
});
