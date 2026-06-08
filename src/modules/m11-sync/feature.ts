/**
 * v2.0 同步特性（main-facing）：reactive 登录态 + signIn/signOut + 懒加载 backend + wireSync。
 * 须在 Solid root 内创建。env 缺失 → enabled=false（无登录 UI / 纯本地，AC-v20-1/7）。
 */
import { createSignal, type Accessor } from 'solid-js';
import type { DocManagerAPI } from '@/modules/m9-doc-manager/api';
import type { AuthUser, SyncBackend } from './api';
import { syncEnv, hasPersistedSession, loadBackend } from './client';
import { wireSync } from './orchestrator';

export interface SyncFeature {
  /** 是否配了 env（决定是否显示登录 UI）。 */
  readonly enabled: boolean;
  readonly user: Accessor<AuthUser | null>;
  signIn(email: string): Promise<{ ok: boolean; error?: string }>;
  signOut(): Promise<void>;
}

export function createSyncFeature(docManager: DocManagerAPI): SyncFeature {
  const enabled = syncEnv() !== null;
  const [user, setUser] = createSignal<AuthUser | null>(null);
  let backend: SyncBackend | null = null;
  let loading: Promise<SyncBackend | null> | null = null;

  function ensureBackend(): Promise<SyncBackend | null> {
    if (backend) return Promise.resolve(backend);
    if (!loading) {
      loading = loadBackend().then((b) => {
        backend = b;
        if (b) {
          wireSync(b, docManager); // 接 backend ↔ M9（登录 pull+并集 / 钩子 push）
          b.auth.onAuthChange(setUser); // 登录态 → UI
        }
        return b;
      });
    }
    return loading;
  }

  // 启动：有 env + 有持久 session → 懒加载恢复（匿名/未登录永不加载 supabase-js）
  if (enabled && hasPersistedSession()) void ensureBackend();

  return {
    enabled,
    user,
    signIn: async (email) => {
      const b = await ensureBackend();
      if (!b) return { ok: false, error: 'sync disabled' };
      return b.auth.signIn(email);
    },
    signOut: async () => {
      (await ensureBackend())?.auth.signOut();
    },
  };
}
