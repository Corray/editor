import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { resetStorage } from './_storage';

const tb = { name: 'Markdown editor' };

// v2.1 编辑增强（共识 AC-v21-1~8 / ADR-017）。
// AC-v21-7（程序化编辑 Cmd+Z 可撤销）只能在真浏览器验（jsdom 无 undo 栈）——本 spec 是该门槛唯一载体。
test.describe('AC-v21 编辑增强（查找/替换 + 快捷键 + 列表延续 + 字数）', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetStorage(page);
    await page.reload();
  });

  const ta = (page: Page) => page.getByRole('textbox', tb);
  const selection = (page: Page) =>
    page.evaluate(() => {
      const el = document.querySelector<HTMLTextAreaElement>('.editor-area');
      return el ? [el.selectionStart, el.selectionEnd] : null;
    });

  test('E2E-AC14-1: Cmd+F 唤起查找栏 → 计数/跳转/Esc 关闭回焦（AC-v21-1）', async ({
    page,
  }) => {
    await ta(page).fill('foo bar\nfoo baz\nFOO qux');
    await ta(page).click();
    await page.keyboard.press('ControlOrMeta+f');
    const findInput = page.getByPlaceholder('查找…');
    await expect(findInput).toBeVisible();
    await expect(findInput).toBeFocused();

    await findInput.fill('foo');
    await expect(page.locator('.find-count')).toHaveText('1/3'); // 大小写不敏感含 FOO
    await page.keyboard.press('Enter');
    await expect(page.locator('.find-count')).toHaveText('2/3');
    expect(await selection(page)).toEqual([8, 11]); // 第 2 个 foo
    await page.keyboard.press('Shift+Enter');
    await expect(page.locator('.find-count')).toHaveText('1/3');

    await page.keyboard.press('Escape');
    await expect(findInput).toHaveCount(0);
    await expect(ta(page)).toBeFocused(); // 回焦编辑器
  });

  test('E2E-AC14-2: 替换当前 / 全部替换 + toast 计数（AC-v21-2）', async ({
    page,
  }) => {
    await ta(page).fill('cat cat cat');
    await ta(page).click();
    await page.keyboard.press('ControlOrMeta+f');
    await page.getByPlaceholder('查找…').fill('cat');
    await page.getByPlaceholder('替换为…').fill('dog');

    await page.getByRole('button', { name: '替换', exact: true }).click();
    await expect(ta(page)).toHaveValue('dog cat cat');

    await page.getByRole('button', { name: '全部替换' }).click();
    await expect(ta(page)).toHaveValue('dog dog dog');
    await expect(page.locator('.toast')).toContainText('已替换 2 处');
  });

  test('E2E-AC14-3: Cmd+B 包裹/解包 toggle（AC-v21-3）', async ({ page }) => {
    await ta(page).click();
    await page.keyboard.type('hello world');
    await page.evaluate(() => {
      document
        .querySelector<HTMLTextAreaElement>('.editor-area')!
        .setSelectionRange(0, 5);
    });
    await page.keyboard.press('ControlOrMeta+b');
    await expect(ta(page)).toHaveValue('**hello** world');

    // toggle：再按一次解包（选区保持内文 hello）
    await page.keyboard.press('ControlOrMeta+b');
    await expect(ta(page)).toHaveValue('hello world');
  });

  test('E2E-AC14-3b: 程序化编辑 Cmd+Z 可撤销（AC-v21-7 undo 门槛）', async ({
    page,
    browserName,
  }) => {
    // Playwright WebKit 的 textarea undo 把所有编辑（含纯键入）合并为单步回基线 ——
    // 探针实证（2026-06-11）：纯 keyboard.type 两段 + 光标移动后单次 Cmd+Z 也回空串，
    // 与 execCommand 实现无关 = 测试环境引擎特性，非真 Safari 行为。undo 粒度仅 chromium
    // 实证；webkit 侧格式化行为由 AC14-3/4 双引擎覆盖。详见 F-V21-1。
    test.skip(browserName === 'webkit', 'Playwright WebKit undo 全合并（F-V21-1）');
    await ta(page).click();
    await page.keyboard.type('hello world'); // fill() 不进 undo 栈，必须键入铺底
    await page.evaluate(() => {
      document
        .querySelector<HTMLTextAreaElement>('.editor-area')!
        .setSelectionRange(0, 5);
    });
    await page.keyboard.press('ControlOrMeta+b');
    await expect(ta(page)).toHaveValue('**hello** world');
    await page.keyboard.press('ControlOrMeta+b');
    await expect(ta(page)).toHaveValue('hello world');

    // AC-v21-7：程序化编辑进原生 undo 栈 —— 两步都可撤销
    await page.keyboard.press('ControlOrMeta+z');
    await expect(ta(page)).toHaveValue('**hello** world');
    await page.keyboard.press('ControlOrMeta+z');
    await expect(ta(page)).toHaveValue('hello world');
  });

  test('E2E-AC14-4: Cmd+I 斜体 / Cmd+K 链接 url 占位选中（AC-v21-3/4）', async ({
    page,
  }) => {
    await ta(page).click();
    await page.keyboard.type('click here');
    await page.evaluate(() => {
      document
        .querySelector<HTMLTextAreaElement>('.editor-area')!
        .setSelectionRange(0, 5);
    });
    await page.keyboard.press('ControlOrMeta+i');
    await expect(ta(page)).toHaveValue('*click* here');

    await page.evaluate(() => {
      document
        .querySelector<HTMLTextAreaElement>('.editor-area')!
        .setSelectionRange(0, 7); // 选中 *click*
    });
    await page.keyboard.press('ControlOrMeta+k');
    await expect(ta(page)).toHaveValue('[*click*](url) here');
    expect(await selection(page)).toEqual([10, 13]); // url 占位选中
    await page.keyboard.type('https://x.dev'); // 直接输入替换占位
    await expect(ta(page)).toHaveValue('[*click*](https://x.dev) here');
  });

  test('E2E-AC14-5: 列表自动延续 — 续行/数字递增/空项退出（AC-v21-5）', async ({
    page,
  }) => {
    await ta(page).click();
    await page.keyboard.type('- one');
    await page.keyboard.press('Enter');
    await page.keyboard.type('two');
    await expect(ta(page)).toHaveValue('- one\n- two');

    // 空项回车 → 删前缀退出
    await page.keyboard.press('Enter'); // 产出裸 '- '
    await page.keyboard.press('Enter'); // 空项 → 退出
    await expect(ta(page)).toHaveValue('- one\n- two\n');

    await page.keyboard.type('1. first');
    await page.keyboard.press('Enter');
    await page.keyboard.type('second');
    await expect(ta(page)).toHaveValue('- one\n- two\n1. first\n2. second');
  });

  test('E2E-AC14-6: 字数统计实时更新（AC-v21-6）', async ({ page }) => {
    await expect(page.locator('.editor-status')).toHaveText('0 字');
    await ta(page).fill('你好世界 hello world');
    await expect(page.locator('.editor-status')).toHaveText(
      '6 字 · 约 <1 分钟',
    );
    await ta(page).fill('');
    await expect(page.locator('.editor-status')).toHaveText('0 字');
  });

  test('E2E-AC14-7: 行号 gutter 与查找/列表共存零回归（AC-v21-8）', async ({
    page,
  }) => {
    // 行号默认开 → gutter 行数随列表延续增长
    await expect(page.locator('.editor-gutter')).toBeVisible();
    await ta(page).click();
    await page.keyboard.type('- a');
    await page.keyboard.press('Enter');
    await page.keyboard.type('b');
    await expect(page.locator('.editor-gutter__line')).toHaveCount(2);
    // 查找栏打开不破 gutter
    await page.keyboard.press('ControlOrMeta+f');
    await expect(page.getByPlaceholder('查找…')).toBeVisible();
    await expect(page.locator('.editor-gutter')).toBeVisible();
  });
});
