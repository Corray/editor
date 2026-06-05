import { test, expect } from '@playwright/test';
import { resetStorage } from './_storage';

const tb = { name: 'Markdown editor' };

// 多文档增强（rename + search / M9 v1.8 / ADR-012）。桌面默认 → sidebar 可见。
test.describe('AC-v18 多文档增强', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetStorage(page);
    await page.reload();
  });

  test('E2E-v18-001: 双击标题内联重命名 → Enter 提交（列表显示新名）', async ({
    page,
  }) => {
    const ta = page.getByRole('textbox', tb);
    await ta.fill('# Auto Name');
    await page.waitForTimeout(700);
    const title = page.locator('.doc-list__title').first();
    await title.dblclick();
    const input = page.locator('.doc-list__rename');
    await expect(input).toBeVisible();
    await input.fill('Renamed Doc');
    await input.press('Enter');
    await expect(page.locator('.doc-list__title').first()).toHaveText('Renamed Doc');
  });

  test('E2E-v18-002: 重命名后编辑内容 → 标题不被覆盖（titleManual 锁 / 解 F-V16-2）', async ({
    page,
  }) => {
    const ta = page.getByRole('textbox', tb);
    await ta.fill('# Original');
    await page.waitForTimeout(700);
    await page.locator('.doc-list__title').first().dblclick();
    await page.locator('.doc-list__rename').fill('Locked Name');
    await page.locator('.doc-list__rename').press('Enter');
    // 继续编辑内容
    await ta.fill('# Completely New Heading');
    await page.waitForTimeout(700);
    // 标题仍是手动名（不被自动派生覆盖）
    await expect(page.locator('.doc-list__title').first()).toHaveText('Locked Name');
  });

  test('E2E-v18-004: Esc 取消重命名 → 保留原标题', async ({ page }) => {
    const ta = page.getByRole('textbox', tb);
    await ta.fill('# Keep Me');
    await page.waitForTimeout(700);
    await page.locator('.doc-list__title').first().dblclick();
    const input = page.locator('.doc-list__rename');
    await input.fill('discard this');
    await input.press('Escape');
    await expect(page.locator('.doc-list__title').first()).toHaveText('Keep Me');
  });

  test('E2E-v18-005: 搜索按标题或内容过滤列表；清空恢复', async ({ page }) => {
    const ta = page.getByRole('textbox', tb);
    await ta.fill('# Apples\n\nfruit');
    await page.waitForTimeout(700);
    await page.locator('.doc-list__new').click();
    await ta.fill('# Bananas\n\ncontains pineapple');
    await page.waitForTimeout(700);
    await expect(page.locator('.doc-list__item')).toHaveCount(2);

    const search = page.locator('.doc-list__search');
    // 标题命中
    await search.fill('apple'); // 命中 Apples（标题）+ Bananas（正文 pineapple）
    await expect(page.locator('.doc-list__item')).toHaveCount(2);
    await search.fill('banana'); // 仅 Bananas 标题
    await expect(page.locator('.doc-list__item')).toHaveCount(1);
    await expect(page.locator('.doc-list__title').first()).toHaveText('Bananas');
    // 内容命中（标题不含 fruit，正文含）
    await search.fill('fruit');
    await expect(page.locator('.doc-list__item')).toHaveCount(1);
    await expect(page.locator('.doc-list__title').first()).toHaveText('Apples');
    // 清空恢复
    await search.fill('');
    await expect(page.locator('.doc-list__item')).toHaveCount(2);
  });
});
