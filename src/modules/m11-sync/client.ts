/**
 * Supabase client gating（ADR-013 D3）：env 缺失 → 同步禁用（纯本地降级，不报错 /
 * AC-v20-7）。supabase-js 懒加载（仅有 env + 需要时）。
 */
import type { SyncBackend } from './api';

export interface SyncEnv {
  url: string;
  anonKey: string;
}

/** 读 env（缺任一 → null = 禁用同步）。anon key 公开（RLS 才是边界 / ADR-016）。 */
export function syncEnv(): SyncEnv | null {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> })
    .env;
  const url = env?.VITE_SUPABASE_URL;
  const anonKey = env?.VITE_SUPABASE_ANON_KEY;
  return url && anonKey ? { url, anonKey } : null;
}

/** 是否已有持久 Supabase session（启动时探测 → 决定是否懒加载恢复，匿名永不加载）。 */
export function hasPersistedSession(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('sb-') && k.includes('-auth-token')) return true;
    }
  } catch {
    // localStorage 不可用 → 视为无 session
  }
  return false;
}

/** 懒加载真 Supabase backend；env 缺失 → null。 */
export async function loadBackend(): Promise<SyncBackend | null> {
  const env = syncEnv();
  if (!env) return null;
  const { createSupabaseBackend } = await import('./supabase');
  return createSupabaseBackend(env.url, env.anonKey);
}
