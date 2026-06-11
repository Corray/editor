import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { resetStorage } from './_storage';

const tb = { name: 'Markdown editor' };

const DOC = [
  '# 第一章',
  '',
  ...Array.from({ length: 40 }, (_, i) => `第一章内容行 ${i + 1}`),
  '## 一点一节',
  '',
  '```',
  '# 代码里的伪标题',
  '```',
  '',
  ...Array.from({ length: 40 }, (_, i) => `更多内容行 ${i + 1}`),
  '# 第二章',
  '结尾',
].join('\n');

// v2.2 大纲面板（共识 AC-v22-1~7 / ADR-018）。桌面 only（TBD-v22-1a）。
test.describe('AC-v22 大纲/TOC 面板', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetStorage(page);
    await page.reload();
  });

  const ta = (page: Page) => page.getByRole('textbox', tb);
  const items = (page: Page) => page.locator('.outline-item');

  test('E2E-AC15-1: 标题全层级按序展示 + fenced 伪标题排除（AC-v22-1/2）', async ({
    page,
  }) => {
    await ta(page).fill(DOC);
    await expect(items(page)).toHaveText(['第一章', '一点一节', '第二章']);
    // 层级缩进 class
    await expect(items(page).nth(1)).toHaveClass(/outline-item--l2/);
    // 伪标题不出现
    await expect(
      page.locator('.outline-item', { hasText: '伪标题' }),
    ).toHaveCount(0);
  });

  test('E2E-AC15-2: 点击跳转 → 编辑器滚动 + 光标行首 + 预览联动（AC-v22-3）', async ({
    page,
  }) => {
    await ta(page).fill(DOC);
    // fill 置光标于尾 → chromium 初始即滚到底；显式归零再验证跳转
    await page.evaluate(() => {
      const el = document.querySelector<HTMLTextAreaElement>('.editor-area')!;
      el.setSelectionRange(0, 0);
      el.scrollTop = 0;
    });
    await page.locator('.outline-item', { hasText: '第二章' }).click();
    const after = await page.evaluate(() => {
      const el = document.querySelector<HTMLTextAreaElement>('.editor-area')!;
      return {
        scrollTop: el.scrollTop,
        sel: [el.selectionStart, el.selectionEnd],
        focused: document.activeElement === el,
      };
    });
    expect(after.scrollTop).toBeGreaterThan(0); // 滚动到深处
    expect(after.sel[0]).toBe(after.sel[1]); // 光标（非选区）
    expect(after.focused).toBe(true);
    // 光标落在 '# 第二章' 行首
    const offset = DOC.indexOf('# 第二章');
    expect(after.sel[0]).toBe(offset);
    // 预览经 M10 联动跟随（编辑器 scroll 事件驱动）
    await expect
      .poll(() =>
        page.evaluate(
          () => document.querySelector('.preview-pane')!.scrollTop,
        ),
      )
      .toBeGreaterThan(0);
  });

  test('E2E-AC15-3: 编辑即更新（deferred）+ 空态（AC-v22-4/5）', async ({
    page,
  }) => {
    // 空文档 → 空态
    await expect(page.locator('.outline-panel__empty')).toBeVisible();
    await ta(page).click();
    await page.keyboard.type('# 新标题');
    await expect(items(page)).toHaveText(['新标题']);
    // 删除 → 回空态
    await ta(page).fill('');
    await expect(page.locator('.outline-panel__empty')).toBeVisible();
  });

  test('E2E-AC15-4: 切换文档 → 大纲刷新（AC-v22-6）', async ({ page }) => {
    await ta(page).fill('# 文档甲标题');
    await expect(items(page)).toHaveText(['文档甲标题']);
    await page.getByRole('button', { name: '+ 新建' }).click();
    await expect(page.locator('.outline-panel__empty')).toBeVisible(); // 新文档无标题
    await ta(page).fill('## 文档乙标题');
    await expect(items(page)).toHaveText(['文档乙标题']);
    // 切回甲
    await page.locator('.doc-list__item', { hasText: '文档甲标题' }).click();
    await expect(items(page)).toHaveText(['文档甲标题']);
  });
});
