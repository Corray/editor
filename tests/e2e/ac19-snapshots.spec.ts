import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { resetStorage } from './_storage';

const tb = { name: 'Markdown editor' };

// v2.6 版本快照（共识 AC-v26-2/3 / ADR-022）。桌面双引擎。
// 自动快照间隔 5min 不便 e2e → 聚焦手动快照 + 恢复 + 保护快照流。
test.describe('AC-v26 版本快照', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetStorage(page);
    await page.reload();
  });

  const ta = (page: Page) => page.getByRole('textbox', tb);
  // M3 debounce 500ms → 等持久化落到 records（snapshotNow 读 records）
  const settle = (page: Page) => page.waitForTimeout(700);

  test('E2E-AC19-1: 立即快照 → 历史列表出现（AC-v26-2）', async ({ page }) => {
    await ta(page).fill('# 版本一\n\n初始内容');
    await settle(page);
    // ⏱ 打开历史（首存已有 auto 基线）
    await page.locator('.doc-list__history-btn').first().click();
    const dialog = page.getByRole('dialog', { name: '版本历史' });
    await expect(dialog).toBeVisible();
    const before = await dialog.locator('.history-item').count();
    await dialog.getByRole('button', { name: '立即快照' }).click();
    await expect(dialog.locator('.history-item')).toHaveCount(before + 1);
    await expect(dialog.locator('.history-badge--manual').first()).toBeVisible();
  });

  test('E2E-AC19-2: 恢复 → 编辑器变目标版本 + 多一张保护快照（AC-v26-3）', async ({
    page,
  }) => {
    page.on('dialog', (d) => void d.accept()); // restore confirm

    await ta(page).fill('VERSION ONE');
    await settle(page);
    await page.locator('.doc-list__history-btn').first().click();
    const dialog = page.getByRole('dialog', { name: '版本历史' });
    await dialog.getByRole('button', { name: '立即快照' }).click(); // manual "VERSION ONE"
    await expect(dialog.locator('.history-item')).toHaveCount(2); // auto 基线 + manual

    // 改成 V2（间隔内不产新 auto）
    await ta(page).fill('VERSION TWO');
    await settle(page);

    const countBefore = await dialog.locator('.history-item').count();
    // 恢复最新一张快照（text=VERSION ONE）
    await dialog.locator('.history-item__restore').first().click();

    // 编辑器变回 VERSION ONE
    await expect(ta(page)).toHaveValue('VERSION ONE');
    // 多一张 restore 保护快照（内容=恢复前的 VERSION TWO）
    await expect(dialog.locator('.history-item')).toHaveCount(countBefore + 1);
    await expect(dialog.locator('.history-badge--restore').first()).toBeVisible();
  });
});
