import { test, expect } from '@playwright/test';

test.describe('AC-2 持久化', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('E2E-AC2-001: content survives reload (debounced save)', async ({
    page,
  }) => {
    const textarea = page.getByRole('textbox', { name: 'Markdown editor' });
    await textarea.fill('# persisted');
    // Wait past debounce (500ms) so M3 setItem fires
    await page.waitForTimeout(800);

    await page.reload();

    const restored = page.getByRole('textbox', { name: 'Markdown editor' });
    await expect(restored).toHaveValue('# persisted');
  });

  test('E2E-AC2-002: clear button empties textarea + persistence (with confirm)', async ({
    page,
  }) => {
    // Accept window.confirm dialogs automatically
    page.on('dialog', (dialog) => dialog.accept());

    const textarea = page.getByRole('textbox', { name: 'Markdown editor' });
    await textarea.fill('# to-be-cleared');
    await page.waitForTimeout(800); // past M3 debounce

    await page.getByRole('button', { name: '清空' }).click();
    await expect(textarea).toHaveValue('');

    // localStorage doc key should be removed
    const stored = await page.evaluate(() =>
      localStorage.getItem('editor.document.v1'),
    );
    expect(stored).toBeNull();

    // Reload — still empty
    await page.reload();
    const reloaded = page.getByRole('textbox', { name: 'Markdown editor' });
    await expect(reloaded).toHaveValue('');
  });

  test('E2E-AC2-002.dismiss: clear confirm dismissed → content stays', async ({
    page,
  }) => {
    page.on('dialog', (dialog) => dialog.dismiss());

    const textarea = page.getByRole('textbox', { name: 'Markdown editor' });
    await textarea.fill('# keep-me');
    await page.waitForTimeout(800);

    await page.getByRole('button', { name: '清空' }).click();
    await expect(textarea).toHaveValue('# keep-me');
  });
});
