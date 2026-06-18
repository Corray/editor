import { describe, it, expect, afterEach } from 'vitest';
import { i18n, t } from '@/modules/m7-i18n/i18n';
import { zhCNDict } from '@/modules/m7-i18n/zh-CN.dict';
import { enUSDict } from '@/modules/m7-i18n/en-US.dict';

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
  'settings.button',
  'settings.title',
  'settings.autoSnapshot',
  'settings.interval',
  'settings.interval.1min',
  'settings.interval.5min',
  'settings.interval.10min',
  'settings.maxSnapshots',
  'settings.language',
  'settings.language.zh',
  'settings.language.en',
  'stats.title',
  'stats.charsWithSpaces',
  'stats.charsNoSpaces',
  'stats.words',
  'stats.cjk',
  'stats.headings',
  'stats.paragraphs',
  'stats.readingTime',
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

// 测试计划 v3.0 §家族 完整性 + 切换 + 持久化（AC-v30-1/2/3）
describe('M7 i18n — v3.0 en-US (CT-I18N)', () => {
  afterEach(() => {
    i18n.setLang('zh-CN'); // 复位（模块级 signal 跨测共享）
    try {
      localStorage.removeItem('editor.lang.v1');
    } catch {
      /* ignore */
    }
  });

  it('CT-I18N-1: en dict key 集 == zh dict（无缺漏/无多余）', () => {
    const zhKeys = Object.keys(zhCNDict).sort();
    const enKeys = Object.keys(enUSDict).sort();
    expect(enKeys).toEqual(zhKeys);
  });

  it('CT-I18N-2: en dict 每值非空（无裸 key 露出）', () => {
    for (const [k, v] of Object.entries(enUSDict)) {
      expect(typeof v, `key=${k}`).toBe('string');
      expect(v.length, `key=${k}`).toBeGreaterThan(0);
    }
  });

  it('CT-I18N-3: 含占位符 key 两侧都保留 {n}/{m}', () => {
    expect(enUSDict['wordcount.fmt']).toContain('{n}');
    expect(enUSDict['wordcount.fmt']).toContain('{m}');
    expect(enUSDict['find.replaced']).toContain('{n}');
    expect(enUSDict['history.minAgo']).toContain('{n}');
  });

  it('CT-I18N-4: setLang 切换 → t() 返对应语言 + EXPECTED_KEYS 双 dict 均覆盖', () => {
    i18n.setLang('en-US');
    expect(t('clear.button')).toBe('Clear');
    i18n.setLang('zh-CN');
    expect(t('clear.button')).toBe('清空');
    // 双 dict 都覆盖白名单
    for (const k of EXPECTED_KEYS) {
      expect(k in zhCNDict, `zh missing ${k}`).toBe(true);
      expect(k in enUSDict, `en missing ${k}`).toBe(true);
    }
  });

  it('CT-I18N-5: setLang 持久化到 localStorage', () => {
    i18n.setLang('en-US');
    expect(localStorage.getItem('editor.lang.v1')).toBe('en-US');
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
