import { test, expect } from '@playwright/test';
import { resetStorage } from './_storage';

const tb = { name: 'Markdown editor' };

// v3.2 文档统计面板（共识 AC-v32 / ADR-028）。双引擎。
test.describe('AC-v32 文档统计面板', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetStorage(page);
    await page.reload();
  });

  test('E2E-AC25-1: 点击 status bar 开统计弹层 + 字段显示 + 再点关（AC-v32-1/2/4）', async ({
    page,
  }) => {
    await page.getByRole('textbox', tb).fill('# 标题\n\n正文 hello world');
    await page.waitForTimeout(400); // deferred 统计（timeoutMs 300）
    const statusBtn = page.locator('.editor-status');
    await statusBtn.click();
    const panel = page.getByRole('dialog', { name: '文档统计' });
    await expect(panel).toBeVisible();
    // 标题数 1 / 段落数 2 出现在面板
    await expect(panel).toContainText('标题数');
    await expect(panel.locator('.stats-row', { hasText: '标题数' })).toContainText('1');
    await expect(panel.locator('.stats-row', { hasText: '段落数' })).toContainText('2');
    // 点遮罩关闭
    await page.locator('.stats-backdrop').click({ position: { x: 5, y: 5 } });
    await expect(panel).toHaveCount(0);
  });

  test('E2E-AC25-2: 空文档统计全零（AC-v32-6）', async ({ page }) => {
    // 空文档时 status bar 显 "0 字"，点击开面板
    await page.waitForTimeout(400);
    await page.locator('.editor-status').click();
    const panel = page.getByRole('dialog', { name: '文档统计' });
    await expect(panel.locator('.stats-row', { hasText: '词数' })).toContainText('0');
  });
});
