import { test, expect, devices } from '@playwright/test';
import { resetStorage } from './_storage';

const tb = { name: 'Markdown editor' };

// 多文档（M9 / ADR-010）。桌面默认 viewport → 左侧 sidebar 可见。
test.describe('AC-v16 多文档', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetStorage(page);
    await page.reload();
  });

  test('E2E-v16-001: 新建 → 列表+1 + 切换互不干扰', async ({ page }) => {
    const ta = page.getByRole('textbox', tb);
    await ta.fill('# Doc One');
    await page.waitForTimeout(700); // debounce 存盘
    await expect(page.locator('.doc-list__item')).toHaveCount(1);

    await page.locator('.doc-list__new').click();
    await expect(page.locator('.doc-list__item')).toHaveCount(2);
    await expect(ta).toHaveValue(''); // 新文档空
    await ta.fill('# Doc Two');
    await page.waitForTimeout(700);

    // 列表标题反映各自内容
    await expect(page.locator('.doc-list__item')).toContainText([
      'Doc Two',
      'Doc One',
    ]);
  });

  test('E2E-v16-002: 切换文档加载各自内容（切换前 flush）', async ({ page }) => {
    const ta = page.getByRole('textbox', tb);
    await ta.fill('# First');
    await page.waitForTimeout(700);
    await page.locator('.doc-list__new').click();
    await ta.fill('# Second');
    await page.waitForTimeout(700);

    // 点回第一篇（列表按最近排序：Second 在上，First 在下）
    await page.locator('.doc-list__item', { hasText: 'First' }).click();
    await expect(ta).toHaveValue('# First');
    // 再切到第二篇
    await page.locator('.doc-list__item', { hasText: 'Second' }).click();
    await expect(ta).toHaveValue('# Second');
  });

  test('E2E-v16-003: 删除 active → 切到现存最新', async ({ page }) => {
    page.on('dialog', (d) => d.accept()); // 删除 confirm
    const ta = page.getByRole('textbox', tb);
    await ta.fill('# Keep');
    await page.waitForTimeout(700);
    await page.locator('.doc-list__new').click();
    await ta.fill('# Delete Me');
    await page.waitForTimeout(700);
    await expect(page.locator('.doc-list__item')).toHaveCount(2);

    // 删 active（Delete Me 在顶）
    await page
      .locator('.doc-list__item', { hasText: 'Delete Me' })
      .locator('.doc-list__del')
      .click();
    await expect(page.locator('.doc-list__item')).toHaveCount(1);
    await expect(ta).toHaveValue('# Keep'); // 切到剩下的
  });

  test('E2E-v16-006: 刷新 → 回到上次 active 文档', async ({ page }) => {
    const ta = page.getByRole('textbox', tb);
    await ta.fill('# Alpha');
    await page.waitForTimeout(700);
    await page.locator('.doc-list__new').click();
    await ta.fill('# Beta active');
    await page.waitForTimeout(700);

    await page.reload();
    // active = Beta（最后操作的），刷新后仍是它
    await expect(page.getByRole('textbox', tb)).toHaveValue('# Beta active');
    await expect(page.locator('.doc-list__item')).toHaveCount(2);
  });

  test('E2E-v16-007: 移动端抽屉 — ☰文档 开抽屉 + 新建/切换（选中关抽屉）', async ({
    browser,
  }) => {
    const context = await browser.newContext({ ...devices['iPhone SE'] });
    const page = await context.newPage();
    await page.goto('/');
    await resetStorage(page);
    await page.reload();

    const ta = page.getByRole('textbox', tb);
    await ta.fill('# Mobile First');
    await page.waitForTimeout(700);

    // 桌面 sidebar 在移动端不显示；改用 header ☰文档 按钮开抽屉
    await expect(page.locator('.doc-sidebar')).toHaveCount(0);
    await page.getByRole('button', { name: '文档' }).click();
    await expect(page.locator('.doc-drawer')).toBeVisible();

    // 抽屉内新建 → 创建并关抽屉（onAfterSelect）
    await page.locator('.doc-drawer .doc-list__new').click();
    await expect(page.locator('.doc-drawer')).toHaveCount(0); // 抽屉已关
    await expect(ta).toHaveValue(''); // 新文档空
    await ta.fill('# Mobile Second');
    await page.waitForTimeout(700);

    // 再开抽屉 → 2 篇；切回第一篇 → 抽屉关 + 编辑区加载
    await page.getByRole('button', { name: '文档' }).click();
    await expect(page.locator('.doc-drawer .doc-list__item')).toHaveCount(2);
    await page
      .locator('.doc-drawer .doc-list__item', { hasText: 'Mobile First' })
      .click();
    await expect(page.locator('.doc-drawer')).toHaveCount(0); // 选中关抽屉
    await expect(ta).toHaveValue('# Mobile First');

    await context.close();
  });
});
