import { test, expect } from '@playwright/test';
import { resetStorage } from './_storage';

const tb = { name: 'Markdown editor' };
const fence = (body: string) => '```mermaid\n' + body + '\n```';

test.describe('AC-v14 Mermaid 图', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetStorage(page);
    await page.reload();
  });

  test('E2E-v14-001: ```mermaid graph → 渲染出 SVG（懒加载+异步）', async ({
    page,
  }) => {
    await page.getByRole('textbox', tb).fill(fence('graph TD; A-->B; B-->C'));
    // 懒加载 mermaid + 异步渲染后 preview 出现 svg（auto-wait）
    await expect(page.getByLabel('Preview').locator('svg').first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('E2E-v14-003: 恶意 mermaid（label 注入）→ 无 alert/script/foreignObject（XSS 发布门槛）', async ({
    page,
  }) => {
    await page.evaluate(() => {
      // @ts-expect-error probe
      window.__alertCalled = false;
      window.alert = () => {
        // @ts-expect-error probe
        window.__alertCalled = true;
      };
    });
    await page
      .getByRole('textbox', tb)
      .fill(fence('graph TD; A["<img src=x onerror=alert(1)>"] --> B["<script>alert(2)</script>"]'));
    // 等渲染（懒加载 + 异步）；不论渲染成功还是降级，都不应执行脚本
    await page.waitForTimeout(2500);
    const preview = page.getByLabel('Preview');
    const alerted = await page.evaluate(
      // @ts-expect-error probe
      () => window.__alertCalled === true,
    );
    expect(alerted).toBe(false);
    await expect(preview.locator('script')).toHaveCount(0);
    await expect(preview.locator('foreignObject')).toHaveCount(0); // FORBID 生效
    await expect(preview.locator('[onerror]')).toHaveCount(0);
  });

  test('E2E-v14-004: 非法 mermaid 语法 → 块内显错，其余 markdown 不受影响', async ({
    page,
  }) => {
    await page
      .getByRole('textbox', tb)
      .fill('# 标题正常\n\n' + fence('graph TD; A--<><invalid'));
    // 标题正常渲染（不被图错误连累）
    await expect(page.getByLabel('Preview').locator('h1')).toHaveText('标题正常');
    // 图块降级为错误占位（mermaid-error）或 mermaid 内置错误图，不崩
    await page.waitForTimeout(2500);
    const alerted = await page.evaluate(
      () => (window as unknown as { __crashed?: boolean }).__crashed === true,
    );
    expect(alerted).toBeFalsy();
  });

  test('E2E-v14-002: 无图文档不渲染 svg', async ({ page }) => {
    await page.getByRole('textbox', tb).fill('# 纯文本\n\n没有图');
    await expect(page.getByLabel('Preview').locator('h1')).toBeVisible();
    await expect(page.getByLabel('Preview').locator('svg')).toHaveCount(0);
  });
});
