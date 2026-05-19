import { createSignal, type Accessor } from 'solid-js';
import { zhCNDict } from './zh-CN.dict';
import type { I18nAPI, Lang } from './api';

const DICTS: Record<Lang, Record<string, string>> = {
  'zh-CN': zhCNDict,
};

const [lang, setLangSignal] = createSignal<Lang>('zh-CN');

function lookup(key: string): string {
  const dict = DICTS[lang()];
  return dict[key] ?? key;
}

/**
 * Module-level i18n singleton (api-spec §3.7).
 *
 * Usage from chrome code:
 *   import { t } from '@/modules/m7-i18n/api';
 *   const label = t('clear.button');
 */
export const i18n: I18nAPI = {
  lang,
  t: lookup,
  setLang(next) {
    setLangSignal(next);
  },
};

/** Shortcut export — same as i18n.t. */
export const t = lookup;

/** Re-export for type-only consumers. */
export type { Lang } from './api';
export type { Accessor };
