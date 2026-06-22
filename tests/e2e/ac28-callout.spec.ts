import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { resetStorage } from './_storage';

const tb = { name: 'Markdown editor' };

// v3.5 callout 容器块（共识 AC-v35 / ADR-031）。双引擎。resetStorage seed zh-CN（PP-006）。
test.describe('AC-v35 callout 容器块', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetStorage(page);
    await page.reload();
  });

  const pc = (page: Page) => page.locator('.preview-content');

  test('E2E-AC28-1: 4 类 callout 渲染 + 自定义标题 + 内部 markdown（AC-v35-1/2/3）', async ({
    page,
  }) => {
    await page.getByRole('textbox', tb).fill(
      ':::note 注意事项\n**重点**内容\n:::\n\n:::danger\n危险\n:::',
    );
    await expect(pc(page).locator('.callout--note')).toBeVisible();
    await expect(pc(page).locator('.callout--note .callout__title')).toHaveText('注意事项');
    await expect(pc(page).locator('.callout--note strong')).toHaveText('重点');
    // 无标题 danger → 默认类型名（zh）
    await expect(pc(page).locator('.callout--danger')).toBeVisible();
    await expect(pc(page).locator('.callout--danger .callout__title')).toHaveText('危险');
  });

  test('E2E-AC28-2: XSS — callout 标题/内容恶意无 alert（AC-v35-6 双引擎门槛）', async ({
    page,
  }) => {
    let dialog = false;
    page.on('dialog', (d) => {
      dialog = true;
      void d.dismiss();
    });
    await page
      .getByRole('textbox', tb)
      .fill(':::note <script>alert(1)</script>\n<img src=x onerror=alert(1)>\n:::');
    await expect(pc(page).locator('.callout--note')).toBeVisible();
    const counts = await page.evaluate(() => ({
      scripts: document.querySelectorAll('.preview-content script').length,
      onerror: document.querySelectorAll('.preview-content [onerror]').length,
    }));
    expect(counts).toEqual({ scripts: 0, onerror: 0 });
    expect(dialog).toBe(false);
  });
});
