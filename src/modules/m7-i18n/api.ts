import type { Accessor } from 'solid-js';

export type Lang = 'zh-CN' | 'en-US'; // v3.0：+en-US（ADR-026）

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

  /** Set language (v3.0：persisted to localStorage; t() reactively re-renders). */
  setLang(lang: Lang): void;
}

export { i18n, t } from './i18n';
