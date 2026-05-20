import { test, expect } from '@playwright/test';

test.describe('AC-5 性能（自动断言部分）', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('E2E-AC5-001: 1000-line markdown renders preview within loose bound', async ({
    page,
  }) => {
    const textarea = page.getByRole('textbox', { name: 'Markdown editor' });
    const bigMd = Array.from(
      { length: 1000 },
      (_, i) => `# Line ${i + 1}`,
    ).join('\n');

    const start = Date.now();
    await textarea.fill(bigMd);
    // Wait until the last header lands in the preview
    await page.getByLabel('Preview').locator('h1').last().waitFor({
      timeout: 10_000,
    });
    const elapsed = Date.now() - start;

    // Loose bound — Playwright fill() has its own per-char delay overhead
    // and webkit is consistently slower than chromium for this workload.
    // Real "input-to-preview < 50ms" assertion lives in manual Lighthouse pass
    // (TBD-T1 decision). Here we only assert no timeout / no crash.
    expect(elapsed).toBeLessThan(20_000);
  });

  // Real Lighthouse perf score lives in manual run before release.
  // (Test plan §7.5 marked MANUAL-PERF-001~003.)
});
