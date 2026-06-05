import { openDB, type IDBPDatabase } from 'idb';
import { toast } from '@/shared/toast';
import { t } from '@/modules/m7-i18n/i18n';
import { newDocId } from './idPrefix';
import { deriveTitle } from './title';

/**
 * M9 storage — IndexedDB `documents` store + 单→多迁移（ADR-010 / data-model v1.6）。
 *
 * - DB `editor` v2：store `kv`（含 `activeDocId`）+ store `documents`（keyPath `id`）
 * - 第三次迁移：v1.1 单 `kv/document` → `documents/D_*`（先写后删幂等）
 * - IDB 不可用（隐私模式）→ 降级单文档 localStorage（保 v1.1 契约；多文档功能 IDB-only）
 */
export interface DocRecord {
  id: string;
  title: string;
  text: string;
  createdAt: number;
  updatedAt: number;
}

const DB_NAME = 'editor';
const DB_VERSION = 2;
const KV = 'kv';
const DOCS = 'documents';
const ACTIVE_KEY = 'activeDocId';
const LEGACY_SINGLE_KEY = 'document'; // v1.1 kv 单 doc key
const LEGACY_LS_KEY = 'editor.document.v1'; // v1.0 localStorage（degrade 用）

let dbPromise: Promise<IDBPDatabase> | null = null;
let idbUnavailable = false;
let degradedNotified = false;

function openEditorDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1 && !db.objectStoreNames.contains(KV)) {
          db.createObjectStore(KV); // fresh install
        }
        if (oldVersion < 2 && !db.objectStoreNames.contains(DOCS)) {
          db.createObjectStore(DOCS, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

async function tryGetDb(): Promise<IDBPDatabase | null> {
  if (idbUnavailable) return null;
  if (typeof indexedDB === 'undefined') {
    idbUnavailable = true;
    return null;
  }
  try {
    return await openEditorDb();
  } catch {
    idbUnavailable = true;
    dbPromise = null;
    return null;
  }
}

function notifyDegradedOnce(): void {
  if (degradedNotified) return;
  degradedNotified = true;
  toast.show(t('storage.degraded'), 'warn');
}

export function isIdbUnavailable(): boolean {
  return idbUnavailable;
}

function lsGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function lsSet(key: string, v: string): void {
  try {
    localStorage.setItem(key, v);
  } catch {
    /* quota — best effort */
  }
}
function lsRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* best effort */
  }
}

function makeDoc(text: string, now: number): DocRecord {
  return {
    id: newDocId(),
    title: deriveTitle(text),
    text,
    createdAt: now,
    updatedAt: now,
  };
}

export interface InitialDocs {
  docs: DocRecord[];
  activeId: string;
}

/**
 * 启动加载：迁移 + 返回全量 docs + activeId。永远 ≥1 篇（ADR-010 D4）。
 * `now` 由调用方注入（测试可控；避免模块内直接 Date.now 便于确定性测试）。
 */
export async function loadInitialDocs(now: number): Promise<InitialDocs> {
  const db = await tryGetDb();
  if (!db) {
    notifyDegradedOnce();
    // 降级：单文档（localStorage legacy）；多文档 IDB-only
    const legacy = lsGet(LEGACY_LS_KEY) ?? '';
    const doc = makeDoc(legacy, now);
    return { docs: [doc], activeId: doc.id };
  }

  let docs: DocRecord[];
  try {
    docs = (await db.getAll(DOCS)) as DocRecord[];
  } catch (err) {
    console.error('[m9] documents getAll failed', err);
    toast.show(t('storage.loadError'), 'warn');
    const doc = makeDoc('', now);
    return { docs: [doc], activeId: doc.id };
  }

  if (docs.length > 0) {
    // 已是多文档（幂等跳过迁移）
    const stored = (await db.get(KV, ACTIVE_KEY)) as string | undefined;
    const activeId =
      stored && docs.some((d) => d.id === stored)
        ? stored
        : [...docs].sort((a, b) => b.updatedAt - a.updatedAt)[0]!.id;
    return { docs, activeId };
  }

  // documents 空 → 迁移旧单 doc（先写后删）。来源两路（兼容跳版升级）：
  //   v1.1 单 doc `kv/document`，或 v1.0 直跳 v1.6 残留的 localStorage `editor.document.v1`
  const idbLegacy = (await db.get(KV, LEGACY_SINGLE_KEY)) as string | undefined;
  const legacy = idbLegacy ?? lsGet(LEGACY_LS_KEY) ?? undefined;
  if (typeof legacy === 'string') {
    const doc = makeDoc(legacy, now);
    await db.put(DOCS, doc);
    await db.put(KV, doc.id, ACTIVE_KEY);
    await db.delete(KV, LEGACY_SINGLE_KEY); // 确认写成功后删旧（两路都清）
    lsRemove(LEGACY_LS_KEY);
    return { docs: [doc], activeId: doc.id };
  }

  // 新用户 → 建一个空首篇
  const doc = makeDoc('', now);
  await db.put(DOCS, doc);
  await db.put(KV, doc.id, ACTIVE_KEY);
  return { docs: [doc], activeId: doc.id };
}

/** 持久化一条 doc（put）。IDB 不可用 → 降级写 active 单文档到 localStorage。 */
export async function putDoc(doc: DocRecord, isActive: boolean): Promise<void> {
  const db = await tryGetDb();
  if (!db) {
    if (isActive) lsSet(LEGACY_LS_KEY, doc.text);
    return;
  }
  await db.put(DOCS, doc);
}

export async function deleteDocRecord(id: string): Promise<void> {
  const db = await tryGetDb();
  if (!db) return;
  await db.delete(DOCS, id);
}

export async function setActiveId(id: string): Promise<void> {
  const db = await tryGetDb();
  if (!db) return;
  await db.put(KV, id, ACTIVE_KEY);
}
