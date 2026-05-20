import { test, expect, devices } from '@playwright/test';

test.describe('AC-4 移动端', () => {
  test('E2E-AC4-001: 320px iPhone SE — no horizontal scroll', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      ...devices['iPhone SE'],
    });
    const page = await context.newPage();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
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

  test.skip('E2E-AC4-002: mobile tab switch (edit ↔ preview)', () => {
    // SKIP — 依赖 GAP-001（M5 LayoutAPI 未实现，无 tab 切换 UI；
    // 当前移动端用 CSS @media column 叠列）；待 GAP-001 修复后 unskip。
  });

  test.skip('E2E-AC4-003: iPhone 14 Pro full flow (edit + preview + download)', () => {
    // SKIP — 依赖 GAP-001（同上）；
    // 底层路径 AC-1/2/3 已在桌面 + iPhone SE 测试覆盖部分。
  });
});
