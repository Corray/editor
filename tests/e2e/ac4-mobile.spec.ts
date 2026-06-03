import { test, expect, devices } from '@playwright/test';
import { resetStorage } from './_storage';

test.describe('AC-4 移动端', () => {
  test('E2E-AC4-001: 320px iPhone SE — no horizontal scroll', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      ...devices['iPhone SE'],
    });
    const page = await context.newPage();
    await page.goto('/');
    await resetStorage(page);
    await page.reload();

    const textarea = page.getByRole('textbox', { name: 'Markdown editor' });
    await textarea.fill('a'.repeat(800));

    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    const clientWidth = await page.evaluate(
      () => document.documentElement.clientWidth,
    );
    expect(scrollWidth).toBe(clientWidth);

    await context.close();
  });

  test('E2E-AC4-002: mobile tab switch (edit ↔ preview)', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      ...devices['iPhone SE'],
    });
    const page = await context.newPage();
    await page.goto('/');
    await resetStorage(page);
    await page.reload();

    const textarea = page.getByRole('textbox', { name: 'Markdown editor' });
    await textarea.fill('# title');

    // Switch to preview tab
    await page.getByRole('tab', { name: '预览' }).click();
    await expect(
      page.getByLabel('Preview').locator('h1'),
    ).toHaveText('title');
    // Editor textarea no longer mounted in DOM
    await expect(
      page.getByRole('textbox', { name: 'Markdown editor' }),
    ).toHaveCount(0);

    // Switch back to edit
    await page.getByRole('tab', { name: '编辑' }).click();
    await expect(
      page.getByRole('textbox', { name: 'Markdown editor' }),
    ).toHaveValue('# title');

    await context.close();
  });

  test('E2E-AC4-003: iPhone 14 Pro full flow (chromium + webkit mobile context)', async ({
    browser,
  }) => {
    // BHV-004 resolved (Playwright 1.60)：webkit + mobile context page.goto 不再
    // 超时，故移除 chromium-only skip —— 本用例现在同时在 chromium / webkit 跑，
    // webkit 引擎下 isMobile context 提供真正的 mobile-safari 覆盖。
    const context = await browser.newContext({
      viewport: { width: 393, height: 852 }, // iPhone 14 Pro logical
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('/');
    await resetStorage(page);
    await page.reload();

    // Edit
    await page
      .getByRole('textbox', { name: 'Markdown editor' })
      .fill('# mobile');

    // Switch to preview
    await page.getByRole('tab', { name: '预览' }).click();
    await expect(
      page.getByLabel('Preview').locator('h1'),
    ).toHaveText('mobile');

    // Switch back + download .md
    await page.getByRole('tab', { name: '编辑' }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: '下载 .md' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^editor-\d{8}-\d{6}\.md$/);

    await context.close();
  });
});
