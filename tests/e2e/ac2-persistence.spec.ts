import { test, expect } from '@playwright/test';
import { resetStorage, seedLegacyDoc, readActiveDocText } from './_storage';

test.describe('AC-2 持久化', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetStorage(page);
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

  test('E2E-AC2-002: clear button empties active doc 内容 (v1.6：清内容保留条目)', async ({
    page,
  }) => {
    // Accept window.confirm dialogs automatically
    page.on('dialog', (dialog) => dialog.accept());

    const textarea = page.getByRole('textbox', { name: 'Markdown editor' });
    await textarea.fill('# to-be-cleared');
    await page.waitForTimeout(800); // past M3 debounce

    await page.getByRole('button', { name: '清空' }).click();
    await expect(textarea).toHaveValue('');

    // v1.6：清空 = active doc 内容置空（条目保留，仍 1 篇）
    await page.waitForTimeout(300);
    expect(await readActiveDocText(page)).toBe('');
    await expect(page.locator('.doc-list__item')).toHaveCount(1);

    // Reload — still empty
    await page.reload();
    const reloaded = page.getByRole('textbox', { name: 'Markdown editor' });
    await expect(reloaded).toHaveValue('');
  });

  test('E2E-v11-001 / AC-v16-4: legacy localStorage doc 直跳 v1.6 迁移到 documents store', async ({
    page,
  }) => {
    // v1.0 用户直跳 v1.6：localStorage 旧 doc，IDB documents 空。
    // beforeEach 的 reload 已建空 doc → 先 resetStorage 清掉它，再 seed legacy，
    // 模拟"真 v1.0 用户首次 v1.6 加载（documents 从未建过）"。
    await resetStorage(page);
    await seedLegacyDoc(page, '# legacy doc');
    await page.reload(); // v1.6 首次加载 → loadInitialDocs 迁移（含 localStorage 兜底路）

    // Document restored into the editor
    const textarea = page.getByRole('textbox', { name: 'Markdown editor' });
    await expect(textarea).toHaveValue('# legacy doc');

    // 迁移进 documents store（active doc），localStorage 旧 key 删除
    expect(await readActiveDocText(page)).toBe('# legacy doc');
    const legacy = await page.evaluate(() =>
      localStorage.getItem('editor.document.v1'),
    );
    expect(legacy).toBeNull();
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
