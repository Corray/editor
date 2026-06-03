import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot, createSignal } from 'solid-js';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { openDB } from 'idb';
import { t } from '@/modules/m7-i18n/i18n';

const DOC_KEY = 'editor.document.v1';
const NOTICE_KEY = 'editor.notice.large-doc.v1';

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

/**
 * Fresh store module per test — store.ts memoizes dbPromise / idbUnavailable /
 * degradedNotified at module level; resetModules isolates backend state.
 */
async function freshStore(): Promise<
  typeof import('@/modules/m3-persistence/store')
> {
  vi.resetModules();
  return import('@/modules/m3-persistence/store');
}

/** Open the same IDB the store uses, for direct assertions. */
async function idbDoc(): Promise<unknown> {
  const db = await openDB('editor', 1, {
    upgrade(d) {
      if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv');
    },
  });
  return db.get('kv', 'document');
}
async function seedIdb(value: string): Promise<void> {
  const db = await openDB('editor', 1, {
    upgrade(d) {
      if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv');
    },
  });
  await db.put('kv', value, 'document');
}

describe('M3 persistence v1.1 — IndexedDB + migration', () => {
  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory(); // fresh DB per test
    localStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---------- loadStoredDocument + migration ----------

  it('UT-MIG-001: migrates legacy localStorage → IDB, deletes old key', async () => {
    localStorage.setItem(DOC_KEY, '# old');
    const { loadStoredDocument } = await freshStore();
    const result = await loadStoredDocument();
    expect(result).toBe('# old');
    expect(await idbDoc()).toBe('# old'); // written to IDB
    expect(localStorage.getItem(DOC_KEY)).toBeNull(); // old key deleted
  });

  it('UT-MIG-002: idempotent — IDB has doc → skips migration, legacy untouched', async () => {
    await seedIdb('# existing');
    localStorage.setItem(DOC_KEY, '# should-not-win');
    const { loadStoredDocument } = await freshStore();
    const result = await loadStoredDocument();
    expect(result).toBe('# existing'); // IDB wins
    expect(localStorage.getItem(DOC_KEY)).toBe('# should-not-win'); // not migrated, not deleted
  });

  it('UT-MIG-003: IDB put fails mid-migration → keeps old localStorage (no data loss)', async () => {
    localStorage.setItem(DOC_KEY, '# keep');
    vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(() => {
      throw new Error('put fail');
    });
    const { loadStoredDocument } = await freshStore();
    const result = await loadStoredDocument();
    expect(result).toBe('# keep'); // fallback to legacy value
    expect(localStorage.getItem(DOC_KEY)).toBe('# keep'); // NOT deleted
  });

  it('UT-MIG-004: new user (all empty) → returns ""', async () => {
    const { loadStoredDocument } = await freshStore();
    expect(await loadStoredDocument()).toBe('');
  });

  it('UT-MIG-005: empty-string legacy value still migrates (null vs "")', async () => {
    localStorage.setItem(DOC_KEY, ''); // present but empty
    const { loadStoredDocument } = await freshStore();
    expect(await loadStoredDocument()).toBe('');
    expect(await idbDoc()).toBe(''); // migrated (key was present)
    expect(localStorage.getItem(DOC_KEY)).toBeNull();
  });

  // ---------- IDB unavailable → localStorage fallback (TBD-v11-3) ----------

  it('UT-FALLBACK-004: IDB unavailable → localStorage read + degraded toast', async () => {
    // @ts-expect-error simulate privacy mode / no IDB
    globalThis.indexedDB = undefined;
    localStorage.setItem(DOC_KEY, '# fb');
    const { loadStoredDocument } = await freshStore();
    const { toast } = await import('@/shared/toast');
    const spy = vi.spyOn(toast, 'show').mockImplementation(() => {});
    const result = await loadStoredDocument();
    expect(result).toBe('# fb');
    expect(spy).toHaveBeenCalledWith(t('storage.degraded'), 'warn');
  });

  it('UT-FALLBACK-006: IDB unavailable → write lands in localStorage', async () => {
    // @ts-expect-error simulate no IDB
    globalThis.indexedDB = undefined;
    const { createPersistence } = await freshStore();
    const { toast } = await import('@/shared/toast');
    vi.spyOn(toast, 'show').mockImplementation(() => {});
    const [text, setText] = createSignal('');
    let dispose!: () => void;
    createRoot((d) => {
      dispose = d;
      createPersistence(text);
    });
    setText('# fb-write');
    await sleep(650);
    await flushMicrotasks();
    expect(localStorage.getItem(DOC_KEY)).toBe('# fb-write');
    dispose();
  });

  // ---------- write round-trip + state machine ----------

  it('UT-IDB-001: edit → debounce → IDB has value; status IDLE', async () => {
    const { createPersistence } = await freshStore();
    const [text, setText] = createSignal('');
    let api!: import('@/modules/m3-persistence/api').PersistenceAPI;
    let dispose!: () => void;
    createRoot((d) => {
      dispose = d;
      api = createPersistence(text);
    });
    expect(api.status()).toBe('IDLE');
    setText('# hi');
    await flushMicrotasks();
    expect(api.status()).toBe('DIRTY');
    await sleep(650);
    await flushMicrotasks();
    expect(await idbDoc()).toBe('# hi');
    expect(api.status()).toBe('IDLE');
    dispose();
  });

  it('UT-IDB-003: large doc (>5MB) round-trips through IDB', async () => {
    const big = 'x'.repeat(5_000_000);
    const { createPersistence } = await freshStore();
    const [text, setText] = createSignal('');
    let dispose!: () => void;
    createRoot((d) => {
      dispose = d;
      createPersistence(text);
    });
    setText(big);
    await sleep(650);
    await flushMicrotasks();
    expect(await idbDoc()).toBe(big);
    dispose();
  });

  it('UT-PR-ERROR: write failure → ERROR + quota toast', async () => {
    // @ts-expect-error force fallback to localStorage
    globalThis.indexedDB = undefined;
    const { createPersistence } = await freshStore();
    const { toast } = await import('@/shared/toast');
    vi.spyOn(toast, 'show').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });
    const [text, setText] = createSignal('');
    let api!: import('@/modules/m3-persistence/api').PersistenceAPI;
    let dispose!: () => void;
    createRoot((d) => {
      dispose = d;
      api = createPersistence(text);
    });
    setText('x');
    await sleep(650);
    await flushMicrotasks();
    expect(api.status()).toBe('ERROR');
    expect(toast.show).toHaveBeenCalledWith(t('storage.quota'), 'error');
    dispose();
  });

  it('disable() stops debounced writes (nothing reaches IDB)', async () => {
    const { createPersistence } = await freshStore();
    const [text, setText] = createSignal('');
    let api!: import('@/modules/m3-persistence/api').PersistenceAPI;
    let dispose!: () => void;
    createRoot((d) => {
      dispose = d;
      api = createPersistence(text);
    });
    api.disable();
    setText('x');
    await sleep(650);
    await flushMicrotasks();
    expect(await idbDoc()).toBeUndefined();
    dispose();
  });

  // ---------- clear (TBD-v11-5: IDB + legacy keys) ----------

  it('UT-CLEAR-005: clear deletes IDB doc + leftover legacy keys', async () => {
    localStorage.setItem(NOTICE_KEY, '1'); // leftover from v1.0
    await seedIdb('# x');
    const { createPersistence } = await freshStore();
    const [text] = createSignal('');
    let api!: import('@/modules/m3-persistence/api').PersistenceAPI;
    let dispose!: () => void;
    createRoot((d) => {
      dispose = d;
      api = createPersistence(text);
    });
    await api.clear();
    expect(await idbDoc()).toBeUndefined();
    expect(localStorage.getItem(NOTICE_KEY)).toBeNull();
    expect(api.status()).toBe('IDLE');
    dispose();
  });
});
