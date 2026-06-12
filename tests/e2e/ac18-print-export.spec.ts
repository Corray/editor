import { test, expect } from '@playwright/test';
import { resetStorage } from './_storage';

const tb = { name: 'Markdown editor' };

// v2.5 打印/导出 HTML（共识 AC-v25-1/2/4 / ADR-021）
test.describe('AC-v25 打印 / 导出 HTML', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetStorage(page);
    await page.reload();
  });

  test('E2E-AC18-1: 导出 .html → 下载触发 + 内容自包含 + 无内部属性（AC-v25-2/4/6）', async ({
    page,
  }) => {
    await page
      .getByRole('textbox', tb)
      .fill('# 导出标题\n\n```js\nconst x = 1;\n```');
    // 等高亮渲染（hljs 懒加载）
    await expect(page.locator('.preview-content .hljs-keyword').first()).toBeVisible();
    const downloadP = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出 HTML' }).click();
    const download = await downloadP;
    expect(download.suggestedFilename()).toMatch(/^editor-\d{8}-\d{6}\.html$/);
    const path = await download.path();
    const fs = await import('node:fs/promises');
    const content = await fs.readFile(path, 'utf-8');
    expect(content).toContain('<!doctype html>');
    expect(content).toContain('导出标题');
    expect(content).toContain('hljs-keyword'); // 预览 DOM 最终态（含已高亮 span）
    expect(content).not.toContain('data-source-line');
    expect(content).not.toContain('<script>');
  });

  test('E2E-AC18-2: print 媒体 → chrome 全隐 + 预览可见 + 强制浅色（AC-v25-1）', async ({
    page,
  }) => {
    await page.getByRole('textbox', tb).fill('# 打印内容');
    // 切深色再 emulate print，验证强制浅色
    await page.getByRole('button', { name: '切换主题' }).click();
    await page.emulateMedia({ media: 'print' });
    const vis = await page.evaluate(() => {
      const d = (sel: string) =>
        getComputedStyle(document.querySelector(sel)!).display;
      return {
        header: d('.app-header'),
        sidebar: d('.doc-sidebar'),
        editor: d('.editor-pane'),
        status: d('.editor-status'),
        preview: d('.preview-pane'),
        bg: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(),
      };
    });
    expect(vis.header).toBe('none');
    expect(vis.sidebar).toBe('none');
    expect(vis.editor).toBe('none');
    expect(vis.status).toBe('none');
    expect(vis.preview).not.toBe('none');
    expect(vis.bg).toBe('#ffffff'); // dark 主题下仍强制浅色
    await expect(page.locator('.preview-content h1')).toHaveText('打印内容');
  });
});
