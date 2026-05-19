import type { Accessor } from 'solid-js';

export type Lang = 'zh-CN';

export interface I18nAPI {
  readonly lang: Accessor<Lang>;
  /**
   * Look up dict by key.
   *
   * - Hit: returns translated string.
   * - Miss: returns the key itself (fallback, per consensus §4.5).
   *
   * Always synchronous — no async dict loading.
   */
  t(key: string): string;

  /**
   * Reserved for v1.1+ language switching. MVP only supports 'zh-CN'.
   */
  setLang(lang: Lang): void;
}

export { i18n, t } from './i18n';
