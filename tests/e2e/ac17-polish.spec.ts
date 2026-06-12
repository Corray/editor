import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { resetStorage } from './_storage';

const tb = { name: 'Markdown editor' };

// v2.4 编辑细节打磨包（共识 AC-v24-1~6 / ADR-020）
test.describe('AC-v24 编辑打磨（Tab 缩进 + 帮助面板 + TOC 高亮）', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetStorage(page);
    await page.reload();
  });

  const ta = (page: Page) => page.getByRole('textbox', tb);

  test('E2E-AC17-1: Tab/Shift+Tab 多行缩进（AC-v24-1/2）', async ({ page }) => {
    await ta(page).fill('aa\nbb');
    await ta(page).click();
    await page.evaluate(() => {
      const el = document.querySelector<HTMLTextAreaElement>('.editor-area')!;
      el.setSelectionRange(0, 5);
    });
    await page.keyboard.press('Tab');
    await expect(ta(page)).toHaveValue('  aa\n  bb');
    await page.keyboard.press('Shift+Tab');
    await expect(ta(page)).toHaveValue('aa\nbb');
  });

  test('E2E-AC17-2: 缩进 Cmd+Z 可撤销（AC-v24-3）', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === 'webkit', 'Playwright WebKit undo 全合并（F-V21-1）');
    await ta(page).click();
    await page.keyboard.type('hello');
    await page.keyboard.press('Tab');
    await expect(ta(page)).toHaveValue('hello  ');
    await page.keyboard.press('ControlOrMeta+z');
    await expect(ta(page)).toHaveValue('hello');
  });

  test('E2E-AC17-3: Esc 后下一个 Tab 放行焦点移动（AC-v24-4 a11y）', async ({
    page,
  }) => {
    await ta(page).click();
    await page.keyboard.press('Tab');
    await expect(ta(page)).toHaveValue('  '); // 默认拦截 = 插缩进
    await page.keyboard.press('Escape');
    await page.keyboard.press('Tab');
    await expect(ta(page)).not.toBeFocused(); // 放行 → 焦点离开
    await expect(ta(page)).toHaveValue('  '); // 未再插入
  });

  test('E2E-AC17-4: 帮助面板 — 按钮/Cmd+/ 唤起 + Esc 关 + 条目齐全（AC-v24-5）', async ({
    page,
  }) => {
    await page.getByRole('button', { name: '快捷键' }).click();
    const dialog = page.getByRole('dialog', { name: '键盘快捷键' });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.help-dialog__row')).toHaveCount(9); // v2.5 +Cmd+P
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    // Cmd+/ 从编辑器内唤起
    await ta(page).click();
    await page.keyboard.press('ControlOrMeta+/');
    await expect(page.getByRole('dialog', { name: '键盘快捷键' })).toBeVisible();
  });

  test('E2E-AC17-5: TOC 当前位置高亮随滚动跟随（AC-v24-6）', async ({
    page,
  }) => {
    const doc = [
      '# 第一章',
      ...Array.from({ length: 60 }, (_, i) => `内容 ${i}`),
      '# 第二章',
      ...Array.from({ length: 60 }, (_, i) => `更多 ${i}`),
    ].join('\n');
    await ta(page).fill(doc);
    await page.evaluate(() => {
      const el = document.querySelector<HTMLTextAreaElement>('.editor-area')!;
      el.scrollTop = 0;
      el.dispatchEvent(new Event('scroll'));
    });
    await expect(
      page.locator('.outline-item--active', { hasText: '第一章' }),
    ).toHaveCount(1);
    // 滚到第二章区域
    await page.evaluate(() => {
      const el = document.querySelector<HTMLTextAreaElement>('.editor-area')!;
      el.scrollTop = el.scrollHeight; // 到底
      el.dispatchEvent(new Event('scroll'));
    });
    await expect(
      page.locator('.outline-item--active', { hasText: '第二章' }),
    ).toHaveCount(1);
  });
});
