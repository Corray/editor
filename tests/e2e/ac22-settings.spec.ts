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
    // v3.0：语言段已从只读占位改为 select，默认中文
    await expect(dialog.getByLabel('语言')).toHaveValue('zh-CN');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });

  test('E2E-AC22-2: 改快照上限 → 持久化（刷新保留）（AC-v29-4/5）', async ({
    page,
  }) => {
    await page.getByRole('button', { name: '设置' }).click();
    const dialog = page.getByRole('dialog', { name: '设置' });
    // 上限 select（按 aria-label 定位，不靠位置 / v3.0 加了语言 select）
    await dialog.getByLabel('每文档快照上限').selectOption('50');
    await page.keyboard.press('Escape');
    // 刷新后重开，值保留
    await page.reload();
    await page.getByRole('button', { name: '设置' }).click();
    await expect(
      page.getByRole('dialog', { name: '设置' }).getByLabel('每文档快照上限'),
    ).toHaveValue('50');
  });

  test('E2E-AC22-3: 关闭自动快照 → 间隔档隐藏（AC-v29-2）', async ({ page }) => {
    await page.getByRole('button', { name: '设置' }).click();
    const dialog = page.getByRole('dialog', { name: '设置' });
    // 默认开 → 间隔 select 可见；关闭后隐藏（按 aria-label，不靠总数 / v3.0 加了语言 select）
    await expect(dialog.getByLabel('快照间隔')).toBeVisible();
    await dialog.locator('input[type=checkbox]').uncheck();
    await expect(dialog.getByLabel('快照间隔')).toHaveCount(0);
    // 上限/语言 select 始终在
    await expect(dialog.getByLabel('每文档快照上限')).toBeVisible();
  });
});
