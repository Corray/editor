import { describe, it, expect } from 'vitest';
import { i18n, t } from '@/modules/m7-i18n/i18n';
import { zhCNDict } from '@/modules/m7-i18n/zh-CN.dict';

// 各模块预期的 chrome key 白名单 —— 新增 key 时同步本数组。
// 当前覆盖：app / M2 preview / chrome buttons / M1 prefs / M5 tabs / M3 toast / M4 toast.
const EXPECTED_KEYS = [
  'app.title',
  'preview.placeholder',
  'render.fail',
  'mermaid.error',
  'clear.button',
  'clear.confirm',
  'download.button',
  'copy.button',
  'theme.toggle',
  'editor.fontDecrease',
  'editor.fontIncrease',
  'editor.lineNumbers',
  'tab.edit',
  'tab.preview',
  'storage.quota',
  'storage.unavailable',
  'storage.degraded',
  'storage.loadError',
  'clipboard.ok',
  'clipboard.fail',
  'share.button',
  'import.button',
  'share.ok',
  'share.tooLarge',
  'share.linkInvalid',
  'import.readFail',
  'import.notText',
  'pwa.updateAvailable',
  'pwa.refresh',
  'doc.new',
  'doc.button',
  'doc.list',
  'doc.delete',
  'doc.close',
  'doc.delete.confirm',
  'doc.search',
  'doc.rename',
  'auth.login',
  'auth.logout',
  'auth.emailPrompt',
  'auth.checkEmail',
  'auth.failed',
  'auth.privacy',
  'find.placeholder',
  'find.replacePlaceholder',
  'find.prev',
  'find.next',
  'find.replace',
  'find.replaceAll',
  'find.close',
  'find.replaced',
  'wordcount.empty',
  'wordcount.fmt',
  'outline.title',
  'outline.empty',
  'help.button',
  'help.title',
  'help.k.find',
  'help.k.bold',
  'help.k.italic',
  'help.k.link',
  'help.k.indent',
  'help.k.list',
  'help.k.help',
  'help.k.esc',
  'help.k.print',
  'exportHtml.button',
  'history.button',
  'history.title',
  'history.empty',
  'history.snapshotNow',
  'history.restore',
  'history.restore.confirm',
  'history.restored',
  'history.snapped',
  'history.words',
  'history.justNow',
  'history.minAgo',
  'history.hourAgo',
  'history.dayAgo',
  'history.kind.auto',
  'history.kind.manual',
  'history.kind.restore',
  'fmt.toolbar',
  'fmt.bold',
  'fmt.italic',
  'fmt.code',
  'fmt.link',
  'fmt.quote',
  'fmt.ul',
  'fmt.ol',
  'fmt.codeblock',
  'fmt.table',
] as const;

describe('M7 i18n — UT-I18N (basic API)', () => {
  it('UT-I18N-001: hit key returns translated string (≠ key)', () => {
    const v = t('clear.confirm');
    expect(v).not.toBe('clear.confirm');
    expect(typeof v).toBe('string');
    expect(v.length).toBeGreaterThan(0);
  });

  it('UT-I18N-002: miss key falls back to key itself', () => {
    expect(t('nonexistent.key.xyz')).toBe('nonexistent.key.xyz');
  });

  it('UT-I18N-003: dict covers all expected chrome keys (whitelist)', () => {
    const missing: string[] = [];
    for (const k of EXPECTED_KEYS) {
      if (!(k in zhCNDict)) missing.push(k);
    }
    expect(missing).toEqual([]);
  });
});

describe('M7 i18n — singleton API surface', () => {
  it('exposes lang accessor defaulting to zh-CN', () => {
    expect(i18n.lang()).toBe('zh-CN');
  });

  it('i18n.t and exported t() resolve identically', () => {
    expect(i18n.t('app.title')).toBe(t('app.title'));
  });

  it('all dict values are non-empty strings', () => {
    for (const [key, value] of Object.entries(zhCNDict)) {
      expect(typeof value, `key=${key}`).toBe('string');
      expect(value.length, `key=${key}`).toBeGreaterThan(0);
    }
  });

  it('setLang stores new lang (even though only zh-CN supported in MVP)', () => {
    i18n.setLang('zh-CN'); // no-op, but exercises the path
    expect(i18n.lang()).toBe('zh-CN');
  });
});
