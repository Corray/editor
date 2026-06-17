import { test, expect } from '@playwright/test';
import { resetStorage } from './_storage';

// v2.9 设置面板（共识 AC-v29 / ADR-025）。双引擎。
test.describe('AC-v29 设置面板', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetStorage(page);
    await page.reload();
  });

  test('E2E-AC22-1: ⚙ 开设置面板 + Esc 关 + 语言只读占位（AC-v29-1/7）', async ({
    page,
  }) => {
    await page.getByRole('button', { name: '设置' }).click();
    const dialog = page.getByRole('dialog', { name: '设置' });
    await expect(dialog).toBeVisible();
    // 语言只读占位
    await expect(dialog.locator('.settings-row__readonly')).toHaveText('中文');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });

  test('E2E-AC22-2: 改快照上限 → 持久化（刷新保留）（AC-v29-4/5）', async ({
    page,
  }) => {
    await page.getByRole('button', { name: '设置' }).click();
    const dialog = page.getByRole('dialog', { name: '设置' });
    // 上限 select：选 50
    const maxSelect = dialog.locator('select').last();
    await maxSelect.selectOption('50');
    await page.keyboard.press('Escape');
    // 刷新后重开，值保留
    await page.reload();
    await page.getByRole('button', { name: '设置' }).click();
    await expect(page.getByRole('dialog', { name: '设置' }).locator('select').last()).toHaveValue('50');
  });

  test('E2E-AC22-3: 关闭自动快照 → 间隔档隐藏（AC-v29-2）', async ({ page }) => {
    await page.getByRole('button', { name: '设置' }).click();
    const dialog = page.getByRole('dialog', { name: '设置' });
    // 默认开 → 间隔 select 存在（2 个 select：间隔 + 上限）
    await expect(dialog.locator('select')).toHaveCount(2);
    await dialog.locator('input[type=checkbox]').uncheck();
    // 关闭 → 间隔 select 隐藏（仅剩上限）
    await expect(dialog.locator('select')).toHaveCount(1);
  });
});
