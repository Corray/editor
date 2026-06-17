import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { openDB } from 'idb';

// 版本快照（v2.6 / ADR-022）。fake-indexeddb；store.ts 模块级 memoize dbPromise → 每测 freshM9。
async function freshM9() {
  vi.resetModules();
  const store = await import('@/modules/m9-doc-manager/store');
  const manager = await import('@/modules/m9-doc-manager/manager');
  return { store, createDocManager: manager.createDocManager };
}

let clk = 1_000_000;
const now = () => clk;

beforeEach(() => {
  (globalThis as unknown as { indexedDB: IDBFactory }).indexedDB = new IDBFactory();
  localStorage.clear();
  clk = 1_000_000;
});

/** maybeAutoSnapshot 是 fire-and-forget；轮询等到期望数量。 */
async function waitSnaps(
  m: { listSnapshots: (id?: string) => Promise<unknown[]> },
  expected: number,
  docId?: string,
): Promise<unknown[]> {
  for (let i = 0; i < 60; i++) {
    const s = await m.listSnapshots(docId);
    if (s.length >= expected) return s;
    await new Promise((r) => setTimeout(r, 5));
  }
  return m.listSnapshots(docId);
}

function makeManager(
  store: Awaited<ReturnType<typeof freshM9>>['store'],
  createDocManager: Awaited<ReturnType<typeof freshM9>>['createDocManager'],
) {
  let editorText = '';
  return {
    init: async (settings?: {
      autoSnapshotEnabled: () => boolean;
      autoSnapshotIntervalMs: () => number;
      maxSnapshotsPerDoc: () => number;
    }) => {
      const initial = await store.loadInitialDocs(now());
      const m = createDocManager({
        initial,
        now,
        setEditorText: (txt) => (editorText = txt),
        getEditorText: () => editorText,
        settings,
      });
      return { m, getEditorText: () => editorText };
    },
  };
}

describe('M9 snapshots store — CT-SNAP-store (AC-v26-4/5)', () => {
  it('CT-SNAP-S1: put/list（createdAt desc）+ latestSnapshotAt', async () => {
    const { store } = await freshM9();
    await store.loadInitialDocs(now()); // 触发 DB v3 open
    await store.putSnapshot({ id: 'SN_1', docId: 'D_a', title: 't', text: 'a', createdAt: 100, kind: 'manual' });
    await store.putSnapshot({ id: 'SN_2', docId: 'D_a', title: 't', text: 'b', createdAt: 300, kind: 'auto' });
    await store.putSnapshot({ id: 'SN_3', docId: 'D_a', title: 't', text: 'c', createdAt: 200, kind: 'auto' });
    const list = await store.listSnapshotsByDoc('D_a');
    expect(list.map((s) => s.id)).toEqual(['SN_2', 'SN_3', 'SN_1']); // desc by createdAt
    expect(await store.latestSnapshotAt('D_a')).toBe(300);
  });

  it('CT-SNAP-S2: FIFO 配额 — 第 31 张挤出最旧，总数恒 30', async () => {
    const { store } = await freshM9();
    await store.loadInitialDocs(now());
    for (let i = 1; i <= 31; i++) {
      await store.putSnapshot({ id: `SN_${i}`, docId: 'D_a', title: 't', text: `v${i}`, createdAt: i, kind: 'auto' });
    }
    const list = await store.listSnapshotsByDoc('D_a');
    expect(list).toHaveLength(store.MAX_SNAPSHOTS_PER_DOC); // 30
    expect(list.some((s) => s.id === 'SN_1')).toBe(false); // 最旧（createdAt=1）被挤出
    expect(list.some((s) => s.id === 'SN_31')).toBe(true);
  });

  it('CT-SNAP-S3: deleteSnapshotsByDoc cascade — 只清本文档，不误删他文档', async () => {
    const { store } = await freshM9();
    await store.loadInitialDocs(now());
    await store.putSnapshot({ id: 'SN_a1', docId: 'D_a', title: 't', text: 'a', createdAt: 1, kind: 'auto' });
    await store.putSnapshot({ id: 'SN_b1', docId: 'D_b', title: 't', text: 'b', createdAt: 1, kind: 'auto' });
    await store.deleteSnapshotsByDoc('D_a');
    expect(await store.listSnapshotsByDoc('D_a')).toHaveLength(0);
    expect(await store.listSnapshotsByDoc('D_b')).toHaveLength(1); // 不误删
  });
});

