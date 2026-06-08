/**
 * Mock 后端（TBD-v20-6a）：内存 fake，供 unit/e2e，不连真云。
 *
 * **模拟 RLS**：cloud 按 user_id 分区；sync 操作只触当前用户分区 → 跨用户天然隔离
 * （验调用方契约正确；真隔离仍靠 Supabase RLS / ADR-016，需真项目人工审）。
 * **测试简化**：signIn 即时建 session（模拟"已点 magic link"），真流程是发链接后异步。
 */
import type {
  AuthGateway,
  AuthUser,
  RemoteDoc,
  SyncBackend,
  SyncGateway,
} from './api';

/** 共享内存云（多 backend 共用以测跨用户隔离）。key=user_id → (key=docId → RemoteDoc)。 */
export type MockCloud = Map<string, Map<string, RemoteDoc>>;
export function createMockCloud(): MockCloud {
  return new Map();
}

function emailToId(email: string): string {
  return 'user_' + email.toLowerCase().trim();
}

export interface MockBackendOptions {
  initialUser?: AuthUser | null;
}

export function createMockBackend(
  cloud: MockCloud,
  opts: MockBackendOptions = {},
): SyncBackend {
  let user: AuthUser | null = opts.initialUser ?? null;
  const cbs = new Set<(u: AuthUser | null) => void>();
  const fire = () => cbs.forEach((cb) => cb(user));

  function partition(): Map<string, RemoteDoc> {
    if (!user) throw new Error('not authenticated'); // 模拟 RLS：未登录拒绝
    let p = cloud.get(user.id);
    if (!p) {
      p = new Map();
      cloud.set(user.id, p);
    }
    return p;
  }

  const auth: AuthGateway = {
    currentUser: () => user,
    signIn: async (email) => {
      // 测试简化：即时登录（真流程发 magic link 后异步建 session）
      user = { id: emailToId(email), email };
      fire();
      return { ok: true };
    },
    signOut: async () => {
      user = null;
      fire();
    },
    onAuthChange: (cb) => {
      cbs.add(cb);
      return () => cbs.delete(cb);
    },
  };

  const sync: SyncGateway = {
    push: async (doc) => {
      partition().set(doc.id, { ...doc });
    },
    pullAll: async () => [...partition().values()].map((d) => ({ ...d })),
    pushDelete: async (id, updatedAt) => {
      const p = partition();
      const existing = p.get(id);
      p.set(id, {
        id,
        title: existing?.title ?? '',
        text: existing?.text ?? '',
        createdAt: existing?.createdAt ?? updatedAt,
        updatedAt,
        deleted: true,
      });
    },
  };

  return { auth, sync };
}
