import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRoot } from 'solid-js';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import {
  createMockCloud,
  createMockBackend,
} from '@/modules/m11-sync/mock';
import { wireSync, toRemote } from '@/modules/m11-sync/orchestrator';
import { syncEnv } from '@/modules/m11-sync/client';
import type { RemoteDoc } from '@/modules/m11-sync/api';

async function freshDocManager() {
  vi.resetModules();
  const store = await import('@/modules/m9-doc-manager/store');
  const manager = await import('@/modules/m9-doc-manager/manager');
  return { store, createDocManager: manager.createDocManager };
}

let clock = 1000;
const now = () => clock++;

beforeEach(() => {
  (globalThis as unknown as { indexedDB: IDBFactory }).indexedDB = new IDBFactory();
  localStorage.clear();
  clock = 1000;
});

async function setup() {
  const { store, createDocManager } = await freshDocManager();
  const initial = await store.loadInitialDocs(now());
  let editorText = initial.docs[0]!.text;
  const api = createDocManager({
    initial,
    now,
    setEditorText: (t) => {
      editorText = t;
    },
    getEditorText: () => editorText,
  });
  return { api };
}

const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
};

describe('M11 mergeRemote — LWW / 首登并集 / 软删（ADR-015）', () => {
  it('UT-SYNC-merge-union: 仅本地 + 仅云 → 并集，不丢（AC-v20-5）', async () => {
    await createRoot(async (dispose) => {
      const { api } = await setup();
      await api.create('# Local Only'); // 本地有
      const remote: RemoteDoc[] = [
        { id: 'D_cloud1', title: 'Cloud Only', text: '# Cloud', createdAt: 1, updatedAt: 2, deleted: false },
      ];
      const toPush = await api.mergeRemote(remote);
      const titles = api.docs().map((d) => d.title).sort();
      expect(titles).toContain('Local Only'); // 本地保留
      expect(titles).toContain('Cloud Only'); // 云端采纳
      expect(toPush.some((d) => d.title === 'Local Only')).toBe(true); // 本地-only 回推
      dispose();
    });
  });

  it('UT-SYNC-lww: 同 id 云更新 → 采纳云；本地更新 → 回推', async () => {
    await createRoot(async (dispose) => {
      const { api } = await setup();
      const id = await api.create('# v1'); // 本地 updatedAt ~ small
      const localUpdatedAt = api.docs().find((d) => d.id === id)!.updatedAt;
      // 云更新（updatedAt 更大）
      const cloudNewer: RemoteDoc[] = [
        { id, title: 'Cloud Wins', text: '# cloud newer', createdAt: 1, updatedAt: localUpdatedAt + 100, deleted: false },
      ];
      await api.mergeRemote(cloudNewer);
      expect(api.docs().find((d) => d.id === id)!.title).toBe('Cloud Wins'); // 云胜
      // 本地更新（updatedAt 更大）→ 回推
      const cloudOlder: RemoteDoc[] = [
        { id, title: 'stale', text: 'x', createdAt: 1, updatedAt: 1, deleted: false },
      ];
      const toPush = await api.mergeRemote(cloudOlder);
      expect(toPush.some((d) => d.id === id)).toBe(true); // 本地胜 → 回推
      expect(api.docs().find((d) => d.id === id)!.title).toBe('Cloud Wins'); // 本地仍是较新
      dispose();
    });
  });

  it('UT-SYNC-delete-tombstone: 云软删更新 → 删本地（防复活）', async () => {
    await createRoot(async (dispose) => {
      const { api } = await setup();
      const id = await api.create('# doomed');
      const u = api.docs().find((d) => d.id === id)!.updatedAt;
      await api.mergeRemote([{ id, title: '', text: '', createdAt: 1, updatedAt: u + 50, deleted: true }]);
      expect(api.docs().some((d) => d.id === id)).toBe(false); // 已删
      // 再 merge 同 tombstone → 不复活、不报错
      await api.mergeRemote([{ id, title: '', text: '', createdAt: 1, updatedAt: u + 50, deleted: true }]);
      expect(api.docs().some((d) => d.id === id)).toBe(false);
      dispose();
    });
  });
});

describe('M11 orchestrator + mock backend（wireSync）', () => {
  it('UT-SYNC-push: 登录后本地新建 → push 到云', async () => {
    await createRoot(async (dispose) => {
      const { api } = await setup();
      const cloud = createMockCloud();
      const backend = createMockBackend(cloud);
      wireSync(backend, api);
      await backend.auth.signIn('a@x.com'); // mock 即时登录 → 注入钩子 + pull
      await flush();
      await api.create('# pushed doc'); // onLocalChange → push
      await flush();
      const userCloud = cloud.get('user_a@x.com');
      expect([...(userCloud?.values() ?? [])].some((d) => d.title === 'pushed doc')).toBe(true);
      dispose();
    });
  });

  it('UT-RLS-deny: 两用户共享云 → B 看不到 A 的 doc（mock 模拟 RLS 分区）', async () => {
    await createRoot(async (dispose) => {
      const cloud = createMockCloud();
      const a = createMockBackend(cloud);
      const b = createMockBackend(cloud);
      await a.auth.signIn('a@x.com');
      await a.sync.push({ id: 'D_a1', title: 'A secret', text: 's', createdAt: 1, updatedAt: 2, deleted: false });
      await b.auth.signIn('b@x.com');
      const bSees = await b.sync.pullAll();
      expect(bSees.some((d) => d.title === 'A secret')).toBe(false); // B 不可见 A
      expect(bSees.length).toBe(0);
      dispose();
    });
  });
});

describe('M11 client — env 缺失降级（AC-v20-7）', () => {
  it('UT-CLIENT-no-env: 无 VITE_SUPABASE_* → syncEnv null（同步禁用）', () => {
    // 测试环境无 env → null（纯本地降级，不报错）
    expect(syncEnv()).toBeNull();
  });
  it('toRemote: DocRecord → RemoteDoc(deleted:false)', () => {
    const r = toRemote({ id: 'D_x', title: 't', text: 'b', createdAt: 1, updatedAt: 2 });
    expect(r).toEqual({ id: 'D_x', title: 't', text: 'b', createdAt: 1, updatedAt: 2, deleted: false });
  });
});
