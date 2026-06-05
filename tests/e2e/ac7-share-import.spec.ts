import { test, expect } from '@playwright/test';
import LZString from 'lz-string'; // default import — Playwright Node ESM lacks named-export interop for this CJS module
import { resetStorage } from './_storage';

/** Build a v1.2 share hash for a given source text. */
function shareHash(text: string): string {
  return `#doc=1.${LZString.compressToEncodedURIComponent(text)}`;
}

const textbox = { name: 'Markdown editor' };

test.describe('AC-v12 分享 / 导入', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetStorage(page);
    await page.reload();
  });

  test('E2E-v12-001: 分享生成 #doc= URL 并复制到剪贴板', async ({
    page,
    context,
  }) => {
    // 跨引擎 stub clipboard（避免真剪贴板权限），捕获复制内容
    await context.addInitScript(() => {
      (window as unknown as { __copied: string | null }).__copied = null;
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: async (t: string) => {
            (window as unknown as { __copied: string | null }).__copied = t;
          },
        },
      });
    });
    await page.reload();

    await page.getByRole('textbox', textbox).fill('# shared doc');
    await page.getByRole('button', { name: '分享' }).click();

    const copied = await page.evaluate(
      () => (window as unknown as { __copied: string | null }).__copied,
    );
    expect(copied).toContain('#doc=1.');
    // privacy toast shown
    await expect(page.locator('.toast')).toContainText('分享链接已复制');
  });

  test('E2E-v12-002: 打开 #doc= 链接（本机空）→ 内容加载 + hash 清除', async ({
    page,
  }) => {
    await page.goto(`/editor/${shareHash('# from link\n\nbody')}`);
    await page.reload(); // force full load so app startup reads the hash
    await expect(page.getByRole('textbox', textbox)).toHaveValue(
      '# from link\n\nbody',
    );
    // hash cleared (replaceState) so reload won't re-trigger
    expect(await page.evaluate(() => location.hash)).toBe('');
  });

  test('E2E-v16-share-new: 打开分享链接（本机非空）→ 新建文档，不覆盖本机（v1.6 / ADR-010 D6）', async ({
    page,
  }) => {
    // seed a local doc first
    await page.getByRole('textbox', textbox).fill('# local existing');
    await page.waitForTimeout(800); // past debounce → IDB

    await page.goto(`/editor/${shareHash('# shared as new')}`);
    await page.reload(); // force full load so app startup reads the hash
    // 分享内容进当前（新建并切为 active）；本机文档仍在列表（不被覆盖）
    await expect(page.getByRole('textbox', textbox)).toHaveValue(
      '# shared as new',
    );
    await expect(page.locator('.doc-list__item')).toHaveCount(2);
  });

  test('E2E-v16-import-new: 导入 .md → 新建文档（不覆盖当前）', async ({
    page,
  }) => {
    await page.getByRole('textbox', textbox).fill('# local before import');
    await page.waitForTimeout(800);

    const fileInput = page.locator('input[type=file]');
    await fileInput.setInputFiles({
      name: 'note.md',
      mimeType: 'text/markdown',
      buffer: Buffer.from('# imported\n\nfrom file'),
    });
    // 导入内容进当前（新建并切为 active）；原文档保留 → 共 2 篇
    await expect(page.getByRole('textbox', textbox)).toHaveValue(
      '# imported\n\nfrom file',
    );
    await expect(page.locator('.doc-list__item')).toHaveCount(2);
  });
});