describe('M9 snapshots — DB v2→v3 升级零损 (AC-v26-6)', () => {
  it('CT-SNAP-UP1: 预置 v2 DB（documents+active）→ 开 v3 → 数据完整 + snapshots 可用', async () => {
    // seed v2
    const db = await openDB('editor', 2, {
      upgrade(d, old) {
        if (old < 1 && !d.objectStoreNames.contains('kv')) d.createObjectStore('kv');
        if (old < 2 && !d.objectStoreNames.contains('documents')) d.createObjectStore('documents', { keyPath: 'id' });
      },
    });
    await db.put('documents', { id: 'D_old', title: 'Kept', text: '# Kept\nbody', createdAt: 1, updatedAt: 2 });
    await db.put('kv', 'D_old', 'activeDocId');
    db.close();

    const { store } = await freshM9();
    const init = await store.loadInitialDocs(now());
    // v2 数据完整
    expect(init.docs).toHaveLength(1);
    expect(init.docs[0]!.id).toBe('D_old');
    expect(init.docs[0]!.text).toBe('# Kept\nbody');
    expect(init.activeId).toBe('D_old');
    // snapshots store 已建可用
    await store.putSnapshot({ id: 'SN_x', docId: 'D_old', title: 'Kept', text: 's', createdAt: 5, kind: 'manual' });
    expect(await store.listSnapshotsByDoc('D_old')).toHaveLength(1);
  });
});

describe('M9 snapshots — manager piggyback/manual/restore (AC-v26-1/2/3)', () => {
  it('CT-SNAP-M1: 自动快照 — 首存基线 / 间隔内不重复 / 超间隔+内容变才存 / 内容同不存', async () => {
    const { store, createDocManager } = await freshM9();
    const { m } = await makeManager(store, createDocManager).init();
    const docId = m.activeId();

    await m.saveActiveText('A'); // 基线
    let snaps = await waitSnaps(m, 1);
    expect(snaps).toHaveLength(1);

    await m.saveActiveText('B'); // 间隔内 → 不存
    await new Promise((r) => setTimeout(r, 20));
    expect(await m.listSnapshots()).toHaveLength(1);

    clk = 1_000_000 + 400_000; // 超 5min
    await m.saveActiveText('A'); // 内容 == 上张快照 text → 不存
    await new Promise((r) => setTimeout(r, 20));
    expect(await m.listSnapshots()).toHaveLength(1);

    await m.saveActiveText('C'); // 超间隔 + 内容变 → 存
    snaps = await waitSnaps(m, 2);
    expect(snaps).toHaveLength(2);
    expect((snaps[0] as { docId: string }).docId).toBe(docId);
  });

  it('CT-SNAP-M2: snapshotNow 立即存 manual（不受间隔限制）', async () => {
    const { store, createDocManager } = await freshM9();
    const { m } = await makeManager(store, createDocManager).init();
    await m.saveActiveText('hello');
    await waitSnaps(m, 1);
    await m.snapshotNow();
    await m.snapshotNow(); // 连续两次 manual，无间隔门槛
    const snaps = await m.listSnapshots();
    expect(snaps.filter((s) => s.kind === 'manual')).toHaveLength(2);
  });

  it('CT-SNAP-M3: restore — 先存 restore 保护快照（当前内容）→ 编辑器变目标 text', async () => {
    const { store, createDocManager } = await freshM9();
    const { m, getEditorText } = await makeManager(store, createDocManager).init();
    await m.saveActiveText('VERSION-A');
    await waitSnaps(m, 1);
    const snapA = (await m.listSnapshots())[0]!;

    clk += 400_000;
    await m.saveActiveText('VERSION-B'); // 当前内容 = B
    await waitSnaps(m, 2);

    await m.restoreSnapshot(snapA.id); // 恢复到 A
    expect(getEditorText()).toBe('VERSION-A'); // 编辑器变 A

    const snaps = await m.listSnapshots();
    // 多一张 restore 保护快照，内容 = 恢复前的 B
    const restoreSnap = snaps.find((s) => s.kind === 'restore');
    expect(restoreSnap).toBeDefined();
    expect(restoreSnap!.text).toBe('VERSION-B');
  });

  it('CT-SNAP-M4: remove 文档 → cascade 删其快照（AC-v26-5）', async () => {
    const { store, createDocManager } = await freshM9();
    const { m } = await makeManager(store, createDocManager).init();
    const doc1 = m.activeId();
    await m.saveActiveText('doc1 content');
    await waitSnaps(m, 1, doc1);

    const doc2 = await m.create('doc2 content'); // 切到 doc2
    await m.snapshotNow(); // doc2 一张

    expect((await m.listSnapshots(doc1)).length).toBeGreaterThan(0);
    await m.remove(doc1); // 删 doc1
    expect(await store.listSnapshotsByDoc(doc1)).toHaveLength(0); // cascade
    expect((await store.listSnapshotsByDoc(doc2)).length).toBeGreaterThan(0); // doc2 不受影响
  });
});

