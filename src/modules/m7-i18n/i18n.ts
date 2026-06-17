import { createSignal, type Accessor } from 'solid-js';
import { zhCNDict } from './zh-CN.dict';
import { enUSDict } from './en-US.dict';
import type { I18nAPI, Lang } from './api';

const DICTS: Record<Lang, Record<string, string>> = {
  'zh-CN': zhCNDict,
  'en-US': enUSDict,
};

const LANG_STORAGE_KEY = 'editor.lang.v1'; // v3.0 持久化（ADR-026 D2）
const LANGS: readonly Lang[] = ['zh-CN', 'en-US'];

/**
 * 初始语言（ADR-026 D3）：
 *   1. localStorage 持久值（合法）→ 用
 *   2. 否则 navigator.language `en*` → en-US / 否则 zh-CN
 *   3. 任何异常 → zh-CN
 */
function detectInitialLang(): Lang {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored && (LANGS as string[]).includes(stored)) return stored as Lang;
  } catch {
    /* localStorage 不可用 → 落检测 */
  }
  try {
    const nav =
      typeof navigator !== 'undefined' ? navigator.language ?? '' : '';
    if (nav.toLowerCase().startsWith('en')) return 'en-US';
  } catch {
    /* ignore */
  }
  return 'zh-CN';
}

const [lang, setLangSignal] = createSignal<Lang>(detectInitialLang());

function lookup(key: string): string {
  const dict = DICTS[lang()];
  return dict[key] ?? key;
}

/**
 * Module-level i18n singleton (api-spec §3.7).
 *
 * Usage from chrome code:
 *   import { t } from '@/modules/m7-i18n/i18n';
 *   const label = t('clear.button');
 *
 * `t()` reads the `lang` signal → Solid JSX `{t('key')}` re-renders on language change.
 */
export const i18n: I18nAPI = {
  lang,
  t: lookup,
  setLang(next) {
    setLangSignal(next);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next); // v3.0 持久化（best-effort）
    } catch {
      /* quota / 不可用 — best effort */
    }
  },
};

/** Shortcut export — same as i18n.t. */
export const t = lookup;

/** Re-export for type-only consumers. */
export type { Lang } from './api';
export type { Accessor };
