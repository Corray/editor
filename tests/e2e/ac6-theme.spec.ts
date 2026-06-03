import { test, expect } from '@playwright/test';
import { resetStorage } from './_storage';

test.describe('AC-6 主题', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetStorage(page);
    await page.reload();
  });

  test('E2E-AC6-001: toggle button flips data-theme', async ({ page }) => {
    const initial = await page.evaluate(
      () => document.documentElement.dataset.theme,
    );
    await page.getByRole('button', { name: '切换主题' }).click();
    const after = await page.evaluate(
      () => document.documentElement.dataset.theme,
    );
    expect(after).not.toBe(initial);
    expect(['light', 'dark']).toContain(after);
  });

  test('E2E-AC6-002: theme persists across reload', async ({ page }) => {
    await page.getByRole('button', { name: '切换主题' }).click();
    const set = await page.evaluate(
      () => document.documentElement.dataset.theme,
    );

    await page.reload();
    const after = await page.evaluate(
      () => document.documentElement.dataset.theme,
    );
    expect(after).toBe(set);
  });

  test('E2E-AC6-003: prefers-color-scheme=dark drives initial theme (no localStorage)', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    // Clear and reload so M6 readInitial picks up matchMedia
    await resetStorage(page);
    await page.reload();

    const theme = await page.evaluate(
      () => document.documentElement.dataset.theme,
    );
    expect(theme).toBe('dark');
  });
});
