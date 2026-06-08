/**
 * 同步编排（ADR-015）：把 SyncBackend 接到 M9 DocManager。
 *   - 登录 → 注入 push/delete 钩子 + pullAll + 首登并集（mergeRemote）+ 回推本地权威
 *   - 登出 → 清钩子（回匿名）
 *   - focus → 已登录则 pull+merge+push（多设备拉取）
 * M9 不碰 supabase；本编排是 M11↔M9 的唯一桥。
 */
import type { SyncBackend, RemoteDoc } from './api';
import type { DocManagerAPI } from '@/modules/m9-doc-manager/api';
import type { DocRecord } from '@/modules/m9-doc-manager/store';

export function toRemote(d: DocRecord): RemoteDoc {
  return {
    id: d.id,
    title: d.title,
    text: d.text,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    deleted: false,
  };
}

async function pullMergePush(backend: SyncBackend, docs: DocManagerAPI): Promise<void> {
  const remote = await backend.sync.pullAll();
  const toPush = await docs.mergeRemote(remote);
  for (const d of toPush) await backend.sync.push(toRemote(d)); // 本地权威回推（含首登并集的本地-only）
}

/** 接 backend ↔ docs。返回 dispose（取消订阅）。 */
export function wireSync(backend: SyncBackend, docs: DocManagerAPI): () => void {
  const onFocus = () => {
    if (backend.auth.currentUser()) void pullMergePush(backend, docs);
  };

  const unsubAuth = backend.auth.onAuthChange((user) => {
    if (user) {
      docs.setSyncHooks({
        onLocalChange: (d) => void backend.sync.push(toRemote(d)),
        onLocalDelete: (id, updatedAt) => void backend.sync.pushDelete(id, updatedAt),
      });
      void pullMergePush(backend, docs); // 登录即拉取 + 首登并集
      if (typeof window !== 'undefined') window.addEventListener('focus', onFocus);
    } else {
      docs.setSyncHooks(null); // 登出 → 匿名
      if (typeof window !== 'undefined') window.removeEventListener('focus', onFocus);
    }
  });

  return () => {
    unsubAuth();
    if (typeof window !== 'undefined') window.removeEventListener('focus', onFocus);
    docs.setSyncHooks(null);
  };
}
