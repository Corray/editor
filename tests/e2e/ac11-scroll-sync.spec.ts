import { test, expect, devices } from '@playwright/test';
import { resetStorage } from './_storage';

const tb = { name: 'Markdown editor' };

// 长文档（多标题 + filler）→ 编辑/预览都溢出可滚 + 块带 data-source-line
const LONG_DOC = Array.from(
  { length: 40 },
  (_, i) => `## Section ${i}\n\n${'lorem ipsum dolor sit amet. '.repeat(8)}\n`,
).join('\n');

// 滚动同步（M10 / ADR-011）。桌面默认 viewport → 双栏可见可滚。
test.describe('AC-v17 滚动同步', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetStorage(page);
    await page.reload();
    await page.getByRole('textbox', tb).fill(LONG_DOC);
    await page.waitForTimeout(300); // 渲染 + data-source-line 标注
  });

  test('E2E-v17-001: 编辑区下滚 → 预览区跟随（source-line，非 0）', async ({
    page,
  }) => {
    const moved = await page.evaluate(async () => {
      const ed = document.querySelector('textarea')!;
      const pv = document.querySelector('.preview-pane')! as HTMLElement;
      // 复位到顶（fill 会把光标滚到末尾 → sync 已把预览带到底，先归零）
      ed.scrollTop = 0;
      ed.dispatchEvent(new Event('scroll'));
      await new Promise((r) => setTimeout(r, 150));
      const before = pv.scrollTop;
      ed.scrollTop = ed.scrollHeight; // 滚到底
      ed.dispatchEvent(new Event('scroll'));
      await new Promise((r) => setTimeout(r, 150));
      return { before, after: pv.scrollTop };
    });
    expect(moved.before).toBeLessThan(20); // 复位后预览近顶
    expect(moved.after).toBeGreaterThan(50); // 预览被驱动滚下
  });

  test('E2E-v17-003: 预览区下滚 → 编辑区跟随（双向，无死循环）', async ({
    page,
  }) => {
    const res = await page.evaluate(async () => {
      const ed = document.querySelector('textarea')!;
      const pv = document.querySelector('.preview-pane')! as HTMLElement;
      // 先复位两侧
      ed.scrollTop = 0;
      ed.dispatchEvent(new Event('scroll'));
      await new Promise((r) => setTimeout(r, 120));
      // 预览驱动
      pv.scrollTop = pv.scrollHeight;
      pv.dispatchEvent(new Event('scroll'));
      await new Promise((r) => setTimeout(r, 120));
      const edAfter = ed.scrollTop;
      // 再等一拍：确认无来回抖动（编辑 scrollTop 稳定）
      await new Promise((r) => setTimeout(r, 150));
      const edSettled = ed.scrollTop;
      return { edAfter, edSettled };
    });
    expect(res.edAfter).toBeGreaterThan(50); // 编辑被预览驱动
    expect(Math.abs(res.edSettled - res.edAfter)).toBeLessThan(5); // 稳定，无震荡
  });

  test('E2E-v17-xss / AC-v17-5: ADD_ATTR data-source-line 后恶意输入仍无执行', async ({
    page,
  }) => {
    await page.evaluate(() => {
      (window as unknown as { __alert: boolean }).__alert = false;
      window.alert = () => {
        (window as unknown as { __alert: boolean }).__alert = true;
      };
    });
    await page
      .getByRole('textbox', tb)
      .fill('# safe heading\n\n<img src=x onerror="alert(1)">\n\n<script>alert(2)<\/script>');
    await page.waitForTimeout(300);
    const preview = page.getByLabel('Preview');
    expect(await page.evaluate(() => (window as unknown as { __alert: boolean }).__alert)).toBe(false);
    await expect(preview.locator('script')).toHaveCount(0);
    await expect(preview.locator('[onerror]')).toHaveCount(0);
    // data-source-line 确实放行（在安全块上）
    await expect(preview.locator('h1[data-source-line]')).toHaveCount(1);
  });

  test('E2E-v17-004: 移动端单栏 → 不启用滚动同步（无回归/不报错）', async ({
    browser,
  }) => {
    const context = await browser.newContext({ ...devices['iPhone SE'] });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('/');
    await resetStorage(page);
    await page.reload();
    await page.getByRole('textbox', tb).fill(LONG_DOC);
    // 移动端只有单栏（edit tab）；滚编辑不应报错（无 preview-pane 同时挂载）
    await page.evaluate(() => {
      const ed = document.querySelector('textarea');
      if (ed) {
        ed.scrollTop = 200;
        ed.dispatchEvent(new Event('scroll'));
      }
    });
    await page.waitForTimeout(150);
    expect(errors).toEqual([]);
    await context.close();
  });
});
