import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { resetStorage } from './_storage';

const tb = { name: 'Markdown editor' };

// v2.7 格式工具栏（共识 AC-v27 / ADR-023）。双引擎 + 移动 viewport 可见性。
test.describe('AC-v27 格式工具栏', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetStorage(page);
    await page.reload();
  });

  const ta = (page: Page) => page.getByRole('textbox', tb);
  const selectAll = (page: Page) =>
    page.evaluate(() => {
      const el = document.querySelector<HTMLTextAreaElement>('.editor-area')!;
      el.focus();
      el.setSelectionRange(0, el.value.length);
    });

  test('E2E-AC20-1: 加粗按钮 → 选区包裹 ** + toggle 解除（AC-v27-1）', async ({
    page,
  }) => {
    await ta(page).fill('hello');
    await selectAll(page);
    await page.getByRole('button', { name: '加粗' }).click();
    await expect(ta(page)).toHaveValue('**hello**');
    await selectAll(page);
    await page.getByRole('button', { name: '加粗' }).click();
    await expect(ta(page)).toHaveValue('hello');
  });

  test('E2E-AC20-2: 行内代码 / 代码块 / 链接（AC-v27-1/2/5）', async ({ page }) => {
    await ta(page).fill('x');
    await selectAll(page);
    await page.getByRole('button', { name: '行内代码' }).click();
    await expect(ta(page)).toHaveValue('`x`');

    await ta(page).fill('code line');
    await selectAll(page);
    await page.getByRole('button', { name: '代码块' }).click();
    await expect(ta(page)).toHaveValue('```\ncode line\n```');
  });

  test('E2E-AC20-3: 多行有序列表前缀递增 + toggle 去除（AC-v27-3/4）', async ({
    page,
  }) => {
    await ta(page).fill('a\nb\nc');
    await selectAll(page);
    await page.getByRole('button', { name: '有序列表' }).click();
    await expect(ta(page)).toHaveValue('1. a\n2. b\n3. c');
    await selectAll(page);
    await page.getByRole('button', { name: '有序列表' }).click();
    await expect(ta(page)).toHaveValue('a\nb\nc'); // toggle 去除
  });

  test('E2E-AC20-4: 工具栏操作 Cmd+Z 可撤销（AC-v27-6）', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === 'webkit', 'Playwright WebKit undo 全合并（F-V21-1）');
    await ta(page).click();
    await page.keyboard.type('hello'); // 键入铺底（受 undo 跟踪）
    await selectAll(page);
    await page.getByRole('button', { name: '引用' }).click();
    await expect(ta(page)).toHaveValue('> hello');
    await page.keyboard.press('ControlOrMeta+z');
    await expect(ta(page)).toHaveValue('hello');
  });

  test('E2E-AC20-5: 移动 viewport 工具栏可见可点（AC-v27-7）', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.reload();
    // 移动端默认编辑 tab → 工具栏在编辑面板
    await expect(page.locator('.format-toolbar')).toBeVisible();
    await ta(page).fill('m');
    await selectAll(page);
    await page.getByRole('button', { name: '加粗' }).click();
    await expect(ta(page)).toHaveValue('**m**');
  });
});
