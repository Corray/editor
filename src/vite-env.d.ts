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
