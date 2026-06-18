/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** Supabase 项目 URL（v2.0 云同步；缺失 → 同步禁用 / 公开）。 */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase anon key（公开，RLS 才是安全边界 / ADR-016）。 */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// v3.4：markdown-it 扩展插件无官方类型声明（ADR-030）。插件 = (md) => void。
declare module 'markdown-it-emoji' {
  import type MarkdownIt from 'markdown-it';
  export const full: (md: MarkdownIt) => void;
  export const light: (md: MarkdownIt) => void;
  export const bare: (md: MarkdownIt) => void;
}
declare module 'markdown-it-footnote' {
  import type MarkdownIt from 'markdown-it';
  const plugin: (md: MarkdownIt) => void;
  export default plugin;
}
declare module 'markdown-it-sub' {
  import type MarkdownIt from 'markdown-it';
  const plugin: (md: MarkdownIt) => void;
  export default plugin;
}
declare module 'markdown-it-sup' {
  import type MarkdownIt from 'markdown-it';
  const plugin: (md: MarkdownIt) => void;
  export default plugin;
}
