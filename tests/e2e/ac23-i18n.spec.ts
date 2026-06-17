import { test, expect } from '@playwright/test';
import { resetStorage } from './_storage';

// v3.0 国际化（共识 AC-v30 / ADR-026）。双引擎。
// 确定性起点：显式置 zh-CN（避免 CI navigator.language 影响首访检测）。
test.describe('AC-v30 国际化（en-US + 语言切换）', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetStorage(page);
    await page.evaluate(() => localStorage.setItem('editor.lang.v1', 'zh-CN'));
    await page.reload();
  });

  test('E2E-AC23-1: 设置切 English → header 文案即时变英文 + 持久化（AC-v30-2/3）', async ({
    page,
  }) => {
    await expect(page.getByRole('button', { name: '清空' })).toBeVisible(); // 起点中文
    await page.getByRole('button', { name: '设置' }).click();
    const dialog = page.locator('.settings-dialog');
    await expect(dialog).toBeVisible();
    // 语言 select（按 aria-label 定位）→ en-US
    await dialog.getByLabel('语言').selectOption('en-US');
    await page.keyboard.press('Escape');
    // header 即时变英文
    await expect(page.getByRole('button', { name: 'Clear' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Download .md' })).toBeVisible();
    // 持久化：刷新后仍英文
    await page.reload();
    await expect(page.getByRole('button', { name: 'Clear' })).toBeVisible();
  });

  test('E2E-AC23-2: 切回中文 → 文案变中文（AC-v30-2）', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('editor.lang.v1', 'en-US'));
    await page.reload();
    await expect(page.getByRole('button', { name: 'Clear' })).toBeVisible();
    await page.getByRole('button', { name: 'Settings' }).click();
    // 英文界面下语言 select 的 aria-label 是 'Language'
    await page.locator('.settings-dialog').getByLabel('Language').selectOption('zh-CN');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: '清空' })).toBeVisible();
  });
});
