import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { resetStorage } from './_storage';

const tb = { name: 'Markdown editor' };

// v2.8 表格编辑辅助（共识 AC-v28 / ADR-024）。双引擎。
test.describe('AC-v28 表格编辑辅助', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetStorage(page);
    await page.reload();
  });

  const ta = (page: Page) => page.getByRole('textbox', tb);
  const sel = (page: Page) =>
    page.evaluate(() => {
      const el = document.querySelector<HTMLTextAreaElement>('.editor-area')!;
      return el.value.slice(el.selectionStart, el.selectionEnd);
    });

  test('E2E-AC21-1: 工具栏插入表格模板 + 光标选中首单元格（AC-v28-1）', async ({
    page,
  }) => {
    await ta(page).click();
    await page.getByRole('button', { name: '插入表格' }).click();
    await expect(ta(page)).toHaveValue(
      '| 列1 | 列2 |\n| --- | --- |\n| 单元格 | 单元格 |\n',
    );
    expect(await sel(page)).toBe('列1');
  });

  test('E2E-AC21-2: 表格行内 Tab 跳单元格（AC-v28-2）', async ({ page }) => {
    await ta(page).fill('| aa | bb |');
    await page.evaluate(() => {
      const el = document.querySelector<HTMLTextAreaElement>('.editor-area')!;
      el.focus();
      el.setSelectionRange(3, 3); // aa 单元格
    });
    await page.keyboard.press('Tab');
    expect(await sel(page)).toBe('bb');
  });

  test('E2E-AC21-3: 末行末单元格 Tab → 新增行（AC-v28-3）', async ({ page }) => {
    await ta(page).fill('| aa | bb |');
    await page.evaluate(() => {
      const el = document.querySelector<HTMLTextAreaElement>('.editor-area')!;
      el.focus();
      el.setSelectionRange(8, 8); // bb（末单元格）
    });
    await page.keyboard.press('Tab');
    await expect(ta(page)).toHaveValue('| aa | bb |\n| 单元格 | 单元格 |');
    expect(await sel(page)).toBe('单元格');
  });

  test('E2E-AC21-4: 非表格行 Tab → 仍缩进（v2.4 零回归 / AC-v28-4）', async ({
    page,
  }) => {
    await ta(page).fill('plain');
    await page.evaluate(() => {
      const el = document.querySelector<HTMLTextAreaElement>('.editor-area')!;
      el.focus();
      el.setSelectionRange(0, 0);
    });
    await page.keyboard.press('Tab');
    await expect(ta(page)).toHaveValue('  plain'); // 缩进 2 空格，非单元格导航
  });
});
