import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRoot } from 'solid-js';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { openDB } from 'idb';
import { deriveTitle, UNTITLED } from '@/modules/m9-doc-manager/title';

// Fresh modules per test (store.ts memoizes dbPromise/idbUnavailable at module level)
async function freshM9(): Promise<{
  loadInitialDocs: typeof import('@/modules/m9-doc-manager/store')['loadInitialDocs'];
  createDocManager: typeof import('@/modules/m9-doc-manager/manager')['createDocManager'];
}> {
  vi.resetModules();
  const store = await import('@/modules/m9-doc-manager/store');
  const manager = await import('@/modules/m9-doc-manager/manager');
  return { loadInitialDocs: store.loadInitialDocs, createDocManager: manager.createDocManager };
}

// seed a v1 (single-doc) DB like v1.1 left it
async function seedV1Single(text: string): Promise<void> {
  const db = await openDB('editor', 1, {
    upgrade(d) {
      if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv');
    },
  });
  await db.put('kv', text, 'document');
  db.close();
}
async function rawDocsCount(): Promise<number> {
  const db = await openDB('editor', 2);
  const n = (await db.getAll('documents')).length;
  db.close();
  return n;
}

let clock = 1000;
const now = () => clock++;

beforeEach(() => {
  // reset fake IDB + clock + localStorage between tests
  (globalThis as unknown as { indexedDB: IDBFactory }).indexedDB = new IDBFactory();
  localStorage.clear();
  clock = 1000;
});

describe('M9 deriveTitle (UT-M9-title-derive)', () => {
  it('takes first H1 heading text', () => {
    expect(deriveTitle('# Hello World\n\nbody')).toBe('Hello World');
  });
  it('takes first non-empty line when no H1', () => {
    expect(deriveTitle('\n\njust a line\nmore')).toBe('just a line');
  });
  it('empty → Untitled', () => {
    expect(deriveTitle('')).toBe(UNTITLED);
    expect(deriveTitle('   \n  ')).toBe(UNTITLED);
  });
  it('truncates long titles with ellipsis', () => {
    const t = deriveTitle('#  ' + 'x'.repeat(80));
    expect(t.length).toBeLessThanOrEqual(41);
    expect(t.endsWith('…')).toBe(true);
  });
});

describe('M9 migration (ADR-010 D3 / data-model v1.6 §3)', () => {
  it('UT-M9-migrate-legacy: v1.1 单 doc → documents/D_*，内容不丢，旧 key 删除', async () => {
    await seedV1Single('# Legacy\n\nold content');
    const { loadInitialDocs } = await freshM9();
    const init = await loadInitialDocs(now());
    expect(init.docs).toHaveLength(1);
    expect(init.docs[0]!.text).toBe('# Legacy\n\nold content');
    expect(init.docs[0]!.title).toBe('Legacy');
    expect(init.docs[0]!.id).toMatch(/^D_/);
    expect(init.activeId).toBe(init.docs[0]!.id);
    // 旧单 doc key 已删
    const db = await openDB('editor', 2);
    expect(await db.get('kv', 'document')).toBeUndefined();
    expect(await db.get('kv', 'activeDocId')).toBe(init.activeId);
  });

  it('UT-M9-migrate-idempotent: 跑两次不翻倍', async () => {
    await seedV1Single('# Once');
    const m1 = await freshM9();
    await m1.loadInitialDocs(now());
    const m2 = await freshM9();
    const init2 = await m2.loadInitialDocs(now());
    expect(init2.docs).toHaveLength(1); // 幂等
    expect(await rawDocsCount()).toBe(1);
  });

  it('UT-M9-migrate-ls-direct: v1.0 localStorage 直跳 v1.6（无 kv/document）→ 迁移 + 删 ls key', async () => {
    localStorage.setItem('editor.document.v1', '# from localStorage');
    const { loadInitialDocs } = await freshM9();
    const init = await loadInitialDocs(now());
    expect(init.docs).toHaveLength(1);
    expect(init.docs[0]!.text).toBe('# from localStorage');
    expect(localStorage.getItem('editor.document.v1')).toBeNull(); // 旧 key 删
  });

  it('新用户（无 legacy）→ 自动建 1 篇空 doc', async () => {
    const { loadInitialDocs } = await freshM9();
    const init = await loadInitialDocs(now());
    expect(init.docs).toHaveLength(1);
    expect(init.docs[0]!.text).toBe('');
  });
});

describe('M9 CRUD (createDocManager)', () => {
  async function setup() {
    const { loadInitialDocs, createDocManager } = await freshM9();
    const initial = await loadInitialDocs(now());
    let editorText = initial.docs[0]!.text;
    const api = createDocManager({
      initial,
      now,
      setEditorText: (t) => {
        editorText = t;
      },
      getEditorText: () => editorText,
    });
    return { api, getEditorText: () => editorText };
  }

  it('UT-M9-create: 新建 → 列表+1 + 切为 active + 编辑区切到新文档', async () => {
    await createRoot(async (dispose) => {
      const { api, getEditorText } = await setup();
      const before = api.docs().length;
      const id = await api.create('# New Doc');
      expect(api.docs().length).toBe(before + 1);
      expect(api.activeId()).toBe(id);
      expect(getEditorText()).toBe('# New Doc');
      expect(api.docs()[0]!.title).toBe('New Doc'); // 最新在顶
      dispose();
    });
  });

  it('UT-M9-switch-flush: 切换前 flush 当前编辑，切回内容仍在', async () => {
    await createRoot(async (dispose) => {
      const { loadInitialDocs, createDocManager } = await freshM9();
      const initial = await loadInitialDocs(now());
      let editorText = '';
      const api = createDocManager({
        initial, now,
        setEditorText: (t) => { editorText = t; },
        getEditorText: () => editorText,
      });
      const firstId = api.activeId();
      editorText = '# Doc A edits';            // 模拟用户编辑首篇
      const secondId = await api.create('# Doc B'); // create flush 首篇
      expect(editorText).toBe('# Doc B');
      await api.switchTo(firstId);             // 切回首篇
      expect(editorText).toBe('# Doc A edits'); // flush 的内容回来了
      expect(api.activeId()).toBe(firstId);
      dispose();
    });
  });

  it('UT-M9-remove-active: 删 active → 切到现存最新', async () => {
    await createRoot(async (dispose) => {
      const { api } = await setup();
      const a = api.activeId();
      const b = await api.create('# B');
      expect(api.activeId()).toBe(b);
      await api.remove(b);
      expect(api.activeId()).toBe(a); // 切回剩下的
      expect(api.docs().some((d) => d.id === b)).toBe(false);
      dispose();
    });
  });

  it('UT-M9-remove-last: 删唯一 doc → 自动建空（永远 ≥1）', async () => {
    await createRoot(async (dispose) => {
      const { api } = await setup();
      const only = api.activeId();
      await api.remove(only);
      expect(api.docs()).toHaveLength(1); // 自动补一篇
      expect(api.activeId()).not.toBe(only);
      dispose();
    });
  });

  it('UT-M9-noop-save: saveActiveText 同文本不 bump（不重排列表）', async () => {
    await createRoot(async (dispose) => {
      const { api } = await setup();
      const id = await api.create('# X');
      const t0 = api.docs().find((d) => d.id === id)!.updatedAt;
      await api.saveActiveText('# X'); // 同文本
      const t1 = api.docs().find((d) => d.id === id)!.updatedAt;
      expect(t1).toBe(t0); // no-op
      dispose();
    });
  });
});