// 测试计划 v2.9 §家族 — manager settings 注入（AC-v29-2/3/4/6）
describe('M9 snapshots — settings 注入 (v2.9 / AC-v29-2/3/4)', () => {
  it('CT-SNAP-SET1: autoSnapshotEnabled=false → 不产 auto 快照', async () => {
    const { store, createDocManager } = await freshM9();
    const { m } = await makeManager(store, createDocManager).init({
      autoSnapshotEnabled: () => false,
      autoSnapshotIntervalMs: () => 300_000,
      maxSnapshotsPerDoc: () => 30,
    });
    await m.saveActiveText('A');
    await new Promise((r) => setTimeout(r, 20));
    expect(await m.listSnapshots()).toHaveLength(0); // 关闭 → 无 auto
    await m.snapshotNow(); // 手动仍可
    expect(await m.listSnapshots()).toHaveLength(1);
  });

  it('CT-SNAP-SET2: 自定义间隔 1min 生效（超 60s 才存第二张）', async () => {
    const { store, createDocManager } = await freshM9();
    const { m } = await makeManager(store, createDocManager).init({
      autoSnapshotEnabled: () => true,
      autoSnapshotIntervalMs: () => 60_000, // 1min
      maxSnapshotsPerDoc: () => 30,
    });
    await m.saveActiveText('A'); // 基线
    await waitSnaps(m, 1);
    clk = 1_000_000 + 70_000; // 超 1min（但不到默认 5min）
    await m.saveActiveText('B');
    const snaps = await waitSnaps(m, 2);
    expect(snaps).toHaveLength(2); // 1min 间隔下已产第二张
  });

  it('CT-SNAP-SET3: 自定义上限 10 → FIFO 按 10 裁剪', async () => {
    const { store } = await freshM9();
    await store.loadInitialDocs(now());
    for (let i = 1; i <= 12; i++) {
      await store.putSnapshot(
        { id: `SN_${i}`, docId: 'D_a', title: 't', text: `v${i}`, createdAt: i, kind: 'manual' },
        10, // 自定义上限
      );
    }
    expect(await store.listSnapshotsByDoc('D_a')).toHaveLength(10);
  });
});
