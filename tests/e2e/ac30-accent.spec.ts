import { test, expect } from '@playwright/test';
import { resetStorage } from './_storage';

// v3.7 主题增强（强调色）（共识 AC-v37 / ADR-033）。双引擎。
test.describe('AC-v37 强调色', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetStorage(page);
    await page.reload();
  });

  test('E2E-AC30-1: 选强调色 → data-accent 应用 + accent 变 + 持久化（AC-v37-1/2）', async ({
    page,
  }) => {
    // 默认 blue → 无 data-accent
    expect(await page.evaluate(() => document.documentElement.dataset.accent)).toBeUndefined();
    await page.getByRole('button', { name: '设置' }).click();
    const dialog = page.getByRole('dialog', { name: '设置' });
    await dialog.getByRole('button', { name: '绿' }).click();
    // data-accent=green 应用
    await expect
      .poll(() => page.evaluate(() => document.documentElement.dataset.accent))
      .toBe('green');
    // --accent 变绿（浅色 #16a34a）
    const accent = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
    );
    expect(accent).toBe('#16a34a');
    await page.keyboard.press('Escape');
    // 持久化：刷新保留
    await page.reload();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.dataset.accent))
      .toBe('green');
  });

  test('E2E-AC30-2: 切回蓝 → data-accent 移除（默认零变化 / AC-v37-4）', async ({
    page,
  }) => {
    await page.getByRole('button', { name: '设置' }).click();
    const dialog = page.getByRole('dialog', { name: '设置' });
    await dialog.getByRole('button', { name: '紫' }).click();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.dataset.accent))
      .toBe('purple');
    await dialog.getByRole('button', { name: '蓝' }).click();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.dataset.accent))
      .toBeFalsy(); // blue → 删属性
  });
});
