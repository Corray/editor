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

  test('E2E-AC5-002: single edit on a 1000-line doc → preview DOM updates fast', async ({
    page,
    browserName,
  }) => {
    const textarea = page.getByRole('textbox', { name: 'Markdown editor' });
    const base = Array.from({ length: 1000 }, (_, i) => `# Line ${i + 1}`).join(
      '\n',
    );
    await textarea.fill(base);
    await page
      .getByLabel('Preview')
      .locator('h1')
      .last()
      .waitFor({ timeout: 10_000 });

    // Measure input → preview DOM mutation latency in-page (performance.now()
    // + MutationObserver). Closest honest proxy for MANUAL-PERF-002
    // 「输入到预览更新 < 50ms」 — excludes final browser paint but captures
    // markdown-it render + DOMPurify + innerHTML swap on a 1000-line doc.
    const latency = await page.evaluate(async () => {
      const ta = document.querySelector(
        'textarea.editor-area',
      ) as HTMLTextAreaElement;
      const preview = document.querySelector('.preview-content') as HTMLElement;
      return await new Promise<number>((resolve) => {
        let t0 = 0;
        let done = false;
        const finish = (v: number) => {
          if (done) return;
          done = true;
          obs.disconnect();
          resolve(v);
        };
        const obs = new MutationObserver(() => finish(performance.now() - t0));
        obs.observe(preview, { childList: true, subtree: true });
        t0 = performance.now();
        ta.value = `${ta.value}\n# PERF_MARKER`;
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        // safety net — never hang the test; -1 signals "no mutation observed"
        setTimeout(() => finish(-1), 3000);
      });
    });

    // -1 = mutation never observed (would be a real regression — preview
    // stopped reacting to input). Budget MANUAL-PERF-002 = 50ms; bound here is
    // generous (engine + CI variance, no real-paint isolation). Recorded
    // baseline (docs/perf/) holds actual observed numbers; webkit is slower.
    expect(latency).toBeGreaterThanOrEqual(0);
    const bound = browserName === 'webkit' ? 300 : 150;
    expect(latency).toBeLessThan(bound);
  });

  // Lighthouse Performance ≥ 90 (MANUAL-PERF-001) + bundle < 150KB gzip
  // (MANUAL-PERF-003) recorded as one-time baseline in
  // docs/perf/baseline-v0.1.0.md; bundle size is also CI-gated in deploy.yml.
  // Full Lighthouse CI remains deferred to v1.1+ per TBD-T1.
});
