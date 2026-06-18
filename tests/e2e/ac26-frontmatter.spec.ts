import { test, expect } from '@playwright/test';
import { resetStorage } from './_storage';

const tb = { name: 'Markdown editor' };

// v3.3 frontmatter (YAML) 支持（共识 AC-v33 / ADR-029）。双引擎。
test.describe('AC-v33 frontmatter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetStorage(page);
    await page.reload();
  });

  test('E2E-AC26-1: doc 头 frontmatter → metadata 框（无 hr）+ 正文正常（AC-v33-1/6）', async ({
    page,
  }) => {
    await page.getByRole('textbox', tb).fill('---\ntitle: My Note\ntags: work\n---\n\n# Body heading');
    const fm = page.locator('.preview-content .frontmatter');
    await expect(fm).toBeVisible();
    await expect(fm).toContainText('title');
    await expect(fm).toContainText('My Note');
    // 首行 --- 不渲染为 hr
    await expect(page.locator('.preview-content hr')).toHaveCount(0);
    // 正文标题正常
    await expect(page.locator('.preview-content h1')).toHaveText('Body heading');
  });

  test('E2E-AC26-2: 文中 `---` 仍渲染 hr（AC-v33-2）', async ({ page }) => {
    await page.getByRole('textbox', tb).fill('text\n\n---\n\nmore');
    await expect(page.locator('.preview-content hr')).toHaveCount(1);
    await expect(page.locator('.preview-content .frontmatter')).toHaveCount(0);
  });

  test('E2E-AC26-3: XSS — frontmatter 值恶意内容无 alert（AC-v33-5 双引擎门槛）', async ({
    page,
  }) => {
    let dialog = false;
    page.on('dialog', (d) => {
      dialog = true;
      void d.dismiss();
    });
    await page
      .getByRole('textbox', tb)
      .fill('---\ntitle: <script>alert(1)</script>\nx: <img src=y onerror=alert(1)>\n---\n');
    await expect(page.locator('.preview-content .frontmatter')).toBeVisible();
    const counts = await page.evaluate(() => ({
      scripts: document.querySelectorAll('.preview-content script').length,
      onerror: document.querySelectorAll('.preview-content [onerror]').length,
    }));
    expect(counts).toEqual({ scripts: 0, onerror: 0 });
    expect(dialog).toBe(false);
  });
});
